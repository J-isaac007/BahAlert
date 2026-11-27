import { Radio, WifiOff } from 'lucide-react';
import { timeAgo } from './Status.jsx';

// "Live · updated 4 s ago" / "Offline · 3 min ago"
export default function OnlineBadge({ sensor }) {
  if (!sensor.live) return <span className="fw-caption">No data yet</span>;
  return (
    <span className="fw-caption" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {sensor.online ? (
        <Radio size={14} className="fw-live" style={{ color: 'var(--status-normal-text)' }} aria-hidden="true" />
      ) : (
        <WifiOff size={14} style={{ color: 'var(--status-offline-text)' }} aria-hidden="true" />
      )}
      {sensor.online ? 'Live' : 'Offline'} · updated {timeAgo(sensor.live.ts)}
    </span>
  );
}
