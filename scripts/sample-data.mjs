// SAMPLE data around Alangilan and Balagtas, Batangas City (placeholder). Replace with your barangay's real sites.
// Names are fake on purpose — do not present them as real evacuation centers.

export const DEVICES = {
  'fw-001': {
    meta: { name: 'Sensor 1 — Riverbank North', barangay: 'Balagtas', lat: 13.7960, lng: 121.0700, dangerRadiusM: 300 },
    config: { sensorHeightCm: 100, yellowCm: 40, redCm: 60, dangerCm: 80, intervalSec: 2 },
  },
  'fw-002': {
    meta: { name: 'Sensor 2 — Bridge', barangay: 'Alangilan', lat: 13.7890, lng: 121.0690, dangerRadiusM: 300 },
    config: { sensorHeightCm: 100, yellowCm: 40, redCm: 60, dangerCm: 80, intervalSec: 2 },
  },
  'fw-003': {
    meta: { name: 'Sensor 3 — Creek Outlet', barangay: 'Alangilan', lat: 13.7815, lng: 121.0665, dangerRadiusM: 250 },
    config: { sensorHeightCm: 100, yellowCm: 40, redCm: 60, dangerCm: 80, intervalSec: 2 },
  },
};

export const SAFE_ZONES = {
  'sz-001': { name: 'SAMPLE Evacuation Center A', type: 'evac', lat: 13.7870, lng: 121.0760, capacity: 500, address: 'Sample address, Alangilan', contact: '', active: true },
  'sz-002': { name: 'SAMPLE Elementary School', type: 'school', lat: 13.7990, lng: 121.0760, capacity: 300, address: 'Sample address, Balagtas', contact: '', active: true },
  'sz-003': { name: 'SAMPLE Covered Court', type: 'court', lat: 13.7830, lng: 121.0730, capacity: 200, address: 'Sample address, Alangilan', contact: '', active: true },
  'sz-004': { name: 'SAMPLE Chapel', type: 'church', lat: 13.7930, lng: 121.0640, capacity: 120, address: 'Sample address, Balagtas', contact: '', active: false },
  // Sits inside sensor 3's zone — routing must skip it when sensor 3 is red
  'sz-005': { name: 'SAMPLE Riverside Hall', type: 'evac', lat: 13.7820, lng: 121.0668, capacity: 150, address: 'Sample address, Alangilan', contact: '', active: true },
};

// TODO(M5): verify every number from official sources, fill blanks, then set verified: true.
export const HOTLINES = {
  'hl-911': { name: 'National Emergency Hotline', number: '911', category: 'national', area: 'Philippines', order: 1, verified: true },
  'hl-prc': { name: 'Philippine Red Cross', number: '143', category: 'national', area: 'Philippines', order: 2, verified: true },
  'hl-ndrrmc': { name: 'NDRRMC Operations Center', number: '', category: 'national', area: 'Philippines', order: 3, verified: false },
  'hl-pagasa': { name: 'PAGASA', number: '', category: 'national', area: 'Philippines', order: 4, verified: false },
  'hl-bfp': { name: 'Bureau of Fire Protection', number: '', category: 'national', area: 'Philippines', order: 5, verified: false },
  'hl-pnp': { name: 'Philippine National Police', number: '', category: 'national', area: 'Philippines', order: 6, verified: false },
  'hl-cdrrmo': { name: 'City DRRM Office (CDRRMO)', number: '', category: 'city', area: 'Your city', order: 1, verified: false },
  'hl-brgy': { name: 'Barangay Hall / BDRRMC', number: '', category: 'barangay', area: 'Your barangay', order: 1, verified: false },
};
