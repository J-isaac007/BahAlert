import { computeRate, minutesToOverflow, STATUS } from '../../lib/flood.js';
import { useReadings } from '../../hooks/useReadings.js';
import { StatusChip, toneOf } from '../ui/Status.jsx';
import { etaText, trendText } from './SensorPopup.jsx';

const RATE_RANGE_MS = 5 * 60_000;

const ETA_COLOR = {
  [STATUS.RED]: 'var(--status-danger-text)',
  [STATUS.YELLOW]: 'var(--status-warning-text)',
};

// Desktop side-panel row. Tapping it selects the sensor on the map.
export default function SensorListItem({ sensor, selected, onSelect, delay = 0, ...rest }) {
  const { readings } = useReadings(sensor.id, RATE_RANGE_MS);
  const level = sensor.live?.levelCm;
  const rate = computeRate(readings);
  const eta = minutesToOverflow(level, rate, sensor.config.dangerCm);
  const trend = trendText(rate);
  const tone = toneOf(sensor.status);

  return (
    <button
      type="button"
      className={`sensor-item sensor-item--${tone} fw-tap fw-rise fw-d${Math.min(delay, 6)}`}
      aria-pressed={selected}
      onClick={onSelect}
      {...rest}
    >
      <span className="sensor-item__top">
        <span className="fw-strong">{sensor.name}</span>
        <StatusChip status={sensor.status} />
      </span>
      {sensor.online ? (
        <span className="sensor-item__mid">
          <span className="fw-num-m">{Math.round(level)} cm</span>
          <span className="fw-strong" style={{ color: ETA_COLOR[sensor.status] ?? 'var(--text-secondary)' }}>
            {etaText(eta)}
          </span>
        </span>
      ) : (
        <span className="fw-body-s">No reading in the last minute. Do not assume it is safe.</span>
      )}
      <span className="fw-caption" style={{ color: 'var(--text-secondary)' }}>
        {[sensor.barangay, sensor.online && trend !== 'Steady' ? trend?.toLowerCase() : null].filter(Boolean).join(' · ')}
      </span>
    </button>
  );
}
