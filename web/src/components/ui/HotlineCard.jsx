import { Info, Phone } from 'lucide-react';

// primary = the one number to call first (filled button); the rest are secondary
export default function HotlineCard({ hotline, primary = false, className = '' }) {
  const { name, number, area, verified } = hotline;
  const callable = number && verified !== false;
  return (
    <article className={`fw-card ${className}`}>
      <div>
        <h3 className="fw-card__name">{name}</h3>
        {area && <div className="fw-meta">{area}</div>}
      </div>
      {callable ? (
        <>
          <div className="hotline-number">{number}</div>
          <a
            className={`fw-btn ${primary ? 'fw-btn--primary' : 'fw-btn--secondary'} fw-btn--lg fw-btn--block`}
            href={`tel:${number.replace(/[^\d+]/g, '')}`}
          >
            <Phone size={22} aria-hidden="true" />
            Call {number}
          </a>
        </>
      ) : (
        <span className="fw-chip fw-chip--offline" style={{ alignSelf: 'flex-start' }}>
          <Info size={16} aria-hidden="true" />
          Number not yet verified
        </span>
      )}
    </article>
  );
}
