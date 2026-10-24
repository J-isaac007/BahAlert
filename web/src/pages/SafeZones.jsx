import { useMemo } from 'react';
import { Link } from 'react-router';
import { LocateFixed, Navigation, OctagonAlert, Phone, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation.js';
import { useSafeZones } from '../hooks/useSafeZones.js';
import { useSensors } from '../hooks/useSensors.js';
import { STATUS } from '../lib/flood.js';
import { distanceM } from '../lib/geo.js';
import { km, walkMinutes, zoneSummary } from '../lib/zones.js';

// open < rising < danger < closed: usable zones first
const RANK = { open: 0, rising: 1, danger: 2, closed: 3 };

// Is a flagged sensor's zone covering this safe zone?
function zoneState(z, sensors) {
  if (z.active === false) return { state: 'closed' };
  const near = (st) =>
    sensors.find((s) => s.status === st && distanceM([z.lng, z.lat], [s.lng, s.lat]) <= s.radiusM);
  const red = near(STATUS.RED);
  if (red) return { state: 'danger', sensor: red };
  const yellow = near(STATUS.YELLOW);
  if (yellow) return { state: 'rising', sensor: yellow };
  return { state: 'open' };
}

function ZoneCard({ zone, delay }) {
  const { state, sensor, d } = zone;
  const callBtn = (label) =>
    zone.contact && (
      <a className="fw-btn fw-btn--secondary" href={`tel:${zone.contact}`}>
        <Phone size={20} aria-hidden="true" />
        {label}
      </a>
    );

  return (
    <article
      className={`fw-card fw-rise fw-d${Math.min(delay, 6)}`}
      style={state === 'rising' ? { borderColor: 'var(--status-warning-text)' } : state === 'danger' ? { borderColor: 'var(--status-danger-text)' } : undefined}
    >
      <div className="fw-card__head">
        <div className="fw-card__title">
          <span className={`fw-card__badge ${state === 'closed' ? 'zone-badge--off' : ''}`}>
            <ShieldCheck size={22} aria-hidden="true" />
          </span>
          <div>
            <h2 className="fw-card__name">{zone.name}</h2>
            <div className="fw-meta">
              <span>{zoneSummary(zone)}</span>
              {d != null && <span>{state === 'open' ? `${km(d)} · ${walkMinutes(d)}` : km(d)}</span>}
            </div>
          </div>
        </div>
        {state === 'open' && <span className="fw-chip fw-chip--normal">Open</span>}
        {state === 'rising' && (
          <span className="fw-chip fw-chip--warning">
            <TriangleAlert size={16} aria-hidden="true" />
            Water rising
          </span>
        )}
        {state === 'danger' && (
          <span className="fw-chip fw-chip--danger">
            <OctagonAlert size={16} aria-hidden="true" />
            In danger zone
          </span>
        )}
        {state === 'closed' && <span className="fw-chip fw-chip--offline">Closed</span>}
      </div>

      {zone.address && state === 'open' && <p className="fw-body-s">{zone.address}</p>}
      {state === 'rising' && (
        <p className="fw-body-s">{sensor.name} nearby is at warning level. Call before going, or choose a zone above.</p>
      )}
      {state === 'danger' && <p className="fw-body-s">{sensor.name} nearby is at danger level. Do not go here now.</p>}
      {state === 'closed' && <p className="fw-body-s">Not open as a shelter right now.</p>}

      {state === 'open' && (
        <div className="fw-card__actions">
          {callBtn('Call')}
          <Link className="fw-btn fw-btn--primary" to={`/?to=${zone.id}`}>
            <Navigation size={20} aria-hidden="true" />
            Navigate
          </Link>
        </div>
      )}
      {state === 'rising' && zone.contact && <div className="fw-card__actions">{callBtn('Call first')}</div>}
    </article>
  );
}

export default function SafeZones() {
  const { safeZones, loading, error } = useSafeZones();
  const { sensors } = useSensors();
  const { position } = useGeolocation();

  const sorted = useMemo(
    () =>
      safeZones
        .map((z) => ({ ...z, ...zoneState(z, sensors), d: position ? distanceM(position, [z.lng, z.lat]) : null }))
        .sort((a, b) => RANK[a.state] - RANK[b.state] || (a.d ?? 0) - (b.d ?? 0)),
    [safeZones, sensors, position],
  );

  return (
    <div className="page page--wide">
      <div className="fw-rise">
        <h1 className="page-title">Safe zones</h1>
        <p className="fw-body-s" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <LocateFixed size={16} aria-hidden="true" />
          {position
            ? 'Pre-registered evacuation centers, schools and courts. Sorted by distance from you.'
            : 'Allow location to sort by distance from you.'}
        </p>
      </div>
      {error && <p className="notice notice--danger">{error.message}</p>}
      {loading && <p className="loading">Loading…</p>}
      {!loading && !sorted.length && <p className="empty">No safe zones registered yet.</p>}
      <div className="grid-cards">
        {sorted.map((z, i) => (
          <ZoneCard key={z.id} zone={z} delay={i + 1} />
        ))}
      </div>
    </div>
  );
}
