(() => {
  const section = document.querySelector('[data-promotion]');
  if (!section) return;

  const label = section.querySelector('[data-promotion-label]');
  const title = section.querySelector('[data-promotion-title]');
  const description = section.querySelector('[data-promotion-description]');
  const details = section.querySelector('[data-promotion-details]');
  const pricing = section.querySelector('[data-promotion-pricing]');
  const price = section.querySelector('[data-promotion-price]');
  const oldPrice = section.querySelector('[data-promotion-old-price]');
  const cta = section.querySelector('[data-promotion-cta]');
  const cacheKey = 'de-palms:promotion:v1';

  function safeText(value, maxLength) {
    return String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
  }

  function safeCtaUrl(value) {
    try {
      const url = new URL(value);
      return ['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol) ? url.href : '';
    } catch (_) {
      return '';
    }
  }

  function setExternalLinkBehaviour(link, href) {
    const url = new URL(href);
    const isExternalWebLink = ['https:', 'http:'].includes(url.protocol) && url.origin !== window.location.origin;
    if (isExternalWebLink) {
      link.target = '_blank';
      link.rel = 'noreferrer';
    } else {
      link.removeAttribute('target');
      link.removeAttribute('rel');
    }
  }

  function renderPromotion(promotion) {
    if (!promotion || !label || !title || !description || !details || !pricing || !price || !oldPrice || !cta) return;

    const promotionTitle = safeText(promotion.title, 120);
    const promotionDescription = safeText(promotion.description, 360);
    if (!promotionTitle || !promotionDescription) return;

    label.textContent = safeText(promotion.label, 60) || 'WHAT’S ON';
    title.textContent = promotionTitle;
    description.textContent = promotionDescription;

    const promotionDetails = safeText(promotion.details, 140);
    details.textContent = promotionDetails;
    details.hidden = !promotionDetails;

    const currentPrice = safeText(promotion.price, 40);
    const previousPrice = safeText(promotion.oldPrice, 40);
    price.textContent = currentPrice;
    oldPrice.textContent = previousPrice;
    oldPrice.hidden = !previousPrice;
    pricing.hidden = !currentPrice;

    const buttonText = safeText(promotion.buttonText, 50);
    const buttonLink = safeCtaUrl(promotion.buttonLink);
    const hasAction = Boolean(currentPrice || (buttonText && buttonLink));
    section.classList.toggle('promotion--has-action', hasAction);
    if (buttonText && buttonLink) {
      cta.textContent = buttonText;
      cta.href = buttonLink;
      setExternalLinkBehaviour(cta, buttonLink);
      cta.hidden = false;
    } else {
      cta.hidden = true;
    }
  }

  function cachePromotion(payload, response) {
    try {
      const cacheControl = response.headers.get('Cache-Control') || '';
      const match = cacheControl.match(/max-age=(\d+)/);
      const seconds = Math.min(600, Math.max(30, Number(match?.[1]) || 300));
      sessionStorage.setItem(cacheKey, JSON.stringify({ expiresAt: Date.now() + seconds * 1000, payload }));
    } catch (_) {}
  }

  function renderCachedPromotion() {
    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey));
      if (cached?.expiresAt > Date.now() && cached?.payload?.active && cached.payload.promotion) {
        renderPromotion(cached.payload.promotion);
        return true;
      }
    } catch (_) {}
    return false;
  }

  async function loadPromotion() {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4500);
    try {
      const response = await fetch('/api/promotion', { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) return;
      const payload = await response.json();
      if (payload?.active && payload.promotion) {
        renderPromotion(payload.promotion);
        cachePromotion(payload, response);
      }
    } catch (_) {
      // The server-rendered De Palms highlight remains visible on failure.
    } finally {
      window.clearTimeout(timeout);
      section.setAttribute('aria-busy', 'false');
    }
  }

  if (renderCachedPromotion()) section.setAttribute('aria-busy', 'false');
  loadPromotion();
})();
