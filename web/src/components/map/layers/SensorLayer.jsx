import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/mapbox';
import { sensorsToFC } from '../../../lib/geojson.js';
import { statusColorExpr, visibility } from '../../../lib/mapStyles.js';

export const SENSOR_LAYER_ID = 'sensor-points';

export default function SensorLayer({ sensors, visible }) {
  const data = useMemo(() => sensorsToFC(sensors), [sensors]);
  const vis = visibility(visible);
  return (
    <Source id="sensors" type="geojson" data={data}>
      <Layer
        id={SENSOR_LAYER_ID}
        type="circle"
        layout={{ visibility: vis }}
        paint={{
          'circle-radius': 9,
          'circle-color': statusColorExpr,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        }}
      />
      <Layer
        id="sensor-labels"
        type="symbol"
        layout={{
          visibility: vis,
          'text-field': ['get', 'label'],
          'text-size': 12,
          'text-offset': [0, 1.3],
          'text-anchor': 'top',
        }}
        paint={{ 'text-color': '#111827', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 }}
      />
    </Source>
  );
}
