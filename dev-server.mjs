/**
 * ══════════════════════════════════════════════════════════════
 * DE PALMS HOTEL — LOCAL DEVELOPMENT SERVER
 * ──────────────────────────────────────────────────────────────
 * • Zero external npm dependencies (uses native Node 18+ Web APIs)
 * • Serves static website files (HTML, CSS, JS, assets)
 * • Emulates Cloudflare Pages Functions edge runtime for /api/chat
 * • Injects secrets from .dev.vars
 * ══════════════════════════════════════════════════════════════
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { onRequestPost } from './functions/api/chat.js';
import { onRequestGet as onPromotionRequestGet } from './functions/api/promotion.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 8788;

// Load .dev.vars
function loadDevVars() {
  const env = { ...process.env };
  const devVarsPath = path.resolve(__dirname, '.dev.vars');
  if (fs.existsSync(devVarsPath)) {
    const lines = fs.readFileSync(devVarsPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        val = val.replace(/\\n/g, '\n');
        env[key] = val;
      }
    }
  }
  return env;
}

const env = loadDevVars();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(urlObj.pathname);

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  // 1. API Route: /api/chat
  if (pathname === '/api/chat' && req.method === 'POST') {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const bodyBuffer = Buffer.concat(chunks);
        const webRequest = new Request(urlObj.toString(), {
          method: 'POST',
          headers: req.headers,
          body: bodyBuffer,
          duplex: 'half',
        });

        const cfResponse = await onRequestPost({ request: webRequest, env });
        const resBody = await cfResponse.arrayBuffer();

        const headers = { ...corsHeaders };
        cfResponse.headers.forEach((value, key) => {
          headers[key] = value;
        });

        res.writeHead(cfResponse.status, headers);
        res.end(Buffer.from(resBody));
      } catch (err) {
        console.error('[dev-server] /api/chat handler error:', err);
        res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 2. API Route: /api/promotion
  if (pathname === '/api/promotion' && req.method === 'GET') {
    try {
      const webRequest = new Request(urlObj.toString(), {
        method: 'GET',
        headers: req.headers,
      });
      const cfResponse = await onPromotionRequestGet({ request: webRequest, env });
      const resBody = await cfResponse.arrayBuffer();
      const headers = { ...corsHeaders };
      cfResponse.headers.forEach((value, key) => {
        headers[key] = value;
      });
      res.writeHead(cfResponse.status, headers);
      res.end(Buffer.from(resBody));
    } catch (err) {
      console.error('[dev-server] /api/promotion handler error:', err);
      res.writeHead(503, { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ active: false }));
    }
    return;
  }

  // 3. Static File Serving
  if (pathname === '/') pathname = '/index.html';
  if (!path.extname(pathname) && fs.existsSync(path.join(__dirname, `${pathname}.html`))) {
    pathname = `${pathname}.html`;
  }

  const filePath = path.join(__dirname, pathname);

  // Security check: ensure path is within __dirname
  const rel = path.relative(__dirname, filePath);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // Prevent serving secrets
  if (pathname.includes('.dev.vars') || pathname.includes('.env') || pathname.includes('secretes.md') || pathname.includes('secrets.md')) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;text-align:center;">
        <h1 style="color:#174c3b;">404 Not Found</h1>
        <p>The requested file <code>${pathname}</code> was not found on De Palms Hotel local server.</p>
        <a href="/" style="color:#174c3b;font-weight:600;">Back to Homepage</a>
      </body></html>`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      ...corsHeaders,
      'Content-Type': contentType,
      'Content-Length': stats.size,
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  const modelName = env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
  console.log(`\n══════════════════════════════════════════════════════════════`);
  console.log(`  🌴 DE PALMS HOTEL — LOCAL DEVELOPMENT SERVER READY`);
  console.log(`══════════════════════════════════════════════════════════════`);
  console.log(`  ➜ Local:          http://localhost:${PORT}`);
  console.log(`  ➜ Chat API:       http://localhost:${PORT}/api/chat`);
  console.log(`  ➜ Promotions API: http://localhost:${PORT}/api/promotion`);
  console.log(`  ➜ AI Engine:      ${modelName}`);
  console.log(`  ➜ Google Sheets:  ${env.GOOGLE_SHEET_ID ? 'Configured & Active' : 'Not configured'}`);
  console.log(`  ➜ Reception:      ${env.RECEPTION_EMAIL || 'Not configured'}`);
  console.log(`══════════════════════════════════════════════════════════════\n`);
});
