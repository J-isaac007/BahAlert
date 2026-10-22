const km = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`);
const min = (s) => `${Math.max(1, Math.round(s / 60))} min`;

// Bottom sheet with route summary + turn list
export default function RouteSheet({ result, loading, error, profile, onProfileChange, onClose }) {
  if (!result && !loading && !error) return null;

  return (
    <section className="route-sheet" aria-live="polite">
      <header>
        <strong>{loading ? 'Finding safe route…' : result ? `To ${result.zone.name}` : 'No route'}</strong>
        <button type="button" className="btn" onClick={onClose} aria-label="Close route">✕</button>
      </header>

      <div className="route-profile">
        {['walking', 'driving'].map((p) => (
          <button
            key={p}
            type="button"
            className={`btn ${profile === p ? 'btn-primary' : ''}`}
            onClick={() => onProfileChange(p)}
          >
            {p === 'walking' ? 'Walk' : 'Drive'}
          </button>
        ))}
      </div>

      {error && <p className="error">{error.message}</p>}

      {result && (
        <>
          <p>
            {km(result.route.distanceM)} · {min(result.route.durationS)}
            {result.provider === 'ors' && <span className="muted"> · flood-avoiding route</span>}
          </p>
          {!result.safe && <p className="error">Warning: every route found passes a flooded area. Go with care.</p>}
          <ol className="route-steps">
            {result.route.steps.map((s, i) => (
              <li key={i}>
                {s.instruction} <span className="muted">{km(s.distanceM)}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
