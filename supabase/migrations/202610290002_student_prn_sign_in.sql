-- PRN sign-in resolves the private PRN-to-Auth-email mapping only in an Edge Function.
-- Store only keyed digests in the rate-limit table; never store raw PRNs or passwords.

create unique index if not exists profiles_student_prn_uidx
  on public.profiles (prn)
  where role = 'student' and prn <> '';

create table if not exists public.student_login_rate_limits (
  prn_key text primary key check (prn_key ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null default now(),
  attempts integer not null default 1 check (attempts > 0)
);

alter table public.student_login_rate_limits enable row level security;
revoke all on table public.student_login_rate_limits from public, anon, authenticated;
grant all on table public.student_login_rate_limits to service_role;

create or replace function public.consume_student_prn_login_attempt(p_prn_key text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  attempt_count integer;
begin
  if p_prn_key !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid rate-limit key';
  end if;

  insert into public.student_login_rate_limits as limits (prn_key, window_started_at, attempts)
  values (p_prn_key, now(), 1)
  on conflict (prn_key) do update set
    attempts = case
      when limits.window_started_at <= now() - interval '15 minutes' then 1
      else limits.attempts + 1
    end,
    window_started_at = case
      when limits.window_started_at <= now() - interval '15 minutes' then now()
      else limits.window_started_at
    end
  returning attempts into attempt_count;

  if random() < 0.02 then
    delete from public.student_login_rate_limits
    where window_started_at < now() - interval '24 hours';
  end if;

  return attempt_count <= 8;
end;
$$;

revoke all on function public.consume_student_prn_login_attempt(text) from public, anon, authenticated;
grant execute on function public.consume_student_prn_login_attempt(text) to service_role;
