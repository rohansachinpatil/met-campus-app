-- Public website signups create pending requests only. MET must verify and provision
-- the account before the PRN sign-in function or app data policies allow access.

alter table public.profiles
  add column if not exists account_status text not null default 'pending';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_account_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_account_status_check
      check (account_status in ('pending', 'active', 'suspended'));
  end if;
end;
$$;

update public.profiles
set account_status = 'active'
where account_status = 'pending'
  and (
    (role = 'student' and prn <> '')
    or (role <> 'student' and coalesce(portal_id, '') <> '')
  );

create table if not exists public.registration_requests (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  claimed_name text not null default '',
  claimed_prn text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint registration_request_name_length check (char_length(claimed_name) <= 120),
  constraint registration_request_prn_format check (claimed_prn = '' or claimed_prn ~ '^[0-9]{8,20}$')
);

create index if not exists registration_requests_status_date_idx
  on public.registration_requests (status, submitted_at desc);

alter table public.registration_requests enable row level security;
revoke all on table public.registration_requests from public, anon, authenticated;
grant all on table public.registration_requests to service_role;

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
  insert into public.profiles (
    id, email, role, account_status, portal_id, name, first_name, label, tone,
    phone, class_name, programme, department, class_scope, club_id,
    division, roll_number, prn, cgpa, backlogs, semester,
    academic_year, batch, lab_group
  ) values (
    new.id,
    coalesce(new.email, ''),
    account_role,
    account_status,
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
    role = excluded.role,
    account_status = excluded.account_status,
    portal_id = excluded.portal_id,
    name = excluded.name,
    first_name = excluded.first_name,
    label = excluded.label,
    tone = excluded.tone,
    phone = excluded.phone,
    class_name = excluded.class_name,
    programme = excluded.programme,
    department = excluded.department,
    class_scope = excluded.class_scope,
    club_id = excluded.club_id,
    division = excluded.division,
    roll_number = excluded.roll_number,
    prn = excluded.prn,
    cgpa = excluded.cgpa,
    backlogs = excluded.backlogs,
    semester = excluded.semester,
    academic_year = excluded.academic_year,
    batch = excluded.batch,
    lab_group = excluded.lab_group;
  return new;
end;
$$;

create or replace function public.create_met_campus_registration_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  signup_data jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  submitted_prn text := trim(coalesce(signup_data ->> 'claimed_prn', ''));
begin
  if signup_data ->> 'met_campus_registration' = 'true' then
    insert into public.registration_requests (user_id, email, claimed_name, claimed_prn)
    values (
      new.id,
      coalesce(new.email, ''),
      left(trim(coalesce(signup_data ->> 'claimed_name', '')), 120),
      case when submitted_prn ~ '^[0-9]{8,20}$' then submitted_prn else '' end
    )
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.create_met_campus_registration_request() from public, anon, authenticated;
grant execute on function public.create_met_campus_registration_request() to service_role;

drop trigger if exists on_auth_user_registration_request on auth.users;
create trigger on_auth_user_registration_request
after insert on auth.users
for each row execute function public.create_met_campus_registration_request();

create or replace function public.guard_campus_content_active_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.updated_by is not null and not exists (
    select 1 from public.profiles p
    where p.id = new.updated_by and p.account_status = 'active'
  ) then
    raise exception 'An active campus account is required to publish content';
  end if;
  return new;
end;
$$;

drop trigger if exists campus_content_require_active_account on public.campus_content;
create trigger campus_content_require_active_account
before update on public.campus_content
for each row execute function public.guard_campus_content_active_account();

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles for select to authenticated
using (id = (select auth.uid()) and account_status = 'active');

drop policy if exists "Users can read their own app state" on public.user_app_state;
create policy "Users can read their own app state"
on public.user_app_state for select to authenticated
using (
  user_id = (select auth.uid())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.account_status = 'active')
);

drop policy if exists "Users can create their own app state" on public.user_app_state;
create policy "Users can create their own app state"
on public.user_app_state for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.account_status = 'active')
);

drop policy if exists "Users can update their own app state" on public.user_app_state;
create policy "Users can update their own app state"
on public.user_app_state for update to authenticated
using (
  user_id = (select auth.uid())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.account_status = 'active')
)
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.account_status = 'active')
);

drop policy if exists "Users can delete their own app state" on public.user_app_state;
create policy "Users can delete their own app state"
on public.user_app_state for delete to authenticated
using (
  user_id = (select auth.uid())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.account_status = 'active')
);

drop policy if exists "Authenticated users can read campus content" on public.campus_content;
create policy "Active users can read campus content"
on public.campus_content for select to authenticated
using (
  id = 1
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.account_status = 'active')
);

drop policy if exists "Users can read their own form responses or their assigned inbox" on public.form_responses;
create policy "Active users can read their own form responses or their assigned inbox"
on public.form_responses for select to authenticated
using (
  exists (select 1 from public.profiles active_profile where active_profile.id = (select auth.uid()) and active_profile.account_status = 'active')
  and (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.account_status = 'active'
        and (
          p.role = 'principal'
          or (p.role = 'tpo' and form_responses.kind = 'drive')
          or (p.role = 'club' and form_responses.kind = 'event' and form_responses.club_id = p.club_id)
        )
    )
  )
);

drop policy if exists "Students can submit their own form responses" on public.form_responses;
create policy "Active students can submit their own form responses"
on public.form_responses for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'student' and p.account_status = 'active'
  )
  and (
    (
      kind = 'event'
      and exists (
        select 1
        from public.campus_content c
        cross join lateral jsonb_array_elements(coalesce(c.data -> 'events', '[]'::jsonb)) e
        where c.id = 1
          and e ->> 'id' = form_responses.target_id
          and e ->> 'clubId' = form_responses.club_id
          and e ->> 'published' = 'true'
          and coalesce((e ->> 'registrationDeadline')::timestamptz, now() + interval '1 day') >= now()
      )
    )
    or (
      kind = 'drive'
      and form_responses.club_id = ''
      and exists (
        select 1
        from public.profiles p
        join public.campus_content c on c.id = 1
        cross join lateral jsonb_array_elements(coalesce(c.data -> 'drives', '[]'::jsonb)) d
        where p.id = (select auth.uid())
          and p.role = 'student'
          and p.account_status = 'active'
          and d ->> 'id' = form_responses.target_id
          and not coalesce((d ->> 'demo')::boolean, false)
          and coalesce((d ->> 'deadline')::timestamptz, now() + interval '1 day') >= now()
          and (p.cgpa is null or p.cgpa >= coalesce(nullif(d ->> 'minCgpa', '')::numeric, 0))
          and (p.backlogs is null or p.backlogs <= coalesce(nullif(d ->> 'maxBacklogs', '')::integer, 0))
          and jsonb_typeof(form_responses.payload -> 'eligibilityPending') = 'boolean'
          and (form_responses.payload ->> 'eligibilityPending')::boolean = (p.cgpa is null or p.backlogs is null)
      )
    )
  )
);
