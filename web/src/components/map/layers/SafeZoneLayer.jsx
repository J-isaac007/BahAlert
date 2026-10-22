import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/mapbox';
import { safeZonesToFC } from '../../../lib/geojson.js';
import { SAFE_ZONE_COLOR, visibility } from '../../../lib/mapStyles.js';

export const SAFE_ZONE_LAYER_ID = 'safe-zone-points';

// TODO: shield icon via map.addImage (re-add on style.load) and cluster: true when zones grow
export default function SafeZoneLayer({ safeZones, visible }) {
  const data = useMemo(() => safeZonesToFC(safeZones), [safeZones]);
  const vis = visibility(visible);
  return (
    <Source id="safe-zones" type="geojson" data={data}>
      <Layer
        id={SAFE_ZONE_LAYER_ID}
        type="circle"
        layout={{ visibility: vis }}
        paint={{
          'circle-radius': 8,
          'circle-color': ['case', ['get', 'active'], SAFE_ZONE_COLOR, '#9ca3af'],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
        }}
      />
      <Layer
        id="safe-zone-labels"
        type="symbol"
        layout={{
          visibility: vis,
          'text-field': ['get', 'name'],
          'text-size': 11,
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
        }}
        paint={{ 'text-color': '#075985', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 }}
      />
    </Source>
  );
}
