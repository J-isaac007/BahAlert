// Safe zone display helpers.

export const ZONE_TYPES = {
  evac: 'Evacuation center',
  school: 'School',
  court: 'Covered court',
  church: 'Church',
};

export const zoneType = (type) => ZONE_TYPES[type] ?? type ?? 'Safe zone';

// "Covered court · 200 people"
export const zoneSummary = (z) => [zoneType(z.type), z.capacity ? `${z.capacity} people` : null].filter(Boolean).join(' · ');

export const km = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`);
export const minutes = (s) => `${Math.max(1, Math.round(s / 60))} min`;

// Rough walking time at 4.8 km/h, used before a real route is fetched
export const walkMinutes = (m) => `${Math.max(1, Math.round(m / 80))} min walk`;
