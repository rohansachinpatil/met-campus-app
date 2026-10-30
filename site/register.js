const registrationForm = document.querySelector('#registration-form');
const registrationError = document.querySelector('#register-error');
const registrationSuccess = document.querySelector('#register-success');
const registrationSubmit = document.querySelector('#register-submit');
const registerPassword = document.querySelector('#register-password');
const registerConfirm = document.querySelector('#register-confirm');

function passwordConfirmationMessage() {
  return registerConfirm.value && registerConfirm.value !== registerPassword.value
    ? 'Passwords do not match.'
    : '';
}

if (registerPassword && registerConfirm) {
  const validateConfirmation = () => registerConfirm.setCustomValidity(passwordConfirmationMessage());
  registerPassword.addEventListener('input', validateConfirmation);
  registerConfirm.addEventListener('input', validateConfirmation);
  registerConfirm.addEventListener('blur', validateConfirmation);
}

if (registrationForm) {
  registrationForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (registrationError) registrationError.textContent = '';
    if (registrationSuccess) registrationSuccess.hidden = true;
    if (!registrationForm.reportValidity()) return;

    const config = window.MET_SITE_CONFIG || {};
    const supabaseUrl = String(config.supabaseUrl || '').replace(/\/$/, '');
    const publishableKey = String(config.supabasePublishableKey || '');
    if (!supabaseUrl || !publishableKey.startsWith('sb_publishable_')) {
      if (registrationError) registrationError.textContent = 'Registration is not configured yet. Contact the MET Campus administrator.';
      return;
    }

    const formData = new FormData(registrationForm);
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const name = String(formData.get('name') || '').trim();
    const prn = String(formData.get('prn') || '').trim();
    const password = String(formData.get('password') || '');
    const redirectTo = `${window.location.origin}/register?verified=1`;

    if (registrationSubmit) {
      registrationSubmit.disabled = true;
      registrationSubmit.setAttribute('aria-busy', 'true');
      registrationSubmit.dataset.originalText = registrationSubmit.textContent.trim();
      registrationSubmit.firstChild.textContent = 'Sending request… ';
    }

    try {
      const response = await fetch(
        `${supabaseUrl}/auth/v1/signup?redirect_to=${encodeURIComponent(redirectTo)}`,
        {
          method: 'POST',
          headers: {
            apikey: publishableKey,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({
            email,
            password,
            data: {
              met_campus_registration: true,
              claimed_name: name,
              claimed_prn: prn
            }
          })
        }
      );

      if (!response.ok) {
        if (response.status === 429) throw new Error('Too many requests. Wait a few minutes, then try again.');
        throw new Error('Registration is unavailable right now. Check your details or contact MET Campus support.');
      }

      registrationForm.hidden = true;
      if (registrationSuccess) registrationSuccess.hidden = false;
      if (registrationError) registrationError.textContent = '';
      if (registrationSuccess) registrationSuccess.focus();
    } catch (error) {
      if (registrationError) registrationError.textContent = error && error.message
        ? error.message
        : 'Could not submit your request. Check your connection and try again.';
      if (registrationSubmit) {
        registrationSubmit.disabled = false;
        registrationSubmit.removeAttribute('aria-busy');
        registrationSubmit.firstChild.textContent = registrationSubmit.dataset.originalText + ' ';
      }
    }
  });
}

const verificationNotice = document.querySelector('#register-success');
if (verificationNotice && new URLSearchParams(window.location.search).get('verified') === '1') {
  if (registrationForm) registrationForm.hidden = true;
  verificationNotice.hidden = false;
  verificationNotice.innerHTML = '<strong>Email confirmed.</strong><span>Your request is still pending. MET must verify your enrollment and approve the account before app access is enabled.</span>';
}
