create index if not exists push_subscriptions_household_idx
  on public.push_subscriptions (household_id);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

drop policy if exists "No browser access" on public.push_runtime_config;
create policy "No browser access"
  on public.push_runtime_config
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists "No browser access" on public.push_subscriptions;
create policy "No browser access"
  on public.push_subscriptions
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

