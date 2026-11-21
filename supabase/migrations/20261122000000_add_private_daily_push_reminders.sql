alter table public.household_settings
  add column if not exists data_generation integer not null default 1,
  add column if not exists data_start_date date,
  add column if not exists data_reset_at timestamptz;

alter table public.household_settings
  drop constraint if exists household_settings_data_generation_check;

alter table public.household_settings
  add constraint household_settings_data_generation_check
  check (data_generation > 0);

create schema if not exists private;
revoke all on schema private from public;

create or replace function private.request_matches_data_generation(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_settings settings
    where settings.household_id = p_household_id
      and (
        settings.data_generation = 1
        or case
          when coalesce(current_setting('request.headers', true)::jsonb ->> 'x-our-dhan-generation', '') ~ '^[0-9]+$'
            then (current_setting('request.headers', true)::jsonb ->> 'x-our-dhan-generation')::integer = settings.data_generation
          else false
        end
      )
  );
$$;

revoke all on function private.request_matches_data_generation(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.request_matches_data_generation(uuid) to authenticated;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'transactions', 'budgets', 'goals', 'debts', 'assets', 'accounts',
    'household_settings', 'recurring_items', 'goal_contributions',
    'net_worth_snapshots', 'monthly_checkups', 'sinking_funds',
    'weekly_money_dates', 'statement_delivery_log'
  ]
  loop
    execute format('drop policy if exists "Current data generation insert" on public.%I', target_table);
    execute format(
      'create policy "Current data generation insert" on public.%I as restrictive for insert to authenticated with check (private.request_matches_data_generation(household_id))',
      target_table
    );
    execute format('drop policy if exists "Current data generation update" on public.%I', target_table);
    execute format(
      'create policy "Current data generation update" on public.%I as restrictive for update to authenticated using (private.request_matches_data_generation(household_id)) with check (private.request_matches_data_generation(household_id))',
      target_table
    );
    execute format('drop policy if exists "Current data generation delete" on public.%I', target_table);
    execute format(
      'create policy "Current data generation delete" on public.%I as restrictive for delete to authenticated using (private.request_matches_data_generation(household_id))',
      target_table
    );
  end loop;
end;
$$;

create table if not exists public.push_runtime_config (
  id smallint primary key default 1 check (id = 1),
  cron_secret text not null,
  vapid_public_key text,
  vapid_private_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default extensions.uuid_generate_v4(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  device_name text not null default 'This phone',
  timezone text not null default 'Indian/Maldives',
  enabled boolean not null default true,
  last_reminder_key text,
  last_sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_enabled_idx
  on public.push_subscriptions (enabled, household_id);

alter table public.push_runtime_config enable row level security;
alter table public.push_subscriptions enable row level security;

revoke all on table public.push_runtime_config from public, anon, authenticated;
revoke all on table public.push_subscriptions from public, anon, authenticated;
grant select, insert, update, delete on table public.push_runtime_config to service_role;
grant select, insert, update, delete on table public.push_subscriptions to service_role;

insert into public.push_runtime_config (id, cron_secret)
values (1, encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (id) do nothing;

create or replace function public.claim_push_reminder(
  p_subscription_id uuid,
  p_reminder_key text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.push_subscriptions
  set last_reminder_key = p_reminder_key,
      last_error = null,
      updated_at = now()
  where id = p_subscription_id
    and enabled = true
    and last_reminder_key is distinct from p_reminder_key;
  return found;
end;
$$;

revoke all on function public.claim_push_reminder(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_push_reminder(uuid, text) to service_role;

create extension if not exists pg_net;
create extension if not exists pg_cron;

create or replace function private.dispatch_our_dhan_reminders(p_slot text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_id bigint;
  secret_value text;
begin
  if p_slot not in ('15:00', '21:00') then
    raise exception 'Unsupported reminder slot';
  end if;

  select cron_secret into secret_value
  from public.push_runtime_config
  where id = 1;

  if secret_value is null then
    raise exception 'Push reminder secret is missing';
  end if;

  select net.http_post(
    url := 'https://wdtlkqcgyjvosejolyqd.supabase.co/functions/v1/push-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', secret_value
    ),
    body := jsonb_build_object('action', 'dispatch', 'slot', p_slot),
    timeout_milliseconds := 10000
  ) into request_id;

  return request_id;
end;
$$;

revoke all on function private.dispatch_our_dhan_reminders(text) from public, anon, authenticated;

do $$
declare
  existing_job record;
begin
  for existing_job in
    select jobid from cron.job
    where jobname in ('our-dhan-reminder-1500', 'our-dhan-reminder-2100')
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;
end;
$$;

select cron.schedule(
  'our-dhan-reminder-1500',
  '0 10 * * *',
  $$select private.dispatch_our_dhan_reminders('15:00');$$
);

select cron.schedule(
  'our-dhan-reminder-2100',
  '0 16 * * *',
  $$select private.dispatch_our_dhan_reminders('21:00');$$
);

