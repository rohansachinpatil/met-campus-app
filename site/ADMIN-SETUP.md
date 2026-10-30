# MET registration review desk: setup and use

The review page is `https://YOUR-VERCEL-DOMAIN/met-admin.html`. It is not linked from the public landing page. The page itself is not a security boundary: the `registration-admin` Edge Function checks the signed-in account against `profiles` on every request and permits only the active `principal` role with portal ID `principal`. The service-role key stays inside Supabase Edge Functions.

## One-time setup

### 1. Check the Supabase project settings

In the MET-owned Supabase project:

1. Open **Authentication → Settings**.
2. Enable student sign-ups and require email confirmation.
3. Set the **Site URL** to the deployed Vercel site.
4. Add the exact registration return URL, `https://YOUR-VERCEL-DOMAIN/register?verified=1`, to the redirect allow list. Add your production domain and any staging domain you will use.
5. Add an official MET-owned email provider if your institution requires it. Ask MET IT to review the privacy and data-retention wording before collecting live student details.

### 2. Apply all database migrations

From the project root, install/use the Supabase CLI, authenticate, link the project, and push migrations:

```sh
npx supabase@latest login
npx supabase@latest link --project-ref bafjeaykzmmhpmocyaql
npx supabase@latest db push
```

This applies the backend, PRN sign-in, pending-registration, and review-workflow migrations. If the project has a migration-history mismatch, stop and have the database owner reconcile it; do not use `db reset` on a live project.

### 3. Deploy the two Edge Functions

```sh
npx supabase@latest functions deploy student-sign-in --project-ref bafjeaykzmmhpmocyaql
npx supabase@latest functions deploy registration-admin --project-ref bafjeaykzmmhpmocyaql
```

`registration-admin` requires a valid Supabase session and then performs its own role check. Supabase supplies the function’s server-side `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ANON_KEY` secrets. If the service-role secret is missing, add it in **Project Settings → Edge Functions → Secrets**. Never put it in `site/config.js`, Vercel public variables, or the browser.

### 4. Publish the static site

In Vercel, set the project root directory to `site`, framework to **Other**, and leave the build command blank. Check `site/config.js` contains the right project URL and **publishable** key. After deployment, open `/met-admin.html` directly; do not add a link to the public page unless MET wants one.

### 5. Create the first principal administrator

The admin page cannot promote itself. An authorized MET owner must:

1. Invite the official principal email in **Supabase → Authentication → Users**.
2. Have the recipient accept the invitation and confirm the email.
3. Copy the Auth user UUID from the user details.
4. Copy `scripts/met-principal.env.example` to `.env.admin.local` in the project root. Fill in the project URL, service-role key, confirmed Auth user UUID, exact official email, and official name. The script checks the UUID/email match. This file is git-ignored.
5. Run `node scripts/provision-met-principal.mjs` from the project root.
6. After the script confirms the profile is active, delete `.env.admin.local`. Never send its contents or the service-role key to anyone.

The script sets trusted app metadata to `role: principal`, `portal_id: principal`, and `account_status: active`. It refuses to promote an unconfirmed email. Consider enabling MFA for the principal Auth account.

## Review a student request

1. Go to `/met-admin.html` and sign in with the confirmed official principal account.
2. Open a request. Confirm the displayed email is verified. If it is not, wait for the student to use their verification email; the Approve button stays disabled.
3. Compare the claimed name and PRN against MET’s official enrollment records. Do not approve based only on the public form. Enter the verified name and PRN, check the attestation, then choose **Approve and activate**.
4. The server checks the confirmed email, checks that the PRN is not assigned to another student, writes trusted Auth app metadata, confirms the profile became active, and marks the request approved. The student can then sign in using their PRN and chosen password.
5. To deny an invalid request, choose **Reject request** and confirm. The request is marked rejected and the pending profile is suspended.

The queue is private to the Edge Function. Browser code never queries `registration_requests` directly or receives a service-role key. A review claimed by an administrator can be resumed by that same account; an abandoned review can be taken over after 15 minutes. The page shows at most the latest 100 pending/in-progress requests.

## Manual steps MET still owns

- Verify the student’s identity and claimed PRN against the official MET record.
- Confirm use of the approved MET email domain and approved privacy/retention wording.
- Invite and verify the initial principal account, then run the one-time local provisioning script.
- Keep the principal account secure (MFA recommended), review requests, and resolve duplicate PRNs through MET before re-approval.
- Apply migrations, deploy Edge Functions, and publish the site. These steps are not performed automatically by the static site.
