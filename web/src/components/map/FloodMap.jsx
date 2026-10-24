import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import Map, { GeolocateControl, Marker, Popup, ScaleControl, Source } from 'react-map-gl/mapbox';
import { BASE_STYLES, DEFAULT_STYLE, DEFAULT_VIEW, FILL, MAPBOX_TOKEN } from '../../lib/mapStyles.js';
import { pointsBbox } from '../../lib/geojson.js';
import DangerZoneLayer from './layers/DangerZoneLayer.jsx';
import HeatmapLayer from './layers/HeatmapLayer.jsx';
import RouteLayer from './layers/RouteLayer.jsx';
import SafeZoneLayer from './layers/SafeZoneLayer.jsx';
import SensorLayer from './layers/SensorLayer.jsx';
import SafeZonePopup from './SafeZonePopup.jsx';
import SensorPopup from './SensorPopup.jsx';

// ref -> { locate, zoomIn, zoomOut, flyTo } so the page's own buttons drive the map.
// selected = { kind: 'sensor' | 'zone', id } lives in the page; showPopup draws it as a Mapbox popup (desktop).
const FloodMap = forwardRef(function FloodMap(
  {
    sensors, safeZones, stats, routeResult, styleKey, overlays, userPos,
    selected, onSelect, showPopup, showNames, onGeolocate, onNavigate,
  },
  ref,
) {
  const mapRef = useRef(null);
  const geolocateRef = useRef(null);
  const fitted = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const style = BASE_STYLES[styleKey] ?? BASE_STYLES[DEFAULT_STYLE];

  useImperativeHandle(ref, () => ({
    locate: () => geolocateRef.current?.trigger(),
    zoomIn: () => mapRef.current?.zoomIn(),
    zoomOut: () => mapRef.current?.zoomOut(),
    flyTo: (lngLat) => mapRef.current?.easeTo({ center: lngLat, duration: 600 }),
  }));

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

  // Look up the live object so popups update while open
  const selectedItem =
    selected && (selected.kind === 'sensor' ? sensors : safeZones).find((item) => item.id === selected.id);

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={DEFAULT_VIEW}
      mapStyle={style.url}
      terrain={style.terrain ? { source: 'mapbox-dem', exaggeration: 1.5 } : undefined}
      onClick={() => onSelect?.(null)}
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
      <SafeZoneLayer
        safeZones={safeZones}
        visible={overlays.safeZones}
        selectedId={selected?.kind === 'zone' ? selected.id : null}
        targetId={routeResult?.zone.id}
        onSelect={onSelect}
      />
      <SensorLayer
        sensors={sensors}
        visible={overlays.flood}
        selectedId={selected?.kind === 'sensor' ? selected.id : null}
        showNames={showNames}
        onSelect={onSelect}
      />

      {userPos && (
        <Marker longitude={userPos[0]} latitude={userPos[1]} style={{ zIndex: 4 }}>
          <span className="fw-user" role="img" aria-label="Your position" />
        </Marker>
      )}

      {/* Hidden: our "Show my location" button calls trigger(); we draw the dot ourselves */}
      <GeolocateControl
        ref={geolocateRef}
        trackUserLocation
        showUserLocation={false}
        positionOptions={{ enableHighAccuracy: true }}
        onGeolocate={(e) => onGeolocate?.([e.coords.longitude, e.coords.latitude])}
        style={{ display: 'none' }}
      />
      <ScaleControl position="bottom-right" />

      {showPopup && selectedItem && (
        <Popup
          className="fw-mapbox-popup"
          longitude={selectedItem.lng}
          latitude={selectedItem.lat}
          offset={24}
          closeButton={false}
          closeOnClick={false}
          maxWidth="300px"
          onClose={() => onSelect?.(null)}
        >
          {selected.kind === 'sensor' ? (
            <SensorPopup sensor={selectedItem} onClose={() => onSelect?.(null)} />
          ) : (
            <SafeZonePopup zone={selectedItem} onClose={() => onSelect?.(null)} onNavigate={() => onNavigate?.(selectedItem)} />
          )}
        </Popup>
      )}
    </Map>
  );
});

export default FloodMap;
