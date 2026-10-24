import { describe, expect, it } from 'vitest';
import { STATUS, computeRate, formatEta, getStatus, isOnline, minutesToOverflow, toSensor } from './flood.js';

const cfg = { yellowCm: 40, redCm: 60, dangerCm: 80 };

// one reading every 20 s, level = start + rate * minutes
const series = (start, ratePerMin, n = 10) =>
  Array.from({ length: n }, (_, i) => ({ ts: 1_000_000 + i * 20_000, levelCm: start + (ratePerMin * i * 20) / 60 }));

describe('getStatus', () => {
  it('maps level to color', () => {
    expect(getStatus(10, cfg)).toBe(STATUS.GREEN);
    expect(getStatus(40, cfg)).toBe(STATUS.YELLOW);
    expect(getStatus(75, cfg)).toBe(STATUS.RED);
  });
});

describe('isOnline / toSensor', () => {
  it('goes offline after 60 s without data', () => {
    expect(isOnline(0, 59_000)).toBe(true);
    expect(isOnline(0, 61_000)).toBe(false);
    expect(isOnline(undefined)).toBe(false);
  });

  it('reports offline status for stale live data', () => {
    const s = toSensor('s1', { meta: { lat: 1, lng: 2 }, live: { status: 'red', ts: 0 } }, 120_000);
    expect(s.status).toBe(STATUS.OFFLINE);
    expect(s.radiusM).toBe(300);
  });
});

describe('computeRate', () => {
  it('finds a steady rise', () => {
    expect(computeRate(series(10, 2))).toBeCloseTo(2, 5);
  });

  it('finds a fall', () => {
    expect(computeRate(series(50, -1.5))).toBeCloseTo(-1.5, 5);
  });

  it('returns null with too few points', () => {
    expect(computeRate(series(10, 2, 3))).toBeNull();
    expect(computeRate([])).toBeNull();
  });
});

describe('minutesToOverflow', () => {
  it('estimates time to the danger line', () => {
    expect(minutesToOverflow(60, 2, 80)).toEqual({ kind: 'rising', minutes: 10 });
  });

  it('flags already over danger', () => {
    expect(minutesToOverflow(85, 1, 80).kind).toBe('overflow');
  });

  it('treats tiny or negative rates as stable', () => {
    expect(minutesToOverflow(50, 0.01, 80).kind).toBe('stable');
    expect(minutesToOverflow(50, -2, 80).kind).toBe('stable');
  });

  it('formats', () => {
    expect(formatEta({ kind: 'rising', minutes: 75 })).toBe('1 h 15 min');
    expect(formatEta({ kind: 'overflow', minutes: 0 })).toBe('OVERFLOW NOW');
  });

  it('carries rounding into the hour', () => {
    expect(formatEta({ kind: 'rising', minutes: 59.6 })).toBe('1 h');
    expect(formatEta({ kind: 'rising', minutes: 119.7 })).toBe('2 h');
    expect(formatEta({ kind: 'rising', minutes: 125 })).toBe('2 h 5 min');
  });
});
