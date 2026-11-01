-- Restrict helper and trigger functions to the roles that actually need them.
-- Trigger functions do not require caller EXECUTE privileges, so exposing them
-- through PostgREST only creates unnecessary RPC surface area.

revoke all on function public.create_met_campus_profile() from public, anon, authenticated;
revoke all on function public.guard_campus_content_active_account() from public, anon, authenticated;
revoke all on function public.set_form_response_identity() from public, anon, authenticated;

revoke all on function public.save_campus_content(jsonb, bigint) from public, anon;
grant execute on function public.save_campus_content(jsonb, bigint) to authenticated, service_role;

revoke all on function public.met_student_first_password(text, text) from public, anon, authenticated;
grant execute on function public.met_student_first_password(text, text) to service_role;

alter function public.met_student_first_password(text, text) set search_path = '';
