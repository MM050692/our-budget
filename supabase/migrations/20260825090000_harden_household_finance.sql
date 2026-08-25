-- Our Budget v5: secure the existing two-person household schema.
-- Idempotent so it is safe to keep in source control after applying it once.

create or replace function public.is_household_member(h uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members m
    where m.household_id = h
      and m.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_household_member(uuid) from public, anon;
grant execute on function public.is_household_member(uuid) to authenticated, service_role;

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.goals enable row level security;
alter table public.debts enable row level security;
alter table public.assets enable row level security;

revoke all on table public.households, public.household_members,
  public.transactions, public.budgets, public.goals, public.debts, public.assets from anon;
grant select on table public.households, public.household_members to authenticated;
grant select, insert, update, delete on table public.transactions, public.budgets,
  public.goals, public.debts, public.assets to authenticated;

drop policy if exists "members can read household" on public.households;
create policy "members can read household" on public.households
for select to authenticated using (public.is_household_member(id));

drop policy if exists "members can read members" on public.household_members;
create policy "members can read members" on public.household_members
for select to authenticated using (public.is_household_member(household_id));

drop policy if exists "members manage transactions" on public.transactions;
create policy "members manage transactions" on public.transactions
for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists "members manage budgets" on public.budgets;
create policy "members manage budgets" on public.budgets
for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists "members manage goals" on public.goals;
create policy "members manage goals" on public.goals
for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists "members manage debts" on public.debts;
create policy "members manage debts" on public.debts
for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists "members manage assets" on public.assets;
create policy "members manage assets" on public.assets
for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create index if not exists transactions_household_date_idx
  on public.transactions (household_id, date desc);
create index if not exists goals_household_idx on public.goals (household_id);
create index if not exists debts_household_idx on public.debts (household_id);
create index if not exists assets_household_idx on public.assets (household_id);
