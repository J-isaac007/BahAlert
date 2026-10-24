import { TrendingDown, TrendingUp } from 'lucide-react';
import { formatEta } from '../../lib/flood.js';
import StatCard from './StatCard.jsx';

const URGENT_MIN = 30;

const toneOf = ({ kind, minutes }) => {
  if (kind === 'overflow') return 'danger';
  if (kind === 'rising') return minutes <= URGENT_MIN ? 'danger' : 'warning';
  return undefined;
};

const valueOf = (eta) => {
  if (eta.kind === 'overflow') return 'Now';
  if (eta.kind === 'stable') return 'Stable';
  if (eta.kind === 'unknown') return '—';
  return formatEta(eta);
};

// The standout feature: minutes until water reaches the overflow line
export default function EtaCard({ eta, levelCm, dangerCm, offline = false, className }) {
  const left = Number.isFinite(levelCm) && Number.isFinite(dangerCm) ? Math.max(0, dangerCm - levelCm) : null;
  let hint = 'Waiting for more readings';
  if (offline) hint = 'Sensor offline — no estimate';
  else if (eta.kind === 'overflow') hint = 'Water is at the overflow line';
  else if (eta.kind === 'stable') hint = 'Not rising right now';
  else if (left != null && eta.kind === 'rising') hint = `${Math.round(left)} cm left to the overflow line`;

  return (
    <StatCard
      label="Minutes to overflow"
      value={valueOf(eta)}
      hint={hint}
      icon={eta.kind === 'stable' ? TrendingDown : eta.kind === 'unknown' ? undefined : TrendingUp}
      tone={toneOf(eta)}
      wide
      className={className}
    />
  );
}
