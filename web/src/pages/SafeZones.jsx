import { useMemo } from 'react';
import { Link } from 'react-router';
import { useGeolocation } from '../hooks/useGeolocation.js';
import { useSafeZones } from '../hooks/useSafeZones.js';
import { distanceM } from '../lib/geo.js';

const km = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`);

export default function SafeZones() {
  const { safeZones, loading, error } = useSafeZones();
  const { position } = useGeolocation();

  const sorted = useMemo(() => {
    const withDist = safeZones.map((z) => ({ ...z, d: position ? distanceM(position, [z.lng, z.lat]) : null }));
    return position ? withDist.sort((a, b) => a.d - b.d) : withDist;
  }, [safeZones, position]);

  return (
    <main className="page">
      <h1>Safe Zones</h1>
      <p className="muted">{position ? 'Sorted by distance from you.' : 'Allow location to sort by distance.'}</p>
      {error && <p className="notice">{error.message}</p>}
      {loading && <p>Loading…</p>}
      <div className="list">
        {sorted.map((z) => (
          <article key={z.id} className="card zone">
            <div>
              <strong>{z.name}</strong>
              <div className="muted">
                {z.type} · capacity {z.capacity ?? '?'} {z.d != null && `· ${km(z.d)}`}
              </div>
              {z.address && <div>{z.address}</div>}
              {z.active === false && <div className="error">Closed right now</div>}
            </div>
            <div className="zone-actions">
              {z.contact && <a className="btn" href={`tel:${z.contact}`}>Call</a>}
              {z.active !== false && <Link className="btn btn-primary" to={`/?to=${z.id}`}>Navigate</Link>}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
