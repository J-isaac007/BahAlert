// Route the user to a safe zone without entering a red danger zone. Never returns a route through one.
//
// 1. Mapbox Matrix ranks the nearest safe zones by real travel time.
// 2. Mapbox Directions alternatives to each: take the first that stays out of every red circle.
// 3. OpenRouteService with avoid_polygons, if a key is set.
// 4. Detours: add silent via points beside each red circle the route crosses and ask again,
//    one circle at a time, keeping whichever variant crosses the fewest circles; swing wider when
//    the roads still lead back through the same circle.
// 5. Still nothing: return route: null so the UI says there is no flood-free route.
//
// A red zone the user is already standing in is allowed: the route has to cross it to get them out.
import { alongM, avoidZones, bearingDeg, crossedZones, detourVias, isInDanger, nearestCandidates, routeCrossesDanger, toMultiPolygon, zoneCircle } from './geo.js';

const ORS_PROFILE = { walking: 'foot-walking', driving: 'driving-car' };
const CANDIDATES = 5;
const ZONES_TO_TRY = 3; // direct routes and ORS
const DETOUR_ZONES = 2; // detour search is the expensive step: only the nearest zones
const DETOUR_ROUNDS = 5; // detour requests are 4 per round
const DETOUR_SCALES = [1, 2, 3.5]; // how far out each retry around the same circle swings
const VARIANTS = [
  [1, 'tight'],
  [-1, 'tight'],
  [1, 'wide'],
  [-1, 'wide'],
];

const mapboxToken = () => import.meta.env.VITE_MAPBOX_TOKEN;
const orsKey = () => import.meta.env.VITE_ORS_KEY;
const pair = ([lng, lat]) => `${lng},${lat}`;
const zonePoint = (z) => [z.lng, z.lat];
const fastest = (routes) => routes.reduce((a, b) => (b.durationS < a.durationS ? b : a));

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
      `?sources=0&annotations=duration&access_token=${mapboxToken()}`;
    const { durations } = await getJson(url);
    return zones
      .map((z, i) => ({ ...z, durationS: durations[0][i + 1] }))
      .filter((z) => z.durationS != null)
      .sort((a, b) => a.durationS - b.durationS);
  } catch {
    return zones;
  }
}

// coords: [start, ...via, end]. Via points are silent (no "arrived" step), via the `waypoints` param.
async function directions(coords, profile, { alternatives = false } = {}) {
  const last = coords.length - 1;
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coords.map(pair).join(';')}` +
    `?alternatives=${alternatives}&geometries=geojson&overview=full&steps=true` +
    (last > 1 ? `&waypoints=0;${last}` : '') +
    `&access_token=${mapboxToken()}`;
  const { routes = [] } = await getJson(url);
  return routes.map((r) => ({
    geometry: r.geometry,
    distanceM: r.distance,
    durationS: r.duration,
    steps: r.legs.flatMap((l) => l.steps).map((s) => ({ instruction: s.maneuver.instruction, distanceM: s.distance })),
  }));
}

async function orsRoute(user, dest, profile, avoid) {
  const data = await getJson(`https://api.openrouteservice.org/v2/directions/${ORS_PROFILE[profile]}/geojson`, {
    method: 'POST',
    headers: { Authorization: orsKey(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      coordinates: [user, dest],
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

async function tryOrs(user, dest, profile, polys) {
  if (!orsKey() || !polys.length) return null;
  try {
    const route = await orsRoute(user, dest, profile, polys);
    return routeCrossesDanger(route.geometry, polys) ? null : route;
  } catch {
    return null;
  }
}

// Steer `base` around the red circles it crosses. Each round adds detour points beside the first circle
// still crossed (both sides, tight and wide) and keeps the variant crossing the fewest circles.
// A circle that is still crossed after its detour gets a wider one (roads may only cross a river at a
// bridge inside the zone, so the next crossing can be far away).
async function detourRoute(user, dest, profile, zones, polys, base) {
  const travel = bearingDeg(user, dest);
  let best = { groups: [], route: base };

  for (let round = 0; round < DETOUR_ROUNDS; round++) {
    const zone = crossedZones(best.route.geometry, zones)[0];
    const attempts = best.groups.find((g) => g.zone.id === zone.id)?.attempts ?? 0;
    if (attempts >= DETOUR_SCALES.length) return null; // went as wide as we dare around this one
    const scale = DETOUR_SCALES[attempts];
    const others = best.groups.filter((g) => g.zone.id !== zone.id);

    const at = alongM(user, travel, [zone.lng, zone.lat]);
    const tries = await Promise.all(
      VARIANTS.map(async ([side, shape]) => {
        const group = { zone, at, attempts: attempts + 1, vias: detourVias(zone, travel, side, shape, scale) };
        const groups = [...others, group].sort((a, b) => a.at - b.at);
        try {
          const [route] = await directions([user, ...groups.flatMap((g) => g.vias), dest], profile);
          return route ? { groups, route, crossed: crossedZones(route.geometry, zones).length } : null;
        } catch {
          return null;
        }
      }),
    );

    const found = tries.filter(Boolean);
    const clean = found.filter((t) => !routeCrossesDanger(t.route.geometry, polys));
    if (clean.length) return fastest(clean.map((t) => t.route));
    if (!found.length) return null;
    best = found.reduce((a, b) => (b.crossed < a.crossed || (b.crossed === a.crossed && b.route.durationS < a.route.durationS) ? b : a));
  }
  return null;
}

function assertToken() {
  if (!mapboxToken()) throw new Error('VITE_MAPBOX_TOKEN is not set');
}

// Result: { zone, route: { geometry, distanceM, durationS, steps } | null, safe, provider, reason? }
// safe=false always comes with route=null. reason: 'blocked' (every way crosses a red zone)
// or 'zoneFlooded' (the chosen safe zone is inside one).
export async function routeToZone({ user, zone, sensors, profile = 'walking' }) {
  assertToken();
  if (isInDanger(zonePoint(zone), sensors)) return { zone, route: null, safe: false, reason: 'zoneFlooded' };

  const zones = avoidZones(user, sensors);
  const polys = zones.map(zoneCircle);
  const dest = zonePoint(zone);
  const routes = await directions([user, dest], profile, { alternatives: true });
  if (!routes.length) throw new Error('No route found');

  const clean = routes.find((r) => !routeCrossesDanger(r.geometry, polys));
  if (clean) return { zone, route: clean, safe: true, provider: 'mapbox' };

  const ors = await tryOrs(user, dest, profile, polys);
  if (ors) return { zone, route: ors, safe: true, provider: 'ors' };

  const detour = await detourRoute(user, dest, profile, zones, polys, routes[0]);
  if (detour) return { zone, route: detour, safe: true, provider: 'mapbox' };

  return { zone, route: null, safe: false, reason: 'blocked' };
}

export async function findSafeRoute({ user, safeZones, sensors, profile = 'walking' }) {
  assertToken();
  const zones = avoidZones(user, sensors);
  const polys = zones.map(zoneCircle);
  const candidates = nearestCandidates(user, safeZones, sensors, CANDIDATES);
  if (!candidates.length) throw new Error('No reachable safe zone');

  const top = (await rankByTravelTime(user, candidates, profile)).slice(0, ZONES_TO_TRY);
  if (!top.length) throw new Error('No reachable safe zone');
  const direct = await Promise.all(
    top.map((z) => directions([user, zonePoint(z)], profile, { alternatives: true }).catch((error) => ({ error }))),
  );
  if (direct.every((d) => d.error)) throw direct[0].error;
  const routesTo = (i) => (direct[i].error ? [] : direct[i]);

  // Nearest zone with a flood-free road straight away
  for (let i = 0; i < top.length; i++) {
    const clean = routesTo(i).find((r) => !routeCrossesDanger(r.geometry, polys));
    if (clean) return { zone: top[i], route: clean, safe: true, provider: 'mapbox' };
  }

  for (const zone of top) {
    const ors = await tryOrs(user, zonePoint(zone), profile, polys);
    if (ors) return { zone, route: ors, safe: true, provider: 'ors' };
  }

  // Detour to the nearest zones at once, then take the fastest that worked
  const detours = await Promise.all(
    top.slice(0, DETOUR_ZONES).map(async (zone, i) => {
      const base = routesTo(i)[0];
      const route = base && (await detourRoute(user, zonePoint(zone), profile, zones, polys, base));
      return route ? { zone, route } : null;
    }),
  );
  const ok = detours.filter(Boolean);
  if (ok.length) {
    const best = ok.reduce((a, b) => (b.route.durationS < a.route.durationS ? b : a));
    return { ...best, safe: true, provider: 'mapbox' };
  }

  return { zone: top[0], route: null, safe: false, reason: 'blocked' };
}
