import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env.admin.local');
let rawEnv;
try {
  rawEnv = readFileSync(envPath, 'utf8');
} catch {
  console.error('Create .env.admin.local from scripts/met-principal.env.example first.');
  process.exit(1);
}

const localEnv = {};
for (const line of rawEnv.split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (!match || match[1].startsWith('#')) continue;
  localEnv[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
}

const baseUrl = String(localEnv.SUPABASE_URL || '').replace(/\/$/, '');
const serviceRoleKey = localEnv.SUPABASE_SERVICE_ROLE_KEY || '';
const userId = localEnv.MET_PRINCIPAL_USER_ID || '';
const principalEmail = String(localEnv.MET_PRINCIPAL_EMAIL || '').trim().toLowerCase();
const principalName = String(localEnv.MET_PRINCIPAL_NAME || '').trim();

if (!baseUrl.startsWith('https://') || !serviceRoleKey || !userId || !principalEmail || !principalName) {
  console.error('Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MET_PRINCIPAL_USER_ID, MET_PRINCIPAL_EMAIL, and MET_PRINCIPAL_NAME in .env.admin.local.');
  process.exit(1);
}

if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
  console.error('MET_PRINCIPAL_USER_ID must be the Auth user UUID shown in Supabase.');
  process.exit(1);
}

const headers = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  Accept: 'application/json',
  'Content-Type': 'application/json'
};

async function readJson(response) {
  try { return await response.json(); } catch { return null; }
}

try {
  const userResponse = await fetch(`${baseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`, { headers });
  const user = await readJson(userResponse);
  if (!userResponse.ok || !user?.id) throw new Error('Could not find that Auth user. Check its UUID.');
  if (String(user.email || '').trim().toLowerCase() !== principalEmail) throw new Error('The Auth UUID and official principal email do not match.');
  if (!user.email_confirmed_at) throw new Error('Confirm the official MET email before making this account an administrator.');

  const previous = user.app_metadata && typeof user.app_metadata === 'object' ? user.app_metadata : {};
  const appMetadata = {
    ...(typeof previous.provider === 'string' ? { provider: previous.provider } : {}),
    ...(Array.isArray(previous.providers) ? { providers: previous.providers } : {}),
    role: 'principal',
    portal_id: 'principal',
    account_status: 'active',
    name: principalName
  };

  const updateResponse = await fetch(`${baseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ app_metadata: appMetadata })
  });
  if (!updateResponse.ok) throw new Error('Supabase rejected the trusted app-metadata update.');

  const profileUrl = new URL(`${baseUrl}/rest/v1/profiles`);
  profileUrl.searchParams.set('select', 'id,role,portal_id,account_status');
  profileUrl.searchParams.set('id', `eq.${userId}`);
  profileUrl.searchParams.set('limit', '1');
  const profileResponse = await fetch(profileUrl, { headers });
  const profiles = await readJson(profileResponse);
  const profile = Array.isArray(profiles) ? profiles[0] : null;
  if (!profileResponse.ok || !profile || profile.role !== 'principal' || profile.portal_id !== 'principal' || profile.account_status !== 'active') {
    throw new Error('Auth metadata updated, but the campus profile is not active. Confirm all migrations and the Auth profile trigger are installed.');
  }

  console.log('The confirmed MET principal account is provisioned and active. Keep .env.admin.local private and delete it when setup is complete.');
} catch (error) {
  console.error(error && error.message ? error.message : 'Principal provisioning failed.');
  process.exitCode = 1;
}
