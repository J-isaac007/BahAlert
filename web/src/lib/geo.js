// Pure geo logic for danger zones and safe-zone candidates. Coordinates are [lng, lat].
import { circle } from '@turf/circle';
import { distance } from '@turf/distance';
import { booleanIntersects } from '@turf/boolean-intersects';
import { STATUS } from './flood.js';

export const APPROACH_BUFFER_M = 200;

const LEVEL_RANK = { safe: 0, caution: 1, approaching: 2, danger: 3 };

export function distanceM(a, b) {
  return distance(a, b, { units: 'kilometers' }) * 1000;
}

// Real-meter circle polygon. Mapbox `circle` layers size in pixels, so zones must be polygons.
export function zoneCircle(sensor) {
  return circle([sensor.lng, sensor.lat], sensor.radiusM / 1000, {
    steps: 64,
    units: 'kilometers',
    properties: { id: sensor.id, status: sensor.status },
  });
}

export function isInDanger(lngLat, sensors) {
  return sensors.some((s) => s.status === STATUS.RED && distanceM(lngLat, [s.lng, s.lat]) <= s.radiusM);
}

// level: 'danger' (inside red) | 'approaching' (near red) | 'caution' (inside yellow) | 'safe'
export function checkDanger(userLngLat, sensors) {
  let result = { level: 'safe', sensor: null, distanceM: null };
  for (const s of sensors) {
    if (s.status !== STATUS.RED && s.status !== STATUS.YELLOW) continue;
    const d = distanceM(userLngLat, [s.lng, s.lat]);
    let level = 'safe';
    if (s.status === STATUS.RED) {
      if (d <= s.radiusM) level = 'danger';
      else if (d <= s.radiusM + APPROACH_BUFFER_M) level = 'approaching';
    } else if (d <= s.radiusM) {
      level = 'caution';
    }
    if (LEVEL_RANK[level] > LEVEL_RANK[result.level]) result = { level, sensor: s, distanceM: d };
  }
  return result;
}

export function dangerPolygons(sensors) {
  return sensors.filter((s) => s.status === STATUS.RED).map(zoneCircle);
}

// Closest usable safe zones by straight line. Skips inactive zones and zones inside a red circle.
export function nearestCandidates(user, safeZones, sensors, n = 5) {
  return safeZones
    .filter((z) => z.active !== false && !isInDanger([z.lng, z.lat], sensors))
    .map((z) => ({ ...z, straightM: distanceM(user, [z.lng, z.lat]) }))
    .sort((a, b) => a.straightM - b.straightM)
    .slice(0, n);
}

export function routeCrossesDanger(lineGeometry, polygons) {
  return polygons.some((p) => booleanIntersects(lineGeometry, p));
}

// ORS wants all avoid areas as one MultiPolygon geometry
export function toMultiPolygon(polygons) {
  return { type: 'MultiPolygon', coordinates: polygons.map((p) => p.geometry.coordinates) };
}
