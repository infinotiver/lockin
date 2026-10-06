-- Requires the existing quests and stake_coin_terms tables.
-- Apply before deploying the API that calls create_coin_quest.
create or replace function public.create_coin_quest(p_user text, p_quest jsonb)
returns setof public.quests
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_quest public.quests%rowtype;
begin
  -- All coin quest creation for a user shares this transaction-scoped lock.
  perform pg_advisory_xact_lock(hashtextextended('coin_quest:' || p_user, 0));

  select * into v_quest
  from jsonb_populate_record(null::public.quests, p_quest);

  if not exists (
    select 1 from public.stake_coin_terms
    where stake_id = v_quest.id and user_id = p_user
  ) then
    raise exception 'missing_stake_terms' using errcode = '23514';
  end if;

  -- Keep in sync with MAX_ACTIVE_COIN_STAKES in constants/coinEconomy.ts.
  if (
    select count(*)
    from public.stake_coin_terms t
    join public.quests q on q.id = t.stake_id
    where t.user_id = p_user and q.status = 'active'
  ) >= 1 then
    raise exception 'stake_cap' using errcode = '23514';
  end if;

  return query
  insert into public.quests (
    id, family_id, title, description, reward, type, status, expires_at
  ) values (
    v_quest.id, v_quest.family_id, v_quest.title, v_quest.description,
    v_quest.reward, v_quest.type, 'active', v_quest.expires_at
  ) returning *;
end;
$$;

revoke all on function public.create_coin_quest(text, jsonb) from public, anon, authenticated;
grant execute on function public.create_coin_quest(text, jsonb) to service_role;
