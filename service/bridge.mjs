// Local HTTP server for the team's prototype ESP32 sketches (flood_sensor.ino / alarm_system.ino).
// Same endpoints and JSON as the original laptop server, so the boards need no changes:
//   POST /api/level   sensor sends { distance_cm, raw_level, level }   (level: NORMAL | LOW | MEDIUM | HIGH)
//   GET  /api/alarm   alarm reads  { alarm, level, distance_cm }
//   GET  /status      current state, for a browser
// Each reading is also written to Firebase as devices/{id}/live (+ readings, + alerts when the level
// changes), so the website shows the sensor live and the alert service sends Telegram alerts.
import http from 'node:http';
import { ServerValue } from 'firebase-admin/database';

// The board's levels -> the website's colours
const STATUS = { NORMAL: 'green', LOW: 'yellow', MEDIUM: 'red', HIGH: 'red', CRITICAL: 'red' };
export const statusFor = (level) => STATUS[String(level ?? '').toUpperCase()] ?? null;
export const isAlarm = (level) => ['HIGH', 'CRITICAL'].includes(String(level ?? '').toUpperCase());

const READING_EVERY_MS = 5000;
const STALE_AFTER_MS = 60_000; // same rule as the website's "offline"
const round1 = (v) => Math.round(v * 10) / 10;

export function startBridge({ db, port = 3000, deviceId = 'bah-001' }) {
  const state = {
    deviceId,
    distanceCm: null,
    rawLevel: 'NORMAL',
    level: 'NORMAL',
    alarmActive: false,
    updatedAt: null,
    levelCm: null,
    status: null,
    firebase: 'waiting for the first reading',
  };
  let config = { sensorHeightCm: 50 };
  let lastStatus = null;
  let lastReadingAt = 0;

  const configRef = db.ref(`devices/${deviceId}/config`);
  configRef.on('value', (snap) => {
    config = { ...config, ...(snap.val() ?? {}) };
  });
  // Start from what the website last showed, so the first reading after a restart isn't a false "change"
  db.ref(`devices/${deviceId}/live/status`)
    .get()
    .then((snap) => {
      lastStatus ??= snap.val();
    })
    .catch(() => {});

  async function toFirebase(distanceCm, level) {
    const status = statusFor(level);
    if (!status || !Number.isFinite(distanceCm)) return;
    const levelCm = round1(config.sensorHeightCm - distanceCm);
    state.levelCm = levelCm;
    state.status = status;
    const ts = ServerValue.TIMESTAMP;

    await db.ref(`devices/${deviceId}/live`).set({ levelCm, distanceCm: round1(distanceCm), status, ts });
    const now = Date.now();
    if (now - lastReadingAt >= READING_EVERY_MS) {
      lastReadingAt = now;
      await db.ref(`readings/${deviceId}`).push({ levelCm, distanceCm: round1(distanceCm), ts });
    }
    if (lastStatus && status !== lastStatus) {
      await db.ref(`alerts/${deviceId}`).push({ from: lastStatus, to: status, levelCm, ack: false, ts });
      console.log(`[ALERT] ${deviceId} ${lastStatus} -> ${status} (${level}, ${levelCm} cm)`);
    }
    lastStatus = status;
    state.firebase = 'ok';
  }

  const send = (res, code, body) => {
    res.writeHead(code, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
  };

  const server = http.createServer((req, res) => {
    const url = req.url.split('?')[0];

    if (req.method === 'POST' && url === '/api/level') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
        if (body.length > 10_000) req.destroy();
      });
      req.on('end', () => {
        let data;
        try {
          data = JSON.parse(body);
        } catch {
          return send(res, 400, { error: 'Invalid JSON' });
        }
        const distance = Number(data.distance_cm);
        if (Number.isFinite(distance)) state.distanceCm = distance;
        state.rawLevel = String(data.raw_level ?? state.rawLevel ?? 'NORMAL').toUpperCase();
        state.level = String(data.level ?? 'NORMAL').toUpperCase();
        state.alarmActive = isAlarm(state.level);
        state.updatedAt = new Date().toISOString();
        console.log(`[LEVEL] ${state.distanceCm} cm | raw ${state.rawLevel} | ${state.level}${state.alarmActive ? ' | ALARM' : ''}`);
        send(res, 200, { ok: true, state }); // answer the board first; Firebase can take a moment

        toFirebase(state.distanceCm, state.level).catch((err) => {
          state.firebase = `error: ${err.message}`;
          console.error('[FIREBASE]', err.message);
        });
      });
      return;
    }

    if (req.method === 'GET' && url === '/api/alarm') {
      const stale = !state.updatedAt || Date.now() - Date.parse(state.updatedAt) > STALE_AFTER_MS;
      // "stale" is extra: the original alarm sketch ignores unknown fields
      return send(res, 200, { alarm: state.alarmActive, level: state.level, distance_cm: state.distanceCm, stale });
    }

    if (req.method === 'GET' && (url === '/status' || url === '/')) return send(res, 200, state);

    send(res, 404, { error: 'Not found' });
  });

  server.listen(port, '0.0.0.0');
  return {
    server,
    state,
    stop() {
      configRef.off();
      server.close();
    },
  };
}
