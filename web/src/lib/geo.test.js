import { describe, expect, it } from 'vitest';
import {
  avoidZones,
  bearingDeg,
  checkDanger,
  crossedZones,
  dangerPolygons,
  detourVias,
  distanceM,
  nearestCandidates,
  offsetPoint,
  routeCrossesDanger,
  toMultiPolygon,
} from './geo.js';

// ~111 m per 0.001 deg latitude
const red = { id: 'r', lng: 121.1, lat: 14.65, radiusM: 300, status: 'red' };
const yellow = { id: 'y', lng: 121.2, lat: 14.65, radiusM: 300, status: 'yellow' };
const sensors = [red, yellow];

describe('distanceM', () => {
  it('is about 111 m per 0.001 deg lat', () => {
    expect(distanceM([121.1, 14.65], [121.1, 14.651])).toBeCloseTo(111, 0);
  });
});

describe('checkDanger', () => {
  it('inside red circle = danger', () => {
    expect(checkDanger([121.1, 14.651], sensors).level).toBe('danger');
  });

  it('just outside red circle = approaching', () => {
    expect(checkDanger([121.1, 14.654], sensors).level).toBe('approaching'); // ~444 m
  });

  it('inside yellow circle = caution', () => {
    expect(checkDanger([121.2, 14.651], sensors).level).toBe('caution');
  });

  it('far away = safe', () => {
    expect(checkDanger([121.15, 14.7], sensors).level).toBe('safe');
  });
});

describe('nearestCandidates', () => {
  const zones = [
    { id: 'inFlood', lng: 121.1, lat: 14.6505 },
    { id: 'far', lng: 121.1, lat: 14.67 },
    { id: 'near', lng: 121.1, lat: 14.656 },
    { id: 'closed', lng: 121.1, lat: 14.655, active: false },
  ];

  it('skips flooded and inactive zones, sorts by distance', () => {
    expect(nearestCandidates([121.1, 14.66], zones, sensors).map((z) => z.id)).toEqual(['near', 'far']);
  });
});

describe('detour helpers', () => {
  it('leaves out the red zone the user is standing in', () => {
    expect(avoidZones([121.1, 14.651], sensors)).toEqual([]);
    expect(avoidZones([121.1, 14.66], sensors)).toEqual([red]);
  });

  it('bearing and offset agree', () => {
    expect(bearingDeg([121.1, 14.65], [121.1, 14.66])).toBeCloseTo(0, 5);
    expect(bearingDeg([121.1, 14.65], [121.11, 14.65])).toBeCloseTo(90, 1);
    const p = offsetPoint([121.1, 14.65], 90, 500);
    expect(distanceM([121.1, 14.65], p)).toBeCloseTo(500, 0);
  });

  it('puts detour points outside the circle, on the asked side', () => {
    // travelling north: right = east, left = west
    const [right] = detourVias(red, 0, 1);
    const [left] = detourVias(red, 0, -1);
    expect(right[0]).toBeGreaterThan(red.lng);
    expect(left[0]).toBeLessThan(red.lng);
    for (const p of [...detourVias(red, 0, 1, 'wide'), right, left]) {
      expect(distanceM(p, [red.lng, red.lat])).toBeGreaterThan(red.radiusM);
    }
  });

  it('wide detour points are linked by straight lines that stay out of the circle', () => {
    const vias = detourVias(red, 0, 1, 'wide');
    expect(vias).toHaveLength(3);
    expect(routeCrossesDanger({ type: 'LineString', coordinates: vias }, dangerPolygons(sensors))).toBe(false);
  });

  it('lists crossed zones nearest first', () => {
    const red2 = { ...red, id: 'r2', lat: 14.66 };
    const line = { type: 'LineString', coordinates: [[121.1, 14.67], [121.1, 14.64]] };
    expect(crossedZones(line, [red, red2]).map((z) => z.id)).toEqual(['r2', 'r']);
  });
});

describe('route checks', () => {
  const polys = dangerPolygons(sensors);

  it('only red sensors make avoid polygons', () => {
    expect(polys).toHaveLength(1);
    expect(toMultiPolygon(polys).type).toBe('MultiPolygon');
  });

  it('detects a route through a red zone', () => {
    const through = { type: 'LineString', coordinates: [[121.09, 14.65], [121.11, 14.65]] };
    const around = { type: 'LineString', coordinates: [[121.09, 14.66], [121.11, 14.66]] };
    expect(routeCrossesDanger(through, polys)).toBe(true);
    expect(routeCrossesDanger(around, polys)).toBe(false);
  });
});
