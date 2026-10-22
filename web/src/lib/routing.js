// Route the user to a safe zone without crossing red danger zones.
// Mapbox Matrix picks the nearest zones by travel time, Mapbox Directions gives alternatives,
// and each alternative is checked against the red circles. ORS (avoid_polygons) is the backup.
import { dangerPolygons, nearestCandidates, routeCrossesDanger, toMultiPolygon } from './geo.js';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const ORS_KEY = import.meta.env.VITE_ORS_KEY;
const ORS_PROFILE = { walking: 'foot-walking', driving: 'driving-car' };
const CANDIDATES = 5;
const ZONES_TO_TRY = 3;

const pair = ([lng, lat]) => `${lng},${lat}`;
const zonePoint = (z) => [z.lng, z.lat];

async function getJson(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// Sort candidates by real travel time. Keeps straight-line order if Matrix fails.
async function rankByTravelTime(user, zones, profile) {
  try {
    const coords = [user, ...zones.map(zonePoint)].map(pair).join(';');
    const url =
      `https://api.mapbox.com/directions-matrix/v1/mapbox/${profile}/${coords}` +
      `?sources=0&annotations=duration&access_token=${MAPBOX_TOKEN}`;
    const { durations } = await getJson(url);
    return zones
      .map((z, i) => ({ ...z, durationS: durations[0][i + 1] }))
      .filter((z) => z.durationS != null)
      .sort((a, b) => a.durationS - b.durationS);
  } catch {
    return zones;
  }
}

async function mapboxRoutes(user, zone, profile) {
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/${profile}/${pair(user)};${pair(zonePoint(zone))}` +
    `?alternatives=true&geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_TOKEN}`;
  const { routes = [] } = await getJson(url);
  return routes.map((r) => ({
    geometry: r.geometry,
    distanceM: r.distance,
    durationS: r.duration,
    steps: r.legs.flatMap((l) => l.steps).map((s) => ({ instruction: s.maneuver.instruction, distanceM: s.distance })),
  }));
}

async function orsRoute(user, zone, profile, avoid) {
  const data = await getJson(`https://api.openrouteservice.org/v2/directions/${ORS_PROFILE[profile]}/geojson`, {
    method: 'POST',
    headers: { Authorization: ORS_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      coordinates: [user, zonePoint(zone)],
      options: { avoid_polygons: toMultiPolygon(avoid) },
    }),
  });
  const f = data.features[0];
  return {
    geometry: f.geometry,
    distanceM: f.properties.summary.distance,
    durationS: f.properties.summary.duration,
    steps: f.properties.segments.flatMap((s) => s.steps).map((s) => ({ instruction: s.instruction, distanceM: s.distance })),
  };
}

async function tryOrs(user, zone, profile, danger) {
  if (!ORS_KEY || !danger.length) return null;
  try {
    const route = await orsRoute(user, zone, profile, danger);
    return routeCrossesDanger(route.geometry, danger) ? null : route;
  } catch {
    return null;
  }
}

function assertToken() {
  if (!MAPBOX_TOKEN) throw new Error('VITE_MAPBOX_TOKEN is not set');
}

// Result: { zone, route: { geometry, distanceM, durationS, steps }, safe, provider }
// safe=false means every route found crosses a red zone — UI must warn.
export async function routeToZone({ user, zone, sensors, profile = 'walking' }) {
  assertToken();
  const danger = dangerPolygons(sensors);
  const routes = await mapboxRoutes(user, zone, profile);
  const clean = routes.find((r) => !routeCrossesDanger(r.geometry, danger));
  if (clean) return { zone, route: clean, safe: true, provider: 'mapbox' };

  const ors = await tryOrs(user, zone, profile, danger);
  if (ors) return { zone, route: ors, safe: true, provider: 'ors' };

  if (!routes.length) throw new Error('No route found');
  return { zone, route: routes[0], safe: false, provider: 'mapbox' };
}

export async function findSafeRoute({ user, safeZones, sensors, profile = 'walking' }) {
  assertToken();
  const danger = dangerPolygons(sensors);
  const candidates = nearestCandidates(user, safeZones, sensors, CANDIDATES);
  if (!candidates.length) throw new Error('No reachable safe zone');

  const ranked = await rankByTravelTime(user, candidates, profile);
  let unsafe = null;
  for (const zone of ranked.slice(0, ZONES_TO_TRY)) {
    const routes = await mapboxRoutes(user, zone, profile);
    const clean = routes.find((r) => !routeCrossesDanger(r.geometry, danger));
    if (clean) return { zone, route: clean, safe: true, provider: 'mapbox' };
    if (!unsafe && routes.length) unsafe = { zone, route: routes[0] };
  }

  const ors = await tryOrs(user, ranked[0], profile, danger);
  if (ors) return { zone: ranked[0], route: ors, safe: true, provider: 'ors' };

  if (unsafe) return { ...unsafe, safe: false, provider: 'mapbox' };
  throw new Error('No route found');
}
