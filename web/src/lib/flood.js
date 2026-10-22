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
  if (minutes < 60) return `${Math.round(minutes)} min`;
  return `${Math.floor(minutes / 60)} h ${Math.round(minutes % 60)} min`;
}
