const y=document.getElementById('year'); if(y) y.textContent=new Date().getFullYear();

// Theme handling: apply class to html and body so CSS selectors like
// `html.dark` and `body.dark` both work across all pages.
const toggle=document.getElementById('themeToggle');
(() => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');
  const shouldDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
  document.documentElement.classList.toggle('dark', shouldDark);
  if (document.body) document.body.classList.toggle('dark', shouldDark);
  if (toggle) toggle.setAttribute('aria-pressed', String(shouldDark));
})();

if(toggle){
  toggle.addEventListener('click',()=>{
    const isDark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', isDark);
    if (document.body) document.body.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    toggle.setAttribute('aria-pressed',String(isDark));
  });
}

// Mark the current page in the header navigation and make it non-clickable.
(() => {
  const normalize = (p) => {
    try {
      const url = new URL(p, window.location.href);
      let n = url.pathname;
      n = n.replace(/index\.html?$/i, '');
      if (!n.endsWith('/')) n = n;
      return n || '/';
    } catch { return p; }
  };
  const here = normalize(window.location.pathname);
  document.querySelectorAll('.site-nav a[href]').forEach(a => {
    const there = normalize(a.getAttribute('href'));
    if (there === here) {
      const span = document.createElement('span');
      span.className = 'current';
      span.setAttribute('aria-current','page');
      span.textContent = a.textContent;
      a.replaceWith(span);
    }
  });
  // Disable brand link when already on its destination (home page).
  const brand = document.querySelector('.brand[href]');
  if (brand) {
    const there = normalize(brand.getAttribute('href'));
    if (there === here) {
      const span = document.createElement('span');
      span.className = 'brand current';
      span.setAttribute('aria-current','page');
      span.innerHTML = brand.innerHTML;
      brand.replaceWith(span);
    }
  }
})();

// Enhance Netlify form with inline success/error and captcha checks
(() => {
  const form = document.querySelector('form[name="notify"][data-netlify="true"]');
  if (!form || !window.URLSearchParams) return;
  const submitBtn = form.querySelector('button[type="submit"]');
  let status = form.querySelector('.form-status');
  if (!status) {
    status = document.createElement('div');
    status.className = 'form-status';
    status.setAttribute('role','status');
    status.setAttribute('aria-live','polite');
    form.appendChild(status);
  }

  const setStatus = (msg, kind) => {
    status.textContent = msg || '';
    status.className = 'form-status' + (kind ? ' ' + kind : '');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('', '');
    // Ensure captcha completed when present
    const captcha = form.querySelector('textarea[name="g-recaptcha-response"]');
    if (captcha && !captcha.value.trim()) {
      setStatus('Please complete the CAPTCHA to continue.', 'error');
      const container = form.querySelector('[data-netlify-recaptcha]');
      container && container.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }
    try {
      const data = new FormData(form);
      const body = new URLSearchParams(data).toString();
      const resp = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      if (resp.ok) {
        setStatus('Thanks! Check your email to confirm.', 'success');
        form.reset();
        if (window.grecaptcha && typeof window.grecaptcha.reset === 'function') {
          try { window.grecaptcha.reset(); } catch {}
        }
      } else {
        const isCaptcha = resp.status === 422;
        setStatus(isCaptcha ? 'CAPTCHA failed. Please try again.' : 'Submission failed. Please try again in a moment.', 'error');
      }
    } catch (err) {
      setStatus('Network error. Please try again.', 'error');
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Request invite'; }
    }
  });
})();
