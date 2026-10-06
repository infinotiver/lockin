# Coin quest creation

Apply `migrations/20261006000000_create_coin_quest.sql` to the existing Supabase
schema **before deploying the API**. It requires the existing `quests` and
`stake_coin_terms` tables; this repository does not contain their base DDL.

`create_coin_quest` is callable only by `service_role`. It serializes coin quest
creation per user and checks the active count in the same transaction as the
quest insert. Keep its cap in sync with `MAX_ACTIVE_COIN_STAKES`.

## Regression checks

```sh
pnpm exec tsc --noEmit
node --test tests/coin-integrity.test.cjs
```

The database test uses a **disposable, empty PostgreSQL 16 container**. It creates
and drops synthetic tables and roles, applies the migration, and exercises
concurrent creation, released slots, ownership checks, and function permissions.
It does not validate against the externally managed production schema.

```sh
PG_TEST_CONTAINER=<container-name> PG_TEST_PORT=5432 node --test tests/stake-cap.test.cjs
```

Set `DOCKER_HOST` if the container runs on a non-default Docker socket. The
database test is skipped when `PG_TEST_CONTAINER` is unset.
