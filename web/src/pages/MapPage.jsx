import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Info, Layers, LocateFixed, Minus, Plus, Radio, ShieldCheck } from 'lucide-react';
import FloodMap from '../components/map/FloodMap.jsx';
import Legend from '../components/map/Legend.jsx';
import MapModes from '../components/map/MapModes.jsx';
import RouteSheet from '../components/map/RouteSheet.jsx';
import SafeZonePopup from '../components/map/SafeZonePopup.jsx';
import SensorListItem from '../components/map/SensorListItem.jsx';
import SensorPopup from '../components/map/SensorPopup.jsx';
import DangerBanner from '../components/alerts/DangerBanner.jsx';
import { StatusChip, timeAgo } from '../components/ui/Status.jsx';
import { useDangerCheck } from '../hooks/useDangerCheck.js';
import { useIsDesktop } from '../hooks/useMediaQuery.js';
import { useNow } from '../hooks/useNow.js';
import { usePersistentState } from '../hooks/usePersistentState.js';
import { useRoute } from '../hooks/useRoute.js';
import { useSafeZones } from '../hooks/useSafeZones.js';
import { useSensors } from '../hooks/useSensors.js';
import { useStats } from '../hooks/useStats.js';
import { STATUS } from '../lib/flood.js';
import { distanceM } from '../lib/geo.js';
import { DEFAULT_OVERLAYS, DEFAULT_STYLE } from '../lib/mapStyles.js';

const REROUTE_AFTER_M = 100;
const ORDER = [STATUS.RED, STATUS.YELLOW, STATUS.GREEN, STATUS.OFFLINE];
const COUNT_WORD = { [STATUS.RED]: 'danger', [STATUS.YELLOW]: 'warning', [STATUS.GREEN]: 'normal', [STATUS.OFFLINE]: 'offline' };

// "Live · 3 sensors · updated 4 s ago" + one chip per status
function LiveSummary({ sensors }) {
  const now = useNow(1000);
  const online = sensors.filter((s) => s.online);
  const latest = Math.max(0, ...online.map((s) => s.live.ts));
  return (
    <div className="fw-glass fw-drop map-status">
      <div className="map-status__row">
        <Radio size={18} className="fw-live" style={{ color: 'var(--status-normal-text)' }} aria-hidden="true" />
        <span className="fw-strong">
          Live · {online.length} sensor{online.length === 1 ? '' : 's'}
        </span>
        {latest > 0 && (
          <span className="fw-caption" style={{ marginLeft: 'auto' }}>
            Updated {timeAgo(latest, now)}
          </span>
        )}
      </div>
      <div className="map-status__chips">
        {ORDER.map((st) => {
          const n = sensors.filter((s) => s.status === st).length;
          return n ? <StatusChip key={st} status={st} label={`${n} ${COUNT_WORD[st]}`} /> : null;
        })}
      </div>
    </div>
  );
}

export default function MapPage() {
  const isDesktop = useIsDesktop();
  const { sensors, error } = useSensors();
  const { safeZones } = useSafeZones();
  const { stats } = useStats();
  const [styleKey, setStyleKey] = usePersistentState('fw.mapStyle', DEFAULT_STYLE);
  const [overlays, setOverlays] = usePersistentState('fw.overlays', DEFAULT_OVERLAYS);
  const [modesOpen, setModesOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [selected, setSelected] = useState(null); // { kind: 'sensor' | 'zone', id }
  const [userPos, setUserPos] = useState(null);
  const [profile, setProfile] = useState('walking');
  const danger = useDangerCheck(userPos, sensors);
  const { result, loading, error: routeError, toNearest, toZone, clear } = useRoute();
  const mapRef = useRef(null);
  const listRef = useRef(null); // desktop sensor list, scrolled to the pin picked on the map
  const request = useRef(null); // last route request { zoneId, profile, redKey, from } — replayed on re-route
  const [searchParams, setSearchParams] = useSearchParams();

  const redKey = sensors
    .filter((s) => s.status === STATUS.RED)
    .map((s) => s.id)
    .sort()
    .join(',');

  const runRoute = (zoneId, pos) => {
    request.current = { zoneId, profile, redKey, from: pos };
    setSelected(null);
    const zone = zoneId && safeZones.find((z) => z.id === zoneId);
    if (zone) toZone({ user: pos, zone, sensors, profile });
    else toNearest({ user: pos, safeZones, sensors, profile });
  };

  // zoneId = null -> nearest safe zone
  const requestRoute = (zoneId = null) => {
    if (userPos) return runRoute(zoneId, userPos);
    mapRef.current?.locate(); // keep tracking the user too
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

  const select = (item) => {
    setSelected(item);
    if (item) setLegendOpen(false);
  };

  const pickSensor = (s) => {
    const same = selected?.kind === 'sensor' && selected.id === s.id;
    setSelected(same ? null : { kind: 'sensor', id: s.id });
    if (!same) mapRef.current?.flyTo([s.lng, s.lat]);
  };

  // Deep link from Safe Zones page: /?to=<zoneId>, from Sensor page: /?to=nearest
  const toParam = searchParams.get('to');
  useEffect(() => {
    if (!toParam || !safeZones.length) return;
    setSearchParams({}, { replace: true });
    requestRoute(toParam === 'nearest' ? null : toParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toParam, safeZones.length]);

  // Pin picked on the map -> bring its row into view in the scrollable list
  useEffect(() => {
    if (selected?.kind !== 'sensor') return;
    listRef.current?.querySelector(`[data-sensor-id="${selected.id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selected]);

  // Re-route when user moves, a zone turns red/clears, or walk/drive changes
  useEffect(() => {
    const req = request.current;
    if (!req || !userPos) return;
    const moved = distanceM(userPos, req.from) > REROUTE_AFTER_M;
    if (moved || req.redKey !== redKey || req.profile !== profile) runRoute(req.zoneId, userPos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPos, redKey, profile]);

  const routing = Boolean(result || loading || routeError);
  const inDanger = danger && danger.level !== 'safe';
  const selectedItem =
    selected && (selected.kind === 'sensor' ? sensors : safeZones).find((item) => item.id === selected.id);
  const sorted = [...sensors].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status));

  const routeSheet = (variant) => (
    <RouteSheet
      result={result}
      loading={loading}
      error={routeError}
      profile={profile}
      onProfileChange={setProfile}
      onClose={closeRoute}
      variant={variant}
    />
  );

  const banner = (
    <>
      {error && <div className="notice notice--danger map-error">{error.message}</div>}
      <DangerBanner danger={danger} onRoute={() => requestRoute()} routing={routing} />
    </>
  );

  const modesBtn = (
    <button
      type="button"
      className="fw-iconbtn fw-iconbtn--surface fw-glass"
      aria-label="Map modes"
      aria-expanded={modesOpen}
      onClick={() => setModesOpen((o) => !o)}
    >
      <Layers size={24} aria-hidden="true" />
    </button>
  );
  const locateBtn = (
    <button type="button" className="fw-iconbtn fw-iconbtn--surface fw-glass" aria-label="Show my location" onClick={() => mapRef.current?.locate()}>
      <LocateFixed size={24} aria-hidden="true" />
    </button>
  );

  const map = (
    <FloodMap
      ref={mapRef}
      sensors={sensors}
      safeZones={safeZones}
      stats={stats}
      routeResult={result}
      styleKey={styleKey}
      overlays={overlays}
      userPos={userPos}
      selected={selected}
      onSelect={select}
      showPopup={isDesktop}
      showNames={isDesktop}
      onGeolocate={onGeolocate}
      onNavigate={(zone) => requestRoute(zone.id)}
    />
  );

  const modes = modesOpen && (
    <MapModes
      styleKey={styleKey}
      onStyleChange={setStyleKey}
      overlays={overlays}
      onOverlaysChange={setOverlays}
      onClose={() => setModesOpen(false)}
    />
  );

  if (isDesktop) {
    return (
      <div className="map-page">
        <aside className={`map-side ${routing ? 'map-side--route' : ''}`} aria-live="polite">
          {routing ? (
            routeSheet('panel')
          ) : (
            <>
              <div className="map-cta fw-rise">
                <h2 className="fw-h3">Where is the nearest safe zone?</h2>
                <p className="fw-body-s">
                  Share your location to check if you are in a flood zone and get a route that avoids flooded streets. Your
                  location stays on this device.
                </p>
                <button type="button" className="fw-btn fw-btn--primary fw-btn--lg fw-btn--block" onClick={() => requestRoute()}>
                  <ShieldCheck size={22} aria-hidden="true" />
                  Nearest safe zone
                </button>
              </div>
              <section className="sensor-section" aria-labelledby="sensors-title">
                <div className="sensor-section__head">
                  <h2 id="sensors-title" className="section-title">
                    Sensors
                  </h2>
                  {sorted.length > 0 && (
                    <span className="fw-caption">
                      {sorted.length} sensor{sorted.length === 1 ? '' : 's'}
                    </span>
                  )}
                </div>
                <div className="sensor-list" ref={listRef}>
                  {sorted.length ? (
                    sorted.map((s, i) => (
                      <SensorListItem
                        key={s.id}
                        sensor={s}
                        delay={i + 1}
                        selected={selected?.kind === 'sensor' && selected.id === s.id}
                        onSelect={() => pickSensor(s)}
                        data-sensor-id={s.id}
                      />
                    ))
                  ) : (
                    <p className="empty">No sensors yet.</p>
                  )}
                </div>
              </section>
            </>
          )}
        </aside>

        <div className="map-region" role="region" aria-label="Flood map">
          {map}
          <div className="map-banner">{banner}</div>
          <div className="map-controls">
            {modesBtn}
            {locateBtn}
            <button type="button" className="fw-iconbtn fw-iconbtn--surface fw-glass" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()}>
              <Plus size={24} aria-hidden="true" />
            </button>
            <button type="button" className="fw-iconbtn fw-iconbtn--surface fw-glass" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()}>
              <Minus size={24} aria-hidden="true" />
            </button>
          </div>
          <Legend overlays={overlays} />
          {modes}
        </div>
      </div>
    );
  }

  // Mobile: banner on top, then [card | controls], route sheet or "Nearest safe zone" at the bottom
  let card = null;
  if (selectedItem) {
    card =
      selected.kind === 'sensor' ? (
        <SensorPopup sensor={selectedItem} onClose={() => setSelected(null)} />
      ) : (
        <SafeZonePopup zone={selectedItem} onClose={() => setSelected(null)} onNavigate={() => requestRoute(selectedItem.id)} />
      );
  } else if (legendOpen) {
    card = <Legend id="legend" overlays={overlays} className="fw-pop" />;
  } else if (!inDanger && !routing && sensors.length > 0) {
    card = <LiveSummary sensors={sensors} />;
  }

  return (
    <div className="map-page">
      <div className="map-region" role="region" aria-label="Flood map">
        {map}
        <div className="map-top">
          {banner}
          <div className="map-top__row">
            <div className="map-top__left">{card}</div>
            <div className="map-controls">
              {modesBtn}
              {locateBtn}
              <button
                type="button"
                className="fw-iconbtn fw-iconbtn--surface fw-glass"
                aria-label="Legend"
                aria-expanded={legendOpen}
                aria-controls="legend"
                onClick={() => {
                  setLegendOpen((o) => !o);
                  setSelected(null);
                }}
              >
                <Info size={24} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {routing ? (
          routeSheet('sheet')
        ) : (
          <div className="map-nearest">
            <button type="button" className="fw-btn fw-btn--primary fw-btn--lg fw-btn--pill" onClick={() => requestRoute()}>
              <ShieldCheck size={22} aria-hidden="true" />
              Nearest safe zone
            </button>
          </div>
        )}
        {modes}
      </div>
    </div>
  );
}
