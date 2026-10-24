// Dev-only fake GPS for demos and testing: open any page with ?at=lat,lng (e.g. ?at=13.7817,121.0667).
// Sticks for the tab (sessionStorage) until ?at=off. Never active in production builds.
const KEY = 'fw-dev-at';

function readOverride() {
  const param = new URLSearchParams(window.location.search).get('at');
  try {
    if (param === 'off') sessionStorage.removeItem(KEY);
    else if (param) sessionStorage.setItem(KEY, param);
    return sessionStorage.getItem(KEY);
  } catch {
    return param && param !== 'off' ? param : null;
  }
}

export function installDevLocation() {
  if (!import.meta.env.DEV || !navigator.geolocation) return;
  const [lat, lng] = (readOverride() ?? '').split(',').map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  const position = () => ({
    coords: { latitude: lat, longitude: lng, accuracy: 5, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
    timestamp: Date.now(),
  });
  let nextId = 1;
  const watches = new Map();

  // Async like the real API, so callers' setState runs after they subscribe
  navigator.geolocation.getCurrentPosition = (onSuccess) => setTimeout(() => onSuccess(position()), 0);
  navigator.geolocation.watchPosition = (onSuccess) => {
    const id = nextId++;
    watches.set(id, setTimeout(() => onSuccess(position()), 0));
    return id;
  };
  navigator.geolocation.clearWatch = (id) => {
    clearTimeout(watches.get(id));
    watches.delete(id);
  };
  console.info(`[dev] Fake location ${lat}, ${lng}. Open with ?at=off to use real GPS.`);
}
