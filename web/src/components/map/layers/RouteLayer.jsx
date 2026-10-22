import { Layer, Source } from 'react-map-gl/mapbox';
import { ROUTE_COLOR, visibility } from '../../../lib/mapStyles.js';

// Dashed when no flood-free route exists (result.safe === false)
export default function RouteLayer({ result, visible }) {
  if (!result) return null;
  const layout = { visibility: visibility(visible), 'line-cap': 'round', 'line-join': 'round' };
  return (
    <Source id="route" type="geojson" data={{ type: 'Feature', geometry: result.route.geometry, properties: {} }}>
      <Layer id="route-casing" type="line" layout={layout} paint={{ 'line-color': '#ffffff', 'line-width': 9 }} />
      <Layer
        id="route-line"
        type="line"
        layout={layout}
        paint={{
          'line-color': result.safe ? ROUTE_COLOR : '#dc2626',
          'line-width': 5,
          ...(result.safe ? {} : { 'line-dasharray': [2, 1.5] }),
        }}
      />
    </Source>
  );
}
