// Demo data for Batangas City, Alangilan down to the Poblacion.
// Safe zones are the city's listed evacuation centers (pins from OpenStreetMap).
// Sensors are demo spots on nearby streets — no real hardware is installed there.

const CONFIG = { sensorHeightCm: 100, yellowCm: 40, redCm: 60, dangerCm: 80, intervalSec: 2 };
const sensor = (name, barangay, lat, lng, dangerRadiusM = 300) => ({
  meta: { name, barangay, lat, lng, dangerRadiusM },
  config: { ...CONFIG },
});

export const DEVICES = {
  'fw-001': sensor('Sensor 1 — Sitio 3 Road', 'Balagtas', 13.7960, 121.0701),
  'fw-002': sensor('Sensor 2 — Malugay Street', 'Alangilan', 13.7838, 121.0620),
  'fw-003': sensor('Sensor 3 — Bolbok Interior Road', 'Bolbok', 13.7821, 121.0517),
  // Covers Kumintang Ilaya Covered Court (~200 m away) — routing must skip that zone when this is red
  'fw-004': sensor('Sensor 4 — National Highway', 'Kumintang Ilaya', 13.7728, 121.0660),
  'fw-005': sensor('Sensor 5 — Buenafe Road', 'Kumintang Ibaba', 13.7641, 121.0690),
  'fw-006': sensor('Sensor 6 — P. Burgos Street', 'Poblacion', 13.7580, 121.0580),
  'fw-007': sensor('Sensor 7 — Bolbok Side Street', 'Bolbok', 13.7720, 121.0581),
  'fw-008': sensor('Sensor 8 — Tinga Labac Road', 'Tinga Labac', 13.7764, 121.0772),
  'fw-009': sensor('Sensor 9 — Duluhan Street', 'Cuta', 13.7499, 121.0600),
  'fw-010': sensor('Sensor 10 — PPA Road', 'Sta. Clara', 13.7608, 121.0486),
};

// TODO: capacity and contact unknown — fill in from the CDRRMO list.
const zone = (name, type, lat, lng, address) => ({ name, type, lat, lng, capacity: null, address, contact: '', active: true });

export const SAFE_ZONES = {
  'sz-001': zone('Alangilan Elementary School', 'school', 13.7877, 121.0688, 'National Highway, Alangilan'),
  'sz-002': zone('Batangas State University - Alangilan Campus (Main II)', 'school', 13.7843, 121.0743, 'Golden Country Village, Alangilan'),
  'sz-004': zone('Kumintang Ilaya Covered Court', 'court', 13.7739, 121.0645, 'R. Diokno Street, Kumintang Ilaya'),
  'sz-005': zone('401st Community Defense Center', 'evac', 13.7647, 121.0615, 'Hilltop Road, Kumintang Ibaba'),
  'sz-006': zone('Batangas City Evacuation Center', 'evac', 13.7696, 121.0531, 'National Highway, Bolbok'),
  'sz-007': zone('Batangas Provincial Sports Complex', 'evac', 13.7777, 121.0450, 'Taurus Street, Bolbok'),
  'sz-008': zone('Batangas City Coliseum', 'evac', 13.7530, 121.0519, 'Sta. Clara'),
  'sz-009': zone('BatStateU Pablo Borbon Main I', 'school', 13.7545, 121.0531, 'Rizal Avenue, Poblacion'),
  'sz-010': zone('Batangas City East Elementary School', 'school', 13.7601, 121.0642, 'P. Herrera Street, Kumintang Ibaba'),
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
