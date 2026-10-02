(() => {
  const header = document.querySelector('[data-header]'); const toggle = document.querySelector('[data-menu-toggle]'); const menu = document.querySelector('[data-mobile-menu]');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (window.Tawk_API && typeof window.Tawk_API.hideWidget === 'function') {
      if (open) {
        window.Tawk_API.hideWidget();
      } else {
        window.Tawk_API.showWidget();
      }
    }
  };
  window.addEventListener('scroll', () => header.classList.toggle('is-scrolled', window.scrollY > 24), { passive: true });
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
})();
