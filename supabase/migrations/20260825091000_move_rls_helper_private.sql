-- Keep the SECURITY DEFINER membership helper outside the exposed public API.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_household_member(h uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.household_members m
    where m.household_id = h and m.user_id = (select auth.uid())
  );
$$;
revoke all on function private.is_household_member(uuid) from public, anon;
grant execute on function private.is_household_member(uuid) to authenticated, service_role;

alter policy "members can read household" on public.households
  using (private.is_household_member(id));
alter policy "members can read members" on public.household_members
  using (private.is_household_member(household_id));
alter policy "members manage transactions" on public.transactions
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));
alter policy "members manage budgets" on public.budgets
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));
alter policy "members manage goals" on public.goals
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));
alter policy "members manage debts" on public.debts
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));
alter policy "members manage assets" on public.assets
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));

drop function public.is_household_member(uuid);
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

create index if not exists household_members_user_idx on public.household_members (user_id);
create index if not exists transactions_user_idx on public.transactions (user_id);
create index if not exists assets_user_idx on public.assets (user_id);
