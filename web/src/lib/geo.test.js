import { describe, expect, it } from 'vitest';
import { checkDanger, dangerPolygons, distanceM, nearestCandidates, routeCrossesDanger, toMultiPolygon } from './geo.js';

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
