// Small enhancements: theme toggle and current year
const y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();

const toggle = document.getElementById('themeToggle');
if (toggle) {
  toggle.addEventListener('click', () => {
    const wasDark = document.documentElement.classList.toggle('dark');
    toggle.setAttribute('aria-pressed', String(wasDark));
  });
}
