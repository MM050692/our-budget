-- Our Budget v7: linked money actions, recurring items and net-worth history.

alter table public.debts
  add column if not exists annual_interest_rate numeric(6,3) not null default 0,
  add column if not exists minimum_payment numeric(16,2) not null default 0,
  add column if not exists payment_day smallint,
  add column if not exists active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

alter table public.goals
  add column if not exists active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

alter table public.accounts
  add column if not exists active boolean not null default true;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'debts_annual_interest_rate_check'
      and conrelid = 'public.debts'::regclass
  ) then
    alter table public.debts
      add constraint debts_annual_interest_rate_check
      check (annual_interest_rate between 0 and 100);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'debts_minimum_payment_check'
      and conrelid = 'public.debts'::regclass
  ) then
    alter table public.debts
      add constraint debts_minimum_payment_check
      check (minimum_payment >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'debts_payment_day_check'
      and conrelid = 'public.debts'::regclass
  ) then
    alter table public.debts
      add constraint debts_payment_day_check
      check (payment_day is null or payment_day between 1 and 31);
  end if;
end
$$;

create table if not exists public.household_settings (
  household_id uuid primary key references public.households(id) on delete cascade,
  base_currency character(3) not null default 'MVR'
    check (base_currency in ('AED','MVR','INR','USD')),
  usd_to_aed numeric(14,6) not null default 3.6725 check (usd_to_aed > 0),
  usd_to_mvr numeric(14,6) not null default 15.42 check (usd_to_mvr > 0),
  usd_to_inr numeric(14,6) not null default 88 check (usd_to_inr > 0),
  payday_day smallint check (payday_day is null or payday_day between 1 and 31),
  fun_mode boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.recurring_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  name text not null check (char_length(trim(name)) between 1 and 80),
  kind text not null check (kind in ('income','expense')),
  amount numeric(16,2) not null check (amount > 0),
  currency character(3) not null check (currency in ('AED','MVR','INR','USD')),
  category text not null,
  paid_by text not null default 'Shared',
  account_id uuid references public.accounts(id) on delete set null,
  day_of_month smallint not null check (day_of_month between 1 and 31),
  note text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  amount numeric(16,2) not null check (amount > 0),
  currency character(3) not null check (currency in ('AED','MVR','INR','USD')),
  date date not null default current_date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.net_worth_snapshots (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  snapshot_date date not null,
  cash_usd numeric(18,4) not null,
  assets_usd numeric(18,4) not null,
  debt_usd numeric(18,4) not null,
  net_worth_usd numeric(18,4) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, snapshot_date)
);

alter table public.transactions
  add column if not exists to_account_id uuid references public.accounts(id) on delete set null,
  add column if not exists to_amount numeric(16,2),
  add column if not exists debt_id uuid references public.debts(id) on delete set null,
  add column if not exists debt_principal numeric(16,2),
  add column if not exists debt_interest numeric(16,2),
  add column if not exists recurring_item_id uuid references public.recurring_items(id) on delete set null,
  add column if not exists recurring_month date;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'transactions_to_amount_check'
      and conrelid = 'public.transactions'::regclass
  ) then
    alter table public.transactions
      add constraint transactions_to_amount_check
      check (to_amount is null or to_amount > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'transactions_debt_principal_check'
      and conrelid = 'public.transactions'::regclass
  ) then
    alter table public.transactions
      add constraint transactions_debt_principal_check
      check (debt_principal is null or debt_principal > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'transactions_debt_interest_check'
      and conrelid = 'public.transactions'::regclass
  ) then
    alter table public.transactions
      add constraint transactions_debt_interest_check
      check (debt_interest is null or debt_interest >= 0);
  end if;
end
$$;

alter table public.household_settings enable row level security;
alter table public.recurring_items enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.net_worth_snapshots enable row level security;

revoke all on table public.household_settings from anon;
revoke all on table public.recurring_items from anon;
revoke all on table public.goal_contributions from anon;
revoke all on table public.net_worth_snapshots from anon;

grant select, insert, update on table public.household_settings to authenticated;
grant select, insert, update, delete on table public.recurring_items to authenticated;
grant select, insert, update, delete on table public.goal_contributions to authenticated;
grant select, insert, update on table public.net_worth_snapshots to authenticated;

drop policy if exists "members manage household settings" on public.household_settings;
create policy "members manage household settings" on public.household_settings
for all to authenticated
using ((select private.is_household_member(household_id)))
with check ((select private.is_household_member(household_id)));

drop policy if exists "members manage recurring items" on public.recurring_items;
create policy "members manage recurring items" on public.recurring_items
for all to authenticated
using ((select private.is_household_member(household_id)))
with check ((select private.is_household_member(household_id)));

drop policy if exists "members manage goal contributions" on public.goal_contributions;
create policy "members manage goal contributions" on public.goal_contributions
for all to authenticated
using ((select private.is_household_member(household_id)))
with check ((select private.is_household_member(household_id)));

drop policy if exists "members manage net worth snapshots" on public.net_worth_snapshots;
create policy "members manage net worth snapshots" on public.net_worth_snapshots
for all to authenticated
using ((select private.is_household_member(household_id)))
with check ((select private.is_household_member(household_id)));

create index if not exists recurring_items_household_day_idx
  on public.recurring_items (household_id, active, day_of_month);
create index if not exists recurring_items_account_idx
  on public.recurring_items (account_id) where account_id is not null;
create index if not exists goal_contributions_household_date_idx
  on public.goal_contributions (household_id, date desc);
create index if not exists goal_contributions_goal_idx
  on public.goal_contributions (goal_id);
create index if not exists goal_contributions_account_idx
  on public.goal_contributions (account_id) where account_id is not null;
create index if not exists net_worth_snapshots_household_date_idx
  on public.net_worth_snapshots (household_id, snapshot_date desc);
create index if not exists transactions_to_account_date_idx
  on public.transactions (to_account_id, date desc) where to_account_id is not null;
create index if not exists transactions_debt_date_idx
  on public.transactions (debt_id, date desc) where debt_id is not null;
create index if not exists transactions_recurring_idx
  on public.transactions (recurring_item_id, recurring_month)
  where recurring_item_id is not null;

create unique index if not exists transactions_one_recurring_per_month_idx
  on public.transactions (recurring_item_id, recurring_month)
  where recurring_item_id is not null and recurring_month is not null;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;

drop trigger if exists set_household_settings_updated_at on public.household_settings;
create trigger set_household_settings_updated_at
before update on public.household_settings
for each row execute function private.set_updated_at();

drop trigger if exists set_recurring_items_updated_at on public.recurring_items;
create trigger set_recurring_items_updated_at
before update on public.recurring_items
for each row execute function private.set_updated_at();

drop trigger if exists set_goal_contributions_updated_at on public.goal_contributions;
create trigger set_goal_contributions_updated_at
before update on public.goal_contributions
for each row execute function private.set_updated_at();

drop trigger if exists set_net_worth_snapshots_updated_at on public.net_worth_snapshots;
create trigger set_net_worth_snapshots_updated_at
before update on public.net_worth_snapshots
for each row execute function private.set_updated_at();

drop trigger if exists set_debts_updated_at on public.debts;
create trigger set_debts_updated_at
before update on public.debts
for each row execute function private.set_updated_at();

drop trigger if exists set_goals_updated_at on public.goals;
create trigger set_goals_updated_at
before update on public.goals
for each row execute function private.set_updated_at();

create or replace function private.validate_recurring_item()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  linked_currency character(3);
begin
  if new.account_id is not null then
    select a.currency into linked_currency
    from public.accounts a
    where a.id = new.account_id and a.household_id = new.household_id;

    if linked_currency is null then
      raise exception 'recurring item account must belong to the same household';
    end if;

    if new.currency <> linked_currency then
      raise exception 'recurring item currency must match its account currency';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.validate_recurring_item() from public, anon, authenticated;

drop trigger if exists validate_recurring_item on public.recurring_items;
create trigger validate_recurring_item
before insert or update on public.recurring_items
for each row execute function private.validate_recurring_item();

drop trigger if exists enforce_transaction_account_household on public.transactions;
drop function if exists private.enforce_transaction_account_household();

create or replace function private.validate_v7_transaction_links()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  source_currency character(3);
  destination_currency character(3);
begin
  if new.account_id is not null then
    select a.currency into source_currency
    from public.accounts a
    where a.id = new.account_id and a.household_id = new.household_id;

    if source_currency is null then
      raise exception 'transaction account must belong to the same household';
    end if;

    if new.currency <> source_currency then
      raise exception 'transaction currency must match the source account currency';
    end if;
  end if;

  if new.type = 'transfer' then
    if new.account_id is null or new.to_account_id is null or new.to_amount is null then
      raise exception 'transfers require source account, destination account and destination amount';
    end if;

    if new.account_id = new.to_account_id then
      raise exception 'transfer source and destination accounts must be different';
    end if;

    select a.currency into destination_currency
    from public.accounts a
    where a.id = new.to_account_id and a.household_id = new.household_id;

    if destination_currency is null then
      raise exception 'transfer destination account must belong to the same household';
    end if;
  elsif new.to_account_id is not null or new.to_amount is not null then
    raise exception 'destination account fields are only valid for transfers';
  end if;

  if new.debt_id is not null then
    if new.type <> 'expense' or new.debt_principal is null then
      raise exception 'debt payments must be expenses with a principal amount';
    end if;

    if not exists (
      select 1 from public.debts d
      where d.id = new.debt_id and d.household_id = new.household_id
    ) then
      raise exception 'debt must belong to the same household';
    end if;
  elsif new.debt_principal is not null or new.debt_interest is not null then
    raise exception 'debt amounts require a linked debt';
  end if;

  if new.recurring_item_id is not null then
    if new.recurring_month is null then
      raise exception 'recurring transactions require a recurring month';
    end if;

    if not exists (
      select 1 from public.recurring_items r
      where r.id = new.recurring_item_id and r.household_id = new.household_id
    ) then
      raise exception 'recurring item must belong to the same household';
    end if;
  elsif new.recurring_month is not null then
    raise exception 'recurring month requires a recurring item';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_v7_transaction_links() from public, anon, authenticated;

drop trigger if exists validate_v7_transaction_links on public.transactions;
create trigger validate_v7_transaction_links
before insert or update on public.transactions
for each row execute function private.validate_v7_transaction_links();

create or replace function private.sync_debt_payment()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  available numeric(16,2);
begin
  if tg_op in ('UPDATE','DELETE')
     and old.debt_id is not null
     and old.debt_principal is not null then
    update public.debts
    set remaining_amount = least(original_amount, remaining_amount + old.debt_principal)
    where id = old.debt_id and household_id = old.household_id;
  end if;

  if tg_op in ('INSERT','UPDATE')
     and new.debt_id is not null
     and new.debt_principal is not null then
    select remaining_amount into available
    from public.debts
    where id = new.debt_id and household_id = new.household_id
    for update;

    if available is null then
      raise exception 'linked debt was not found';
    end if;

    if new.debt_principal > available then
      raise exception 'debt principal exceeds the remaining balance';
    end if;

    update public.debts
    set remaining_amount = remaining_amount - new.debt_principal
    where id = new.debt_id and household_id = new.household_id;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function private.sync_debt_payment() from public, anon, authenticated;

drop trigger if exists sync_debt_payment on public.transactions;
create trigger sync_debt_payment
after insert or update or delete on public.transactions
for each row execute function private.sync_debt_payment();

create or replace function private.validate_goal_contribution()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  goal_currency character(3);
begin
  select g.currency into goal_currency
  from public.goals g
  where g.id = new.goal_id and g.household_id = new.household_id;

  if goal_currency is null then
    raise exception 'goal must belong to the same household';
  end if;

  if new.currency <> goal_currency then
    raise exception 'contribution currency must match the goal currency';
  end if;

  if new.account_id is not null and not exists (
    select 1 from public.accounts a
    where a.id = new.account_id and a.household_id = new.household_id
  ) then
    raise exception 'goal account must belong to the same household';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_goal_contribution() from public, anon, authenticated;

drop trigger if exists validate_goal_contribution on public.goal_contributions;
create trigger validate_goal_contribution
before insert or update on public.goal_contributions
for each row execute function private.validate_goal_contribution();

create or replace function private.sync_goal_contribution()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE','DELETE') then
    update public.goals
    set saved = greatest(0, saved - old.amount)
    where id = old.goal_id and household_id = old.household_id;
  end if;

  if tg_op in ('INSERT','UPDATE') then
    update public.goals
    set saved = saved + new.amount
    where id = new.goal_id and household_id = new.household_id;

    if not found then
      raise exception 'linked goal was not found';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function private.sync_goal_contribution() from public, anon, authenticated;

drop trigger if exists sync_goal_contribution on public.goal_contributions;
create trigger sync_goal_contribution
after insert or update or delete on public.goal_contributions
for each row execute function private.sync_goal_contribution();

insert into public.household_settings (household_id, base_currency)
select h.id, 'MVR'
from public.households h
on conflict (household_id) do nothing;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'household_settings',
    'recurring_items',
    'goal_contributions',
    'net_worth_snapshots'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end
$$;
