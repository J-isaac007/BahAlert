import { Layer, Source } from 'react-map-gl/mapbox';
import { CANVAS_COLOR, ROUTE_COLOR, visibility } from '../../../lib/mapStyles.js';

// Only flood-free routes exist: when none is found the result has route: null and nothing is drawn.
export default function RouteLayer({ result, visible }) {
  if (!result?.route) return null;
  const layout = { visibility: visibility(visible), 'line-cap': 'round', 'line-join': 'round' };
  return (
    <Source id="route" type="geojson" data={{ type: 'Feature', geometry: result.route.geometry, properties: {} }}>
      <Layer id="route-casing" type="line" layout={layout} paint={{ 'line-color': CANVAS_COLOR, 'line-width': 10 }} />
      <Layer id="route-line" type="line" layout={layout} paint={{ 'line-color': ROUTE_COLOR, 'line-width': 6 }} />
    </Source>
  );
}
