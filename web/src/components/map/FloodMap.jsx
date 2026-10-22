import { forwardRef, useEffect, useRef, useState } from 'react';
import Map, {
  FullscreenControl,
  GeolocateControl,
  NavigationControl,
  Popup,
  ScaleControl,
  Source,
} from 'react-map-gl/mapbox';
import { BASE_STYLES, DEFAULT_VIEW, FILL, MAPBOX_TOKEN } from '../../lib/mapStyles.js';
import { pointsBbox } from '../../lib/geojson.js';
import DangerZoneLayer from './layers/DangerZoneLayer.jsx';
import HeatmapLayer from './layers/HeatmapLayer.jsx';
import RouteLayer from './layers/RouteLayer.jsx';
import SafeZoneLayer, { SAFE_ZONE_LAYER_ID } from './layers/SafeZoneLayer.jsx';
import SensorLayer, { SENSOR_LAYER_ID } from './layers/SensorLayer.jsx';
import SafeZonePopup from './SafeZonePopup.jsx';
import SensorPopup from './SensorPopup.jsx';

const INTERACTIVE = [SENSOR_LAYER_ID, SAFE_ZONE_LAYER_ID];

// ref -> Mapbox GeolocateControl, so the page can call .trigger()
const FloodMap = forwardRef(function FloodMap(
  { sensors, safeZones, stats, routeResult, styleKey, overlays, onGeolocate, onNavigate },
  geolocateRef,
) {
  const mapRef = useRef(null);
  const fitted = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [cursor, setCursor] = useState('');
  const [popup, setPopup] = useState(null); // { kind: 'sensor' | 'zone', id, lngLat }
  const style = BASE_STYLES[styleKey] ?? BASE_STYLES.street;

  // Frame all sensors + safe zones once, when data first arrives
  useEffect(() => {
    if (fitted.current || !loaded) return;
    const box = pointsBbox([...sensors, ...safeZones]);
    if (!box) return;
    mapRef.current.fitBounds(box, { padding: 60, maxZoom: 16, duration: 0 });
    fitted.current = true;
  }, [loaded, sensors, safeZones]);

  useEffect(() => {
    if (loaded) mapRef.current.easeTo({ pitch: style.terrain ? 60 : 0, duration: 800 });
  }, [loaded, style.terrain]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="map-fallback">
        <p className="notice">Map disabled: set VITE_MAPBOX_TOKEN in web/.env</p>
      </div>
    );
  }

  const onClick = (e) => {
    const f = e.features?.[0];
    if (!f) return setPopup(null);
    setPopup({
      kind: f.layer.id === SENSOR_LAYER_ID ? 'sensor' : 'zone',
      id: f.properties.id,
      lngLat: f.geometry.coordinates,
    });
  };

  // Look up the live object so popups update while open
  const popupItem =
    popup && (popup.kind === 'sensor' ? sensors : safeZones).find((item) => item.id === popup.id);

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={DEFAULT_VIEW}
      mapStyle={style.url}
      terrain={style.terrain ? { source: 'mapbox-dem', exaggeration: 1.5 } : undefined}
      interactiveLayerIds={INTERACTIVE}
      cursor={cursor}
      onMouseEnter={() => setCursor('pointer')}
      onMouseLeave={() => setCursor('')}
      onClick={onClick}
      onLoad={() => setLoaded(true)}
      style={FILL}
    >
      {style.terrain && (
        <Source id="mapbox-dem" type="raster-dem" url="mapbox://mapbox.mapbox-terrain-dem-v1" tileSize={512} maxzoom={14} />
      )}

      {/* Declared bottom -> top */}
      <HeatmapLayer sensors={sensors} stats={stats} visible={overlays.heatmap} />
      <DangerZoneLayer sensors={sensors} visible={overlays.flood} />
      <RouteLayer result={routeResult} visible={overlays.route} />
      <SafeZoneLayer safeZones={safeZones} visible={overlays.safeZones} />
      <SensorLayer sensors={sensors} visible={overlays.flood} />

      <NavigationControl position="top-right" />
      <GeolocateControl
        ref={geolocateRef}
        position="top-right"
        trackUserLocation
        showUserHeading
        positionOptions={{ enableHighAccuracy: true }}
        onGeolocate={(e) => onGeolocate?.([e.coords.longitude, e.coords.latitude])}
      />
      <FullscreenControl position="top-right" />
      <ScaleControl position="bottom-left" />

      {popupItem && (
        <Popup
          longitude={popup.lngLat[0]}
          latitude={popup.lngLat[1]}
          onClose={() => setPopup(null)}
          closeOnClick={false}
          maxWidth="280px"
        >
          {popup.kind === 'sensor' ? (
            <SensorPopup sensor={popupItem} />
          ) : (
            <SafeZonePopup zone={popupItem} onNavigate={() => onNavigate?.(popupItem)} />
          )}
        </Popup>
      )}
    </Map>
  );
});

export default FloodMap;
