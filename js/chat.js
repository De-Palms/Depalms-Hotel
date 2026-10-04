/**
 * ══════════════════════════════════════════════════════════════
 * DE PALMS HOTEL — AI CONCIERGE CHAT WIDGET
 * Architectural Design Language with Gemini 3.1 Flash Lite
 * ──────────────────────────────────────────────────────────────
 * • Strict scroll isolation to the chat stream
 * • Architectural cards with deep green left bar
 * • Reference badge pills ([**DP-XXXXXX**])
 * • 2x2 Clean reservation voucher (no guest-facing logging footer)
 * • Quick action suggestion chips (Airport pickup, Early check-in, Dining menu)
 * • Graceful fallback card linking directly to WhatsApp and Phone
 * • 30-minute session persistence across page navigations
 * ══════════════════════════════════════════════════════════════
 */
(() => {
  'use strict';

  const API_ENDPOINT = '/api/chat';
  const STORAGE_KEY = 'dp_chat_session_v3';
  const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

  /* ─── State ─────────────────────────────────────────────── */

  let chatHistory = [];
  let isWaiting = false;
  let isOpen = false;
  let greetPopTimer = null;

  /* ─── SVG Icons ─────────────────────────────────────────── */

  const ICON = {
    chat: '<svg class="dp-icon-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    close: '<svg class="dp-icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    restart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.23 8.23 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.45 0-2.87-.38-4.12-1.1l-.3-.17-3.12.82.83-3.04-.19-.3a8.21 8.21 0 0 1-1.26-4.44c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.12-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.23.9 2.43 1.02 2.6.13.16 1.77 2.7 4.28 3.79.6.26 1.07.41 1.44.53.6.19 1.15.17 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.18-.47-.3z"/></svg>',
    checkDouble: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L7 17l-5-5"/><path d="M22 10l-7.5 7.5-1.5-1.5"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><circle cx="12" cy="3" r="1" fill="currentColor"/></svg>',
    paperclip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l7.88-7.87"/></svg>',
  };

  /* ─── Helpers ────────────────────────────────────────────── */

  function esc(text) {
    const d = document.createElement('div');
    d.textContent = text || '';
    return d.innerHTML;
  }

  function timeStr() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function sessionDateStr() {
    const now = new Date();
    const t = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    return `TODAY • ${t} GMT+1`;
  }

  /* ─── Session Persistence (30 Minutes) ───────────────────── */

  function loadSavedSession() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !data.lastActive || !Array.isArray(data.history)) return null;

      const elapsed = Date.now() - data.lastActive;
      if (elapsed < SESSION_TIMEOUT_MS) {
        return data;
      }
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('[Session] Load error:', e);
    }
    return null;
  }

  function saveCurrentSession() {
    try {
      const data = {
        history: chatHistory,
        lastActive: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[Session] Save error:', e);
    }
  }

  /* ─── Inject Widget HTML (Matching Image 2 Reference) ────── */

  function injectWidget() {
    const root = document.createElement('div');
    root.id = 'dp-chat-root';
    root.setAttribute('data-lenis-prevent', 'true');

    root.innerHTML = `
      <!-- Floating Greeting Popout -->
      <div class="dp-greet-pop is-hidden" id="dp-greet-pop" role="alert">
        <button class="dp-greet-close" id="dp-greet-close" aria-label="Close greeting">×</button>
        <div class="dp-greet-body">
          <div class="dp-greet-avatar">
            ${ICON.bell}
            <div class="dp-avatar-pip"></div>
          </div>
          <div class="dp-greet-content">
            <div class="dp-greet-title">De Palms Concierge</div>
            <div class="dp-greet-msg">Warm welcome to De Palms Hotel Port Harcourt! How may we assist your stay or reservation today?</div>
          </div>
        </div>
      </div>

      <!-- Launcher Button -->
      <button class="dp-launcher" id="dp-launcher" aria-label="Open De Palms Hotel Live Concierge Chat">
        <div class="dp-launcher-pip" title="Online"></div>
        ${ICON.chat}
        ${ICON.close}
      </button>

      <!-- Architectural Floating Chat Card -->
      <div class="dp-card" id="dp-card" role="dialog" aria-modal="true" aria-label="De Palms Concierge Chat" data-lenis-prevent="true">

        <!-- Luxury Dark Green Header -->
        <div class="dp-header">
          <div class="dp-header-brand" id="dp-header-brand" title="De Palms Hotel Port Harcourt">
            <div class="dp-header-avatar">
              ${ICON.bell}
              <div class="dp-avatar-pip"></div>
            </div>
            <div class="dp-header-info">
              <h3>De Palms Concierge</h3>
              <p>ONLINE • PORT HARCOURT</p>
            </div>
          </div>
          <div class="dp-header-actions">
            <a href="tel:+2349153111592" class="dp-header-btn" title="Call Front Desk (+234 915 311 1592)">
              ${ICON.phone}
            </a>
            <a href="https://wa.me/2349153111592?text=Hello%20De%20Palms%2C%20I%20would%20like%20to%20inquire%20about%20a%20reservation." target="_blank" rel="noopener noreferrer" class="dp-header-btn" title="Open in WhatsApp">
              ${ICON.whatsapp}
            </a>
            <button class="dp-header-btn" id="dp-restart" title="Start fresh conversation">
              ${ICON.restart}
            </button>
            <button class="dp-header-btn" id="dp-minimize" title="Minimize chat">
              ${ICON.minus}
            </button>
            <button class="dp-header-btn" id="dp-close-btn" title="Close chat">
              ${ICON.close}
            </button>
          </div>
        </div>

        <!-- Architectural Grid Messages Stream -->
        <div class="dp-messages" id="dp-messages" data-lenis-prevent="true">
          <div class="dp-date-badge">
            <span id="dp-session-date">${sessionDateStr()}</span>
          </div>
        </div>

        <!-- Quick Suggestion Action Chips (Above Input) -->
        <div class="dp-chips-bar" id="dp-chips-bar">
          <button type="button" class="dp-chip-btn" data-text="Can you arrange airport pickup from Port Harcourt Airport?">AIRPORT PICKUP?</button>
          <button type="button" class="dp-chip-btn" data-text="What is your early check-in policy?">EARLY CHECK-IN</button>
          <button type="button" class="dp-chip-btn" data-text="Could you share the dining and room service menu?">DINING MENU</button>
        </div>

        <!-- Boxy Bottom Input Bar with Micro-Text -->
        <form class="dp-input-bar" id="dp-chat-form">
          <div class="dp-input-row">
            <button type="button" class="dp-attach-btn" id="dp-attach-btn" title="Attach payment proof or document" aria-label="Attach file">
              ${ICON.paperclip}
            </button>
            <input
              type="text"
              class="dp-chat-input"
              id="dp-chat-input"
              placeholder="Type a message..."
              autocomplete="off"
            />
            <button type="submit" class="dp-send-btn" id="dp-send" title="Transmit message" aria-label="Send">
              ${ICON.send}
            </button>
          </div>
          <div class="dp-input-micro">
            <span>PRESS [ENTER] TO TRANSMIT</span>
            <span>END-TO-END ENCRYPTED CONCIERGE</span>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(root);
  }

  /* ─── DOM References ────────────────────────────────────── */

  let $root, $launcher, $greetPop, $greetClose, $card;
  let $minimize, $closeBtn, $restart, $messages, $chatForm, $chatInput, $sendBtn, $attachBtn;

  function bindDOM() {
    $root       = document.getElementById('dp-chat-root');
    $launcher   = document.getElementById('dp-launcher');
    $greetPop   = document.getElementById('dp-greet-pop');
    $greetClose = document.getElementById('dp-greet-close');
    $card       = document.getElementById('dp-card');
    $minimize   = document.getElementById('dp-minimize');
    $closeBtn   = document.getElementById('dp-close-btn');
    $restart    = document.getElementById('dp-restart');
    $messages   = document.getElementById('dp-messages');
    $chatForm   = document.getElementById('dp-chat-form');
    $chatInput  = document.getElementById('dp-chat-input');
    $sendBtn    = document.getElementById('dp-send');
    $attachBtn  = document.getElementById('dp-attach-btn');
  }

  /* ─── Scroll Isolation Enforcement ──────────────────────── */

  function setupScrollIsolation() {
    if (!$card || !$messages) return;

    // Strict wheel event isolation
    $card.addEventListener('wheel', (e) => {
      e.stopPropagation();

      const delta = e.deltaY;
      const { scrollTop, scrollHeight, clientHeight } = $messages;
      const maxScroll = scrollHeight - clientHeight;

      if (maxScroll > 0) {
        $messages.scrollTop += delta;
      }

      e.preventDefault();
    }, { passive: false });

    // Touch event isolation
    $card.addEventListener('touchmove', (e) => {
      e.stopPropagation();
    }, { passive: true });
  }

  /* ─── Widget Toggle ─────────────────────────────────────── */

  function toggleWidget(forceState) {
    isOpen = typeof forceState === 'boolean' ? forceState : !isOpen;

    if (isOpen) {
      $card.classList.add('is-open');
      $launcher.classList.add('is-open');
      if ($greetPop) $greetPop.classList.add('is-hidden');
      setTimeout(() => {
        if ($chatInput) $chatInput.focus();
        $messages.scrollTop = $messages.scrollHeight;
      }, 200);
    } else {
      $card.classList.remove('is-open');
      $launcher.classList.remove('is-open');
    }
  }

  /* ─── Format Bank Accounts Card ─────────────────────────── */

  function formatBankCardHtml() {
    return `
      <div class="dp-bank-card">
        <div class="dp-bank-card-title">
          🏦 De Palms Hotel Official Accounts
        </div>
        <div class="dp-bank-item">
          <div class="dp-bank-name">1. Wema Bank</div>
          <div class="dp-bank-acc">
            <span>9379542204</span>
            <button type="button" onclick="navigator.clipboard && navigator.clipboard.writeText('9379542204'); this.textContent='COPIED ✓'; setTimeout(()=>this.textContent='COPY', 2000);">COPY</button>
          </div>
          <div class="dp-bank-holder">Account Name: DePalms Hotel</div>
        </div>
        <div class="dp-bank-item">
          <div class="dp-bank-name">2. Zenith Bank</div>
          <div class="dp-bank-acc">
            <span>1221641025</span>
            <button type="button" onclick="navigator.clipboard && navigator.clipboard.writeText('1221641025'); this.textContent='COPIED ✓'; setTimeout(()=>this.textContent='COPY', 2000);">COPY</button>
          </div>
          <div class="dp-bank-holder">Account Name: De Palms Hotel Limited</div>
        </div>
      </div>
    `;
  }

  /* ─── Clean 2x2 Reservation Voucher (Matching Image 2) ───── */

  function buildVoucher(b) {
    return `
      <div class="dp-voucher">
        <div class="dp-voucher-header">
          <div class="dp-voucher-title">
            <span class="dp-voucher-bell">🛎️</span>
            <span>DE PALMS RESERVATION</span>
          </div>
          <span class="dp-voucher-ref">${esc(b.bookingId)}</span>
        </div>
        <div class="dp-voucher-body">
          <div class="dp-voucher-row">
            <div class="dp-voucher-col">
              <span class="dp-voucher-label">GUEST</span>
              <span class="dp-voucher-val">${esc(b.guestName)}</span>
            </div>
            <div class="dp-voucher-col">
              <span class="dp-voucher-label">ROOM CATEGORY</span>
              <span class="dp-voucher-val">${esc(b.roomType)}</span>
            </div>
          </div>
          <div class="dp-voucher-divider"></div>
          <div class="dp-voucher-row">
            <div class="dp-voucher-col">
              <span class="dp-voucher-label">TOTAL BILL</span>
              <span class="dp-voucher-val dp-voucher-val--total">${esc(b.totalBill || 'N/A')}</span>
            </div>
            <div class="dp-voucher-col">
              <span class="dp-voucher-label">PAYMENT PREFERENCE</span>
              <span class="dp-voucher-val">
                <span class="dp-voucher-badge">${esc(b.paymentPreference || 'PAY LATER')}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /* ─── Graceful Fallback Card on Error (Direct to WA / Call) ── */

  function buildErrorCard(customMsg) {
    return `
      <div class="dp-error-card">
        <div class="dp-error-header">
          <span>🛎️</span>
          <span>DIRECT FRONT-DESK ASSISTANCE</span>
        </div>
        <div class="dp-error-body">
          <p>${esc(customMsg || 'Our automated concierge is momentarily experiencing network latency. Our 24/7 human front-desk team is on standby right now to attend to your reservation:')}</p>
          <div class="dp-error-actions">
            <a href="https://wa.me/2349153111592?text=Hello%20De%20Palms%20Hotel%2C%20I%20need%20assistance%20with%20a%20reservation." target="_blank" rel="noopener noreferrer" class="dp-error-btn dp-error-btn--wa">
              ${ICON.whatsapp} CHAT ON WHATSAPP
            </a>
            <a href="tel:+2349153111592" class="dp-error-btn dp-error-btn--call">
              ${ICON.phone} CALL RECEPTION (+234 915 311 1592)
            </a>
          </div>
        </div>
      </div>
    `;
  }

  /* ─── Markdown Parser to Architectural Cards ────────────── */

  function formatAiContent(text) {
    if (!text) return '';

    // Split text into paragraphs
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

    return paragraphs.map(p => {
      let html = esc(p);

      // 1. Reference numbers [**DP-494458**] or **DP-494458** or DP-XXXXXX into styled badge
      html = html.replace(/\*\*(DP-\d+)\*\*/g, '<span class="dp-tag-ref">**$1**</span>');
      html = html.replace(/\[\*\*(DP-\d+)\*\*\]/g, '<span class="dp-tag-ref">**$1**</span>');
      html = html.replace(/\b(DP-\d{5,})\b/g, '<span class="dp-tag-ref">$1</span>');

      // 2. Bold text **Name** -> <strong>Name</strong>
      html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

      // 3. Single line breaks inside paragraph
      html = html.replace(/\n/g, '<br>');

      return `<div class="dp-msg-card">${html}</div>`;
    }).join('');
  }

  /* ─── Message Rendering ─────────────────────────────────── */

  function appendMessage(role, text, extraHtml, customTime) {
    const isUser = role === 'user';
    const div = document.createElement('div');
    div.className = `dp-msg dp-msg--${isUser ? 'user' : 'ai'}`;

    const displayTime = customTime || timeStr();
    const ticksHtml = isUser
      ? `<span class="dp-bubble-ticks" title="Delivered">${ICON.checkDouble}</span>`
      : '';

    // Check if AI response contains bank details mention
    let bankCardHtml = '';
    if (!isUser && text && (text.includes('9379542204') || text.includes('1221641025') || (text.includes('Wema Bank') && text.includes('Zenith Bank')))) {
      bankCardHtml = formatBankCardHtml();
    }

    if (isUser) {
      div.innerHTML = `
        <div class="dp-user-bubble">
          <div>${esc(text).replace(/\n/g, '<br>')}</div>
          <div class="dp-bubble-meta">
            <span>${displayTime}</span>
            ${ticksHtml}
          </div>
        </div>
      `;
    } else {
      const cardsHtml = text ? formatAiContent(text) : '';
      div.innerHTML = `
        ${cardsHtml}
        ${bankCardHtml}
        ${extraHtml || ''}
        <div class="dp-bubble-meta" style="margin-top: 4px; padding: 0 4px;">
          <span>${displayTime}</span>
        </div>
      `;
    }

    $messages.appendChild(div);
    $messages.scrollTop = $messages.scrollHeight;
  }

  /* ─── Typing Indicator ──────────────────────────────────── */

  let typingEl = null;

  function showTyping() {
    if (typingEl) return;
    typingEl = document.createElement('div');
    typingEl.className = 'dp-typing-bubble';
    typingEl.innerHTML = `
      <div class="dp-typing-dot"></div>
      <div class="dp-typing-dot"></div>
      <div class="dp-typing-dot"></div>
      <span class="dp-typing-text">Concierge is typing…</span>
    `;
    $messages.appendChild(typingEl);
    $messages.scrollTop = $messages.scrollHeight;
  }

  function hideTyping() {
    if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
    typingEl = null;
  }

  /* ─── Conversation Initialization ───────────────────────── */

  function initConversation() {
    $messages.innerHTML = `
      <div class="dp-date-badge">
        <span id="dp-session-date">${sessionDateStr()}</span>
      </div>
    `;

    const saved = loadSavedSession();
    if (saved && saved.history && saved.history.length > 0) {
      chatHistory = saved.history;
      for (const turn of chatHistory) {
        appendMessage(turn.role, turn.content, turn.voucherHtml, turn.time);
      }
      return;
    }

    // Fresh welcome message
    const welcome = 'Warm welcome to De Palms Hotel Port Harcourt! 🛎️\n\nI am your front-desk concierge. Feel free to ask about our room suites, dining, amenities, or make a reservation. How may I assist you today?';
    const initTime = timeStr();
    appendMessage('assistant', welcome, '', initTime);
    chatHistory = [{ role: 'assistant', content: welcome, time: initTime }];
    saveCurrentSession();
  }

  /* ─── Send Message ──────────────────────────────────────── */

  async function sendMessage() {
    const text = $chatInput.value.trim();
    if (!text || isWaiting) return;

    $chatInput.value = '';
    $chatInput.disabled = true;
    $sendBtn.disabled = true;
    isWaiting = true;

    const userTime = timeStr();
    appendMessage('user', text, '', userTime);
    chatHistory.push({ role: 'user', content: text, time: userTime });
    saveCurrentSession();

    showTyping();

    try {
      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: chatHistory.map(m => ({ role: m.role, content: m.content })).slice(-16),
        }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const data = await res.json();
      hideTyping();

      // Graceful error check from backend response
      if (data.isError || data.fallback || !data.reply) {
        const errorCardHtml = buildErrorCard(data.reply);
        const errTime = timeStr();
        appendMessage('assistant', '', errorCardHtml, errTime);
        chatHistory.push({
          role: 'assistant',
          content: 'Direct Front-Desk Assistance prompt displayed.',
          voucherHtml: errorCardHtml,
          time: errTime,
        });
        saveCurrentSession();
        return;
      }

      let voucherHtml = '';
      if (data.bookingSaved && data.bookingDetails) {
        voucherHtml = buildVoucher(data.bookingDetails);
      }

      const reply = data.reply || 'Thank you. Our front desk remains at your complete disposal.';
      const aiTime = timeStr();
      appendMessage('assistant', reply, voucherHtml, aiTime);

      chatHistory.push({
        role: 'assistant',
        content: reply,
        voucherHtml,
        time: aiTime,
      });

      saveCurrentSession();
    } catch (err) {
      hideTyping();
      console.error('[De Palms Chat Connection Error]', err);
      const errTime = timeStr();
      const errorCardHtml = buildErrorCard(
        'We are currently experiencing a network latency delay connecting with our reservations system. Please connect with our 24/7 reception team below:'
      );
      appendMessage('assistant', '', errorCardHtml, errTime);
      chatHistory.push({
        role: 'assistant',
        content: 'Direct Front-Desk Assistance prompt displayed.',
        voucherHtml: errorCardHtml,
        time: errTime,
      });
      saveCurrentSession();
    } finally {
      isWaiting = false;
      $chatInput.disabled = false;
      $sendBtn.disabled = false;
      $chatInput.focus();
    }
  }

  /* ─── Greeting Popout Notification ────────────────────────── */

  function triggerGreetingNotification() {
    greetPopTimer = setTimeout(() => {
      if (!isOpen && $greetPop) {
        $greetPop.classList.remove('is-hidden');
      }
    }, 2500);
  }

  /* ─── Event Wiring ──────────────────────────────────────── */

  function wireEvents() {
    // Launcher toggle
    $launcher.addEventListener('click', () => toggleWidget());
    if ($minimize) $minimize.addEventListener('click', () => toggleWidget(false));
    if ($closeBtn) $closeBtn.addEventListener('click', () => toggleWidget(false));

    // Greeting popout click: open chat
    if ($greetPop) {
      $greetPop.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'dp-greet-close') return;
        toggleWidget(true);
      });
    }

    if ($greetClose) {
      $greetClose.addEventListener('click', (e) => {
        e.stopPropagation();
        if ($greetPop) $greetPop.classList.add('is-hidden');
      });
    }

    // Restart conversation
    $restart.addEventListener('click', () => {
      if (confirm('Start a fresh conversation with De Palms front desk?')) {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (_) {}
        chatHistory = [];
        initConversation();
      }
    });

    // Chat form submit
    $chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      sendMessage();
    });

    // Quick Action Suggestion Chips
    document.querySelectorAll('.dp-chip-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-text');
        if (text && !isWaiting) {
          $chatInput.value = text;
          sendMessage();
        }
      });
    });

    // Attachment button click: guide to WhatsApp or front desk
    if ($attachBtn) {
      $attachBtn.addEventListener('click', () => {
        const modal = confirm(
          'To submit payment receipts or documents to De Palms Hotel:\n\nClick OK to forward directly to our Front Desk on WhatsApp (+234 915 311 1592).'
        );
        if (modal) {
          window.open(
            'https://wa.me/2349153111592?text=Hello%20De%20Palms%2C%20I%20am%20sending%20my%20payment%20receipt%20for%20my%20reservation.',
            '_blank',
            'noopener,noreferrer'
          );
        }
      });
    }

    // Click outside to close (desktop only)
    document.addEventListener('click', (e) => {
      if (!isOpen) return;
      if ($root && !$root.contains(e.target)) {
        toggleWidget(false);
      }
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) toggleWidget(false);
    });
  }

  /* ─── Global openLiveChat trigger ───────────────────────── */

  window.openLiveChat = function (event) {
    if (event && event.preventDefault) event.preventDefault();
    toggleWidget(true);
  };

  function wireOpenChatTriggers() {
    document.querySelectorAll('[data-open-chat]').forEach((el) => {
      el.addEventListener('click', window.openLiveChat);
    });
  }

  /* ─── Mobile Menu Sync ──────────────────────────────────── */

  function syncMobileMenu() {
    const mobileMenu = document.querySelector('[data-mobile-menu]');
    if (!mobileMenu) return;

    const observer = new MutationObserver(() => {
      if ($root) {
        $root.style.display = mobileMenu.classList.contains('is-open') ? 'none' : '';
      }
    });

    observer.observe(mobileMenu, { attributes: true, attributeFilter: ['class'] });
  }

  /* ─── Initialize ────────────────────────────────────────── */

  function init() {
    injectWidget();
    bindDOM();
    setupScrollIsolation();
    wireEvents();
    wireOpenChatTriggers();
    syncMobileMenu();
    initConversation();
    triggerGreetingNotification();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
