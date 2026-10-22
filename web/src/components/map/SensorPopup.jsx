import { Link } from 'react-router';
import { computeRate, formatEta, minutesToOverflow } from '../../lib/flood.js';
import { useReadings } from '../../hooks/useReadings.js';
import OnlineBadge from '../ui/OnlineBadge.jsx';

const RATE_RANGE_MS = 5 * 60_000;

export default function SensorPopup({ sensor }) {
  const { readings } = useReadings(sensor.id, RATE_RANGE_MS);
  const level = sensor.live?.levelCm;
  const eta = minutesToOverflow(level, computeRate(readings), sensor.config.dangerCm);

  return (
    <div className="popup">
      <strong>{sensor.name}</strong>
      <div className="muted">{sensor.barangay}</div>
      <OnlineBadge sensor={sensor} />
      {sensor.online && (
        <dl className="popup-stats">
          <dt>Level</dt>
          <dd>{level.toFixed(1)} cm</dd>
          <dt>Overflow in</dt>
          <dd>{formatEta(eta)}</dd>
        </dl>
      )}
      <Link to={`/sensor/${sensor.id}`}>Details →</Link>
    </div>
  );
}
