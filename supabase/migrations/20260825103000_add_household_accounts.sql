-- Our Budget v6: shared bank/cash accounts with transaction linkage.
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  account_type text not null check (account_type in ('bank','cash','wallet')),
  currency character(3) not null default 'MVR' check (currency in ('AED','MVR','INR','USD')),
  opening_balance numeric(16,2) not null default 0,
  opening_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, name)
);

alter table public.transactions
  add column if not exists account_id uuid references public.accounts(id) on delete set null;

alter table public.accounts enable row level security;
revoke all on table public.accounts from anon;
grant select, insert, update, delete on table public.accounts to authenticated;

drop policy if exists "members manage accounts" on public.accounts;
create policy "members manage accounts" on public.accounts
for all to authenticated
using (private.is_household_member(household_id))
with check (private.is_household_member(household_id));

create or replace function private.enforce_transaction_account_household()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.account_id is not null and not exists (
    select 1
    from public.accounts a
    where a.id = new.account_id
      and a.household_id = new.household_id
  ) then
    raise exception 'transaction account must belong to the same household';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_transaction_account_household() from public;
revoke all on function private.enforce_transaction_account_household() from anon;
revoke all on function private.enforce_transaction_account_household() from authenticated;

drop trigger if exists enforce_transaction_account_household on public.transactions;
create trigger enforce_transaction_account_household
before insert or update of account_id, household_id on public.transactions
for each row execute function private.enforce_transaction_account_household();

create index if not exists accounts_household_idx on public.accounts (household_id);
create index if not exists transactions_account_date_idx on public.transactions (account_id, date desc)
where account_id is not null;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'accounts'
  ) then
    alter publication supabase_realtime add table public.accounts;
  end if;
end
$$;
