const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Greeting based on the visitor's local time.
const greeting = document.querySelector('.greeting');
if (greeting) {
  const h = new Date().getHours();
  greeting.textContent = (h >= 5 && h < 12 ? 'Good morning! ' : h >= 12 && h < 17 ? 'Good afternoon! ' : 'Good evening! ');
}

// Theme switcher: remembers the visitor's pick.
const buttons = document.querySelectorAll('[data-set-theme]');
const divider = document.querySelector('.divider');
const themeColor = document.querySelector('meta[name="theme-color"]');
function applyTheme(theme, animate) {
  root.dataset.theme = theme;
  themeColor.content = getComputedStyle(root).getPropertyValue('--bg').trim();
  buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.setTheme === theme)));
  if (animate && !reduceMotion) {
    divider.classList.remove('hop');
    void divider.offsetWidth; // restart the animation
    divider.classList.add('hop');
  }
}
buttons.forEach(b => b.addEventListener('click', () => {
  applyTheme(b.dataset.setTheme, true);
  try { localStorage.setItem('theme', b.dataset.setTheme); } catch (e) {}
}));
applyTheme(root.dataset.theme, false);

// Email links open Gmail compose in a new tab and also copy the address,
// so visitors who use another mail app can just paste it.
const toast = document.querySelector('.toast');
let toastTimer;
document.querySelectorAll('[data-email]').forEach(a => a.addEventListener('click', () => {
  const address = 'phuc.h0168094@gmail.com';
  const show = msg => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  };
  if (navigator.clipboard) {
    navigator.clipboard.writeText(address).then(
      () => show('Email address copied. Opening Gmail…'),
      () => show('Opening Gmail…'));
  } else {
    show('Opening Gmail…');
  }
}));

// Footer email: click to copy; the address briefly turns into a "Copied" pill in place.
document.querySelectorAll('[data-copy-email]').forEach(b => {
  let timer;
  b.addEventListener('click', () => {
    const address = b.querySelector('.email-text').textContent.trim();
    const done = () => {
      b.classList.add('copied');
      toast.textContent = 'Email address copied'; // announced to screen readers, not shown
      clearTimeout(timer);
      timer = setTimeout(() => b.classList.remove('copied'), 1800);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(address).then(done, () => {});
  });
});

// Scroll reveal: items entering together fade in one after another.
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    entries.filter(e => e.isIntersecting).forEach((e, i) => {
      e.target.style.transitionDelay = `${i * 70}ms`;
      e.target.classList.add('in');
      e.target.addEventListener('transitionend', () => { e.target.style.transitionDelay = ''; }, { once: true });
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(el => io.observe(el));
} else {
  reveals.forEach(el => el.classList.add('in'));
}

// Back-to-top button: shows once the hero is off screen.
const toTop = document.querySelector('.to-top');
const hero = document.querySelector('.hero');
if (toTop && hero && 'IntersectionObserver' in window) {
  new IntersectionObserver(([e]) => toTop.classList.toggle('show', !e.isIntersecting)).observe(hero);
  toTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    document.querySelector('.logo').focus({ preventScroll: true });
  });
}

// Progress bar fallback for browsers without CSS scroll timelines (e.g. Firefox).
const bar = document.querySelector('.progress');
if (bar && !CSS.supports('animation-timeline: scroll()')) {
  let queued = false;
  window.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    });
  }, { passive: true });
}

// Footer cat: eyes follow the cursor.
const cat = document.querySelector('.peek');
const pupils = cat && cat.querySelector('.pupils');
if (pupils && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
  let frame = 0;
  window.addEventListener('pointermove', e => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const r = cat.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height * 0.75);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 300) * 1.4; // max 1.4 SVG units of travel
      pupils.style.transform = `translate(${(dx / d) * k}px, ${(dy / d) * k}px)`;
    });
  }, { passive: true });
}
