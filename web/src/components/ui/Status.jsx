import { CircleCheck, OctagonAlert, TriangleAlert, WifiOff } from 'lucide-react';
import { STATUS } from '../../lib/flood.js';

// Sensor status -> design-system tone. Every status is shown as icon + word + colour.
export const TONE = {
  [STATUS.GREEN]: 'normal',
  [STATUS.YELLOW]: 'warning',
  [STATUS.RED]: 'danger',
  [STATUS.OFFLINE]: 'offline',
};

export const STATUS_LABEL = {
  [STATUS.GREEN]: 'Normal',
  [STATUS.YELLOW]: 'Warning',
  [STATUS.RED]: 'Danger',
  [STATUS.OFFLINE]: 'Offline',
};

const ICONS = { normal: CircleCheck, warning: TriangleAlert, danger: OctagonAlert, offline: WifiOff };

export const toneOf = (status) => TONE[status] ?? 'offline';

export function StatusIcon({ status, tone = toneOf(status), size = 16, ...rest }) {
  const Icon = ICONS[tone] ?? WifiOff;
  return <Icon size={size} aria-hidden="true" {...rest} />;
}

// label overrides the default word ("1 danger", "Water rising", ...)
export function StatusChip({ status, tone = toneOf(status), label, icon = true, className = '' }) {
  return (
    <span className={`fw-chip fw-chip--${tone} ${className}`}>
      {icon && <StatusIcon tone={tone} />}
      {label ?? STATUS_LABEL[status] ?? 'Offline'}
    </span>
  );
}

export function timeAgo(ts, now = Date.now()) {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return `${s} s ago`;
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  return `${Math.round(s / 3600)} h ago`;
}
