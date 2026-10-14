/**
 * ══════════════════════════════════════════════════════════════
 * DE PALMS HOTEL — RESTAURANT MENU ENGINE
 * ──────────────────────────────────────────────────────────────
 * Fetches menu data from the public Google Sheet (Menu tab),
 * parses CSV, filters by Available=TRUE, and renders cards
 * with category/subcategory filtering + live search.
 *
 * Sheet ID: 1UWALYDh1RhxdAI4pJHUzRF0RR6aNuDO9DVqdbNUBjpM
 * ══════════════════════════════════════════════════════════════
 */
(() => {
  'use strict';

  const SHEET_ID = '1UWALYDh1RhxdAI4pJHUzRF0RR6aNuDO9DVqdbNUBjpM';
  const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=Menu&tqx=out:csv`;
  const CACHE_KEY = 'depalms_menu_cache';
  const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  /* ─── Minimal SVG Fallback Graphics by Subcategory ──────── */
  const FALLBACK_ICONS = {
    // Swallow
    'swallow': `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="24" cy="30" rx="16" ry="8"/><path d="M8 30c0 4.4 7.2 8 16 8s16-3.6 16-8"/><path d="M14 18c0-3 4.5-6 10-6s10 3 10 6"/><path d="M14 18v4c0 2 4.5 4 10 4s10-2 10-4v-4"/><line x1="24" y1="8" x2="24" y2="12"/><path d="M20 10c2-2 6-2 8 0"/></svg>`,
    // Soups (Local & Continental)
    'soups': `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 24h32"/><path d="M10 24c0 8 6.3 14 14 14s14-6 14-14"/><path d="M6 24h36"/><path d="M18 10c0-2 1-3 1-5"/><path d="M24 10c0-2 1-3 1-5"/><path d="M30 10c0-2 1-3 1-5"/></svg>`,
    'pepper soup': `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 24h32"/><path d="M10 24c0 8 6.3 14 14 14s14-6 14-14"/><path d="M6 24h36"/><path d="M18 10c0-2 1-3 1-5"/><path d="M24 10c0-2 1-3 1-5"/><path d="M30 10c0-2 1-3 1-5"/><circle cx="36" cy="14" r="3"/><path d="M36 17v4"/></svg>`,
    // Breakfast & Starters
    'breakfast': `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="24" cy="28" rx="16" ry="10"/><path d="M8 28c0 5.5 7.2 10 16 10s16-4.5 16-10"/><circle cx="20" cy="26" r="4"/><circle cx="30" cy="26" r="3"/><path d="M14 18l2 4"/><path d="M34 18l-2 4"/><path d="M24 14v6"/></svg>`,
    'starters & appetizers': `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="18" width="32" height="20" rx="4"/><path d="M12 18v-4a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v4"/><line x1="18" y1="26" x2="18" y2="32"/><line x1="24" y1="26" x2="24" y2="32"/><line x1="30" y1="26" x2="30" y2="32"/></svg>`,
    // Rice & Pasta
    'rice': `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 26c0 0 4-8 16-8s16 8 16 8"/><path d="M8 26c0 7 7.2 13 16 13s16-6 16-13"/><path d="M16 12c0-2 1-4 2-5"/><path d="M24 12c0-3 0-5 1-7"/><path d="M32 12c0-2-1-4-2-5"/></svg>`,
    'pasta': `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 26c0 0 4-8 16-8s16 8 16 8"/><path d="M8 26c0 7 7.2 13 16 13s16-6 16-13"/><path d="M14 22c4-3 8 1 12-2s6-4 10-2"/><path d="M20 10c0-3 1-5 1-7"/><path d="M28 10c0-3-1-5-1-7"/></svg>`,
    // Mains & Grills, Peppered Protein
    'mains & grills': `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M24 42V22"/><path d="M18 8l6 14 6-14"/><path d="M16 42h16"/><circle cx="14" cy="26" r="2"/><circle cx="34" cy="30" r="2"/><path d="M8 38c2-2 4-6 6-12"/><path d="M40 38c-2-2-4-6-6-12"/></svg>`,
    'peppered protein': `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="24" cy="32" rx="16" ry="8"/><path d="M8 32c0 4.4 7.2 8 16 8s16-3.6 16-8"/><path d="M14 28c2-6 6-10 10-12s8 0 10 4"/><path d="M20 10c-1-3 0-5 2-6"/><path d="M28 12c1-3 0-5-2-6"/></svg>`,
    // Salads
    'salads': `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 28c0 0 4-8 16-8s16 8 16 8"/><path d="M8 28c0 6 7.2 12 16 12s16-6 16-12"/><path d="M16 22c-2-4 0-8 4-10"/><path d="M24 18c0-5 2-8 4-10"/><path d="M32 22c2-4 0-8-4-10"/></svg>`,
    // Sides
    'sides': `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="10" y="20" width="28" height="18" rx="4"/><path d="M14 20v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4"/><line x1="20" y1="26" x2="20" y2="32"/><line x1="28" y1="26" x2="28" y2="32"/></svg>`,
    // Sauces & Accompaniments
    'sauces & accompaniments': `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 14l-2 24h20l-2-24"/><path d="M12 14h24"/><path d="M20 8v6"/><path d="M28 8v6"/><path d="M20 24c2 2 6 2 8 0"/></svg>`,
    // Drinks (all drink subcategories)
    'drinks_default': `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 8h20l-4 28H18L14 8z"/><path d="M14 8h20"/><path d="M18 36h12v4H18z"/><path d="M14 36h20"/><path d="M20 16c2 2 6 2 8 0"/></svg>`,
    'champagne': `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6h12v10c0 4-2.7 7-6 7s-6-3-6-7V6z"/><line x1="24" y1="23" x2="24" y2="34"/><path d="M18 34h12"/><path d="M16 38h16"/><path d="M18 34v4"/><path d="M30 34v4"/><circle cx="20" cy="12" r="1"/><circle cx="26" cy="10" r="1"/></svg>`,
    'whiskey': `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="14" y="10" width="16" height="24" rx="2"/><path d="M14 18h16"/><path d="M30 18h6v8h-6"/><path d="M18 38h12"/><path d="M20 34v4"/><path d="M28 34v4"/></svg>`,
    'beer & cider': `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="12" y="10" width="18" height="28" rx="3"/><path d="M30 16h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-6"/><path d="M18 10v-2a2 2 0 0 1 4 0v2"/><path d="M12 20h18"/></svg>`,
    'soft drinks': `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 10h16l-2 28H18L16 10z"/><path d="M14 10h20"/><path d="M22 6c0-2 4-2 4 0"/><path d="M20 18c2 2 6 2 8 0"/></svg>`,
    'wine': `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 6h16v8c0 6-3.6 10-8 10s-8-4-8-10V6z"/><line x1="24" y1="24" x2="24" y2="36"/><path d="M18 36h12"/><path d="M16 40h16"/><path d="M18 36v4"/><path d="M30 36v4"/></svg>`,
  };

  /* Map subcategories to icon keys */
  function getFallbackKey(category, subCategory) {
    const sub = (subCategory || '').toLowerCase();
    const cat = (category || '').toLowerCase();

    // Direct subcategory match
    if (FALLBACK_ICONS[sub]) return sub;

    // Partial matches for drinks
    if (cat === 'drinks') {
      if (sub.includes('wine')) return 'wine';
      if (sub.includes('champagne')) return 'champagne';
      if (sub.includes('whiskey') || sub.includes('brandy')) return 'whiskey';
      if (sub.includes('beer') || sub.includes('cider')) return 'beer & cider';
      if (sub.includes('soft') || sub.includes('juice') || sub.includes('yoghurt') || sub.includes('energy')) return 'soft drinks';
      return 'drinks_default';
    }

    // General food fallbacks
    if (sub.includes('soup')) return 'soups';
    if (sub.includes('pepper')) return 'pepper soup';
    if (sub.includes('rice')) return 'rice';
    if (sub.includes('pasta')) return 'pasta';
    if (sub.includes('grill') || sub.includes('main')) return 'mains & grills';
    if (sub.includes('salad')) return 'salads';
    if (sub.includes('side')) return 'sides';
    if (sub.includes('sauce') || sub.includes('accomp')) return 'sauces & accompaniments';
    if (sub.includes('breakfast') || sub.includes('starter') || sub.includes('appetizer')) return 'breakfast';
    if (sub.includes('swallow')) return 'swallow';
    if (sub.includes('peppered') || sub.includes('protein')) return 'peppered protein';

    return 'soups'; // ultimate fallback
  }

  /* ─── CSV Parser ────────────────────────────────────────── */
  function parseCSV(str) {
    const arr = [];
    let quote = false, col = '', row = [];
    for (let c = 0; c < str.length; c++) {
      const ch = str[c], next = str[c + 1];
      if (ch === '"') {
        if (quote && next === '"') { col += '"'; c++; }
        else { quote = !quote; }
      } else if (ch === ',' && !quote) {
        row.push(col); col = '';
      } else if ((ch === '\r' || ch === '\n') && !quote) {
        if (ch === '\r' && next === '\n') c++;
        row.push(col); arr.push(row); row = []; col = '';
      } else {
        col += ch;
      }
    }
    if (col || row.length) { row.push(col); arr.push(row); }
    return arr;
  }

  /* ─── Fetch & Cache ─────────────────────────────────────── */
  async function fetchMenuData() {
    // Check local cache
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { ts, data } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) return data;
      }
    } catch (_) { /* ignore corrupt cache */ }

    const response = await fetch(CSV_URL);
    if (!response.ok) throw new Error(`Failed to load menu: ${response.status}`);
    const text = await response.text();

    const rows = parseCSV(text);
    const headers = rows[0];
    const data = rows.slice(1)
      .map(r => {
        const obj = {};
        headers.forEach((h, i) => { obj[h.trim()] = (r[i] || '').trim(); });
        return obj;
      })
      .filter(r => r['Item Name'] && r['Available'] === 'TRUE')
      .sort((a, b) => (Number(a['Display Order']) || 999) - (Number(b['Display Order']) || 999));

    // Cache result
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch (_) { /* storage full */ }

    return data;
  }

  /* ─── Render Functions ──────────────────────────────────── */
  function renderSkeleton(count) {
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'menu-skeleton';
      el.innerHTML = `
        <div class="menu-skeleton-visual"></div>
        <div class="menu-skeleton-body">
          <div class="menu-skeleton-line menu-skeleton-line--short"></div>
          <div class="menu-skeleton-line"></div>
          <div class="menu-skeleton-line menu-skeleton-line--tiny"></div>
        </div>`;
      grid.appendChild(el);
    }
  }

  /* Optional map of known local photos in assets/restaurant/ */
  const LOCAL_IMAGE_MAP = {
    'jollof rice': 'assets/restaurant/Party jollof with Chicken.webp',
  };

  /* Normalizes image URLs, auto-converting Google Drive view links to direct image CDN links */
  function normalizeImageUrl(url) {
    if (!url) return '';
    const trimmed = url.trim();
    const driveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (driveMatch && (trimmed.includes('drive.google.com') || trimmed.includes('drive.usercontent.google.com'))) {
      return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
    }
    return trimmed;
  }

  function renderCard(item) {
    const card = document.createElement('article');
    card.className = 'menu-card';
    card.dataset.category = item['Category'] || '';
    card.dataset.subcategory = item['Sub Category'] || '';
    const itemNameLower = (item['Item Name'] || '').toLowerCase();
    card.dataset.name = itemNameLower;

    const rawUrl = item['Image URL'] || LOCAL_IMAGE_MAP[itemNameLower] || '';
    const imageUrl = normalizeImageUrl(rawUrl);
    const subCat = item['Sub Category'] || item['Category'] || '';
    const fallbackKey = getFallbackKey(item['Category'], item['Sub Category']);
    const fallbackSVG = FALLBACK_ICONS[fallbackKey] || FALLBACK_ICONS['soups'];

    let visualHTML;
    if (imageUrl) {
      visualHTML = `<div class="menu-card-visual">
        <img src="${escapeAttr(imageUrl)}" alt="${escapeAttr(item['Item Name'])}" loading="lazy"
             onerror="this.parentElement.innerHTML='<div class=\\'menu-card-fallback\\'>${fallbackSVG}<span class=\\'menu-card-fallback-label\\'>${escapeAttr(subCat)}</span></div>'">
      </div>`;
    } else {
      visualHTML = `<div class="menu-card-visual">
        <div class="menu-card-fallback">
          ${fallbackSVG}
          <span class="menu-card-fallback-label">${escapeHTML(subCat)}</span>
        </div>
      </div>`;
    }

    const descHTML = item['Description']
      ? `<p class="menu-card-desc">${escapeHTML(item['Description'])}</p>`
      : '';

    const priceDisplay = item['Price'] || '';

    card.innerHTML = `
      ${visualHTML}
      <div class="menu-card-body">
        <span class="menu-card-tag">${escapeHTML(subCat)}</span>
        <h3 class="menu-card-name">${escapeHTML(item['Item Name'])}</h3>
        ${descHTML}
        <span class="menu-card-price">${escapeHTML(priceDisplay)}</span>
      </div>`;

    return card;
  }

  function renderEmpty(searchTerm) {
    const div = document.createElement('div');
    div.className = 'menu-empty';
    div.innerHTML = `
      <div class="menu-empty-icon" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </div>
      <h3>No dishes found.</h3>
      <p>${searchTerm ? `No results for "${escapeHTML(searchTerm)}". Try a different search.` : 'No items available in this category right now.'}</p>`;
    return div;
  }

  function renderError() {
    const div = document.createElement('div');
    div.className = 'menu-error';
    div.innerHTML = `
      <h3>Unable to load menu.</h3>
      <p>We couldn't connect to our menu service. Please try again in a moment.</p>
      <button class="button" onclick="location.reload()">Retry <span>↻</span></button>`;
    return div;
  }

  /* ─── Helpers ───────────────────────────────────────────── */
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ─── Main Controller ──────────────────────────────────── */
  let allItems = [];
  let activeCategory = 'all';
  let activeSubcategory = 'all';
  let searchTerm = '';

  function getFilteredItems() {
    return allItems.filter(item => {
      const catMatch = activeCategory === 'all' || item['Category'] === activeCategory;
      const subMatch = activeSubcategory === 'all' || item['Sub Category'] === activeSubcategory;
      const searchMatch = !searchTerm || (item['Item Name'] || '').toLowerCase().includes(searchTerm);
      return catMatch && subMatch && searchMatch;
    });
  }

  function getSubcategories() {
    const items = activeCategory === 'all'
      ? allItems
      : allItems.filter(item => item['Category'] === activeCategory);
    const subs = [...new Set(items.map(i => i['Sub Category']).filter(Boolean))];
    return subs;
  }

  function renderSubcategoryPills() {
    const bar = document.getElementById('menu-subcategory-bar');
    if (!bar) return;
    const subs = getSubcategories();
    if (subs.length <= 1) {
      bar.innerHTML = '';
      return;
    }
    const pills = [`<button class="menu-subcategory-pill${activeSubcategory === 'all' ? ' is-active' : ''}" data-sub="all">All</button>`];
    subs.forEach(sub => {
      pills.push(`<button class="menu-subcategory-pill${activeSubcategory === sub ? ' is-active' : ''}" data-sub="${escapeAttr(sub)}">${escapeHTML(sub)}</button>`);
    });
    bar.innerHTML = `<div class="menu-subcategory-pills">${pills.join('')}</div>`;

    bar.querySelectorAll('.menu-subcategory-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        activeSubcategory = btn.dataset.sub;
        renderSubcategoryPills();
        renderMenu();
      });
    });
  }

  function renderMenu() {
    const grid = document.getElementById('menu-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = getFilteredItems();
    if (filtered.length === 0) {
      grid.appendChild(renderEmpty(searchTerm));
      return;
    }

    filtered.forEach(item => {
      grid.appendChild(renderCard(item));
    });
  }

  function buildCategoryTabs() {
    const container = document.getElementById('menu-category-tabs');
    if (!container) return;

    const categories = [...new Set(allItems.map(i => i['Category']).filter(Boolean))];
    // Define display order
    const catOrder = ['Local Dishes', 'Continental', 'Drinks'];
    categories.sort((a, b) => {
      const ai = catOrder.indexOf(a);
      const bi = catOrder.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    const allCount = allItems.length;
    let html = `<button class="menu-category-tab is-active" data-cat="all">All <span class="tab-count">${allCount}</span></button>`;
    categories.forEach(cat => {
      const count = allItems.filter(i => i['Category'] === cat).length;
      html += `<button class="menu-category-tab" data-cat="${escapeAttr(cat)}">${escapeHTML(cat)} <span class="tab-count">${count}</span></button>`;
    });
    container.innerHTML = html;

    container.querySelectorAll('.menu-category-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        activeSubcategory = 'all';
        container.querySelectorAll('.menu-category-tab').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        renderSubcategoryPills();
        renderMenu();
      });
    });
  }

  function setupSearch() {
    const input = document.getElementById('menu-search-input');
    if (!input) return;
    let debounceTimer;
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchTerm = input.value.trim().toLowerCase();
        renderMenu();
      }, 200);
    });
  }

  /* ─── Sticky shadow for controls bar ────────────────────── */
  function setupStickyObserver() {
    const controls = document.querySelector('.menu-controls');
    if (!controls) return;
    const sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none';
    controls.parentNode.insertBefore(sentinel, controls);
    const observer = new IntersectionObserver(([entry]) => {
      controls.classList.toggle('is-stuck', !entry.isIntersecting);
    }, { threshold: 0 });
    observer.observe(sentinel);
  }

  /* ─── Init ──────────────────────────────────────────────── */
  async function init() {
    renderSkeleton(12);
    setupSearch();
    setupStickyObserver();

    try {
      allItems = await fetchMenuData();
      buildCategoryTabs();
      renderSubcategoryPills();
      renderMenu();
    } catch (err) {
      console.error('[Restaurant Menu]', err);
      const grid = document.getElementById('menu-grid');
      if (grid) {
        grid.innerHTML = '';
        grid.appendChild(renderError());
      }
    }
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
