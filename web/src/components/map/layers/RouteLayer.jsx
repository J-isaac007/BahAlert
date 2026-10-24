import { Layer, Source } from 'react-map-gl/mapbox';
import { CANVAS_COLOR, DANGER_TEXT_COLOR, ROUTE_COLOR, visibility } from '../../../lib/mapStyles.js';

// Dashed red when no flood-free route exists (result.safe === false)
export default function RouteLayer({ result, visible }) {
  if (!result) return null;
  const layout = { visibility: visibility(visible), 'line-cap': 'round', 'line-join': 'round' };
  return (
    <Source id="route" type="geojson" data={{ type: 'Feature', geometry: result.route.geometry, properties: {} }}>
      <Layer id="route-casing" type="line" layout={layout} paint={{ 'line-color': CANVAS_COLOR, 'line-width': 10 }} />
      <Layer
        id="route-line"
        type="line"
        layout={layout}
        paint={{
          'line-color': result.safe ? ROUTE_COLOR : DANGER_TEXT_COLOR,
          'line-width': 6,
          ...(result.safe ? {} : { 'line-dasharray': [2, 1.5] }),
        }}
      />
    </Source>
  );
}
