-- MET Campus account-scoped backend.
-- Apply in the Supabase SQL editor before enabling backend credentials in an APK.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'student'
    check (role in ('student', 'tpo', 'hod', 'coordinator', 'principal', 'club')),
  portal_id text,
  name text not null default '',
  first_name text not null default '',
  label text not null default '',
  tone text not null default 'lilac',
  phone text not null default '',
  class_name text not null default '',
  programme text not null default '',
  department text not null default '',
  class_scope text not null default '',
  club_id text not null default '',
  division text not null default '',
  roll_number text not null default '',
  prn text not null default '',
  cgpa numeric(4,2),
  backlogs integer,
  semester text not null default '',
  academic_year text not null default '',
  batch text not null default '',
  lab_group text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_portal_check check (
    (role = 'student' and portal_id is null)
    or (role <> 'student' and portal_id is not null)
  )
);

create table if not exists public.user_app_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint user_app_state_size_check check (pg_column_size(state) <= 2097152)
);

create table if not exists public.campus_content (
  id smallint primary key check (id = 1),
  data jsonb not null default '{}'::jsonb,
  version bigint not null default 0,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint campus_content_private_fields_check check (
    not (data ?| array['students', 'sessions', 'formResponses', 'gateRequests', 'gateLog', 'entry', 'profile', 'admin'])
  )
);

insert into public.campus_content (id, data)
values (1, '{}'::jsonb)
on conflict (id) do nothing;

create table if not exists public.form_responses (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('event', 'drive')),
  target_id text not null,
  club_id text not null default '',
  student_name text not null default '',
  student_prn text not null default '',
  student_email text not null default '',
  submitted_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint form_response_size_check check (pg_column_size(payload) <= 65536)
);

create index if not exists form_responses_user_date_idx
  on public.form_responses (user_id, submitted_at desc);
create index if not exists form_responses_target_idx
  on public.form_responses (kind, target_id, submitted_at desc);
create unique index if not exists form_responses_user_target_uidx
  on public.form_responses (user_id, kind, target_id);

create or replace function public.set_form_response_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select name, prn, email
  into new.student_name, new.student_prn, new.student_email
  from public.profiles
  where id = new.user_id;
  if not found then
    raise exception 'A provisioned account profile is required to submit a response';
  end if;
  return new;
end;
$$;

drop trigger if exists form_responses_set_identity on public.form_responses;
create trigger form_responses_set_identity
before insert on public.form_responses
for each row execute function public.set_form_response_identity();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists user_app_state_set_updated_at on public.user_app_state;
create trigger user_app_state_set_updated_at
before update on public.user_app_state
for each row execute function public.set_updated_at();

create or replace function public.create_met_campus_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  metadata jsonb := coalesce(new.raw_app_meta_data, '{}'::jsonb);
  account_role text := coalesce(nullif(metadata ->> 'role', ''), 'student');
begin
  insert into public.profiles (
    id, email, role, portal_id, name, first_name, label, tone,
    phone, class_name, programme, department, class_scope, club_id,
    division, roll_number, prn, cgpa, backlogs, semester,
    academic_year, batch, lab_group
  ) values (
    new.id,
    coalesce(new.email, ''),
    account_role,
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

create or replace function public.save_campus_content(p_data jsonb, p_expected_version bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_version bigint;
  old_data jsonb;
  new_data jsonb;
  actor_role text;
  actor_club text;
  actor_department text;
  actor_class_scope text;
  allowed_keys text[];
  field_name text;
  old_other_events jsonb;
  new_other_events jsonb;
begin
  select role, club_id, department, class_scope
  into actor_role, actor_club, actor_department, actor_class_scope
  from public.profiles where id = auth.uid();
  if actor_role is null or actor_role = 'student' then
    raise exception 'Only a provisioned staff account may publish campus content';
  end if;
  if actor_role = 'club' and coalesce(actor_club, '') = '' then
    raise exception 'A club account must be assigned to a campus club';
  end if;

  allowed_keys := case actor_role
    when 'club' then array['events']
    when 'coordinator' then
      case when actor_class_scope = 'T.E. CSD' then array['timetable', 'timetableInfo'] else array[]::text[] end
    when 'hod' then
      case when actor_department = 'CSD'
        then array['announcements', 'assignments', 'notes', 'results', 'timetable', 'timetableInfo', 'subjects']
        else array[]::text[] end
    when 'tpo' then array['announcements', 'drives', 'events']
    when 'principal' then array['announcements', 'assignments', 'notes', 'results', 'drives', 'events', 'timetable', 'timetableInfo', 'subjects', 'curriculum', 'clubs']
    else array[]::text[]
  end;

  select data into old_data from public.campus_content where id = 1;
  old_data := coalesce(old_data, '{}'::jsonb);
  for field_name in
    select jsonb_object_keys(coalesce(p_data, '{}'::jsonb))
  loop
    if not (field_name = any(allowed_keys)) then
      raise exception 'Role % cannot update campus content field %', actor_role, field_name;
    end if;
  end loop;

  if p_data is null or jsonb_typeof(p_data) <> 'object' then
    raise exception 'Campus content update must be a JSON object';
  end if;
  if p_data ?| array['students', 'sessions', 'formResponses', 'gateRequests', 'gateLog', 'entry', 'profile', 'admin'] then
    raise exception 'Private student/account fields are not accepted in campus content';
  end if;
  new_data := old_data || p_data;

  if actor_role = 'club' then
    select coalesce(jsonb_agg(e order by e ->> 'id'), '[]'::jsonb) into old_other_events
    from jsonb_array_elements(coalesce(old_data -> 'events', '[]'::jsonb)) e
    where e ->> 'clubId' <> actor_club;
    select coalesce(jsonb_agg(e order by e ->> 'id'), '[]'::jsonb) into new_other_events
    from jsonb_array_elements(coalesce(new_data -> 'events', '[]'::jsonb)) e
    where e ->> 'clubId' <> actor_club;
    if old_other_events is distinct from new_other_events then
      raise exception 'Club accounts can only change their own events';
    end if;
  end if;

  update public.campus_content
  set data = new_data, version = version + 1, updated_by = auth.uid(), updated_at = now()
  where id = 1 and version = p_expected_version
  returning version into next_version;

  if next_version is null then
    raise exception 'Campus content changed in another session; reload before saving';
  end if;
  return next_version;
end;
$$;

drop trigger if exists on_auth_user_created_met_campus on auth.users;
create trigger on_auth_user_created_met_campus
after insert on auth.users
for each row execute function public.create_met_campus_profile();

drop trigger if exists on_auth_user_updated_met_campus on auth.users;
create trigger on_auth_user_updated_met_campus
after update on auth.users
for each row
when (old.email is distinct from new.email or old.raw_app_meta_data is distinct from new.raw_app_meta_data)
execute function public.create_met_campus_profile();

alter table public.profiles enable row level security;
alter table public.user_app_state enable row level security;
alter table public.campus_content enable row level security;
alter table public.form_responses enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
revoke all on public.user_app_state from anon, authenticated;
grant select, insert, update, delete on public.user_app_state to authenticated;
revoke all on public.campus_content from anon, authenticated;
grant select on public.campus_content to authenticated;
revoke all on public.form_responses from anon, authenticated;
grant select, insert on public.form_responses to authenticated;
revoke all on function public.save_campus_content(jsonb, bigint) from public, anon;
grant execute on function public.save_campus_content(jsonb, bigint) to authenticated;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles for select to authenticated
using (id = (select auth.uid()));

drop policy if exists "Users can read their own app state" on public.user_app_state;
create policy "Users can read their own app state"
on public.user_app_state for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users can create their own app state" on public.user_app_state;
create policy "Users can create their own app state"
on public.user_app_state for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "Users can update their own app state" on public.user_app_state;
create policy "Users can update their own app state"
on public.user_app_state for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete their own app state" on public.user_app_state;
create policy "Users can delete their own app state"
on public.user_app_state for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Authenticated users can read campus content" on public.campus_content;
create policy "Authenticated users can read campus content"
on public.campus_content for select to authenticated
using (id = 1);

drop policy if exists "Users can read their own form responses or their assigned inbox" on public.form_responses;
create policy "Users can read their own form responses or their assigned inbox"
on public.form_responses for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and (
        p.role = 'principal'
        or (p.role = 'tpo' and form_responses.kind = 'drive')
        or (p.role = 'club' and form_responses.kind = 'event' and form_responses.club_id = p.club_id)
      )
  )
);

drop policy if exists "Students can submit their own form responses" on public.form_responses;
create policy "Students can submit their own form responses"
on public.form_responses for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'student')
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
