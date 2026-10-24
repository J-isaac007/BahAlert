// Mapbox base styles and shared paint expressions.
// Colours mirror the design tokens (styles/tokens.css, dark theme) — Mapbox paint can't read CSS vars.

export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// swatch = preview colour on the Map modes tile
export const BASE_STYLES = {
  street: { label: 'Street', url: 'mapbox://styles/mapbox/streets-v12', swatch: '#e8edf0' },
  satellite: { label: 'Satellite', url: 'mapbox://styles/mapbox/satellite-streets-v12', swatch: '#3f4a33' },
  dark: { label: 'Dark', url: 'mapbox://styles/mapbox/dark-v11', swatch: '#1b1f24' },
  terrain: { label: '3D terrain', url: 'mapbox://styles/mapbox/outdoors-v12', terrain: true, swatch: '#c9d6b8' },
};

export const DEFAULT_STYLE = 'dark';

export const OVERLAYS = {
  flood: { label: 'Flood status', hint: 'Sensors and danger zones' },
  safeZones: { label: 'Safe zones', hint: 'Evacuation centers and shelters' },
  heatmap: { label: 'Flood history', hint: 'Where it flooded in the last 7 days' },
  route: { label: 'Route', hint: 'Your way to the nearest safe zone' },
};

export const DEFAULT_OVERLAYS = { flood: true, safeZones: true, heatmap: false, route: true };

// Alangilan–Balagtas, Batangas City (where the sample sensors sit).
export const DEFAULT_VIEW = { longitude: 121.0705, latitude: 13.7900, zoom: 14.5 };

export const STATUS_COLORS = {
  green: '#4ade80',
  yellow: '#fbbf24',
  red: '#dc2626',
  offline: '#64748b',
};

export const SAFE_ZONE_COLOR = '#2dd4bf';
export const ROUTE_COLOR = '#8be3f7';
export const CANVAS_COLOR = '#05090d';
export const DANGER_TEXT_COLOR = '#fca5a5';

export const statusColorExpr = [
  'match',
  ['get', 'status'],
  'green', STATUS_COLORS.green,
  'yellow', STATUS_COLORS.yellow,
  'red', STATUS_COLORS.red,
  STATUS_COLORS.offline,
];

export const visibility = (on) => (on ? 'visible' : 'none');

// Map container style. Must be inline: react-map-gl sets position: relative inline, which beats a CSS class.
export const FILL = { position: 'absolute', inset: 0 };
