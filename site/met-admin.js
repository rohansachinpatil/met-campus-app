const adminConfig = window.MET_SITE_CONFIG || {};
const adminBaseUrl = String(adminConfig.supabaseUrl || '').replace(/\/$/, '');
const adminPublicKey = String(adminConfig.supabasePublishableKey || '');
const loginPanel = document.querySelector('#admin-login-panel');
const workspace = document.querySelector('#admin-workspace');
const loginForm = document.querySelector('#admin-login-form');
const loginButton = document.querySelector('#admin-login-button');
const adminMessage = document.querySelector('#admin-message');
const listStatus = document.querySelector('#admin-list-status');
const requestList = document.querySelector('#admin-request-list');
const signedInLabel = document.querySelector('#admin-signed-in');
const limitNote = document.querySelector('#admin-list-limit');
let adminAccessToken = '';
let adminEmail = '';

function setMessage(message, kind = 'info') {
  if (!adminMessage) return;
  adminMessage.textContent = message;
  adminMessage.hidden = !message;
  adminMessage.className = `admin-message admin-message-${kind}`;
}

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function formatSubmittedAt(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function setBusy(button, busy, busyLabel) {
  if (!button) return;
  if (busy) {
    button.dataset.originalLabel = button.textContent.trim();
    button.textContent = busyLabel;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
  } else {
    button.textContent = button.dataset.originalLabel || button.textContent;
    button.disabled = false;
    button.removeAttribute('aria-busy');
    delete button.dataset.originalLabel;
  }
}

async function parseResponse(response) {
  let payload = {};
  try { payload = await response.json(); } catch (_) {}
  if (!response.ok) {
    const message = payload.error || payload.message || payload.msg || payload.error_description;
    if (response.status === 401 && !message) throw new Error('Your session expired. Sign in again to continue.');
    throw new Error(message || 'The request could not be completed.');
  }
  return payload;
}

async function adminCall(payload) {
  if (!adminBaseUrl || !adminPublicKey.startsWith('sb_publishable_')) {
    throw new Error('The public Supabase configuration is missing. Ask the site administrator to check site/config.js.');
  }
  if (!adminAccessToken) throw new Error('Sign in again to continue.');
  const response = await fetch(`${adminBaseUrl}/functions/v1/registration-admin`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      apikey: adminPublicKey,
      Authorization: `Bearer ${adminAccessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
}

async function loadRequests() {
  setMessage('');
  if (listStatus) listStatus.textContent = 'Loading requests…';
  if (requestList) requestList.replaceChildren();
  try {
    const result = await adminCall({ action: 'list' });
    const requests = Array.isArray(result.requests) ? result.requests : [];
    renderRequests(requests);
    if (listStatus) listStatus.textContent = requests.length ? `${requests.length} request${requests.length === 1 ? '' : 's'} need review or follow-up.` : 'No pending requests. New requests will appear here after signup.';
    if (limitNote) limitNote.hidden = requests.length < (result.limit || 100);
    return true;
  } catch (error) {
    if (listStatus) listStatus.textContent = '';
    if (error.message.includes('session expired') || error.message.includes('Sign in again')) {
      endSession('Your session expired. Sign in again to view requests.');
      return;
    }
    setMessage(error.message, 'error');
    return false;
  }
}

function requestCard(request) {
  const userId = escapeHtml(request.user_id);
  const claimedName = escapeHtml(request.claimed_name || 'Name not provided');
  const email = escapeHtml(request.email || 'Email unavailable');
  const claimedPrn = escapeHtml(request.claimed_prn || 'No valid PRN submitted');
  const confirmed = request.email_confirmed && request.email_matches;
  const emailState = confirmed
    ? '<span class="request-check request-check-good">Email confirmed</span>'
    : '<span class="request-check request-check-wait">Email not confirmed or does not match</span>';
  const status = request.status === 'reviewing'
    ? `<span class="request-state request-state-review">${request.review_owned_by_current_admin ? 'Your review is in progress' : request.review_available ? 'Review paused · available to resume' : 'Review in progress'}</span>`
    : '<span class="request-state">Pending MET review</span>';
  const reviewUnavailable = !request.email_matches || !request.review_available;
  const unavailable = !confirmed || reviewUnavailable;
  const date = escapeHtml(formatSubmittedAt(request.submitted_at));

  return `<article class="admin-request-card" data-request-id="${userId}">
    <div class="request-card-top">
      <div><p class="request-card-kicker">Student request</p><h3>${claimedName}</h3><a class="request-email" href="mailto:${email}">${email}</a></div>
      ${status}
    </div>
    <div class="request-details">
      <div><span>Claimed PRN</span><strong>${claimedPrn}</strong></div>
      <div><span>Submitted</span><strong>${date}</strong></div>
      <div class="request-email-state"><span>Email check</span>${emailState}</div>
    </div>
    <p class="request-caution">The submitted identity is only a claim. Enter the values you independently verified in MET records below.</p>
    <form class="admin-approval-form" data-user-id="${userId}">
      <div class="admin-verified-fields">
        <div class="admin-field"><label for="verified-name-${userId}">Verified full name</label><input id="verified-name-${userId}" name="verifiedName" type="text" value="${escapeHtml(request.claimed_name || '')}" maxlength="120" autocomplete="off" required></div>
        <div class="admin-field"><label for="verified-prn-${userId}">Verified PRN</label><input id="verified-prn-${userId}" name="verifiedPrn" type="text" inputmode="numeric" value="${escapeHtml(request.claimed_prn || '')}" minlength="8" maxlength="20" pattern="[0-9]{8,20}" autocomplete="off" required></div>
      </div>
      <label class="admin-confirm-line"><input name="metVerification" type="checkbox" required><span>I matched this student and PRN to MET’s official records and confirmed the email check above.</span></label>
      <div class="request-actions">
        <button class="button admin-approve-button" type="submit" ${unavailable ? 'disabled' : ''}>Approve and activate</button>
        <button class="button admin-reject-button" type="button" data-action="reject" ${reviewUnavailable ? 'disabled' : ''}>Reject request</button>
      </div>
      ${!request.email_matches ? '<p class="request-lock-note">The Auth email does not match this request. Resolve it in Supabase before review.</p>' : ''}
      ${request.status === 'reviewing' && !request.review_available ? '<p class="request-lock-note">Another reviewer has this request. You can take over if their review remains inactive for 15 minutes.</p>' : ''}
    </form>
  </article>`;
}

function renderRequests(requests) {
  if (!requestList) return;
  requestList.innerHTML = requests.map(requestCard).join('');
}

function endSession(message) {
  adminAccessToken = '';
  adminEmail = '';
  if (workspace) workspace.hidden = true;
  if (loginPanel) loginPanel.hidden = false;
  if (loginForm) loginForm.reset();
  if (signedInLabel) signedInLabel.textContent = '';
  if (requestList) requestList.replaceChildren();
  if (listStatus) listStatus.textContent = '';
  setMessage(message, 'info');
}

async function signIn(event) {
  event.preventDefault();
  setMessage('');
  if (!loginForm.reportValidity()) return;
  if (!adminBaseUrl || !adminPublicKey.startsWith('sb_publishable_')) {
    setMessage('The public Supabase configuration is missing. Ask the site administrator to check site/config.js.', 'error');
    return;
  }

  const formData = new FormData(loginForm);
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  setBusy(loginButton, true, 'Checking account…');
  try {
    const response = await fetch(`${adminBaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      cache: 'no-store',
      headers: { apikey: adminPublicKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const session = await parseResponse(response);
    if (!session.access_token) throw new Error('Supabase did not return a sign-in session.');
    adminAccessToken = session.access_token;
    adminEmail = session.user && session.user.email || email;

    const result = await adminCall({ action: 'list' });
    if (!loginPanel || !workspace) return;
    loginPanel.hidden = true;
    workspace.hidden = false;
    if (signedInLabel) signedInLabel.textContent = `Signed in as ${adminEmail} · Principal portal`;
    renderRequests(Array.isArray(result.requests) ? result.requests : []);
    if (listStatus) {
      const count = Array.isArray(result.requests) ? result.requests.length : 0;
      listStatus.textContent = count ? `${count} request${count === 1 ? '' : 's'} need review or follow-up.` : 'No pending requests. New requests will appear here after signup.';
    }
    if (limitNote) limitNote.hidden = !Array.isArray(result.requests) || result.requests.length < (result.limit || 100);
    if (loginForm) loginForm.reset();
    setMessage('Access granted. Verify each request against MET records before approving.', 'success');
  } catch (error) {
    adminAccessToken = '';
    adminEmail = '';
    setMessage(error.message || 'Could not sign in. Check the official account and try again.', 'error');
  } finally {
    setBusy(loginButton, false, '');
  }
}

async function reviewSubmit(event) {
  const form = event.target.closest('.admin-approval-form');
  if (!form) return;
  event.preventDefault();
  if (!form.reportValidity()) return;
  const checkbox = form.elements.namedItem('metVerification');
  if (!checkbox || !checkbox.checked) return;
  const button = form.querySelector('.admin-approve-button');
  setBusy(button, true, 'Activating account…');
  setMessage('');
  const formData = new FormData(form);
  try {
    await adminCall({
      action: 'review',
      decision: 'approve',
      userId: form.dataset.userId,
      verifiedName: String(formData.get('verifiedName') || '').trim(),
      verifiedPrn: String(formData.get('verifiedPrn') || '').trim(),
      confirmMetVerification: checkbox.checked
    });
    if (await loadRequests()) setMessage('Account approved and activated. The student can now sign in with their PRN and password.', 'success');
  } catch (error) {
    if (error.message.includes('session expired') || error.message.includes('Sign in again')) {
      endSession('Your session expired. Sign in again to view requests.');
      return;
    }
    setMessage(error.message || 'Approval failed. Refresh the queue and try again.', 'error');
  } finally {
    if (button && button.isConnected) setBusy(button, false, '');
  }
}

async function rejectRequest(button) {
  const userId = button.closest('[data-request-id]')?.dataset.requestId;
  if (!userId || !window.confirm('Reject this request and suspend its pending campus profile? The student will not receive campus access.')) return;
  setBusy(button, true, 'Rejecting…');
  setMessage('');
  try {
    await adminCall({ action: 'review', decision: 'reject', userId });
    if (await loadRequests()) setMessage('Request rejected. Its pending campus profile has been suspended.', 'success');
  } catch (error) {
    if (error.message.includes('session expired') || error.message.includes('Sign in again')) {
      endSession('Your session expired. Sign in again to review requests.');
      return;
    }
    setMessage(error.message || 'Rejection failed. Refresh the queue and try again.', 'error');
  } finally {
    if (button.isConnected) setBusy(button, false, '');
  }
}

if (loginForm) loginForm.addEventListener('submit', signIn);
if (requestList) {
  requestList.addEventListener('submit', reviewSubmit);
  requestList.addEventListener('click', (event) => {
    const rejectButton = event.target.closest('[data-action="reject"]');
    if (rejectButton && !rejectButton.disabled) rejectRequest(rejectButton);
  });
}

const refreshButton = document.querySelector('#admin-refresh');
if (refreshButton) refreshButton.addEventListener('click', () => loadRequests());

const signOutButton = document.querySelector('#admin-sign-out');
if (signOutButton) signOutButton.addEventListener('click', async () => {
  const token = adminAccessToken;
  if (token && adminBaseUrl && adminPublicKey) {
    try {
      await fetch(`${adminBaseUrl}/auth/v1/logout`, {
        method: 'POST',
        cache: 'no-store',
        headers: { apikey: adminPublicKey, Authorization: `Bearer ${token}` }
      });
    } catch (_) {}
  }
  endSession('You are signed out.');
});
