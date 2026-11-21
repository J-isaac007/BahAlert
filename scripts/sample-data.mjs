// Demo data for Batangas City, Alangilan down to the Poblacion.
// Sensors sit at real evacuation-center sites (pins from OpenStreetMap). Safe zones below are still
// SAMPLE placeholders — fake names on purpose, do not present them as real evacuation centers.

const CONFIG = { sensorHeightCm: 100, yellowCm: 40, redCm: 60, dangerCm: 80, intervalSec: 2 };
const sensor = (name, barangay, lat, lng, dangerRadiusM = 300) => ({
  meta: { name, barangay, lat, lng, dangerRadiusM },
  config: { ...CONFIG },
});

export const DEVICES = {
  'fw-001': sensor('Alangilan Elementary School', 'Alangilan', 13.7877, 121.0688),
  'fw-002': sensor('BatStateU Alangilan Campus (Main II)', 'Alangilan', 13.7843, 121.0743),
  // TODO: not on OpenStreetMap — approximate pin in Alangilan, move to the real clubhouse
  'fw-003': sensor('Alangilan Clubhouse', 'Alangilan', 13.7910, 121.0715),
  'fw-004': sensor('Kumintang Ilaya Covered Court', 'Kumintang Ilaya', 13.7739, 121.0645),
  // TODO: pinned at the 401st Ready Reserve Infantry Battalion HQ (Hilltop) — confirm it's the same site
  'fw-005': sensor('401st Community Defense Center', 'Kumintang Ibaba', 13.7647, 121.0615),
  'fw-006': sensor('Batangas City Evacuation Center', 'Bolbok', 13.7696, 121.0531),
  'fw-007': sensor('Batangas Provincial Sports Complex', 'Bolbok', 13.7777, 121.0450),
  // Coliseum and Pablo Borbon are ~200 m apart: smaller zones so they don't swallow each other
  'fw-008': sensor('Batangas City Coliseum', 'Sta. Clara', 13.7530, 121.0519, 150),
  'fw-009': sensor('BatStateU Pablo Borbon (Main I)', 'Poblacion', 13.7545, 121.0531, 150),
  'fw-010': sensor('Batangas City East Elementary School', 'Kumintang Ibaba', 13.7601, 121.0642),
};

export const SAFE_ZONES = {
  'sz-001': { name: 'SAMPLE Evacuation Center A', type: 'evac', lat: 13.7870, lng: 121.0760, capacity: 500, address: 'Sample address, Alangilan', contact: '', active: true },
  'sz-002': { name: 'SAMPLE Elementary School', type: 'school', lat: 13.7990, lng: 121.0760, capacity: 300, address: 'Sample address, Balagtas', contact: '', active: true },
  'sz-003': { name: 'SAMPLE Covered Court', type: 'court', lat: 13.7830, lng: 121.0730, capacity: 200, address: 'Sample address, Alangilan', contact: '', active: true },
  'sz-004': { name: 'SAMPLE Chapel', type: 'church', lat: 13.7930, lng: 121.0640, capacity: 120, address: 'Sample address, Balagtas', contact: '', active: false },
  // Sits inside sensor 4's zone (Kumintang Ilaya) — routing must skip it when sensor 4 is red
  'sz-005': { name: 'SAMPLE Riverside Hall', type: 'evac', lat: 13.7745, lng: 121.0652, capacity: 150, address: 'Sample address, Kumintang Ilaya', contact: '', active: true },
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
