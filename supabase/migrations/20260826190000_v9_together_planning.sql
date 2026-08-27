-- Our DHAN v9: sinking funds, weekly money dates and richer month closes.

create table if not exists public.sinking_funds (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  name text not null check (char_length(name) between 1 and 100),
  target_amount numeric(18,2) not null check (target_amount > 0),
  saved_amount numeric(18,2) not null default 0 check (saved_amount >= 0),
  currency text not null check (currency in ('AED', 'MVR', 'INR', 'USD')),
  due_date date,
  last_reserved_month date check (last_reserved_month is null or extract(day from last_reserved_month) = 1),
  note text check (note is null or char_length(note) <= 300),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.weekly_money_dates (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  week_start date not null,
  reviewed_by uuid references auth.users(id) on delete set null,
  win text check (win is null or char_length(win) <= 300),
  next_action text check (next_action is null or char_length(next_action) <= 300),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, week_start)
);

alter table public.monthly_checkups
  add column if not exists focus text check (focus is null or char_length(focus) <= 300),
  add column if not exists closed_at timestamptz;

alter table public.sinking_funds enable row level security;
alter table public.weekly_money_dates enable row level security;

revoke all on table public.sinking_funds from anon;
revoke all on table public.weekly_money_dates from anon;
revoke all on table public.sinking_funds from authenticated;
revoke all on table public.weekly_money_dates from authenticated;
grant select, insert, update, delete on table public.sinking_funds to authenticated;
grant select, insert, update, delete on table public.weekly_money_dates to authenticated;

drop policy if exists "members manage sinking funds" on public.sinking_funds;
create policy "members manage sinking funds" on public.sinking_funds
for all to authenticated
using ((select private.is_household_member(household_id)))
with check ((select private.is_household_member(household_id)));

drop policy if exists "members manage weekly money dates" on public.weekly_money_dates;
create policy "members manage weekly money dates" on public.weekly_money_dates
for all to authenticated
using ((select private.is_household_member(household_id)))
with check ((select private.is_household_member(household_id)));

create or replace function private.validate_sinking_fund_actor()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.created_by is not null and not exists (
    select 1 from public.household_members member
    where member.household_id = new.household_id and member.user_id = new.created_by
  ) then
    raise exception 'sinking fund creator must belong to the same household';
  end if;
  return new;
end;
$$;

create or replace function private.validate_weekly_money_date_actor()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.reviewed_by is not null and not exists (
    select 1 from public.household_members member
    where member.household_id = new.household_id and member.user_id = new.reviewed_by
  ) then
    raise exception 'weekly review actor must belong to the same household';
  end if;
  return new;
end;
$$;

revoke all on function private.validate_sinking_fund_actor() from public, anon, authenticated;
revoke all on function private.validate_weekly_money_date_actor() from public, anon, authenticated;

drop trigger if exists validate_sinking_fund_actor on public.sinking_funds;
create trigger validate_sinking_fund_actor
before insert or update of household_id, created_by on public.sinking_funds
for each row execute function private.validate_sinking_fund_actor();

drop trigger if exists validate_weekly_money_date_actor on public.weekly_money_dates;
create trigger validate_weekly_money_date_actor
before insert or update of household_id, reviewed_by on public.weekly_money_dates
for each row execute function private.validate_weekly_money_date_actor();

drop trigger if exists set_sinking_funds_updated_at on public.sinking_funds;
create trigger set_sinking_funds_updated_at before update on public.sinking_funds
for each row execute function private.set_updated_at();

drop trigger if exists set_weekly_money_dates_updated_at on public.weekly_money_dates;
create trigger set_weekly_money_dates_updated_at before update on public.weekly_money_dates
for each row execute function private.set_updated_at();

create index if not exists sinking_funds_household_due_idx
  on public.sinking_funds (household_id, due_date) where active;
create index if not exists sinking_funds_created_by_idx
  on public.sinking_funds (created_by) where created_by is not null;
create index if not exists weekly_money_dates_reviewed_by_idx
  on public.weekly_money_dates (reviewed_by) where reviewed_by is not null;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sinking_funds'
  ) then alter publication supabase_realtime add table public.sinking_funds; end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'weekly_money_dates'
  ) then alter publication supabase_realtime add table public.weekly_money_dates; end if;
end
$$;
