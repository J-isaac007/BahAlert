import { SAFE_ZONE_COLOR, STATUS_COLORS } from '../../lib/mapStyles.js';

const Swatch = ({ color }) => <span className="swatch" style={{ background: color }} />;

// Only lists what is currently drawn
export default function Legend({ overlays }) {
  return (
    <div className="legend">
      {overlays.flood && (
        <>
          <div><Swatch color={STATUS_COLORS.green} /> Normal</div>
          <div><Swatch color={STATUS_COLORS.yellow} /> Warning</div>
          <div><Swatch color={STATUS_COLORS.red} /> Danger zone</div>
          <div><Swatch color={STATUS_COLORS.offline} /> Sensor offline</div>
        </>
      )}
      {overlays.safeZones && <div><Swatch color={SAFE_ZONE_COLOR} /> Safe zone</div>}
      {overlays.heatmap && <div><span className="swatch swatch-heat" /> Often flooded (7 days)</div>}
    </div>
  );
}
