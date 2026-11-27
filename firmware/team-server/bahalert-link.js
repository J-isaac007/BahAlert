// Sends the prototype's readings to the BahAlert website (Firebase Realtime Database).
// Drop this file next to server.js together with bahalert.config.json, then call
//   sendReading({ distanceCm, level })
// whenever the sensor ESP32 posts to /api/level. It never throws and never slows the reply to the board.
// No npm install needed (Node 18+ has fetch).
//
// What it writes (see docs/data-contract.md in the BahAlert repo):
//   devices/{id}/live   every reading         { levelCm, distanceCm, status, ts }
//   readings/{id}       at most every 5 s     { levelCm, distanceCm, ts }
//   alerts/{id}         when the colour changes { from, to, levelCm, ack, ts }
// Levels -> website colours (same as service/bridge.mjs): NORMAL green, LOW yellow, MEDIUM/HIGH/CRITICAL red.

const fs = require('fs');
const path = require('path');

// A missing or broken config switches the website link off; the flood server itself keeps working
let cfg = null;
try {
  cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'bahalert.config.json'), 'utf8'));
  if (!cfg.apiKey || !cfg.databaseUrl || !cfg.email || !cfg.password) throw new Error('missing apiKey, databaseUrl, email or password');
} catch (err) {
  console.error(`[WEBSITE] link off: bahalert.config.json ${err.code === 'ENOENT' ? 'not found next to bahalert-link.js' : `is not valid (${err.message})`}`);
  cfg = null;
}
if (!cfg) {
  module.exports = { sendReading: () => Promise.resolve() };
  return;
}
const DEVICE = cfg.deviceId || 'bah-001';
const DB = String(cfg.databaseUrl).replace(/\/$/, '');
const AUTH_URL = cfg.authUrl || 'https://identitytoolkit.googleapis.com'; // emulator: http://127.0.0.1:9099/identitytoolkit.googleapis.com

const STATUS = { NORMAL: 'green', LOW: 'yellow', MEDIUM: 'red', HIGH: 'red', CRITICAL: 'red' };
const READING_EVERY_MS = 5000;
const CONFIG_EVERY_MS = 60_000;
const TOKEN_LIFETIME_MS = 50 * 60 * 1000; // Firebase tokens last 60 min; renew early

let token = null;
let tokenAt = 0;
let sensorHeightCm = 50;
let configAt = 0;
let lastStatus; // undefined until read from the website, so a restart isn't a false "change"
let lastReadingAt = 0;
let busy = Promise.resolve();
let lastError = '';

const round1 = (v) => Math.round(v * 10) / 10;
const SERVER_TIME = { '.sv': 'timestamp' };

// Builds <db>/<path>.json?auth=..., keeping ?ns=... for the local emulator
function dbUrl(p, auth) {
  const [base, query] = DB.split('?');
  const params = new URLSearchParams(query || '');
  if (auth) params.set('auth', auth);
  const qs = params.toString();
  return `${base}/${p}.json${qs ? `?${qs}` : ''}`;
}

async function signIn() {
  const res = await fetch(`${AUTH_URL}/v1/accounts:signInWithPassword?key=${cfg.apiKey}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: cfg.email, password: cfg.password, returnSecureToken: true }),
    signal: AbortSignal.timeout(10_000),
  });
  const json = await res.json().catch(() => ({}));
  if (!json.idToken) throw new Error(`sign-in failed: ${json.error?.message ?? res.status}`);
  token = json.idToken;
  tokenAt = Date.now();
}

async function request(method, p, body, retried = false) {
  if (!token || Date.now() - tokenAt > TOKEN_LIFETIME_MS) await signIn();
  const res = await fetch(dbUrl(p, token), {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 401 && !retried) {
    token = null; // expired or revoked: sign in again once
    return request(method, p, body, true);
  }
  if (!res.ok) throw new Error(`${method} ${p}: ${res.status} ${(await res.text()).slice(0, 120)}`);
  return res.json();
}

async function refreshConfig() {
  if (Date.now() - configAt < CONFIG_EVERY_MS) return;
  configAt = Date.now();
  const res = await fetch(dbUrl(`devices/${DEVICE}/config`), { signal: AbortSignal.timeout(10_000) });
  const config = res.ok ? await res.json() : null;
  if (config && Number.isFinite(config.sensorHeightCm)) sensorHeightCm = config.sensorHeightCm;
}

async function forward(distanceCm, level) {
  const status = STATUS[String(level ?? '').toUpperCase()];
  if (!status || !Number.isFinite(distanceCm)) return;
  await refreshConfig();
  if (lastStatus === undefined) {
    const res = await fetch(dbUrl(`devices/${DEVICE}/live/status`), { signal: AbortSignal.timeout(10_000) });
    lastStatus = (res.ok && (await res.json())) || null;
  }

  const levelCm = round1(sensorHeightCm - distanceCm);
  const distance = round1(distanceCm);
  await request('PUT', `devices/${DEVICE}/live`, { levelCm, distanceCm: distance, status, ts: SERVER_TIME });

  const now = Date.now();
  if (now - lastReadingAt >= READING_EVERY_MS) {
    lastReadingAt = now;
    await request('POST', `readings/${DEVICE}`, { levelCm, distanceCm: distance, ts: SERVER_TIME });
  }
  if (lastStatus && status !== lastStatus) {
    await request('POST', `alerts/${DEVICE}`, { from: lastStatus, to: status, levelCm, ack: false, ts: SERVER_TIME });
    console.log(`[WEBSITE] ${DEVICE} ${lastStatus} -> ${status} (${level}, ${levelCm} cm)`);
  }
  lastStatus = status;
  if (lastError) console.log('[WEBSITE] connected again');
  lastError = '';
}

// Queue readings one after another so alerts stay in order; errors are logged once, not thrown
function sendReading({ distanceCm, level }) {
  busy = busy
    .then(() => forward(Number(distanceCm), level))
    .catch((err) => {
      if (err.message !== lastError) console.error(`[WEBSITE] not sent: ${err.message}`);
      lastError = err.message;
    });
  return busy;
}

module.exports = { sendReading };
