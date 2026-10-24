import { ChevronRight, X } from 'lucide-react';
import { Link } from 'react-router';
import { computeRate, formatEta, minutesToOverflow, STATUS } from '../../lib/flood.js';
import { useReadings } from '../../hooks/useReadings.js';
import OnlineBadge from '../ui/OnlineBadge.jsx';
import { StatusChip } from '../ui/Status.jsx';

const RATE_RANGE_MS = 5 * 60_000;

const ETA_COLOR = {
  [STATUS.RED]: 'var(--status-danger-text)',
  [STATUS.YELLOW]: 'var(--status-warning-text)',
};

export function etaText(eta) {
  if (eta.kind === 'overflow') return 'Overflowing now';
  if (eta.kind === 'stable') return 'Stable';
  if (eta.kind === 'unknown') return 'Not enough data yet';
  return `Overflow in ${formatEta(eta)}`;
}

export function trendText(rate) {
  if (rate == null) return null;
  if (rate > 0.05) return `Rising ${rate.toFixed(1)} cm/min`;
  if (rate < -0.05) return `Falling ${Math.abs(rate).toFixed(1)} cm/min`;
  return 'Steady';
}

// Sensor card: map popup on desktop, top-left card on mobile
export default function SensorPopup({ sensor, onClose, className = '' }) {
  const { readings } = useReadings(sensor.id, RATE_RANGE_MS);
  const level = sensor.live?.levelCm;
  const rate = computeRate(readings);
  const eta = minutesToOverflow(level, rate, sensor.config.dangerCm);
  const trend = trendText(rate);

  return (
    <section className={`fw-popup fw-glass ${className}`} aria-labelledby={`pop-${sensor.id}`} style={{ gap: 12 }}>
      <div className="map-card__head">
        <div>
          <h2 id={`pop-${sensor.id}`} className="fw-h3">
            {sensor.name}
          </h2>
          <span className="fw-caption">{sensor.barangay && `${sensor.barangay} · `}</span>
          <OnlineBadge sensor={sensor} />
        </div>
        {onClose && (
          <button type="button" className="fw-iconbtn" aria-label="Close" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </button>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <StatusChip status={sensor.status} />
        {sensor.online && <span className="fw-num-m">{Math.round(level)} cm</span>}
      </div>
      {sensor.online && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="fw-strong" style={{ color: ETA_COLOR[sensor.status] ?? 'var(--text-secondary)' }}>
            {etaText(eta)}
          </span>
          {trend && <span className="fw-body-s">{trend}</span>}
        </div>
      )}
      <Link
        to={`/sensor/${sensor.id}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minHeight: 44, alignSelf: 'flex-start', marginBottom: -8 }}
      >
        Sensor details
        <ChevronRight size={18} aria-hidden="true" />
      </Link>
    </section>
  );
}
