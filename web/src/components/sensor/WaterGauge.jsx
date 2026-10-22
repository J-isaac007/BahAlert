import { STATUS_COLORS } from '../../lib/mapStyles.js';

const H = 220;
const W = 90;

// Vertical tank gauge with threshold lines. Top of tank = sensorHeightCm (or danger + 20%).
export default function WaterGauge({ levelCm, status, config }) {
  const max = config.sensorHeightCm ?? (config.dangerCm ?? 100) * 1.2;
  const y = (cm) => H - Math.min(Math.max(cm / max, 0), 1) * H;
  const lines = [
    { cm: config.yellowCm, color: STATUS_COLORS.yellow, label: 'Yellow' },
    { cm: config.redCm, color: STATUS_COLORS.red, label: 'Red' },
    { cm: config.dangerCm, color: '#7f1d1d', label: 'Danger' },
  ].filter((l) => Number.isFinite(l.cm));
  const level = Number.isFinite(levelCm) ? levelCm : 0;

  return (
    <svg viewBox={`0 0 ${W + 70} ${H + 2}`} className="gauge" role="img" aria-label={`Water level ${level.toFixed(1)} cm`}>
      <rect x="1" y="1" width={W} height={H} rx="10" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      <rect
        x="3"
        y={y(level)}
        width={W - 4}
        height={H - y(level)}
        rx="8"
        fill={STATUS_COLORS[status] ?? STATUS_COLORS.offline}
        fillOpacity="0.75"
        style={{ transition: 'y 0.6s, height 0.6s' }}
      />
      {lines.map((l) => (
        <g key={l.label}>
          <line x1="1" x2={W + 6} y1={y(l.cm)} y2={y(l.cm)} stroke={l.color} strokeWidth="2" strokeDasharray="4 3" />
          <text x={W + 10} y={y(l.cm) + 4} fontSize="11" fill={l.color}>
            {l.label} {l.cm}
          </text>
        </g>
      ))}
      <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="20" fontWeight="700" fill="currentColor">
        {level.toFixed(1)}
      </text>
      <text x={W / 2} y={H / 2 + 16} textAnchor="middle" fontSize="11" fill="currentColor">
        cm
      </text>
    </svg>
  );
}
