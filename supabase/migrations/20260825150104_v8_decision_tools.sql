-- Our Budget v8: shared debt strategy and monthly balance check-ups.

alter table public.household_settings
  add column if not exists debt_strategy text not null default 'avalanche';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'household_settings_debt_strategy_check'
      and conrelid = 'public.household_settings'::regclass
  ) then
    alter table public.household_settings
      add constraint household_settings_debt_strategy_check
      check (debt_strategy in ('avalanche', 'snowball'));
  end if;
end
$$;

create table if not exists public.monthly_checkups (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  completed_by uuid references auth.users(id) on delete set null,
  account_count smallint not null default 0 check (account_count between 0 and 100),
  adjustment_total_usd numeric(18,4) not null default 0,
  note text check (note is null or char_length(note) <= 500),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, month)
);

alter table public.monthly_checkups enable row level security;

revoke all on table public.monthly_checkups from anon;
revoke all on table public.monthly_checkups from authenticated;
grant select, insert, update, delete on table public.monthly_checkups to authenticated;

drop policy if exists "members manage monthly checkups" on public.monthly_checkups;
create policy "members manage monthly checkups" on public.monthly_checkups
for all to authenticated
using ((select private.is_household_member(household_id)))
with check ((select private.is_household_member(household_id)));

create index if not exists monthly_checkups_completed_by_idx
  on public.monthly_checkups (completed_by)
  where completed_by is not null;

create or replace function private.validate_monthly_checkup_actor()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.completed_by is not null and not exists (
    select 1
    from public.household_members member
    where member.household_id = new.household_id
      and member.user_id = new.completed_by
  ) then
    raise exception 'monthly checkup actor must belong to the same household';
  end if;
  return new;
end;
$$;

revoke all on function private.validate_monthly_checkup_actor() from public, anon, authenticated;

drop trigger if exists validate_monthly_checkup_actor on public.monthly_checkups;
create trigger validate_monthly_checkup_actor
before insert or update of household_id, completed_by on public.monthly_checkups
for each row execute function private.validate_monthly_checkup_actor();

drop trigger if exists set_monthly_checkups_updated_at on public.monthly_checkups;
create trigger set_monthly_checkups_updated_at
before update on public.monthly_checkups
for each row execute function private.set_updated_at();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'monthly_checkups'
  ) then
    alter publication supabase_realtime add table public.monthly_checkups;
  end if;
end
$$;
