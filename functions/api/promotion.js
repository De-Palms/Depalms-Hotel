/**
 * DE PALMS HOTEL — PROMOTIONS API
 * GET /api/promotion
 *
 * Reads only the Promotions sheet tab and returns the single highest-priority
 * promotion that is active for the current date in Africa/Lagos.
 */

function base64url(input) {
  if (input instanceof ArrayBuffer) input = new Uint8Array(input);
  if (input instanceof Uint8Array) {
    let bin = '';
    input.forEach((byte) => { bin += String.fromCharCode(byte); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function formatPemKey(raw) {
  if (!raw) return '';
  let key = raw.trim();
  if (key.startsWith('"') && key.endsWith('"')) key = key.slice(1, -1);
  return key.replace(/\\n/g, '\n');
}

function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/[\s\r\n]/g, '');
  const bin = atob(b64);
  const buffer = new ArrayBuffer(bin.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < bin.length; i += 1) view[i] = bin.charCodeAt(i);
  return buffer;
}

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

async function getAccessToken(email, rawPrivateKey) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = await getServerTimestamp();
  const payload = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(formatPemKey(rawPrivateKey)),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signingInput)
  );
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${signingInput}.${base64url(signature)}`,
  });
  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok) throw new Error(`Google OAuth error: ${tokenResponse.status}`);
  return tokenData.access_token;
}

function stringValue(value, maxLength = 500) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function headerKey(value) {
  return stringValue(value, 80).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isActive(value) {
  return value === true || ['true', 'yes', '1'].includes(stringValue(value).toLowerCase());
}

function toIsoDate(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const sheetEpoch = Date.UTC(1899, 11, 30);
    return new Date(sheetEpoch + Math.round(value) * 86400000).toISOString().slice(0, 10);
  }
  const text = stringValue(value, 20);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

function lagosDateParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
}

function lagosToday() {
  const date = lagosDateParts();
  return `${date.year}-${date.month}-${date.day}`;
}

function secondsUntilLagosMidnight() {
  const date = lagosDateParts();
  const current = Date.UTC(date.year, Number(date.month) - 1, date.day, date.hour, date.minute, date.second);
  const nextMidnight = Date.UTC(date.year, Number(date.month) - 1, Number(date.day) + 1);
  return Math.max(1, Math.floor((nextMidnight - current) / 1000));
}

function cacheHeaders() {
  const maxAge = Math.min(300, secondsUntilLagosMidnight());
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}`,
  };
}

function noCacheHeaders() {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  };
}

function parsePrice(value, currency) {
  const raw = stringValue(value, 40).replace(/,/g, '');
  if (!raw) return null;
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount < 0) return null;
  const formattedAmount = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 }).format(amount);
  return `${currency}${formattedAmount}`;
}

function safeLink(value) {
  const raw = stringValue(value, 1000);
  if (!raw) return '';
  try {
    const url = new URL(raw);
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol) ? url.href : '';
  } catch (_) {
    return '';
  }
}

export function responsePayload(row) {
  const currency = stringValue(row.currency, 3) || '₦';
  const buttonText = stringValue(row.buttontext, 50);
  const buttonLink = safeLink(row.buttonlink);
  return {
    active: true,
    promotion: {
      label: stringValue(row.label, 60) || 'WHAT’S ON',
      title: stringValue(row.title, 120),
      description: stringValue(row.description, 360),
      details: stringValue(row.details, 140),
      price: parsePrice(row.price, currency),
      oldPrice: parsePrice(row.oldprice, currency),
      buttonText: buttonText && buttonLink ? buttonText : '',
      buttonLink: buttonText && buttonLink ? buttonLink : '',
    },
  };
}

export function selectPromotion(values, today = lagosToday()) {
  if (!Array.isArray(values) || values.length < 2) return null;
  const headers = values[0].map(headerKey);
  const promotions = values.slice(1).map((cells) => headers.reduce((record, header, index) => {
    if (header) record[header] = cells[index] ?? '';
    return record;
  }, {})).filter((row) => {
    const startDate = toIsoDate(row.startdate);
    const endDate = toIsoDate(row.enddate);
    return isActive(row.active)
      && row.title
      && row.description
      && startDate
      && endDate
      && startDate <= today
      && endDate >= today;
  });

  promotions.sort((a, b) => {
    const priorityA = Number(a.priority) || Number.MAX_SAFE_INTEGER;
    const priorityB = Number(b.priority) || Number.MAX_SAFE_INTEGER;
    if (priorityA !== priorityB) return priorityA - priorityB;
    return stringValue(b.createdat, 40).localeCompare(stringValue(a.createdat, 40));
  });
  return promotions[0] || null;
}

export async function onRequestGet({ env }) {
  const sheetId = env.GOOGLE_SHEET_ID;
  const email = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = env.GOOGLE_PRIVATE_KEY;

  if (!sheetId || !email || !privateKey) {
    console.error('[promotion] Google Sheets configuration is unavailable.');
    return new Response(JSON.stringify({ active: false }), { status: 503, headers: noCacheHeaders() });
  }

  try {
    const token = await getAccessToken(email, privateKey);
    let range = encodeURIComponent('Promotions!A:O');
    let response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?valueRenderOption=UNFORMATTED_VALUE`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) {
      // Fallback to Events tab if Promotions tab is not found
      range = encodeURIComponent('Events!A:O');
      response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?valueRenderOption=UNFORMATTED_VALUE`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
    if (!response.ok) throw new Error(`Google Sheets read failed: ${response.status}`);
    const data = await response.json();
    const promotion = selectPromotion(data.values);
    return new Response(
      JSON.stringify(promotion ? responsePayload(promotion) : { active: false }),
      { headers: cacheHeaders() }
    );
  } catch (error) {
    console.error('[promotion] Unable to retrieve promotion:', error.message);
    return new Response(JSON.stringify({ active: false }), { status: 503, headers: noCacheHeaders() });
  }
}
