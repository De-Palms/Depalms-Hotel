/**
 * ══════════════════════════════════════════════════════════════
 * DE PALMS HOTEL — CLOUDFLARE PAGES FUNCTION
 * POST /api/chat
 * ──────────────────────────────────────────────────────────────
 * • Gemini 2.5 Flash via REST API (zero npm dependencies)
 * • Google Sheets append via Service Account JWT + WebCrypto
 * • Edge-native: runs on Cloudflare's 300+ global PoPs
 * ══════════════════════════════════════════════════════════════
 */

/* ─── Base64url helpers (WebCrypto compatible) ────────────── */

function base64url(input) {
  if (input instanceof ArrayBuffer) input = new Uint8Array(input);
  if (input instanceof Uint8Array) {
    let bin = '';
    input.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/[\s\r\n]/g, '');
  const bin = atob(b64);
  const buf = new ArrayBuffer(bin.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
  return buf;
}

function formatPemKey(raw) {
  if (!raw) return '';
  let key = raw.trim();
  if (key.startsWith('"') && key.endsWith('"')) key = key.slice(1, -1);
  key = key.replace(/\\n/g, '\n');
  return key;
}

/* ─── Google Service Account JWT (WebCrypto RS256) ────────── */

async function getServerTimestamp() {
  try {
    const head = await fetch('https://oauth2.googleapis.com', { method: 'HEAD' });
    const sDate = head.headers.get('date');
    if (sDate) {
      const parsed = Math.floor(new Date(sDate).getTime() / 1000);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch (_) {}
  return Math.floor(Date.now() / 1000);
}

async function createSignedJWT(email, privateKeyPem) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = await getServerTimestamp();
  const payload = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(privateKeyPem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput)
  );

  return `${signingInput}.${base64url(signature)}`;
}

async function getAccessToken(email, privateKeyPem) {
  const jwt = await createSignedJWT(email, privateKeyPem);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`OAuth token error: ${JSON.stringify(data)}`);
  return data.access_token;
}

/* ─── Google Sheets append ────────────────────────────────── */

async function appendToGoogleSheet(env, booking) {
  const sheetId = env.GOOGLE_SHEET_ID;
  const email = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = env.GOOGLE_PRIVATE_KEY;

  if (!sheetId || !email || !rawKey) {
    console.log('[Sheets] Credentials missing — simulating append.');
    return { status: 'simulated', message: 'Sheet credentials not configured.' };
  }

  try {
    const privateKey = formatPemKey(rawKey);
    const token = await getAccessToken(email, privateKey);

    const row = [
      new Date().toISOString(),
      booking.bookingId,
      booking.guestName,
      booking.email,
      booking.phone || 'N/A',
      booking.checkIn,
      booking.checkOut,
      booking.roomType,
      booking.totalBill || 'N/A',
      booking.paymentPreference || 'Not specified',
      booking.numberOfGuests || 1,
      booking.specialRequests || 'None',
      booking.inquirySummary || 'Room inquiry and reservation',
      'CONFIRMED',
    ];

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Bookings!A:N:append?valueInputOption=USER_ENTERED`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data.error || data));

    console.log('[Sheets] Row appended:', data.updates?.updatedRange);
    return { status: 'success', updatedRange: data.updates?.updatedRange };
  } catch (err) {
    console.error('[Sheets] Error:', err.message);
    return { status: 'error', error: err.message };
  }
}

/* ─── Email alert (simulation — see docs for REST email setup) */

async function sendEmailAlert(env, booking) {
  // Cloudflare Workers cannot use nodemailer (TCP sockets).
  // To enable real email dispatch, configure one of:
  //   1. Resend API (RESEND_API_KEY env var)
  //   2. SendGrid API (SENDGRID_API_KEY env var)
  //   3. Google Apps Script web-app webhook
  //   4. Cloudflare Email Workers
  //
  // For now, log the booking — the Google Sheet serves as primary record.

  const receptionEmail = env.RECEPTION_EMAIL || 'depalmshotelphc@gmail.com';

  // If Resend API key is configured, send real email
  if (env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'De Palms Front Desk <bookings@depalmshotels.ng>',
          to: [receptionEmail],
          subject: `🛎️ New Booking: ${booking.roomType} — ${booking.guestName} (${booking.checkIn} → ${booking.checkOut})`,
          html: buildEmailHtml(booking),
        }),
      });
      const data = await res.json();
      return { status: 'sent', id: data.id };
    } catch (err) {
      console.error('[Email] Resend error:', err.message);
      return { status: 'error', error: err.message };
    }
  }

  console.log(`[Email] Simulated alert to ${receptionEmail} for booking ${booking.bookingId}`);
  return { status: 'simulated', recipient: receptionEmail };
}

function buildEmailHtml(b) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px;background:#f7f8f5;color:#151815;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid rgba(21,24,21,.12);">
      <div style="background:#174c3b;padding:24px 28px;color:#fff;">
        <h1 style="margin:0;font-size:20px;">De Palms Hotel</h1>
        <p style="margin:4px 0 0;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.7);">78 Elelenwo Road, G.R.A Phase 2, Port Harcourt</p>
        <span style="display:inline-block;margin-top:10px;padding:4px 10px;background:rgba(255,255,255,.15);font-size:11px;letter-spacing:1px;border-radius:3px;">REF: ${b.bookingId}</span>
      </div>
      <div style="padding:28px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:10px 0;color:#6f8f72;font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:500;">Guest</td><td style="padding:10px 0;font-weight:600;">${b.guestName}</td></tr>
          <tr><td style="padding:10px 0;color:#6f8f72;font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:500;">Email</td><td style="padding:10px 0;">${b.email}</td></tr>
          <tr><td style="padding:10px 0;color:#6f8f72;font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:500;">Phone</td><td style="padding:10px 0;">${b.phone || 'N/A'}</td></tr>
          <tr><td style="padding:10px 0;color:#6f8f72;font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:500;">Room</td><td style="padding:10px 0;font-weight:600;color:#174c3b;">${b.roomType}</td></tr>
          <tr><td style="padding:10px 0;color:#6f8f72;font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:500;">Total Bill</td><td style="padding:10px 0;font-weight:600;color:#174c3b;">${b.totalBill || 'N/A'}</td></tr>
          <tr><td style="padding:10px 0;color:#6f8f72;font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:500;">Check-In</td><td style="padding:10px 0;">${b.checkIn}</td></tr>
          <tr><td style="padding:10px 0;color:#6f8f72;font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:500;">Check-Out</td><td style="padding:10px 0;">${b.checkOut}</td></tr>
          <tr><td style="padding:10px 0;color:#6f8f72;font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:500;">Payment</td><td style="padding:10px 0;">${b.paymentPreference || 'Not specified'}</td></tr>
          <tr><td style="padding:10px 0;color:#6f8f72;font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:500;">Guests</td><td style="padding:10px 0;">${b.numberOfGuests || 1}</td></tr>
          <tr><td style="padding:10px 0;color:#6f8f72;font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:500;">Requests</td><td style="padding:10px 0;">${b.specialRequests || 'None'}</td></tr>
          <tr><td style="padding:10px 0;color:#6f8f72;font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:500;">Summary</td><td style="padding:10px 0;font-style:italic;">${b.inquirySummary || 'None'}</td></tr>
        </table>
      </div>
      <div style="padding:16px 28px;background:#f7f8f5;border-top:1px solid rgba(21,24,21,.08);font-size:11px;color:rgba(21,24,21,.5);">
        Logged to Google Sheets Master Reservations Log • ${new Date().toLocaleString()}
      </div>
    </div>
  </body></html>`;
}

/* ─── Gemini system instruction ───────────────────────────── */

const SYSTEM_INSTRUCTION = `
You are the warm, hospitable, and attentive Chief Front-Desk Concierge at "De Palms Hotel", 78 Elelenwo Road, G.R.A Phase 2, Port Harcourt, Rivers State, Nigeria (depalmshotels.ng).

HOSPITALITY, TONE & RECOMMENDATIONS:
- Speak naturally and warmly like an experienced luxury hotel receptionist. Be conversational, free, and genuinely helpful.
- Provide thoughtful recommendations tailored to the guest's needs:
  * Solo travelers, short stays, or budget-conscious: Mini Deluxe (₦60,000/night, room only - no complimentary breakfast) or Super Deluxe (₦90,000/night, comfortable with complimentary breakfast).
  * Couples, elevated business travelers: Royal Room (₦110,000/night) or Special Room (₦120,000/night).
  * VIPs, diplomats, and families seeking luxury: Ambassadorial Room (₦150,000/night) or Presidential Suite (₦250,000/night with 1-2 bedrooms & sitting room).
  * Dining recommendations: Our famous Rivers Native Fisherman Soup, freshly prepared seafood okra, restaurant dining, or cocktails at the Bush Bar under the canopy.
  * Amenities: Sparkling outdoor pool, spa, 24/7 heavy industrial power, high-speed Wi-Fi, and serene G.R.A Phase 2 surroundings.

OFFICIAL ROOM RATES (Nigerian Naira):
- Mini Deluxe Room: ₦60,000/night (Please note: No Complimentary Breakfast)
- Super Deluxe Room: ₦90,000/night (Includes Complimentary Breakfast)
- Royal Room: ₦110,000/night (Includes Complimentary Breakfast)
- Special Room: ₦120,000/night (Includes Complimentary Breakfast)
- Ambassadorial Room: ₦150,000/night (Includes Complimentary Breakfast)
- Presidential Suite: ₦250,000/night (Includes Complimentary Breakfast)

MULTIPLE ROOMS & BILL CALCULATION:
- Guests can reserve single or multiple rooms across any combination of categories and nights.
- Gracefully handle multiple rooms (e.g., 2 Super Deluxe + 1 Royal).
- ALWAYS calculate and display the clear bill breakdown before asking about payment:
  Show: [Quantity]x [Room Category] @ [Rate] × [Nights] = [Subtotal], and the Total Bill.

MANDATORY CONTACT DETAILS PROTOCOL:
- Before any reservation is finalized or processed, you MUST collect:
  1. Full Name
  2. Email Address
  3. Phone Number
- If any of these 3 pieces of information are missing, politely ask the guest to provide them.
- NEVER process a booking with placeholder names like "Valued Guest" or dummy data.

PAYMENT OPTIONS & BANK DETAILS PROTOCOL:
- Once dates, room(s), bill calculation, and contact details are established, ask:
  "Would you like to make a Full Payment, Part Payment, or Pay Later?"
- IF THE GUEST ACCEPTS TO MAKE PAYMENT (Full Payment or Part Payment):
  1. Present the official De Palms Hotel bank account details in this structured manner:

     🏦 De Palms Hotel Official Accounts:

     1. Wema Bank
        • Account Number: 9379542204
        • Account Name: DePalms Hotel

     2. Zenith Bank
        • Account Number: 1221641025
        • Account Name: De Palms Hotel Limited

  2. Inform the guest they can pay to either account.
  3. Immediately execute the "saveBooking" tool with all booking details, total bill, paymentPreference ("Full Payment" or "Part Payment"), and an inquirySummary.
  4. Tell the guest: "Your reservation has been logged under reference {bookingId}! Our front desk team will contact you shortly to confirm your payment."

- IF THE GUEST CHOOSES TO PAY LATER:
  1. Immediately execute the "saveBooking" tool with paymentPreference: "Pay Later", total bill, and an inquirySummary.
  2. Tell the guest: "Your reservation has been logged under reference {bookingId}! Our front desk will contact you shortly for a follow-up on your payment."
`;

/* ─── Gemini function declaration ─────────────────────────── */

const SAVE_BOOKING_DECLARATION = {
  name: 'saveBooking',
  description:
    'Logs and confirms a room reservation for De Palms Hotel Port Harcourt, appends the record to Google Sheets with inquiry summary and bill calculation, and dispatches an instant notification to reception.',
  parameters: {
    type: 'OBJECT',
    properties: {
      guestName: { type: 'STRING', description: 'The full name of the guest.' },
      email: { type: 'STRING', description: "The guest's contact email address." },
      phone: { type: 'STRING', description: "The guest's phone number (e.g. +234...)." },
      checkIn: { type: 'STRING', description: "Check-in date (e.g. '2026-10-15')." },
      checkOut: { type: 'STRING', description: "Check-out date (e.g. '2026-10-18')." },
      roomType: {
        type: 'STRING',
        description: 'Room type and quantity (e.g. "1x Mini Deluxe", "2x Super Deluxe, 1x Royal").',
      },
      totalBill: {
        type: 'STRING',
        description: 'Calculated total bill amount in Naira (e.g. "₦180,000").',
      },
      paymentPreference: {
        type: 'STRING',
        description: "Payment preference: 'Full Payment', 'Part Payment', or 'Pay Later'.",
      },
      numberOfGuests: { type: 'INTEGER', description: 'Number of guests staying.' },
      specialRequests: {
        type: 'STRING',
        description: 'Any special requests (e.g. airport pickup, quiet room, late check-in).',
      },
      inquirySummary: {
        type: 'STRING',
        description: 'Concise summary of the guest inquiry, room selections, and stay notes for front desk records.',
      },
    },
    required: ['guestName', 'email', 'phone', 'checkIn', 'checkOut', 'roomType', 'totalBill', 'paymentPreference', 'inquirySummary'],
  },
};

/* ─── Gemini API caller ───────────────────────────────────── */

const CANDIDATE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
];

async function callGemini(apiKey, model, contents, includeTools = true) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents,
    generation_config: { temperature: 0.5, max_output_tokens: 800 },
  };

  if (includeTools) {
    body.tools = [{ function_declarations: [SAVE_BOOKING_DECLARATION] }];
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errData = await res.text();
    throw new Error(`Gemini ${model} error (${res.status}): ${errData}`);
  }

  return res.json();
}

/* ─── Main handler ────────────────────────────────────────── */

export async function onRequestPost(context) {
  const { request, env } = context;

  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };

  try {
    const { message, history = [], guestInfo = {} } = await request.json();
    const userText = (message || '').trim();

    if (!userText && (!history || history.length === 0)) {
      return new Response(JSON.stringify({ error: 'Message content is required.' }), {
        status: 400,
        headers,
      });
    }

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          reply: `Warm greetings from De Palms Hotel, ${guestInfo.name || 'Valued Guest'}! How may I assist you with your room reservation today? (Direct line: +234 915 311 1592)`,
          bookingSaved: false,
          modelUsed: 'offline-fallback',
        }),
        { headers }
      );
    }

    /* ── Build Gemini contents array ─────────────────────── */
    const rawTurns = [];

    if (Array.isArray(history)) {
      for (const turn of history) {
        const text = (turn.content || '').trim();
        if (!text) continue;
        const role = turn.role === 'assistant' || turn.role === 'model' ? 'model' : 'user';
        rawTurns.push({ role, text });
      }
    }

    const lastTurn = rawTurns[rawTurns.length - 1];
    if (!lastTurn || lastTurn.role !== 'user' || lastTurn.text !== userText) {
      if (userText) rawTurns.push({ role: 'user', text: userText });
    }

    let guestPreamble = '';
    if (guestInfo.name || guestInfo.email) {
      guestPreamble = `[Prefilled Guest Identity: Name="${guestInfo.name || 'Valued Guest'}", Phone="${guestInfo.phone || 'N/A'}", Email="${guestInfo.email || 'N/A'}"]\n`;
    }

    const contents = [];
    for (const turn of rawTurns) {
      if (contents.length === 0 && turn.role === 'model') continue;

      if (contents.length > 0 && contents[contents.length - 1].role === turn.role) {
        contents[contents.length - 1].parts[0].text += `\n${turn.text}`;
      } else {
        let textContent = turn.text;
        if (contents.length === 0 && guestPreamble && turn.role === 'user') {
          textContent = `${guestPreamble}${textContent}`;
        }
        contents.push({ role: turn.role, parts: [{ text: textContent }] });
      }
    }

    if (contents.length === 0) {
      contents.push({
        role: 'user',
        parts: [
          {
            text: guestPreamble
              ? `${guestPreamble}${userText || 'Hello'}`
              : userText || 'Hello',
          },
        ],
      });
    }

    /* ── Call Gemini with model cascade ───────────────────── */
    const preferredModel = env.GEMINI_MODEL || CANDIDATE_MODELS[0];
    const modelsToTry = [
      preferredModel,
      ...CANDIDATE_MODELS.filter((m) => m !== preferredModel),
    ];

    let geminiData = null;
    let selectedModel = preferredModel;
    let lastErr = null;

    for (const model of modelsToTry) {
      try {
        geminiData = await callGemini(apiKey, model, contents);
        selectedModel = model;
        lastErr = null;
        break;
      } catch (err) {
        console.warn(`[Gemini] Model "${model}" failed: ${err.message}`);
        lastErr = err;
      }
    }

    if (!geminiData) {
      console.error('[Gemini] All models exhausted:', lastErr?.message);
      return new Response(
        JSON.stringify({
          reply: `Warm greetings from De Palms Hotel, ${guestInfo.name || 'Valued Guest'}! How may I assist you today? (Direct line: +234 915 311 1592)`,
          bookingSaved: false,
          modelUsed: 'offline-fallback',
        }),
        { headers }
      );
    }

    /* ── Process response & handle function calls ────────── */
    const candidate = geminiData.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    let bookingSaved = false;
    let bookingDetails = null;
    let sheetStatus = null;
    let emailStatus = null;

    // Check for text reply
    let finalReply = '';
    const textParts = parts.filter((p) => p.text);
    if (textParts.length > 0) {
      finalReply = textParts.map((p) => p.text).join('\n');
    }

    // Check for function call
    const fnCall = parts.find((p) => p.functionCall);

    if (fnCall && fnCall.functionCall.name === 'saveBooking') {
      const args = fnCall.functionCall.args || {};
      const bookingId = `DP-${Math.floor(100000 + Math.random() * 900000)}`;

      bookingDetails = {
        bookingId,
        guestName: args.guestName || guestInfo.name || 'Valued Guest',
        email: args.email || guestInfo.email || 'depalmshotelphc@gmail.com',
        phone: args.phone || guestInfo.phone || 'N/A',
        checkIn: args.checkIn || 'Dates Pending',
        checkOut: args.checkOut || 'Dates Pending',
        roomType: args.roomType || 'Super Deluxe',
        totalBill: args.totalBill || 'N/A',
        paymentPreference: args.paymentPreference || 'Part Payment',
        numberOfGuests: args.numberOfGuests || 1,
        specialRequests: args.specialRequests || 'None',
        inquirySummary: args.inquirySummary || 'Room inquiry and reservation',
        timestamp: new Date().toISOString(),
        status: 'Confirmed',
      };

      // 1. Append to Google Sheets
      try {
        sheetStatus = await appendToGoogleSheet(env, bookingDetails);
      } catch (err) {
        console.warn('[Sheets]', err.message);
        sheetStatus = { status: 'simulated', error: err.message };
      }

      // 2. Email alert
      try {
        emailStatus = await sendEmailAlert(env, bookingDetails);
      } catch (err) {
        console.warn('[Email]', err.message);
        emailStatus = { status: 'simulated', error: err.message };
      }

      bookingSaved = true;

      // 3. Send function result back to Gemini for final reply
      try {
        const followUpContents = [
          ...contents,
          {
            role: 'model',
            parts: candidate?.content?.parts || [fnCall],
          },
          {
            role: 'user',
            parts: [
              {
                functionResponse: {
                  name: 'saveBooking',
                  response: {
                    status: 'success',
                    bookingId,
                    message: `Reservation logged with ${bookingDetails.paymentPreference}. Front desk alert dispatched.`,
                    details: bookingDetails,
                  },
                },
              },
            ],
          },
        ];

        const followUp = await callGemini(apiKey, selectedModel, followUpContents, true);
        const followUpParts = followUp.candidates?.[0]?.content?.parts || [];
        const followUpText = followUpParts.filter((p) => p.text).map((p) => p.text).join('\n');

        if (followUpText) {
          finalReply = followUpText;
        } else {
          finalReply = `Your reservation has been made under reference ${bookingId}! You will be contacted shortly by our front desk to confirm your ${bookingDetails.paymentPreference} payment.`;
        }
      } catch (err) {
        console.warn('[Follow-up]', err.message);
        finalReply = `Your reservation has been made under reference ${bookingId}! You will be contacted shortly by our front desk to confirm your ${bookingDetails.paymentPreference} payment.`;
      }
    }

    if (!finalReply) {
      finalReply = "Thank you. Our front desk remains at your complete disposal.";
    }

    return new Response(
      JSON.stringify({
        reply: finalReply,
        bookingSaved,
        bookingDetails,
        sheetStatus,
        emailStatus,
        modelUsed: selectedModel,
      }),
      { headers }
    );
  } catch (error) {
    console.error('[/api/chat] Error:', error);
    return new Response(
      JSON.stringify({
        isError: true,
        fallback: true,
        error: error.message,
        reply: 'I am momentarily experiencing network latency connecting with our reservations server. Please reach out to our 24/7 front desk directly below:',
      }),
      { status: 200, headers }
    );
  }
}
