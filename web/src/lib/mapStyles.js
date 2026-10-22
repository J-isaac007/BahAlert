// Mapbox base styles and shared paint expressions.

export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export const BASE_STYLES = {
  street: { label: 'Street', url: 'mapbox://styles/mapbox/streets-v12' },
  satellite: { label: 'Satellite', url: 'mapbox://styles/mapbox/satellite-streets-v12' },
  dark: { label: 'Dark', url: 'mapbox://styles/mapbox/dark-v11' },
  terrain: { label: '3D Terrain', url: 'mapbox://styles/mapbox/outdoors-v12', terrain: true },
};

export const OVERLAYS = {
  flood: 'Flood status',
  safeZones: 'Safe zones',
  heatmap: 'Flood history (heatmap)',
  route: 'Route',
};

export const DEFAULT_OVERLAYS = { flood: true, safeZones: true, heatmap: false, route: true };

// TODO(team): set to your barangay. Placeholder = Marikina River area.
export const DEFAULT_VIEW = { longitude: 121.1029, latitude: 14.6507, zoom: 13 };

export const STATUS_COLORS = {
  green: '#16a34a',
  yellow: '#f59e0b',
  red: '#dc2626',
  offline: '#9ca3af',
};

export const SAFE_ZONE_COLOR = '#0ea5e9';
export const ROUTE_COLOR = '#2563eb';

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
