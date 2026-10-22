// Build GeoJSON FeatureCollections for the Mapbox sources.
import { bbox } from '@turf/bbox';
import { featureCollection, point } from '@turf/helpers';
import { STATUS } from './flood.js';
import { zoneCircle } from './geo.js';

const DAY_MS = 86_400_000;

export function sensorsToFC(sensors) {
  return featureCollection(
    sensors.map((s) =>
      point([s.lng, s.lat], {
        id: s.id,
        name: s.name,
        status: s.status,
        label: s.online ? `${Math.round(s.live.levelCm)} cm` : 'offline',
      }),
    ),
  );
}

export function dangerZonesToFC(sensors) {
  return featureCollection(
    sensors.filter((s) => s.status === STATUS.RED || s.status === STATUS.YELLOW).map(zoneCircle),
  );
}

export function safeZonesToFC(safeZones) {
  return featureCollection(
    safeZones.map((z) => point([z.lng, z.lat], { id: z.id, name: z.name, active: z.active !== false })),
  );
}

// Heat weight per sensor = total red minutes over the last `days` days (from /stats/{id}/{yyyy-mm-dd})
export function heatToFC(sensors, stats, days = 7, now = Date.now()) {
  const since = new Date(now - days * DAY_MS).toISOString().slice(0, 10);
  return featureCollection(
    sensors.map((s) => {
      const perDay = stats?.[s.id] ?? {};
      const weight = Object.entries(perDay)
        .filter(([date]) => date >= since)
        .reduce((sum, [, d]) => sum + (d.redMinutes ?? 0), 0);
      return point([s.lng, s.lat], { id: s.id, weight });
    }),
  );
}

// [minLng, minLat, maxLng, maxLat] around items with lng/lat, or null if none
export function pointsBbox(items) {
  const pts = items.filter((i) => Number.isFinite(i.lng) && Number.isFinite(i.lat));
  if (!pts.length) return null;
  return bbox(featureCollection(pts.map((i) => point([i.lng, i.lat]))));
}
