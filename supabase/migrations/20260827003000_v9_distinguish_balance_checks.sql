-- Our DHAN v9 follow-up: keep a month close separate from balance confirmation.

alter table public.monthly_checkups
  add column if not exists balances_checked_at timestamptz;

update public.monthly_checkups
set balances_checked_at = completed_at
where balances_checked_at is null
  and (account_count > 0 or adjustment_total_usd <> 0);
