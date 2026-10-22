import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/mapbox';
import { dangerZonesToFC } from '../../../lib/geojson.js';
import { statusColorExpr, visibility } from '../../../lib/mapStyles.js';

// TODO: pulse red outlines (animate line-width with requestAnimationFrame)
export default function DangerZoneLayer({ sensors, visible }) {
  const data = useMemo(() => dangerZonesToFC(sensors), [sensors]);
  const layout = { visibility: visibility(visible) };
  return (
    <Source id="danger-zones" type="geojson" data={data}>
      <Layer id="danger-fill" type="fill" layout={layout} paint={{ 'fill-color': statusColorExpr, 'fill-opacity': 0.25 }} />
      <Layer id="danger-line" type="line" layout={layout} paint={{ 'line-color': statusColorExpr, 'line-width': 2 }} />
    </Source>
  );
}
