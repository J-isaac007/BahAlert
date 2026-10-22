import { formatEta } from '../../lib/flood.js';
import StatCard from './StatCard.jsx';

const TONE = { overflow: 'red', rising: 'yellow', stable: 'green', unknown: undefined };

// The standout feature: minutes until water reaches the danger line
export default function EtaCard({ eta, rate }) {
  const hint =
    rate == null ? 'Waiting for readings' : `${rate >= 0 ? 'Rising' : 'Falling'} ${Math.abs(rate).toFixed(2)} cm/min`;
  return <StatCard label="Minutes to overflow" value={formatEta(eta)} hint={hint} tone={TONE[eta.kind]} />;
}
