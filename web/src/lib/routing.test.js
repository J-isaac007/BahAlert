import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { distanceM, routeCrossesDanger, zoneCircle } from './geo.js';
import { findSafeRoute, routeToZone } from './routing.js';

// Fake Mapbox: every road is a straight line through the requested coordinates, so a route only
// avoids a red circle when the via points steer it around. Matrix requests fail (straight-line order is kept).
function fakeMapbox({ down = false } = {}) {
  const calls = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url) => {
      calls.push(url);
      if (down || url.includes('directions-matrix')) return { ok: false, status: 503, statusText: 'Unavailable' };
      const coords = decodeURIComponent(new URL(url).pathname.split('/').pop())
        .split(';')
        .map((p) => p.split(',').map(Number));
      let distance = 0;
      for (let i = 1; i < coords.length; i++) distance += distanceM(coords[i - 1], coords[i]);
      const route = {
        geometry: { type: 'LineString', coordinates: coords },
        distance,
        duration: distance / 1.4,
        legs: [{ steps: [{ maneuver: { instruction: 'Walk' }, distance }] }],
      };
      return { ok: true, json: async () => ({ routes: [route] }) };
    }),
  );
  return calls;
}

// ~111 m per 0.001 deg latitude. User south of a red zone, safe zone north of it: the straight road crosses it.
const user = [121.0, 14.0];
const red = { id: 'r1', lng: 121.0, lat: 14.01, radiusM: 300, status: 'red' };
const north = { id: 'north', name: 'North school', lng: 121.0, lat: 14.02 };

beforeEach(() => vi.stubEnv('VITE_MAPBOX_TOKEN', 'pk.test'));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('findSafeRoute', () => {
  it('takes the straight road when no red zone is in the way', async () => {
    fakeMapbox();
    const res = await findSafeRoute({ user, safeZones: [north], sensors: [{ ...red, status: 'green' }] });
    expect(res.safe).toBe(true);
    expect(res.route.geometry.coordinates).toHaveLength(2);
  });

  it('detours around a red zone instead of crossing it', async () => {
    const calls = fakeMapbox();
    const res = await findSafeRoute({ user, safeZones: [north], sensors: [red] });
    expect(res.safe).toBe(true);
    expect(res.zone.id).toBe('north');
    expect(routeCrossesDanger(res.route.geometry, [zoneCircle(red)])).toBe(false);
    expect(res.route.geometry.coordinates.length).toBeGreaterThan(2);
    // via points are silent: no extra "arrived" steps
    expect(calls.some((u) => u.includes('waypoints=0;'))).toBe(true);
  });

  it('goes around two red zones in a row', async () => {
    fakeMapbox();
    const red2 = { id: 'r2', lng: 121.0, lat: 14.03, radiusM: 300, status: 'red' };
    const far = { id: 'far', name: 'Far church', lng: 121.0, lat: 14.04 };
    const res = await findSafeRoute({ user, safeZones: [far], sensors: [red, red2] });
    expect(res.safe).toBe(true);
    expect(routeCrossesDanger(res.route.geometry, [zoneCircle(red), zoneCircle(red2)])).toBe(false);
  });

  it('prefers a zone with a clear road over detouring', async () => {
    fakeMapbox();
    const south = { id: 'south', name: 'South court', lng: 121.0, lat: 13.985 };
    const res = await findSafeRoute({ user, safeZones: [north, south], sensors: [red] });
    expect(res.zone.id).toBe('south');
    expect(res.route.geometry.coordinates).toHaveLength(2);
  });

  it('lets a user inside a red zone walk out of it', async () => {
    fakeMapbox();
    const inside = [121.0, 14.0105];
    const res = await findSafeRoute({ user: inside, safeZones: [north], sensors: [red] });
    expect(res.safe).toBe(true);
    expect(res.route).not.toBeNull();
  });

  it('returns no route, not a flooded one, when the safe zone is walled in by red zones', async () => {
    fakeMapbox();
    // Ring of red zones around the safe zone: no way in
    const ring = Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * 2 * Math.PI;
      return { id: `ring${i}`, lng: 121.0 + 0.004 * Math.sin(a), lat: 14.02 + 0.004 * Math.cos(a), radiusM: 300, status: 'red' };
    });
    const res = await findSafeRoute({ user, safeZones: [north], sensors: ring });
    expect(res).toMatchObject({ safe: false, route: null, reason: 'blocked' });
  });

  it('throws when the routing service is down', async () => {
    fakeMapbox({ down: true });
    await expect(findSafeRoute({ user, safeZones: [north], sensors: [red] })).rejects.toThrow('503');
  });
});

describe('routeToZone', () => {
  it('refuses a safe zone that is inside a red zone', async () => {
    const calls = fakeMapbox();
    const flooded = { id: 'flooded', name: 'Flooded hall', lng: 121.0, lat: 14.0101 };
    const res = await routeToZone({ user, zone: flooded, sensors: [red] });
    expect(res).toMatchObject({ safe: false, route: null, reason: 'zoneFlooded' });
    expect(calls).toHaveLength(0);
  });

  it('detours to a chosen zone', async () => {
    fakeMapbox();
    const res = await routeToZone({ user, zone: north, sensors: [red] });
    expect(res.safe).toBe(true);
    expect(routeCrossesDanger(res.route.geometry, [zoneCircle(red)])).toBe(false);
  });
});
