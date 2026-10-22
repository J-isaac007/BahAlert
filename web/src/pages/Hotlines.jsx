import HotlineCard from '../components/ui/HotlineCard.jsx';
import { useHotlines } from '../hooks/useHotlines.js';

const GROUPS = [
  { key: 'national', title: 'National' },
  { key: 'city', title: 'City / Municipality' },
  { key: 'barangay', title: 'Barangay' },
];

export default function Hotlines() {
  const { hotlines, loading, error, cached } = useHotlines();

  return (
    <main className="page">
      <h1>Emergency Hotlines</h1>
      <p className="muted">Tap to call. This page works without internet once opened.</p>
      {cached && <p className="notice">Offline — showing saved list.</p>}
      {error && <p className="notice">{error.message}</p>}
      {loading && <p>Loading…</p>}
      {GROUPS.map((g) => {
        const items = hotlines.filter((h) => h.category === g.key);
        if (!items.length) return null;
        return (
          <section key={g.key}>
            <h2>{g.title}</h2>
            <div className="list">
              {items.map((h) => (
                <HotlineCard key={h.id} hotline={h} />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
