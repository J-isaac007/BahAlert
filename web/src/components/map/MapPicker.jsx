import { useMemo } from 'react';
import { ShieldCheck } from 'lucide-react';
import Map, { Layer, Marker, NavigationControl, Source } from 'react-map-gl/mapbox';
import { BASE_STYLES, DEFAULT_STYLE, DEFAULT_VIEW, FILL, MAPBOX_TOKEN, STATUS_COLORS } from '../../lib/mapStyles.js';
import { zoneCircle } from '../../lib/geo.js';

// Admin: click or drag to set a location. value = { lng, lat } | null. radiusM previews a danger circle.
export default function MapPicker({ value, onChange, radiusM, label = 'Location' }) {
  const circle = useMemo(
    () => (value && radiusM ? zoneCircle({ ...value, id: 'preview', status: 'red', radiusM }) : null),
    [value, radiusM],
  );

  const set = ({ lng, lat }) => onChange({ lng: +lng.toFixed(6), lat: +lat.toFixed(6) });

  return (
    <div className="fw-col" style={{ gap: 8 }}>
      <span id="loc-label" style={{ font: '600 14px/20px var(--font-body)', color: 'var(--text-secondary)' }}>
        {label}
      </span>
      {MAPBOX_TOKEN ? (
        <div className="map-picker" aria-labelledby="loc-label" aria-describedby="loc-help">
          <Map
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={value ? { longitude: value.lng, latitude: value.lat, zoom: 15 } : DEFAULT_VIEW}
            mapStyle={BASE_STYLES[DEFAULT_STYLE].url}
            onClick={(e) => set(e.lngLat)}
            cursor="crosshair"
            style={FILL}
          >
            <NavigationControl position="top-right" showCompass={false} />
            {circle && (
              <Source id="preview" type="geojson" data={circle}>
                <Layer id="preview-fill" type="fill" paint={{ 'fill-color': STATUS_COLORS.red, 'fill-opacity': 0.2 }} />
              </Source>
            )}
            {value && (
              <Marker longitude={value.lng} latitude={value.lat} draggable onDragEnd={(e) => set(e.lngLat)}>
                <span className="fw-pin fw-pin--safe" style={{ width: 40, height: 40 }}>
                  <ShieldCheck size={22} aria-hidden="true" />
                </span>
              </Marker>
            )}
          </Map>
        </div>
      ) : (
        <p className="notice">Set VITE_MAPBOX_TOKEN to pick on the map</p>
      )}
      <span id="loc-help" className="fw-caption" style={{ color: 'var(--text-secondary)' }}>
        {value ? `Click the map or drag the pin · ${value.lat}, ${value.lng}` : 'Click the map to place it.'}
      </span>
    </div>
  );
}
