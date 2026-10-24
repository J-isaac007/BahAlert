import { CircleCheck, WifiOff } from 'lucide-react';
import HotlineCard from '../components/ui/HotlineCard.jsx';
import { useHotlines } from '../hooks/useHotlines.js';

const GROUPS = [
  { key: 'national', title: 'National' },
  { key: 'city', title: 'City / municipality' },
  { key: 'barangay', title: 'Barangay' },
];

export default function Hotlines() {
  const { hotlines, loading, error, cached } = useHotlines();
  // The first callable number gets the filled button
  const primaryId = GROUPS.flatMap((g) => hotlines.filter((h) => h.category === g.key)).find(
    (h) => h.number && h.verified !== false,
  )?.id;

  return (
    <div className="page" style={{ gap: 32 }}>
      <div className="page-head fw-rise">
        <div>
          <h1 className="page-title">Emergency hotlines</h1>
          <p className="fw-body-s">Tap to call from a phone, or read the number aloud. Saved for offline use.</p>
        </div>
        {!loading &&
          (cached ? (
            <span className="fw-chip fw-chip--warning">
              <WifiOff size={16} aria-hidden="true" />
              Offline · saved list
            </span>
          ) : (
            hotlines.length > 0 && (
              <span className="fw-chip fw-chip--normal">
                <CircleCheck size={16} aria-hidden="true" />
                Saved for offline
              </span>
            )
          ))}
      </div>
      {error && <p className="notice notice--danger">{error.message}</p>}
      {loading && <p className="loading">Loading…</p>}
      {GROUPS.map((g, gi) => {
        const items = hotlines.filter((h) => h.category === g.key);
        if (!items.length) return null;
        return (
          <section key={g.key} className="section" aria-labelledby={`hl-${g.key}`}>
            <h2 id={`hl-${g.key}`} className={`section-title fw-rise fw-d${gi + 1}`}>
              {g.title}
            </h2>
            <div className="grid-cards">
              {items.map((h, i) => (
                <HotlineCard
                  key={h.id}
                  hotline={h}
                  primary={h.id === primaryId}
                  className={`fw-rise fw-d${Math.min(gi + i + 1, 6)}`}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
