const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const root = resolve(__dirname, '..');
const user = 'user_test';
const id = '00000000-0000-4000-8000-000000000001';
const auth = {
  verifyAuth: async () => user,
  unauthorized: () => Response.json({}, { status: 401 }),
  forbidden: () => Response.json({}, { status: 403 }),
};
function load(file, mocks, logger = console) {
  const source = readFileSync(resolve(root, file), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  const exports = {};
  vm.runInNewContext(js, {
    exports, Response, URL, Date, Intl, process: { env: {} }, console: logger,
    require(name) {
      assert.ok(name in mocks, `Unexpected import: ${name}`);
      return mocks[name];
    },
  });
  return exports;
}
function query(result, calls = []) {
  const chain = { then: (ok, fail) => Promise.resolve(result).then(ok, fail) };
  for (const name of ['select', 'eq', 'lt', 'order', 'limit', 'or', 'insert', 'upsert', 'delete', 'single', 'maybeSingle']) {
    chain[name] = (...args) => { calls.push([name, ...args]); return chain; };
  }
  return chain;
}

// Execute the actual grouping expression without loading React Native.
test('wallet groups UTC timestamps into the same local keys used by headings', () => {
  const source = readFileSync(resolve(root, 'app/(tabs)/index.tsx'), 'utf8');
  const ast = ts.createSourceFile('index.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let expression;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'groupedEntries') {
      expression = node.initializer.getText(ast);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(expression);
  const js = ts.transpileModule(`result = ${expression}`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const previous = process.env.TZ;
  try {
    for (const [timezone, timestamp, expected] of [
      ['America/Los_Angeles', '2026-01-01T00:30:00Z', '2025-12-31'],
      ['Asia/Tokyo', '2026-01-01T23:30:00Z', '2026-01-02'],
      ['America/Los_Angeles', '2026-03-08T10:30:00Z', '2026-03-08'],
    ]) {
      process.env.TZ = timezone;
      const context = { result: null, Date, entries: [{ created_at: timestamp }], useMemo: (fn) => fn() };
      vm.runInNewContext(js, context);
      assert.equal(context.result[0][0], expected);
    }
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

for (const timestamp of ['2026-10-01T00:00:00.123456+00:00', '2026-10-01T05:30:00.123456+05:30', '2026-09-30T20:00:00.123456-04:00', '2026-10-01T00:00:00Z']) {
  test(`ledger preserves and quotes the full timestamp: ${timestamp}`, async () => {
    const calls = [];
    const { GET } = load('app/api/coins/ledger+api.ts', {
      '@/lib/auth': auth,
      '@/lib/supabaseAdmin': { supabaseAdmin: { from: () => query({ data: [
        { id, created_at: timestamp }, { id: '00000000-0000-4000-8000-000000000002', created_at: timestamp },
      ] }, calls) } },
    });
    const page = await (await GET(new Request('http://local/api/coins/ledger?limit=1'))).json();
    assert.equal(decodeURIComponent(page.nextCursor), `${timestamp}|${id}`);
    assert.equal(page.entries.length, 1);
    const params = new URLSearchParams({ cursor: page.nextCursor });
    assert.equal((await GET(new Request(`http://local/api/coins/ledger?${params}`))).status, 200);
    assert.equal(calls.find(([method]) => method === 'or')[1],
      `created_at.lt."${timestamp}",and(created_at.eq."${timestamp}",id.lt.${id})`);
  });
}

test('ledger rejects filter injection in a cursor', async () => {
  const { GET } = load('app/api/coins/ledger+api.ts', {
    '@/lib/auth': auth,
    '@/lib/supabaseAdmin': { supabaseAdmin: { from: () => assert.fail('must reject before querying') } },
  });
  const params = new URLSearchParams({ cursor: `2026-01-01T00:00:00Z",id.gt.x|${id}` });
  assert.equal((await GET(new Request(`http://local/api/coins/ledger?${params}`))).status, 400);
});

test('client-reported passing usage is persisted but cannot award coins, including retries', async () => {
  const calls = [];
  const { POST } = load('app/api/days/[id]+api.ts', {
    '@/lib/auth': auth, '@/lib/supabase': { supabase: {} },
    '@/lib/supabaseAdmin': { supabaseAdmin: {
      from: (table) => query({ data: table === 'stake_coin_terms' ? { user_id: user, timezone: 'UTC', allow_freeze: true } : null }, calls),
      rpc: () => assert.fail('unverified passing usage must never mint coins'),
    } },
    '../quests/[id]+api': { verifyQuestAccess: async () => ({ quest: {
      status: 'active', created_at: '2020-01-01T00:00:00Z', expires_at: '2020-01-05T00:00:00Z',
      description: { type: 'screen_time_limit', limitMs: 1000 },
    } }) },
  });
  for (let retry = 0; retry < 2; retry++) {
    const response = await POST(new Request('http://local/api/days/id', {
      method: 'POST', body: JSON.stringify({ date: '2020-01-02', totalMs: 0 }),
    }), { id });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { frozen: false, awarded: false });
  }
  assert.equal(calls.filter(([method]) => method === 'upsert').length, 2);
});

function questRoute({ termsError = null, creationError = null, reversalError = null } = {}) {
  const calls = [], logs = [];
  const quest = { id, description: '{"type":"screen_time_limit"}' };
  const { POST } = load('app/api/quests+api.ts', {
    '@clerk/backend': { createClerkClient: () => ({ users: { getUser: async () => ({ publicMetadata: { role: 'individual', familyId: 'family_test' } }) } }) },
    '@/lib/auth': auth, '@/lib/supabase': { supabase: {} },
    '@/constants/coinEconomy': { WAGER_MIN: 10, WAGER_MAX: 500, getWinBonusRate: () => 0.1 },
    '@/lib/supabaseAdmin': { supabaseAdmin: {
      from(table) {
        assert.equal(table, 'stake_coin_terms');
        return query({ error: termsError }, calls);
      },
      rpc(name, args) {
        calls.push([name, args]);
        if (name === 'create_coin_quest') return query({ data: quest, error: creationError });
        assert.equal(name, 'coin_apply');
        return Promise.resolve(args.p_type === 'stake_lock'
          ? { data: { applied: true } } : { error: reversalError });
      },
    } },
  }, { error: (...args) => logs.push(args) });
  return { calls, logs, run: () => POST(new Request('http://local/api/quests', {
    method: 'POST', body: JSON.stringify({ title: 'Test', type: 'screen-time', wagerCoins: 10,
      clientRequestId: id, timezone: 'UTC', expires_at: '2099-01-01T00:00:00Z' }),
  })) };
}

test('quest creation uses the atomic database function', async () => {
  const route = questRoute();
  const response = await route.run();
  assert.equal(response.status, 200);
  assert.equal((await response.json()).quest.description.type, 'screen_time_limit');
  const [, args] = route.calls.find(([name]) => name === 'create_coin_quest');
  assert.equal(args.p_user, user);
  assert.equal(args.p_quest.id, id);
  assert.equal(args.p_quest.status, 'active');
});

test('database cap rejection reverses the lock and maps to stake_cap 409', async () => {
  const route = questRoute({ creationError: { code: '23514', message: 'stake_cap' } });
  const response = await route.run();
  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), { error: 'stake_cap' });
  const reversal = route.calls.find(([name, args]) => name === 'coin_apply' && args.p_type === 'lock_reversal');
  assert.equal(reversal[1].p_delta, 10);
  assert.ok(route.calls.some(([name]) => name === 'delete'));
});

for (const branch of ['terms', 'quest']) {
  test(`${branch} insert failure logs an unsuccessful coin lock reversal`, async () => {
    const failure = { message: 'reversal unavailable' };
    const route = questRoute({ [branch === 'terms' ? 'termsError' : 'creationError']: { message: 'insert failed' }, reversalError: failure });
    assert.equal((await route.run()).status, 500);
    assert.equal(route.logs.length, 1);
    assert.equal(route.logs[0][0], 'Coin lock reversal failed:');
    assert.equal(route.logs[0][1], failure);
  });
}
