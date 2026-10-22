export const RANGES = {
  '1h': 3_600_000,
  '6h': 6 * 3_600_000,
  '24h': 24 * 3_600_000,
  '7d': 7 * 24 * 3_600_000,
};

export default function RangePicker({ value, onChange }) {
  return (
    <div className="segmented" role="group" aria-label="Time range">
      {Object.keys(RANGES).map((k) => (
        <button key={k} type="button" className={value === k ? 'active' : ''} onClick={() => onChange(k)}>
          {k}
        </button>
      ))}
    </div>
  );
}
