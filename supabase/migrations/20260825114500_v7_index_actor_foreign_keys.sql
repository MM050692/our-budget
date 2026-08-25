-- Cover actor foreign keys used by account cleanup and future audit queries.
create index if not exists recurring_items_created_by_idx
  on public.recurring_items (created_by) where created_by is not null;

create index if not exists goal_contributions_user_idx
  on public.goal_contributions (user_id) where user_id is not null;
