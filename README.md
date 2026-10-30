# MET Campus

An Expo campus companion for MET Institute of Technology. The student and role-specific staff/club portals are built with HTML, CSS and vanilla JavaScript inside a React Native WebView.

## Run the app

```sh
npm install
npx expo start -c
```

Open Expo Go and scan the QR code. For a web preview, run `npm run web`.

## Development demo

Debug builds may expose a local-only demo using placeholder identities. These are not institution-managed accounts and must not be used for real campus access. Production builds disable demo sign-in. The faculty portal selector uses portal IDs `principal`, `tpo`, `hodcsd`, `hodcse`, `hodarsa`, `hoscee` and `hodece`; these labels do not provision accounts or grant access.

## Data and demo limitations

- Student names and PRNs are not included in source control or app bundles. The S.E. CSD roll list and attendance remain unavailable until MET imports an approved roster into the protected backend.
- The T.E. CSD Semester V course/faculty assignments and sample Classroom posts are AY 2026–27 data. They are separate from the S.E. roster.
- The eight-semester curriculum and the verified T.E. CSD Semester V timetable for AY 2026–27 (effective 1 August 2026) are included. T1–T4 lab/seminar rotations are preserved; because the demo profile has no supplied roll number, students select their assigned batch to see that rotation. No S.E. weekly timetable was supplied.
- Sample placement listings and club-event promotions are labelled as samples and are excluded from a configured production session until staff publish real listings.
- Student sign-in accepts PRN and individual password. A server-side Edge Function maps the PRN to the verified Auth email; the email mapping is never returned to the app. Password recovery uses the verified MET email linked to the account.
- Faculty select a portal and sign in with their official MET email and individual password. The selected portal must exactly match the trusted `profiles.portal_id` and role; choosing a dropdown option never grants permissions.
- Supabase integration and row-level-security migrations are included. The live migrations and Edge Function still need to be applied/deployed before production sign-in and cloud sync can work.
- The website accepts student registration requests. Email confirmation does not activate an account: claimed PRNs stay in a restricted review queue until MET verifies enrollment and assigns the PRN through trusted app metadata. Faculty accounts remain administrator-provisioned.
- In configured builds, active campus profiles are administrator-provisioned; website registrations stay pending until MET verifies and provisions them. User preferences, attendance display values, assignment submission state, placement state and notifications sync to each active account’s private row. Event registrations and placement applications are stored in a restricted responses table. Published campus content is shared through a role-checked, versioned record.
- The attendance register and S.E. roster are not yet a shared backend feature. Student names and PRNs are absent from source control and app bundles until MET imports an approved roster into a protected backend table. Push notifications are not configured.

## Included modules

- Student home, classroom posts, assignments, announcements and notifications
- Eight-semester CSD curriculum and T.E. CSD Semester V timetable with batch rotations; roster views require an approved backend import
- Student club-event promotions, in-app registration and response review
- TPO placement forms, local applications and response review
- Staff/club dashboards with role-scoped demo routes
- Explicit attendance register; no marks are pre-seeded

## Build

Edit the HTML/CSS/JS in `web/`. `index.html` is the browser source shell; `build.js` bundles the web assets into `html.js`, which the Expo WebView loads.

```sh
npm run build
```

Run the build after changing `web/` or `index.html`. `App.js` is the native Expo/WebView wrapper.

## Vercel website

The static marketing and app-preview site lives in `site/`, separate from the Expo app. In Vercel, set the project root directory to `site` and use the **Other** framework preset with no build command. See [`site/README.md`](site/README.md). The Android download button becomes active when the signed APK is added at `site/downloads/met-campus.apk`.

## Supabase setup

1. Create a Supabase project owned by the institution. In **Authentication → Settings**, enable public sign-ups for the student request flow and require email confirmations. Configure the Site URL and redirect allow-list for the Vercel website and password-reset links. Faculty accounts remain administrator-provisioned.
2. Apply all four migrations in `supabase/migrations/` and deploy `student-sign-in` plus `registration-admin`. See [`site/ADMIN-SETUP.md`](site/ADMIN-SETUP.md) for the principal bootstrap and approval workflow.
3. The private `/met-admin.html` review desk only permits a confirmed, active principal account. MET must independently verify each claimed PRN before approval. The Edge Function assigns trusted **app metadata**, checks for duplicate PRNs, activates the profile, and records the review decision. The request table is not accessible to anon/authenticated users.
4. The PRN sign-in function uses server-side `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ANON_KEY` function secrets; never put either in the app or website. It verifies the mapped email, limits attempts to eight per PRN per 15 minutes, and returns an Auth session only after successful password verification.
5. Set `EXPO_PUBLIC_SUPABASE_URL` and the **public anon/publishable key** for the app. The Vercel site uses its public-only values in `site/config.js`; these may be visible to users, but must never be replaced with a service-role key.
6. Run `npm run build` and `npx expo start -c` for development. Demo sign-in is available only in development. Obtain MET’s approved privacy/retention wording before collecting registration details.

The migration restricts account state to its owner, form responses to the submitting student and assigned staff inboxes, and campus-content updates to role- and scope-specific fields. The shared campus-content RPC uses a version check to reject stale writes. Drive submissions are checked against provisioned CGPA/backlog values; unknown values remain pending, and duplicate submissions per target are prevented. It does not make the staff attendance register or the current roster cloud-backed; those require an approved roster-to-account mapping and a separate protected attendance model.

## Android APK

`eas.json` includes an internal `apk` profile for a directly installable APK and a `production` AAB profile for Google Play. This machine has an EAS login but the project is not linked to an EAS project yet. After configuring Supabase credentials, link it with `npx eas-cli@latest init`, then run:

```sh
npm run build:apk
```

EAS runs `npm run build:production` before packaging; that strips roster data and fails if roster names/PRNs or demo account credentials remain. A production APK still needs the institution’s approved privacy notice, a verified Supabase project, provisioned accounts, and an authorized roster import if attendance features are to be enabled.
