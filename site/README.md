# MET Campus website

This is a static landing page for Vercel. It is intentionally separate from the Expo app at the repository root.

## Deploy to Vercel

1. Import the repository in Vercel.
2. Set **Root Directory** to `site` and **Framework Preset** to **Other**.
3. Leave the build command empty and set the output directory to `.`.
4. Deploy.

The Android button stays unavailable until a signed APK is placed at `site/downloads/met-campus.apk`. The page checks for that file and enables the download when it exists. Preview screens are illustrative and contain no student names or PRNs.

Student registration uses the public publishable key in `config.js` (this key is intended for browser use; do not put a service-role key there). In Supabase, enable sign-ups, require email confirmation, set the Vercel Site URL/redirect allow-list, and apply all five repository migrations. New signups remain pending until MET verifies the student and activates the trusted app metadata. The private review desk is at `/met-admin.html`; it is restricted server-side to an active principal account. See [`ADMIN-SETUP.md`](ADMIN-SETUP.md) for step-by-step setup, initial principal provisioning, account provisioning, deployment, and approval instructions.

You can also run the static page locally by serving this directory with a static file server. This is required for the APK availability check to work; opening the file directly may block that request.
