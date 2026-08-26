-- Match the monthly check-up table to the app's least-privilege access needs.

revoke all on table public.monthly_checkups from anon;
revoke all on table public.monthly_checkups from authenticated;
grant select, insert, update, delete on table public.monthly_checkups to authenticated;
