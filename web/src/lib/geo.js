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

// Red zones a route must stay out of. A zone the user is already standing in is left out:
// the route has to cross it to get them out.
export function avoidZones(user, sensors) {
  return sensors.filter((s) => s.status === STATUS.RED && !(user && distanceM(user, [s.lng, s.lat]) <= s.radiusM));
}

// Red zones a route line passes through, nearest to the start of the route first.
export function crossedZones(lineGeometry, zones) {
  const start = lineGeometry.coordinates[0];
  return zones
    .filter((z) => booleanIntersects(lineGeometry, zoneCircle(z)))
    .sort((a, b) => distanceM(start, [a.lng, a.lat]) - distanceM(start, [b.lng, b.lat]));
}

const EARTH_M = 6_371_008.8;
const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

// Compass bearing from a to b, degrees clockwise from north.
export function bearingDeg([lng1, lat1], [lng2, lat2]) {
  const dl = rad(lng2 - lng1);
  const y = Math.sin(dl) * Math.cos(rad(lat2));
  const x = Math.cos(rad(lat1)) * Math.sin(rad(lat2)) - Math.sin(rad(lat1)) * Math.cos(rad(lat2)) * Math.cos(dl);
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

// The point `meters` away from `from` along `bearing`.
export function offsetPoint([lng, lat], bearing, meters) {
  const d = meters / EARTH_M;
  const b = rad(bearing);
  const la1 = rad(lat);
  const la2 = Math.asin(Math.sin(la1) * Math.cos(d) + Math.cos(la1) * Math.sin(d) * Math.cos(b));
  const lo2 = rad(lng) + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(la1), Math.cos(d) - Math.sin(la1) * Math.sin(la2));
  return [deg(lo2), deg(la2)];
}

// Distance from the edge of the red circle to the detour points.
export const detourRadiusM = (zone) => zone.radiusM * 1.3 + 60;

// Points that steer a route around one red circle. travelBearing = the overall direction of the trip.
// side: 1 = pass on the right, -1 = on the left. 'tight' = one point beside the circle;
// 'wide' = three points wrapping it (behind, beside, ahead), so the road between them can't cut the corner.
// scale > 1 swings further out, for when the nearest roads around still funnel back through the zone (a bridge).
export function detourVias(zone, travelBearing, side, shape = 'tight', scale = 1) {
  const angles = shape === 'tight' ? [90] : [135, 90, 45];
  return angles.map((a) => offsetPoint([zone.lng, zone.lat], travelBearing + side * a, detourRadiusM(zone) * scale));
}

// How far along the trip from `from` (in `bearing`) a point sits, in meters. Orders detours by the zone they go around.
export function alongM(from, bearing, point) {
  return distanceM(from, point) * Math.cos(rad(bearingDeg(from, point) - bearing));
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
