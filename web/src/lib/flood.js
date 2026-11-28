// Pure flood logic. No React, no Firebase — keep it testable.

export const STATUS = { GREEN: 'green', YELLOW: 'yellow', RED: 'red', OFFLINE: 'offline' };

export const OFFLINE_AFTER_MS = 60_000;
export const RATE_WINDOW_MS = 3 * 60_000;
export const STABLE_RATE_CM_MIN = 0.05;
export const DEFAULT_RADIUS_M = 300;

export function getStatus(levelCm, { yellowCm, redCm }) {
  if (levelCm >= redCm) return STATUS.RED;
  if (levelCm >= yellowCm) return STATUS.YELLOW;
  return STATUS.GREEN;
}

const round1 = (v) => Math.round(v * 10) / 10;

// The config update for Admin > Sensors > Calibrate: the sensor's current distance becomes its height.
// Most sensors pick their colour from the water level, so their lines stay put. A board that picks its
// colour from distance (the prototype: config.boardDistances = { yellow, red, danger } in cm from the
// sensor) gets its lines moved with the height, so the chart and gauge keep matching the board's colours.
export function calibrationUpdate(config, heightCm) {
  const update = { sensorHeightCm: round1(heightCm) };
  const d = config?.boardDistances;
  if (d) {
    for (const [key, field] of [['yellow', 'yellowCm'], ['red', 'redCm'], ['danger', 'dangerCm']]) {
      if (Number.isFinite(d[key])) update[field] = round1(heightCm - d[key]);
    }
  }
  return update;
}

// `ts` is stamped by the server, so the app passes server time as `now` (see useNow).
export function isOnline(ts, now = Date.now()) {
  return Number.isFinite(ts) && now - ts <= OFFLINE_AFTER_MS;
}

// Normalize one /devices/{id} node into the shape the UI uses.
export function toSensor(id, device, now = Date.now()) {
  const meta = device?.meta ?? {};
  const live = device?.live ?? null;
  const online = isOnline(live?.ts, now);
  return {
    id,
    name: meta.name ?? id,
    barangay: meta.barangay ?? '',
    lng: meta.lng,
    lat: meta.lat,
    radiusM: meta.dangerRadiusM ?? DEFAULT_RADIUS_M,
    notify: meta.notify === true, // sends SMS/Telegram alerts to residents (Admin > Sensors)
    config: device?.config ?? {},
    live,
    online,
    status: online ? live.status : STATUS.OFFLINE,
  };
}

// Rise rate in cm/min: least-squares slope over the last `windowMs` of readings.
// readings: [{ levelCm, ts }] sorted by ts ascending. Returns null when not enough data.
export function computeRate(readings, { windowMs = RATE_WINDOW_MS, minPoints = 5 } = {}) {
  if (!readings?.length) return null;
  const latest = readings[readings.length - 1].ts;
  const pts = readings.filter((r) => r.ts >= latest - windowMs && Number.isFinite(r.levelCm));
  if (pts.length < minPoints) return null;

  const xs = pts.map((r) => (r.ts - latest) / 60_000);
  const ys = pts.map((r) => r.levelCm);
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den === 0 ? null : num / den;
}

// kind: 'overflow' | 'rising' | 'stable' | 'unknown'
export function minutesToOverflow(levelCm, rate, dangerCm) {
  if (!Number.isFinite(levelCm) || !Number.isFinite(dangerCm)) return { kind: 'unknown', minutes: null };
  if (levelCm >= dangerCm) return { kind: 'overflow', minutes: 0 };
  if (rate == null) return { kind: 'unknown', minutes: null };
  if (rate <= STABLE_RATE_CM_MIN) return { kind: 'stable', minutes: null };
  return { kind: 'rising', minutes: (dangerCm - levelCm) / rate };
}

export function formatEta({ kind, minutes }) {
  if (kind === 'overflow') return 'OVERFLOW NOW';
  if (kind === 'stable') return 'Stable / falling';
  if (kind === 'unknown') return 'Not enough data';
  if (minutes < 1) return '< 1 min';
  // Round once up front so 119.7 reads "2 h", not "1 h 60 min"
  const total = Math.round(minutes);
  if (total < 60) return `${total} min`;
  const rest = total % 60;
  return `${Math.floor(total / 60)} h${rest ? ` ${rest} min` : ''}`;
}
