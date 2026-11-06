create or replace function public.keepalive()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $function$
  select true;
$function$;

comment on function public.keepalive() is
  'Anonymous health pulse for the free GitHub keep-alive. Returns no household data.';

revoke all on function public.keepalive() from public, anon, authenticated, service_role;
grant execute on function public.keepalive() to anon;
