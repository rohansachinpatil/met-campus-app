const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('#site-nav');

if (menuToggle && siteNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
    siteNav.classList.toggle('is-open', !isOpen);
  });

  siteNav.addEventListener('click', (event) => {
    if (!event.target.closest('a')) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    siteNav.classList.remove('is-open');
  });
}

const year = document.querySelector('#year');
if (year) year.textContent = String(new Date().getFullYear());

const apkLink = document.querySelector('#download-apk');
const apkStatus = document.querySelector('#apk-status');
const apkLabel = document.querySelector('#download-label');
const apkPath = 'downloads/met-campus.apk';

if (apkLink) {
  apkLink.addEventListener('click', (event) => {
    if (apkLink.getAttribute('aria-disabled') === 'true') event.preventDefault();
  });

  fetch(apkPath, { method: 'HEAD', cache: 'no-store' })
    .then((response) => {
      if (!response.ok) return;
      apkLink.href = apkPath;
      apkLink.download = 'MET-Campus.apk';
      apkLink.removeAttribute('aria-disabled');
      apkLink.removeAttribute('tabindex');
      apkLink.classList.remove('is-disabled');
      if (apkLabel) apkLabel.textContent = 'Download Android APK';
      if (apkStatus) apkStatus.textContent = 'Signed Android installer available.';
    })
    .catch(() => {
      if (apkStatus) apkStatus.textContent = 'The download will appear here after the signed APK is published.';
    });
}
