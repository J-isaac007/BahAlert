// tone: 'danger' | 'warning' | 'normal' | undefined. icon = Lucide component shown before the hint.
export default function StatCard({ label, value, hint, tone, icon: Icon, wide, className = '' }) {
  return (
    <div className={`fw-stat ${tone ? `fw-stat--${tone}` : ''} ${wide ? 'fw-stat--wide' : ''} ${className}`}>
      <span className="fw-over">{label}</span>
      <span className="fw-num">{value}</span>
      {hint && (
        <span className="fw-stat__hint">
          {Icon && <Icon size={16} aria-hidden="true" style={{ flex: 'none' }} />}
          {hint}
        </span>
      )}
    </div>
  );
}
