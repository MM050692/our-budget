-- Our DHAN v10: long-term data durability and private monthly statement delivery.

alter table public.household_settings
  add column if not exists email_statements_enabled boolean not null default false,
  add column if not exists statement_recipient_user_id uuid references auth.users(id) on delete set null,
  add column if not exists last_portable_backup_at timestamptz,
  add column if not exists last_portable_backup_sha256 text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'household_settings_backup_sha256_check'
      and conrelid = 'public.household_settings'::regclass
  ) then
    alter table public.household_settings
      add constraint household_settings_backup_sha256_check
      check (
        last_portable_backup_sha256 is null
        or last_portable_backup_sha256 ~ '^[0-9a-f]{64}$'
      );
  end if;
end
$$;

create or replace function private.validate_statement_settings()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  delivery_changed boolean := false;
begin
  if new.statement_recipient_user_id is not null and not exists (
    select 1
    from public.household_members member
    where member.household_id = new.household_id
      and member.user_id = new.statement_recipient_user_id
      and member.role = 'owner'
  ) then
    raise exception 'statement recipient must be the household owner';
  end if;

  if new.email_statements_enabled and new.statement_recipient_user_id is null then
    raise exception 'an email statement recipient is required';
  end if;

  if tg_op = 'UPDATE' then
    delivery_changed := new.email_statements_enabled is distinct from old.email_statements_enabled
      or new.statement_recipient_user_id is distinct from old.statement_recipient_user_id;
  elsif tg_op = 'INSERT' then
    delivery_changed := new.email_statements_enabled
      or new.statement_recipient_user_id is not null;
  end if;

  if delivery_changed then
    if (select auth.uid()) is not null and not exists (
      select 1
      from public.household_members member
      where member.household_id = new.household_id
        and member.user_id = (select auth.uid())
        and member.role = 'owner'
    ) then
      raise exception 'only the household owner can change statement delivery';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.validate_statement_settings() from public, anon, authenticated;

drop trigger if exists validate_statement_settings on public.household_settings;
create trigger validate_statement_settings
before insert or update of household_id, email_statements_enabled, statement_recipient_user_id
on public.household_settings
for each row execute function private.validate_statement_settings();

create table if not exists public.statement_delivery_log (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete restrict,
  requested_by uuid references auth.users(id) on delete set null,
  trigger_transaction_id uuid references public.transactions(id) on delete set null,
  period_start date not null,
  period_end date not null,
  status text not null default 'processing'
    check (status in ('processing', 'sent', 'failed')),
  provider text not null default 'resend'
    check (provider in ('resend')),
  provider_message_id text,
  error_code text,
  attempt_count smallint not null default 1 check (attempt_count between 1 and 20),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, period_start),
  check (period_start = date_trunc('month', period_start)::date),
  check (period_end >= period_start and period_end < period_start + interval '1 month'),
  check (provider_message_id is null or char_length(provider_message_id) <= 200),
  check (error_code is null or char_length(error_code) <= 200)
);

alter table public.statement_delivery_log enable row level security;
revoke all on table public.statement_delivery_log from public, anon, authenticated, service_role;
grant select, insert, update on table public.statement_delivery_log to service_role;

drop policy if exists "no direct statement delivery access" on public.statement_delivery_log;
create policy "no direct statement delivery access" on public.statement_delivery_log
for all to authenticated using (false) with check (false);

drop trigger if exists set_statement_delivery_log_updated_at on public.statement_delivery_log;
create trigger set_statement_delivery_log_updated_at
before update on public.statement_delivery_log
for each row execute function private.set_updated_at();

create index if not exists transactions_household_cursor_idx
  on public.transactions (household_id, id);
create index if not exists goal_contributions_household_cursor_idx
  on public.goal_contributions (household_id, id);
create index if not exists net_worth_snapshots_household_cursor_idx
  on public.net_worth_snapshots (household_id, id);
create index if not exists monthly_checkups_household_cursor_idx
  on public.monthly_checkups (household_id, id);
create index if not exists weekly_money_dates_household_cursor_idx
  on public.weekly_money_dates (household_id, id);
create index if not exists household_settings_statement_recipient_idx
  on public.household_settings (statement_recipient_user_id)
  where statement_recipient_user_id is not null;
create index if not exists statement_delivery_recipient_idx
  on public.statement_delivery_log (recipient_user_id);
create index if not exists statement_delivery_requested_by_idx
  on public.statement_delivery_log (requested_by)
  where requested_by is not null;
create index if not exists statement_delivery_trigger_transaction_idx
  on public.statement_delivery_log (trigger_transaction_id)
  where trigger_transaction_id is not null;
