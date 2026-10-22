export default function StatCard({ label, value, hint, tone }) {
  return (
    <div className={`card stat ${tone ? `stat-${tone}` : ''}`}>
      <div className="muted">{label}</div>
      <div className="stat-value">{value}</div>
      {hint && <div className="muted">{hint}</div>}
    </div>
  );
}
