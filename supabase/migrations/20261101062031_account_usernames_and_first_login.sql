-- Support private username lookup and require newly provisioned accounts to
-- choose a personal password before they can read or write campus data.

alter table public.profiles
  add column if not exists username text,
  add column if not exists institution text not null default 'IOT',
  add column if not exists password_setup_completed_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_username_format_check'
  ) then
    alter table public.profiles
      add constraint profiles_username_format_check
      check (username is null or username ~ '^[a-z0-9_]{3,64}$');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_institution_check'
  ) then
    alter table public.profiles
      add constraint profiles_institution_check
      check (institution in ('IOT', 'IOE', 'IOM', 'IOPD', 'IOPS'));
  end if;
end;
$$;

-- Existing active accounts already chose their password. Do not lock them out.
update public.profiles
set password_setup_completed_at = now()
where account_status = 'active'
  and password_setup_completed_at is null;

-- Existing student PRNs remain their usernames. Map known staff portal IDs to
-- the requested IOT usernames; accounts without a unique mapping remain unset
-- until they are provisioned from the private manifest.
update public.profiles
set username = prn
where role = 'student'
  and prn ~ '^[0-9]{8,20}$'
  and (username is null or username = '');

with candidates as (
  select
    id,
    case lower(portal_id)
      when 'principal' then 'principal_iot'
      when 'tpo' then 'tpo_iot'
      when 'hodcsd' then 'hodcsd_iot'
      when 'hodcse' then 'hodcse_iot'
      when 'hodarsa' then 'hodar_iot'
      when 'hodar' then 'hodar_iot'
      when 'hoscee' then 'hodcee_iot'
      when 'hodcee' then 'hodcee_iot'
      when 'hodece' then 'hodece_iot'
      when 'cccsd' then 'cccsd_iot'
      when 'ccarsa' then 'ccarsa_iot'
      when 'ccfe' then 'ccfe_iot'
      when 'ccbe' then 'ccbe_iot'
      when 'cctycsd' then 'cctycsd_iot'
      when 'club_ecell' then 'ecellmet_iot'
      when 'ecellmet' then 'ecellmet_iot'
      when 'club_tedxmet' then 'tedxmet_iot'
      when 'tedxmet' then 'tedxmet_iot'
      when 'club_codecrafters' then 'codecrafters_iot'
      when 'codecrafters' then 'codecrafters_iot'
      when 'club_staple' then 'staple_iot'
      when 'staple' then 'staple_iot'
      when 'club_sacsde' then 'sacsde_iot'
      when 'sacsde' then 'sacsde_iot'
      else null
    end as candidate,
    row_number() over (
      partition by case lower(portal_id)
        when 'principal' then 'principal_iot'
        when 'tpo' then 'tpo_iot'
        when 'hodcsd' then 'hodcsd_iot'
        when 'hodcse' then 'hodcse_iot'
        when 'hodarsa' then 'hodar_iot'
        when 'hodar' then 'hodar_iot'
        when 'hoscee' then 'hodcee_iot'
        when 'hodcee' then 'hodcee_iot'
        when 'hodece' then 'hodece_iot'
        when 'cccsd' then 'cccsd_iot'
        when 'ccarsa' then 'ccarsa_iot'
        when 'ccfe' then 'ccfe_iot'
        when 'ccbe' then 'ccbe_iot'
        when 'cctycsd' then 'cctycsd_iot'
        when 'club_ecell' then 'ecellmet_iot'
        when 'ecellmet' then 'ecellmet_iot'
        when 'club_tedxmet' then 'tedxmet_iot'
        when 'tedxmet' then 'tedxmet_iot'
        when 'club_codecrafters' then 'codecrafters_iot'
        when 'codecrafters' then 'codecrafters_iot'
        when 'club_staple' then 'staple_iot'
        when 'staple' then 'staple_iot'
        when 'club_sacsde' then 'sacsde_iot'
        when 'sacsde' then 'sacsde_iot'
        else null
      end
      order by created_at, id
    ) as candidate_order
  from public.profiles
  where role <> 'student'
    and (username is null or username = '')
)
update public.profiles p
set username = c.candidate
from candidates c
where p.id = c.id
  and c.candidate is not null
  and c.candidate_order = 1
  and not exists (
    select 1 from public.profiles occupied
    where occupied.id <> p.id
      and lower(occupied.username) = c.candidate
  );

create unique index if not exists profiles_username_lower_uidx
  on public.profiles (lower(username))
  where username is not null and username <> '';

create table if not exists public.staff_login_rate_limits (
  username_key text primary key check (username_key ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null default now(),
  attempts integer not null default 1 check (attempts > 0)
);

alter table public.staff_login_rate_limits enable row level security;
revoke all on table public.staff_login_rate_limits from public, anon, authenticated;
grant all on table public.staff_login_rate_limits to service_role;

create or replace function public.consume_staff_login_attempt(p_username_key text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  attempt_count integer;
begin
  if p_username_key !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid rate-limit key';
  end if;

  insert into public.staff_login_rate_limits as limits (username_key, window_started_at, attempts)
  values (p_username_key, now(), 1)
  on conflict (username_key) do update set
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
    delete from public.staff_login_rate_limits
    where window_started_at < now() - interval '24 hours';
  end if;

  return attempt_count <= 8;
end;
$$;

revoke all on function public.consume_staff_login_attempt(text) from public, anon, authenticated;
grant execute on function public.consume_staff_login_attempt(text) to service_role;

-- Keep the Auth-triggered profile mirror in sync with trusted app metadata.
create or replace function public.create_met_campus_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  metadata jsonb := coalesce(new.raw_app_meta_data, '{}'::jsonb);
  account_role text := coalesce(nullif(metadata ->> 'role', ''), 'student');
  account_status text := case
    when metadata ->> 'account_status' = 'suspended' then 'suspended'
    when metadata ->> 'account_status' = 'pending' then 'pending'
    when account_role = 'student' and coalesce(metadata ->> 'prn', '') <> '' then 'active'
    when account_role <> 'student' and coalesce(metadata ->> 'portal_id', '') <> '' then 'active'
    else 'pending'
  end;
begin
  insert into public.profiles as p (
    id, email, role, account_status, username, institution, password_setup_completed_at,
    portal_id, name, first_name, label, tone, phone, class_name, programme,
    department, class_scope, club_id, division, roll_number, prn, cgpa,
    backlogs, semester, academic_year, batch, lab_group
  ) values (
    new.id,
    coalesce(new.email, ''),
    account_role,
    account_status,
    coalesce(nullif(metadata ->> 'username', ''), nullif(metadata ->> 'prn', '')),
    coalesce(nullif(metadata ->> 'institution', ''), 'IOT'),
    nullif(metadata ->> 'password_setup_completed_at', '')::timestamptz,
    nullif(metadata ->> 'portal_id', ''),
    coalesce(metadata ->> 'name', ''),
    coalesce(metadata ->> 'first_name', ''),
    coalesce(metadata ->> 'label', ''),
    coalesce(metadata ->> 'tone', 'lilac'),
    coalesce(metadata ->> 'phone', ''),
    coalesce(metadata ->> 'class_name', ''),
    coalesce(metadata ->> 'programme', ''),
    coalesce(metadata ->> 'department', ''),
    coalesce(metadata ->> 'class_scope', ''),
    coalesce(metadata ->> 'club_id', ''),
    coalesce(metadata ->> 'division', ''),
    coalesce(metadata ->> 'roll_number', ''),
    coalesce(metadata ->> 'prn', ''),
    nullif(metadata ->> 'cgpa', '')::numeric,
    nullif(metadata ->> 'backlogs', '')::integer,
    coalesce(metadata ->> 'semester', ''),
    coalesce(metadata ->> 'academic_year', ''),
    coalesce(metadata ->> 'batch', ''),
    coalesce(metadata ->> 'lab_group', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    role = case
      when metadata ? 'role' then excluded.role
      else p.role
    end,
    account_status = case
      when metadata ? 'account_status' then excluded.account_status
      else p.account_status
    end,
    username = case
      when metadata ? 'username' or metadata ? 'prn' then excluded.username
      else p.username
    end,
    institution = case
      when metadata ? 'institution' then excluded.institution
      else p.institution
    end,
    password_setup_completed_at = case
      when metadata ? 'password_setup_completed_at' then excluded.password_setup_completed_at
      else p.password_setup_completed_at
    end,
    portal_id = case
      when metadata ? 'portal_id' then excluded.portal_id
      else p.portal_id
    end,
    name = case when metadata ? 'name' then excluded.name else p.name end,
    first_name = case when metadata ? 'first_name' then excluded.first_name else p.first_name end,
    label = case when metadata ? 'label' then excluded.label else p.label end,
    tone = case when metadata ? 'tone' then excluded.tone else p.tone end,
    phone = case when metadata ? 'phone' then excluded.phone else p.phone end,
    class_name = case when metadata ? 'class_name' then excluded.class_name else p.class_name end,
    programme = case when metadata ? 'programme' then excluded.programme else p.programme end,
    department = case when metadata ? 'department' then excluded.department else p.department end,
    class_scope = case when metadata ? 'class_scope' then excluded.class_scope else p.class_scope end,
    club_id = case when metadata ? 'club_id' then excluded.club_id else p.club_id end,
    division = case when metadata ? 'division' then excluded.division else p.division end,
    roll_number = case when metadata ? 'roll_number' then excluded.roll_number else p.roll_number end,
    prn = case when metadata ? 'prn' then excluded.prn else p.prn end,
    cgpa = case when metadata ? 'cgpa' then excluded.cgpa else p.cgpa end,
    backlogs = case when metadata ? 'backlogs' then excluded.backlogs else p.backlogs end,
    semester = case when metadata ? 'semester' then excluded.semester else p.semester end,
    academic_year = case when metadata ? 'academic_year' then excluded.academic_year else p.academic_year end,
    batch = case when metadata ? 'batch' then excluded.batch else p.batch end,
    lab_group = case when metadata ? 'lab_group' then excluded.lab_group else p.lab_group end;
  return new;
end;
$$;

-- Restrictive policies add a second gate to the existing per-user policies.
-- The profile itself stays readable by its active owner so the app can show
-- the password setup screen; all campus and account data remains blocked.
drop policy if exists "Require completed password setup for app state" on public.user_app_state;
create policy "Require completed password setup for app state"
on public.user_app_state as restrictive for all to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid())
    and p.account_status = 'active'
    and p.password_setup_completed_at is not null
))
with check (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid())
    and p.account_status = 'active'
    and p.password_setup_completed_at is not null
));

drop policy if exists "Require completed password setup for campus content" on public.campus_content;
create policy "Require completed password setup for campus content"
on public.campus_content as restrictive for all to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid())
    and p.account_status = 'active'
    and p.password_setup_completed_at is not null
))
with check (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid())
    and p.account_status = 'active'
    and p.password_setup_completed_at is not null
));

drop policy if exists "Require completed password setup for form responses" on public.form_responses;
create policy "Require completed password setup for form responses"
on public.form_responses as restrictive for all to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid())
    and p.account_status = 'active'
    and p.password_setup_completed_at is not null
))
with check (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid())
    and p.account_status = 'active'
    and p.password_setup_completed_at is not null
));

create or replace function public.guard_campus_content_active_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.updated_by is not null and not exists (
    select 1 from public.profiles p
    where p.id = new.updated_by
      and p.account_status = 'active'
      and p.password_setup_completed_at is not null
  ) then
    raise exception 'An active campus account with a personal password is required to publish content';
  end if;
  return new;
end;
$$;
