import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/mapbox';
import { heatToFC } from '../../../lib/geojson.js';
import { visibility } from '../../../lib/mapStyles.js';

// Where floods happen most: weight = red minutes over the last `days` days.
export default function HeatmapLayer({ sensors, stats, days = 7, visible }) {
  const data = useMemo(() => heatToFC(sensors, stats, days), [sensors, stats, days]);
  const maxWeight = Math.max(1, ...data.features.map((f) => f.properties.weight));
  return (
    <Source id="flood-heat" type="geojson" data={data}>
      <Layer
        id="flood-heatmap"
        type="heatmap"
        layout={{ visibility: visibility(visible) }}
        paint={{
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, maxWeight, 1],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 10, 20, 15, 60],
          'heatmap-intensity': 1,
          'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0.8, 16, 0],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(59,130,246,0)',
            0.3, '#60a5fa',
            0.6, '#f59e0b',
            1, '#dc2626',
          ],
        }}
      />
    </Source>
  );
}
