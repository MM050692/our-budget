-- Apply the advisor-driven least-privilege and indexing follow-up to projects
-- that already ran the initial durability migration.

revoke all on table public.statement_delivery_log from service_role;
grant select, insert, update on table public.statement_delivery_log to service_role;

drop policy if exists "no direct statement delivery access" on public.statement_delivery_log;
create policy "no direct statement delivery access" on public.statement_delivery_log
for all to authenticated using (false) with check (false);

drop index if exists public.statement_delivery_household_period_idx;

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

