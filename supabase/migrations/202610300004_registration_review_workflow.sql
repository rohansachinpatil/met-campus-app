-- Extend the private registration queue with a short review claim to prevent
-- two reviewers from activating the same request with different PRNs.

alter table public.registration_requests
  drop constraint if exists registration_requests_status_check;

alter table public.registration_requests
  add constraint registration_requests_status_check
  check (status in ('pending', 'reviewing', 'approved', 'rejected'));

alter table public.registration_requests
  add column if not exists reviewed_by uuid references auth.users (id) on delete set null;

create index if not exists registration_requests_review_owner_idx
  on public.registration_requests (reviewed_by, reviewed_at)
  where status = 'reviewing';
