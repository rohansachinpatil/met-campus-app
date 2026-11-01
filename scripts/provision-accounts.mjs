#!/usr/bin/env node
/**
 * Provision MET Campus accounts from the private account manifest.
 *
 * Safety rules:
 * - Dry-run is the default. Nothing is written until --apply is passed.
 * - Credentials are derived locally and never printed.
 * - The manifest and the generated report stay inside the git-ignored
 *   supabase/private/ directory.
 * - The service-role key is read from .env.admin.local or the environment and
 *   is never logged.
 *
 * Usage:
 *   node scripts/provision-accounts.mjs
 *   node scripts/provision-accounts.mjs --apply
 *   node scripts/provision-accounts.mjs --apply --reset-passwords
 *
 * Account rules:
 *   Students: username = PRN
 *             initial password = lowercase first name + last two PRN digits
 *   Faculty/clubs: username ends in _iot (from login_id)
 *                  initial password = METCAMPUS, then a personal 12+ password
 *
 * Rows without auth_email or a usable PRN/username are skipped and reported.
 * The script never guesses or invents an official email address.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const RESET_PASSWORDS = args.includes('--reset-passwords');
const HELP = args.includes('--help') || args.includes('-h');

const INSTITUTIONS = new Set(['IOT', 'IOE', 'IOM', 'IOPD', 'IOPS']);
const STUDENT_ROLES = new Set(['student']);
const STAFF_ROLES = new Set(['tpo', 'hod', 'coordinator', 'principal', 'club']);
const DEFAULT_MANIFEST = 'supabase/private/account-provisioning-manifest.csv';
const DEFAULT_REPORT = 'supabase/private/provisioning-report.csv';
const NAME_PREFIXES = new Set(['mr', 'mrs', 'ms', 'miss', 'dr', 'prof', 'sir', 'madam']);
const DEPARTMENT_PORTALS = {
  CSD: 'hodcsd',
  CSE: 'hodcse',
  AR: 'hodar',
  ARSA: 'hodar',
  CEE: 'hodcee',
  ECE: 'hodece'
};
const CLASS_SCOPE_PORTALS = {
  'S.E. CSD': 'cccsd',
  'T.E. CSD': 'cctycsd',
  'F.E.': 'ccfe',
  'B.E.': 'ccbe'
};
const CLUB_IDS = {
  ecell: 'ecell',
  ecellmet: 'ecell',
  staple: 'staple',
  codecrafters: 'codecrafters',
  tedxmet: 'tedxmet',
  sacsde: 'sacsde'
};
/* Only rows MET has finished checking may be provisioned. */
const MANIFEST_READY_STATUSES = new Set(['active', 'ready', 'approved', 'verified']);

function option(name) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : '';
}

const manifestPath = resolve(process.cwd(), option('--manifest') || DEFAULT_MANIFEST);
const reportPath = resolve(process.cwd(), option('--report') || DEFAULT_REPORT);
const institution = String(option('--institution') || 'IOT').trim().toUpperCase();

if (HELP) {
  console.log('Usage: node scripts/provision-accounts.mjs [--apply] [--reset-passwords] [--institution IOT] [--manifest path] [--report path]');
  process.exit(0);
}

if (!INSTITUTIONS.has(institution)) {
  console.error('Institution must be one of: ' + [...INSTITUTIONS].join(', ') + '.');
  process.exit(1);
}

function loadEnv() {
  const env = { ...process.env };
  const envPath = resolve(process.cwd(), '.env.admin.local');
  if (!existsSync(envPath)) return env;
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || match[1].startsWith('#')) continue;
    env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
  return env;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (character !== '\r') {
      field += character;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  if (!rows.length) return [];
  const header = rows.shift().map((cell) => cell.replace(/^\uFEFF/, '').trim());
  return rows
    .filter((cells) => cells.some((cell) => String(cell).trim() !== ''))
    .map((cells, index) => {
      const record = { __row: index + 2 };
      header.forEach((key, column) => {
        record[key] = String(cells[column] == null ? '' : cells[column]).trim();
      });
      return record;
    });
}

function firstNameOf(displayName) {
  const words = String(displayName || '').trim().split(/\s+/).filter(Boolean);
  const first = words.find((word) => !NAME_PREFIXES.has(word.toLowerCase().replace(/[^a-z]/g, ''))) || words[0] || '';
  return first
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

function derivedStudentPassword(displayName, prn) {
  const suffix = String(prn || '').slice(-2);
  let value = firstNameOf(displayName) + suffix;
  /* Supabase requires six characters; repeat the PRN suffix for short names,
     matching public.met_student_first_password in the database. */
  while (value.length < 6 && suffix.length) value += suffix;
  return value;
}

function normalizeStaffUsername(raw) {
  let username = String(raw || '').trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  if (!username) return '';
  if (!username.endsWith('_iot')) username += '_iot';
  return username;
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function safeCode(value) {
  return String(value || '')
    .replace(/[^a-z0-9_-]/gi, '')
    .slice(0, 40);
}

function derivePortalId(role, department, classScope) {
  if (role === 'principal') return 'principal';
  if (role === 'tpo') return 'tpo';
  if (role === 'hod') return DEPARTMENT_PORTALS[String(department || '').toUpperCase()] || '';
  if (role === 'coordinator') {
    if (/AR/i.test(classScope)) return 'ccarsa';
    return CLASS_SCOPE_PORTALS[classScope] || '';
  }
  return '';
}

function deriveClubId(portalId, clubId) {
  const raw = String(clubId || portalId || '').trim().toLowerCase().replace(/^club_/, '');
  return CLUB_IDS[raw] || raw;
}

function labelFor(role, department, classScope) {
  if (role === 'principal') return 'Principal';
  if (role === 'tpo') return 'TPO · Training & Placement';
  if (role === 'hod') return 'HOD · ' + (department || 'Department');
  if (role === 'coordinator') return 'Class coordinator · ' + (classScope || 'Campus');
  if (role === 'club') return 'Club administrator';
  return 'Student';
}

function toneFor(role) {
  if (role === 'principal') return 'ink';
  if (role === 'tpo') return 'mint';
  if (role === 'hod') return 'lilac';
  if (role === 'coordinator') return 'peach';
  if (role === 'club') return 'butter';
  return 'lilac';
}

const env = loadEnv();
const baseUrl = String(env.SUPABASE_URL || '').replace(/\/$/, '');
const serviceRoleKey = String(env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY || '');
const staffInitialPassword = String(env.MET_STAFF_INITIAL_PASSWORD || 'METCAMPUS');
const configured = baseUrl.startsWith('https://') && serviceRoleKey.length > 0;

async function api(path, options = {}) {
  const headers = {
    apikey: serviceRoleKey,
    Authorization: 'Bearer ' + serviceRoleKey,
    Accept: 'application/json'
  };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.prefer) headers.Prefer = options.prefer;
  const response = await fetch(baseUrl + path, {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }
  if (!response.ok) {
    const code = payload && (payload.code || payload.error_code || payload.error);
    const error = new Error('Supabase request failed (' + response.status + (code ? ' ' + safeCode(code) : '') + ').');
    error.status = response.status;
    throw error;
  }
  return payload;
}

async function listAuthUsers() {
  const byEmail = new Map();
  for (let page = 1; page <= 1000; page += 1) {
    const payload = await api('/auth/v1/admin/users?page=' + page + '&per_page=1000');
    const users = payload && Array.isArray(payload.users) ? payload.users : [];
    if (!users.length) break;
    for (const user of users) {
      const email = String(user && user.email || '').trim().toLowerCase();
      if (email) byEmail.set(email, user);
    }
  }
  return byEmail;
}

async function listProfiles() {
  const profiles = [];
  let offset = 0;
  while (offset < 100000) {
    const rows = await api('/rest/v1/profiles?select=id,email,role,prn,username,account_status,password_setup_completed_at&order=id&limit=1000&offset=' + offset);
    if (!Array.isArray(rows) || !rows.length) break;
    profiles.push(...rows);
    offset += rows.length;
  }
  return profiles;
}

function readManifest() {
  if (!existsSync(manifestPath)) {
    console.error('Manifest not found at ' + manifestPath + '.');
    console.error('Place the private manifest inside supabase/private/ and never commit it.');
    process.exit(1);
  }
  const rows = parseCsv(readFileSync(manifestPath, 'utf8'));
  if (!rows.length) {
    console.error('The manifest has no data rows.');
    process.exit(1);
  }
  return rows;
}

function validateRows(rows) {
  const prepared = rows.map((row) => {
    const accountType = String(row.account_type || '').trim().toLowerCase();
    const role = String(row.role || '').trim().toLowerCase() || (accountType === 'student' ? 'student' : '');
    const isStudent = role === 'student' || accountType === 'student';
    const prn = String(row.prn || '').trim();
    const loginId = String(row.login_id || '').trim();
    const email = String(row.auth_email || '').trim().toLowerCase();
    const displayName = String(row.display_name || '').trim().replace(/\s+/g, ' ');
    const department = String(row.department || '').trim();
    const classScope = String(row.class_scope || '').trim();
    const suppliedPortalId = String(row.portal_id || '').trim().toLowerCase();
    const username = isStudent ? prn : normalizeStaffUsername(loginId);
    const portalId = isStudent ? '' : suppliedPortalId || derivePortalId(role, department, classScope);
    const clubId = !isStudent && role === 'club' ? deriveClubId(portalId, row.club_id) : '';
    const password = isStudent && prn ? derivedStudentPassword(displayName, prn) : staffInitialPassword;
    const reasons = [];

    if (!isStudent && !STAFF_ROLES.has(role)) reasons.push('unknown-role');
    if (isStudent && !STUDENT_ROLES.has(role)) reasons.push('unknown-student-role');
    if (accountType && accountType !== 'student' && accountType !== 'faculty' && accountType !== 'staff' && accountType !== 'club') {
      reasons.push('unknown-account-type');
    }
    if (isStudent) {
      if (!prn) reasons.push('missing-prn');
      if (prn && !/^[0-9]{8,20}$/.test(prn)) reasons.push('invalid-prn-format');
      if (prn && /^[0-9](?:\.[0-9]+)?e\+?[0-9]+$/i.test(prn)) reasons.push('prn-looks-like-excel-scientific-notation');
      if (loginId && prn && loginId !== prn) reasons.push('login-id-does-not-match-prn');
    } else {
      if (!loginId) reasons.push('missing-staff-username');
      if (loginId.includes('@')) reasons.push('staff-username-looks-like-an-email');
      if (username && !/^[a-z0-9_]{3,64}$/.test(username)) reasons.push('invalid-staff-username');
      if (!portalId) reasons.push('missing-portal-id');
      if (role === 'club' && !clubId) reasons.push('missing-club-id');
    }
    if (!email) reasons.push('missing-auth-email');
    if (email && !validEmail(email)) reasons.push('invalid-auth-email');
    if (!displayName) reasons.push('missing-display-name');
    if (password.length < 6) reasons.push('initial-password-too-short');
    if (password.length > 72) reasons.push('initial-password-too-long');

    return {
      ...row,
      __accountType: accountType,
      __role: role,
      __isStudent: isStudent,
      __prn: prn,
      __username: username,
      __email: email,
      __displayName: displayName,
      __firstName: firstNameOf(displayName),
      __department: department,
      __classScope: classScope,
      __portalId: portalId,
      __clubId: clubId,
      __password: password,
      __reasons: [...new Set(reasons)]
    };
  });

  const prnCounts = new Map();
  const emailCounts = new Map();
  const usernameCounts = new Map();
  for (const row of prepared) {
    if (row.__isStudent && row.__prn) prnCounts.set(row.__prn, (prnCounts.get(row.__prn) || 0) + 1);
    if (row.__email) emailCounts.set(row.__email, (emailCounts.get(row.__email) || 0) + 1);
    if (row.__username) usernameCounts.set(row.__username, (usernameCounts.get(row.__username) || 0) + 1);
  }

  for (const row of prepared) {
    if (row.__isStudent && row.__prn && (prnCounts.get(row.__prn) || 0) > 1) row.__reasons.push('duplicate-prn-in-manifest');
    if (row.__email && (emailCounts.get(row.__email) || 0) > 1) row.__reasons.push('duplicate-auth-email-in-manifest');
    if (row.__username && (usernameCounts.get(row.__username) || 0) > 1) row.__reasons.push('duplicate-username-in-manifest');
    const readiness = String(row.account_status || '').trim().toLowerCase();
    if (readiness === 'suspended') {
      row.__reasons.push('manifest-status-suspended');
    } else if (readiness && !MANIFEST_READY_STATUSES.has(readiness)) {
      const reasonCode = safeCode(readiness);
      row.__reasons.push('manifest-status-' + (reasonCode || 'not-ready'));
    }
    row.__reasons = [...new Set(row.__reasons)];
  }

  return prepared;
}

function profilePayloadFor(row, forceSetup) {
  const payload = {
    id: row.__userId,
    email: row.__email,
    role: row.__role,
    account_status: 'active',
    username: row.__username,
    institution,
    portal_id: row.__isStudent ? null : row.__portalId,
    name: row.__displayName,
    first_name: row.__firstName,
    label: labelFor(row.__role, row.__department, row.__classScope),
    tone: toneFor(row.__role),
    department: row.__department,
    class_scope: row.__classScope,
    class_name: row.__classScope
  };
  if (row.__isStudent) payload.prn = row.__prn;
  if (row.__role === 'club') payload.club_id = row.__clubId;
  if (forceSetup) payload.password_setup_completed_at = null;
  return payload;
}

function appMetadataFor(row, existing, forceSetup) {
  const previous = existing && existing.app_metadata && typeof existing.app_metadata === 'object'
    ? existing.app_metadata
    : {};
  const metadata = {
    ...previous,
    role: row.__role,
    username: row.__username,
    institution,
    account_status: 'active',
    portal_id: row.__isStudent ? null : row.__portalId,
    club_id: row.__role === 'club' ? row.__clubId : '',
    name: row.__displayName,
    first_name: row.__firstName,
    label: labelFor(row.__role, row.__department, row.__classScope),
    tone: toneFor(row.__role),
    department: row.__department,
    class_scope: row.__classScope,
    class_name: row.__classScope
  };
  if (row.__isStudent) metadata.prn = row.__prn;
  if (forceSetup) {
    metadata.must_change_password = true;
    metadata.password_setup_completed_at = '';
  }
  return metadata;
}

async function fetchProfile(userId) {
  const rows = await api('/rest/v1/profiles?select=id,email,role,prn,username,account_status,password_setup_completed_at&id=eq.' + encodeURIComponent(userId) + '&limit=1');
  return Array.isArray(rows) ? rows[0] || null : null;
}

function writeReport(results) {
  const header = ['row', 'login_id', 'email', 'status', 'reason'];
  const lines = [header.join(',')];
  const escape = (value) => {
    const text = String(value == null ? '' : value);
    return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  };
  for (const result of results) {
    lines.push([
      result.__row,
      result.__username || '',
      result.__email || '',
      result.__status || 'pending',
      (result.__reasons || []).join('; ')
    ].map(escape).join(','));
  }
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, lines.join('\r\n') + '\r\n', 'utf8');
}

function printSummary(results) {
  const counts = new Map();
  for (const result of results) {
    const status = result.__status || 'pending';
    counts.set(status, (counts.get(status) || 0) + 1);
  }
  const ordered = [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  console.log('');
  console.log('Rows in manifest: ' + results.length);
  for (const [status, count] of ordered) console.log('  ' + status + ': ' + count);

  const reasonCounts = new Map();
  for (const result of results) {
    if (result.__status !== 'skipped' && result.__status !== 'failed') continue;
    for (const reason of result.__reasons || []) {
      reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
    }
  }
  if (reasonCounts.size) {
    console.log('Skip/failure reasons:');
    [...reasonCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .forEach(([reason, count]) => console.log('  ' + reason + ': ' + count));
  }
  console.log('Report written to ' + reportPath + '. Keep it private.');
}

async function main() {
  if (APPLY && !configured) {
    console.error('Create .env.admin.local with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before using --apply.');
    console.error('Never place the service-role key in the app, the website, or git.');
    process.exit(1);
  }

  const rows = validateRows(readManifest());

  let usersByEmail = new Map();
  let profiles = [];
  if (configured) {
    usersByEmail = await listAuthUsers();
    profiles = await listProfiles();
  }

  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const profilesByEmail = new Map(profiles.filter((profile) => profile.email).map((profile) => [String(profile.email).toLowerCase(), profile]));
  const profilesByPrn = new Map(profiles.filter((profile) => profile.prn).map((profile) => [profile.prn, profile]));
  const profilesByUsername = new Map(profiles.filter((profile) => profile.username).map((profile) => [String(profile.username).toLowerCase(), profile]));

  for (const row of rows) {
    if (row.__reasons.length) {
      row.__status = 'skipped';
      continue;
    }

    if (!configured) {
      row.__status = 'ready-to-create (remote check skipped)';
      continue;
    }

    const existingUser = usersByEmail.get(row.__email) || null;
    const existingProfile = (existingUser && profilesById.get(existingUser.id)) || profilesByEmail.get(row.__email) || null;

    if (existingProfile && existingProfile.role !== row.__role) {
      row.__reasons.push('existing-profile-role-mismatch');
      row.__status = 'skipped';
      continue;
    }
    if (row.__isStudent && existingProfile && existingProfile.prn && existingProfile.prn !== row.__prn) {
      row.__reasons.push('existing-profile-prn-mismatch');
      row.__status = 'skipped';
      continue;
    }
    if (!row.__isStudent && existingProfile && existingProfile.username &&
        String(existingProfile.username).toLowerCase() !== row.__username) {
      row.__reasons.push('existing-profile-username-mismatch');
      row.__status = 'skipped';
      continue;
    }
    const prnOwner = row.__isStudent ? profilesByPrn.get(row.__prn) : null;
    if (prnOwner && prnOwner.id !== (existingUser && existingUser.id) && prnOwner.id !== (existingProfile && existingProfile.id)) {
      row.__reasons.push('prn-assigned-to-another-account');
      row.__status = 'skipped';
      continue;
    }
    const usernameOwner = profilesByUsername.get(row.__username);
    if (usernameOwner && usernameOwner.id !== (existingUser && existingUser.id) && usernameOwner.id !== (existingProfile && existingProfile.id)) {
      row.__reasons.push('username-assigned-to-another-account');
      row.__status = 'skipped';
      continue;
    }
    if (existingUser && existingUser.app_metadata && existingUser.app_metadata.role &&
        existingUser.app_metadata.role !== row.__role) {
      row.__reasons.push('auth-account-role-mismatch');
      row.__status = 'skipped';
      continue;
    }

    row.__existingUser = existingUser;
    row.__existingProfile = existingProfile;
    if (!existingUser) {
      row.__status = 'would-create';
    } else if (RESET_PASSWORDS) {
      row.__status = 'would-reset-password';
    } else {
      row.__status = 'would-update';
    }
  }

  if (!APPLY) {
    writeReport(rows);
    printSummary(rows);
    const ready = rows.filter((row) => row.__status.startsWith('would') || row.__status.startsWith('ready')).length;
    console.log('');
    console.log(ready
      ? 'Dry run only. Re-run with --apply to write these changes.'
      : 'No rows are ready. Fill in auth_email and PRN/staff username in the private manifest, then run again.');
    return;
  }

  const results = [];
  let created = 0;
  let updated = 0;
  let reset = 0;
  let failed = 0;

  for (const row of rows) {
    if (row.__status === 'skipped') {
      results.push(row);
      continue;
    }

    try {
      const existingUser = row.__existingUser || usersByEmail.get(row.__email) || null;
      const existingProfile = row.__existingProfile || (existingUser && profilesById.get(existingUser.id)) || profilesByEmail.get(row.__email) || null;
      const forceSetup = !existingUser || RESET_PASSWORDS;
      const metadata = appMetadataFor(row, existingUser, forceSetup);

      let user = existingUser;
      if (!user) {
        user = await api('/auth/v1/admin/users', {
          method: 'POST',
          body: {
            email: row.__email,
            password: row.__password,
            email_confirm: true,
            app_metadata: metadata
          }
        });
        created += 1;
        row.__status = 'created';
      } else {
        if (RESET_PASSWORDS) {
          metadata.must_change_password = true;
          metadata.password_setup_completed_at = '';
          await api('/auth/v1/admin/users/' + encodeURIComponent(user.id), {
            method: 'PUT',
            body: { password: row.__password, app_metadata: metadata }
          });
          reset += 1;
          row.__status = 'password-reset';
        } else {
          if (existingProfile && existingProfile.password_setup_completed_at) {
            metadata.password_setup_completed_at = existingProfile.password_setup_completed_at;
            metadata.must_change_password = false;
          }
          await api('/auth/v1/admin/users/' + encodeURIComponent(user.id), {
            method: 'PUT',
            body: { app_metadata: metadata }
          });
          updated += 1;
          row.__status = 'updated';
        }
      }

      if (!user || !user.id) throw new Error('Auth user id was not returned.');
      row.__userId = user.id;

      await api('/rest/v1/profiles?on_conflict=id', {
        method: 'POST',
        prefer: 'resolution=merge-duplicates,return=minimal',
        body: profilePayloadFor(row, forceSetup)
      });

      const profile = await fetchProfile(user.id);
      if (!profile || profile.account_status !== 'active' ||
          profile.role !== row.__role || profile.username !== row.__username) {
        throw new Error('Profile verification failed.');
      }
      if (forceSetup && profile.password_setup_completed_at) {
        throw new Error('Profile still shows a completed password setup.');
      }
      results.push(row);
    } catch (error) {
      failed += 1;
      row.__status = 'failed';
      row.__reasons.push(error && error.message ? error.message : 'Unknown provisioning error.');
      results.push(row);
    }
  }

  writeReport(results);
  printSummary(results);
  console.log('');
  console.log('Created: ' + created + ', updated: ' + updated + ', password resets: ' + reset + ', failed: ' + failed + ', skipped: ' + (rows.length - created - updated - reset - failed) + '.');
  if (failed) {
    console.error('Some rows failed. Read the private report, fix the cause, and re-run. Do not send the report to anyone.');
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error && error.message ? error.message : 'Account provisioning failed.');
  process.exitCode = 1;
});
