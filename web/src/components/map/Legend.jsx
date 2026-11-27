import { ShieldCheck } from 'lucide-react';
import { StatusIcon } from '../ui/Status.jsx';

const Pin = ({ tone }) => (
  <span className={`fw-pin fw-pin--${tone} fw-pin--sm`}>
    <StatusIcon tone={tone} size={12} strokeWidth={2.5} />
  </span>
);

// Only lists what is currently drawn
export default function Legend({ overlays, id, className = '' }) {
  return (
    <div id={id} className={`fw-legend fw-glass map-legend ${className}`}>
      {overlays.flood && (
        <>
          <div className="fw-legend__row"><Pin tone="normal" />Normal</div>
          <div className="fw-legend__row"><Pin tone="warning" />Warning</div>
          <div className="fw-legend__row"><span className="fw-legend__zone" />Danger zone</div>
          <div className="fw-legend__row"><Pin tone="offline" />Sensor offline</div>
        </>
      )}
      {overlays.safeZones && (
        <div className="fw-legend__row">
          <span className="fw-pin fw-pin--safe fw-pin--sm">
            <ShieldCheck size={12} strokeWidth={2.5} aria-hidden="true" />
          </span>
          Safe zone
        </div>
      )}
      {overlays.heatmap && (
        <div className="fw-legend__row"><span className="fw-legend__heat" />Often flooded (7 days)</div>
      )}
    </div>
  );
}
