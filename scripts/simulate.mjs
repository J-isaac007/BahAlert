// Fake ESP8266s. Writes exactly what the firmware will (see docs/data-contract.md).
// Each sensor's water rises and falls on a cycle so the map shows green / yellow / red.
//   node scripts/simulate.mjs           run until Ctrl+C
//   node scripts/simulate.mjs --clear   wipe readings/alerts/stats/live first
import { db } from './admin.mjs';
import { DEVICES } from './sample-data.mjs';

const LIVE_EVERY_MS = 2_000;
const READING_EVERY_MS = 5_000;
const CYCLE_MS = 6 * 60_000; // one full rise + fall
const MIN_CM = 10;
const MAX_CM = 90;

const ids = Object.keys(DEVICES);

if (process.argv.includes('--clear')) {
  const wipe = { readings: null, alerts: null, stats: null };
  for (const id of ids) wipe[`devices/${id}/live`] = null;
  await db.ref().update(wipe);
  console.log('Cleared readings, alerts, stats, live.');
}

const statusOf = (level, { yellowCm, redCm }) => (level >= redCm ? 'red' : level >= yellowCm ? 'yellow' : 'green');
const manilaDate = (ts) => new Date(ts).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }); // yyyy-mm-dd
const round1 = (n) => Math.round(n * 10) / 10;

const state = Object.fromEntries(ids.map((id, i) => [id, { phase: i / ids.length, status: null, lastReading: 0 }]));

function levelAt(ts, phase) {
  const t = (ts / CYCLE_MS + phase) % 1;
  const wave = 0.5 - 0.5 * Math.cos(2 * Math.PI * t); // 0..1..0
  const noise = (Math.random() - 0.5) * 0.8; // ±0.4 cm, like a real HC-SR04
  return MIN_CM + (MAX_CM - MIN_CM) * wave + noise;
}

async function tick() {
  const ts = Date.now();
  await Promise.all(
    ids.map(async (id) => {
      const { config } = DEVICES[id];
      const s = state[id];
      const levelCm = round1(levelAt(ts, s.phase));
      const distanceCm = round1(config.sensorHeightCm - levelCm);
      const tempC = round1(28 + Math.random());
      const status = statusOf(levelCm, config);
      const jobs = [db.ref(`devices/${id}/live`).set({ levelCm, distanceCm, tempC, status, ts })];

      if (ts - s.lastReading >= READING_EVERY_MS) {
        s.lastReading = ts;
        jobs.push(db.ref(`readings/${id}`).push({ levelCm, distanceCm, tempC, ts }));
      }

      if (s.status && s.status !== status) {
        jobs.push(db.ref(`alerts/${id}`).push({ from: s.status, to: status, levelCm, ts, ack: false }));
        console.log(`${new Date(ts).toLocaleTimeString()} ${id}: ${s.status} -> ${status} (${levelCm} cm)`);
      }
      s.status = status;

      jobs.push(
        db.ref(`stats/${id}/${manilaDate(ts)}`).transaction((cur) => ({
          maxLevelCm: Math.max(cur?.maxLevelCm ?? 0, levelCm),
          redMinutes: round1((cur?.redMinutes ?? 0) + (status === 'red' ? LIVE_EVERY_MS / 60_000 : 0)),
        })),
      );

      await Promise.all(jobs);
    }),
  );
}

console.log(`Simulating ${ids.length} sensors. Ctrl+C to stop.`);
setInterval(() => tick().catch((e) => console.error(e.message)), LIVE_EVERY_MS);
