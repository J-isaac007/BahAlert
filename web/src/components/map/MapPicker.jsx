import { useMemo } from 'react';
import Map, { Layer, Marker, NavigationControl, Source } from 'react-map-gl/mapbox';
import { BASE_STYLES, DEFAULT_VIEW, FILL, MAPBOX_TOKEN } from '../../lib/mapStyles.js';
import { zoneCircle } from '../../lib/geo.js';

// Admin: click or drag to set a location. value = { lng, lat } | null. radiusM previews a danger circle.
export default function MapPicker({ value, onChange, radiusM }) {
  const circle = useMemo(
    () => (value && radiusM ? zoneCircle({ ...value, id: 'preview', status: 'red', radiusM }) : null),
    [value, radiusM],
  );

  if (!MAPBOX_TOKEN) return <div className="notice">Set VITE_MAPBOX_TOKEN to pick on map</div>;

  const set = ({ lng, lat }) => onChange({ lng: +lng.toFixed(6), lat: +lat.toFixed(6) });

  return (
    <div className="map-picker">
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={value ? { longitude: value.lng, latitude: value.lat, zoom: 15 } : DEFAULT_VIEW}
        mapStyle={BASE_STYLES.street.url}
        onClick={(e) => set(e.lngLat)}
        style={FILL}
      >
        <NavigationControl position="top-right" />
        {circle && (
          <Source id="preview" type="geojson" data={circle}>
            <Layer id="preview-fill" type="fill" paint={{ 'fill-color': '#dc2626', 'fill-opacity': 0.2 }} />
          </Source>
        )}
        {value && <Marker longitude={value.lng} latitude={value.lat} draggable onDragEnd={(e) => set(e.lngLat)} />}
      </Map>
    </div>
  );
}
