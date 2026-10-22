import { useEffect, useState } from 'react';

// Browser GPS. Position stays on this device — never send it to Firebase.
// position: [lng, lat] | null
export function useGeolocation(enabled = true) {
  const [state, setState] = useState({ position: null, accuracyM: null, error: null });

  useEffect(() => {
    if (!enabled) return undefined;
    if (!('geolocation' in navigator)) {
      setState((s) => ({ ...s, error: new Error('Location not supported on this device') }));
      return undefined;
    }
    const id = navigator.geolocation.watchPosition(
      (p) => setState({ position: [p.coords.longitude, p.coords.latitude], accuracyM: p.coords.accuracy, error: null }),
      (error) => setState((s) => ({ ...s, error })),
      { enableHighAccuracy: true, maximumAge: 10_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [enabled]);

  return state;
}
