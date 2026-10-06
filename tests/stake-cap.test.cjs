// Run only against a disposable PostgreSQL container:
// DOCKER_HOST=unix:///path/to/docker.sock PG_TEST_CONTAINER=name PG_TEST_PORT=55432 node --test tests/stake-cap.test.cjs
const assert = require('node:assert/strict');
const { spawn, execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');

const container = process.env.PG_TEST_CONTAINER;
const args = ['exec', '-i', container, 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-p', process.env.PG_TEST_PORT || '5432', '-U', 'postgres', '-At'];
function sql(input) {
  return execFileSync('docker', args, { input, encoding: 'utf8' }).trim();
}
function asyncSql(input) {
  return new Promise((resolve, reject) => {
    const child = spawn('docker', args);
    let stdout = '', stderr = '';
    child.stdout.on('data', (data) => { stdout += data; });
    child.stderr.on('data', (data) => { stderr += data; });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
    child.stdin.end(input);
  });
}
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const create = (user, n) => `select id from public.create_coin_quest('${user}', '{"id":"${id(n)}","family_id":"family_test","title":"Test","reward":0,"type":"screen-time","expires_at":"2099-01-01T00:00:00Z"}');`;

test('migration enforces the cap under concurrent transactions', { skip: !container }, async () => {
  // The production schema is managed outside this repo. Model only columns the RPC uses.
  sql(`
    create role anon; create role authenticated; create role service_role;
    create table public.quests (
      id uuid primary key, family_id text not null, title text not null,
      description text, reward integer, type text, status text,
      expires_at timestamptz, created_at timestamptz not null default now()
    );
    create table public.stake_coin_terms (stake_id uuid primary key, user_id text not null);
    grant select, insert on public.quests to service_role;
    grant select on public.stake_coin_terms to service_role;
  `);
  try {
    sql(readFileSync(resolve(__dirname, '../supabase/migrations/20261006000000_create_coin_quest.sql'), 'utf8'));
    sql(`insert into public.stake_coin_terms values ${Array.from({ length: 8 }, (_, n) => `('${id(n + 1)}','user_test')`).join(',')};`);

    // Hold the first transaction after insertion. Contenders must wait for its commit,
    // then see its row in the count even though their RPC began before that commit.
    const first = asyncSql(`begin; set local role service_role; ${create('user_test', 1)} select pg_sleep(1); commit;`);
    const contenders = Array.from({ length: 7 }, (_, n) => asyncSql(`set role service_role; ${create('user_test', n + 2)}`));
    const results = await Promise.all([first, ...contenders]);
    assert.equal(results.filter(({ code }) => code === 0).length, 1, JSON.stringify(results));
    assert.equal(results.filter(({ stderr }) => stderr.includes('stake_cap')).length, 7);
    assert.equal(sql("select count(*) from public.quests where status = 'active';"), '1');
    assert.equal(sql('select count(*) from public.quests where created_at is not null;'), '1');

    // Another user has an independent cap, and completion frees the first user's slot.
    sql(`insert into public.stake_coin_terms values ('${id(9)}','other_user'); ${create('other_user', 9)}`);
    sql("update public.quests set status = 'completed' where family_id = 'family_test';");
    sql(`insert into public.stake_coin_terms values ('${id(10)}','user_test'); ${create('user_test', 10)}`);
    assert.equal(sql("select count(*) from public.quests where status = 'active';"), '1');
    const missingTerms = await asyncSql(create('wrong_user', 11));
    assert.notEqual(missingTerms.code, 0);
    assert.match(missingTerms.stderr, /missing_stake_terms/);

    const anonymous = await asyncSql(`set role anon; ${create('user_test', 12)}`);
    assert.notEqual(anonymous.code, 0);
    assert.match(anonymous.stderr, /permission denied for function create_coin_quest/);
  } finally {
    sql('drop function if exists public.create_coin_quest(text,jsonb); drop table public.stake_coin_terms, public.quests; drop role anon, authenticated, service_role;');
  }
});
