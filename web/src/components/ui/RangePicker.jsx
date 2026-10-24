export const RANGES = {
  '1h': 3_600_000,
  '6h': 6 * 3_600_000,
  '24h': 24 * 3_600_000,
  '7d': 7 * 24 * 3_600_000,
};

export default function RangePicker({ value, onChange, style }) {
  return (
    <div className="fw-seg" role="radiogroup" aria-label="Time range" style={style}>
      {Object.keys(RANGES).map((k) => (
        <button key={k} type="button" role="radio" aria-checked={value === k} onClick={() => onChange(k)}>
          {k}
        </button>
      ))}
    </div>
  );
}
