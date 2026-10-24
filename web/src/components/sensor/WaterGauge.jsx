import { toneOf } from '../ui/Status.jsx';

// Threshold lines, top to bottom. Top of tank = sensorHeightCm (or danger + 20%).
export function gaugeLines(config) {
  return [
    { cm: config.dangerCm, color: 'var(--text-primary)', label: 'Overflow' },
    { cm: config.redCm, color: 'var(--status-danger-text)', label: 'Red' },
    { cm: config.yellowCm, color: 'var(--status-warning-text)', label: 'Yellow' },
  ].filter((l) => Number.isFinite(l.cm));
}

const gaugeMax = (config) => config.sensorHeightCm ?? (config.dangerCm ?? 100) * 1.2;

// showScale = labels beside the tank (mobile); desktop lists them next to the number instead
export default function WaterGauge({ levelCm, status, config, showScale = false, scaleClassName = '' }) {
  const max = gaugeMax(config);
  const pct = (cm) => Math.min(Math.max(cm / max, 0), 1) * 100;
  const level = Number.isFinite(levelCm) ? levelCm : 0;
  const lines = gaugeLines(config);
  const tone = toneOf(status);

  const tank = (
    <div
      className="fw-gauge"
      role="img"
      aria-label={`Water level ${Math.round(level)} cm of ${Math.round(max)}, ${tone}`}
    >
      <div className={`fw-gauge__water fw-gauge__water--${tone}`} style={{ height: `${pct(level)}%` }} />
      {lines.map((l) => (
        <div key={l.label} className="fw-gauge__line" style={{ bottom: `${pct(l.cm)}%`, borderColor: l.color }} />
      ))}
    </div>
  );

  if (!showScale) return tank;
  return (
    <>
      {tank}
      <div className={`fw-gauge-scale ${scaleClassName}`} style={{ width: 84 }} aria-hidden="true">
        {lines.map((l) => (
          <span key={l.label} style={{ top: `${100 - pct(l.cm)}%`, color: l.color }}>
            {l.label} {l.cm}
          </span>
        ))}
      </div>
    </>
  );
}
