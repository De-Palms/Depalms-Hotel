/**
 * De Palms Hotels - Tawk.to Live Chat Integration
 * Fully customized offsets, mobile drawer synchronization, and brand aesthetic harmony.
 */
(() => {
  window.Tawk_API = window.Tawk_API || {};
  window.Tawk_LoadStart = new Date();

  // Widget positioning, offsets and z-index to harmonize with site layout
  window.Tawk_API.customStyle = {
    visibility: {
      desktop: {
        position: 'br', // bottom-right
        xOffset: 24,    // 24px margin from right viewport edge
        yOffset: 24     // 24px margin from bottom viewport edge
      },
      mobile: {
        position: 'br',
        xOffset: 16,
        yOffset: 20
      }
    },
    zIndex: 25 // Keeps widget neatly below sticky site-header (z-index: 30)
  };

  // Ensure widget is hidden if the mobile menu happens to be open when chat finishes loading
  window.Tawk_API.onLoad = function () {
    const mobileMenu = document.querySelector('[data-mobile-menu]');
    if (mobileMenu && mobileMenu.classList.contains('is-open')) {
      if (typeof window.Tawk_API.hideWidget === 'function') {
        window.Tawk_API.hideWidget();
      }
    }
  };

  // Global helper function to trigger chat opening programmatically from any link/button
  window.openLiveChat = function (event) {
    if (event && event.preventDefault) event.preventDefault();
    if (window.Tawk_API && typeof window.Tawk_API.maximize === 'function') {
      window.Tawk_API.maximize();
    }
  };

  // Wire up any elements marked with [data-open-chat]
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-open-chat]').forEach((el) => {
      el.addEventListener('click', window.openLiveChat);
    });
  });

  // Asynchronously inject the Tawk.to embed script
  const s1 = document.createElement('script');
  const s0 = document.getElementsByTagName('script')[0];
  s1.async = true;
  s1.src = 'https://embed.tawk.to/6abfba2fdf2d5634c099c11d/1k3ueuio9';
  s1.charset = 'UTF-8';
  s1.setAttribute('crossorigin', '*');
  if (s0 && s0.parentNode) {
    s0.parentNode.insertBefore(s1, s0);
  } else {
    document.head.appendChild(s1);
  }
})();
