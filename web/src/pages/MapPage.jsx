import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import FloodMap from '../components/map/FloodMap.jsx';
import LayerToggles from '../components/map/LayerToggles.jsx';
import Legend from '../components/map/Legend.jsx';
import RouteSheet from '../components/map/RouteSheet.jsx';
import StyleSwitcher from '../components/map/StyleSwitcher.jsx';
import DangerBanner from '../components/alerts/DangerBanner.jsx';
import { useDangerCheck } from '../hooks/useDangerCheck.js';
import { usePersistentState } from '../hooks/usePersistentState.js';
import { useRoute } from '../hooks/useRoute.js';
import { useSafeZones } from '../hooks/useSafeZones.js';
import { useSensors } from '../hooks/useSensors.js';
import { useStats } from '../hooks/useStats.js';
import { STATUS } from '../lib/flood.js';
import { distanceM } from '../lib/geo.js';
import { DEFAULT_OVERLAYS } from '../lib/mapStyles.js';

const REROUTE_AFTER_M = 100;

export default function MapPage() {
  const { sensors, error } = useSensors();
  const { safeZones } = useSafeZones();
  const { stats } = useStats();
  const [styleKey, setStyleKey] = usePersistentState('fw.mapStyle', 'street');
  const [overlays, setOverlays] = usePersistentState('fw.overlays', DEFAULT_OVERLAYS);
  const [panelOpen, setPanelOpen] = useState(false);
  const [userPos, setUserPos] = useState(null);
  const [profile, setProfile] = useState('walking');
  const danger = useDangerCheck(userPos, sensors);
  const { result, loading, error: routeError, toNearest, toZone, clear } = useRoute();
  const geolocateRef = useRef(null);
  const request = useRef(null); // last route request { zoneId, profile, redKey, from } — replayed on re-route
  const [searchParams, setSearchParams] = useSearchParams();

  const redKey = sensors
    .filter((s) => s.status === STATUS.RED)
    .map((s) => s.id)
    .sort()
    .join(',');

  const runRoute = (zoneId, pos) => {
    request.current = { zoneId, profile, redKey, from: pos };
    const zone = zoneId && safeZones.find((z) => z.id === zoneId);
    if (zone) toZone({ user: pos, zone, sensors, profile });
    else toNearest({ user: pos, safeZones, sensors, profile });
  };

  // zoneId = null -> nearest safe zone
  const requestRoute = (zoneId = null) => {
    if (userPos) return runRoute(zoneId, userPos);
    geolocateRef.current?.trigger(); // show the blue dot too
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        const pos = [p.coords.longitude, p.coords.latitude];
        setUserPos(pos);
        runRoute(zoneId, pos);
      },
      () => alert('Turn on location to get a route to safety.'),
      { enableHighAccuracy: true },
    );
  };

  const onGeolocate = (pos) => {
    setUserPos(pos);
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  };

  const closeRoute = () => {
    request.current = null;
    clear();
  };

  // Deep link from Safe Zones page: /?to=<zoneId>
  const toParam = searchParams.get('to');
  useEffect(() => {
    if (!toParam || !safeZones.length) return;
    setSearchParams({}, { replace: true });
    requestRoute(toParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toParam, safeZones.length]);

  // Re-route when user moves, a zone turns red/clears, or walk/drive changes
  useEffect(() => {
    const req = request.current;
    if (!req || !userPos) return;
    const moved = distanceM(userPos, req.from) > REROUTE_AFTER_M;
    if (moved || req.redKey !== redKey || req.profile !== profile) runRoute(req.zoneId, userPos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPos, redKey, profile]);

  return (
    <div className="map-page">
      <FloodMap
        ref={geolocateRef}
        sensors={sensors}
        safeZones={safeZones}
        stats={stats}
        routeResult={result}
        styleKey={styleKey}
        overlays={overlays}
        onGeolocate={onGeolocate}
        onNavigate={(zone) => requestRoute(zone.id)}
      />

      <div className="map-overlay-top">
        {error && <div className="notice">{error.message}</div>}
        <DangerBanner danger={danger} onRoute={() => requestRoute()} />
      </div>

      <div className="map-panel">
        <button type="button" className="btn" onClick={() => setPanelOpen((o) => !o)} aria-expanded={panelOpen}>
          ☰ Map modes
        </button>
        {panelOpen && (
          <div className="card map-panel-body">
            <StyleSwitcher value={styleKey} onChange={setStyleKey} />
            <LayerToggles value={overlays} onChange={setOverlays} />
          </div>
        )}
      </div>

      <Legend overlays={overlays} />

      {!result && !loading && (
        <button type="button" className="btn btn-primary btn-big nearest-btn" onClick={() => requestRoute()}>
          Nearest safe zone
        </button>
      )}

      <RouteSheet
        result={result}
        loading={loading}
        error={routeError}
        profile={profile}
        onProfileChange={setProfile}
        onClose={closeRoute}
      />
    </div>
  );
}
