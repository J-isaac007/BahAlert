import { Car, ChevronLeft, CircleCheck, Clock, Footprints, LoaderCircle, Navigation, Phone, TriangleAlert, X } from 'lucide-react';
import { Link } from 'react-router';
import { km, minutes, zoneSummary } from '../../lib/zones.js';

// Shown instead of a route: we never send people through a red zone.
const NO_ROUTE = {
  blocked:
    'Every road we found to a safe zone passes through a flooded area, so we are not showing a route. Stay on high ground, away from the water, and call for help.',
  zoneFlooded: 'This safe zone is inside a flooded area right now. Pick another safe zone, or call for help.',
};

const PROFILES = [
  ['walking', 'Walk', Footprints],
  ['driving', 'Drive', Car],
];

// Route summary + turn list. variant "sheet" = mobile bottom sheet, "panel" = desktop side panel.
export default function RouteSheet({ result, loading, error, profile, onProfileChange, onClose, variant = 'sheet' }) {
  if (!result && !loading && !error) return null;
  const panel = variant === 'panel';

  const route = result?.route;
  let title = 'No route found';
  if (loading && !result) title = 'Finding a safe route…';
  else if (route) title = result.zone.name;
  else if (result) title = 'No flood-free route';

  const body = (
    <>
      {route && (
        <div className="fw-sheet__summary">
          <span>
            <Clock size={18} aria-hidden="true" />
            {minutes(route.durationS)}
          </span>
          <span>
            <Navigation size={18} aria-hidden="true" />
            {km(route.distanceM)}
          </span>
          <span className="fw-chip fw-chip--normal" style={{ marginLeft: 'auto' }}>
            <CircleCheck size={16} aria-hidden="true" />
            Avoids floods
          </span>
        </div>
      )}

      <div className="fw-seg" role="radiogroup" aria-label="Travel mode" style={{ alignSelf: 'flex-start' }}>
        {PROFILES.map(([p, label, Icon]) => (
          <button key={p} type="button" role="radio" aria-checked={profile === p} onClick={() => onProfileChange(p)}>
            <Icon size={18} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="fw-warnrow" role="alert">
          <TriangleAlert size={18} aria-hidden="true" style={{ flex: 'none' }} />
          {error.message}
        </div>
      )}

      {result && !route && (
        <>
          <div className="fw-warnrow" role="alert">
            <TriangleAlert size={18} aria-hidden="true" style={{ flex: 'none' }} />
            {NO_ROUTE[result.reason] ?? NO_ROUTE.blocked}
          </div>
          <Link className="fw-btn fw-btn--secondary" to="/hotlines" style={{ alignSelf: 'flex-start' }}>
            <Phone size={20} aria-hidden="true" />
            Call for help
          </Link>
        </>
      )}

      {route && (
        <ol className="fw-steps">
          {route.steps.map((s, i) => (
            <li key={i}>
              <span>{s.instruction}</span>
              <span>{km(s.distanceM)}</span>
            </li>
          ))}
        </ol>
      )}

      {panel && route && result.zone.contact && (
        <a className="fw-btn fw-btn--secondary" href={`tel:${result.zone.contact}`}>
          <Phone size={20} aria-hidden="true" />
          Call {result.zone.name}
        </a>
      )}
    </>
  );

  if (panel) {
    return (
      <div className="fw-col" aria-live="polite" style={{ gap: 20 }}>
        <button type="button" className="fw-btn fw-btn--ghost" onClick={onClose} style={{ alignSelf: 'flex-start', padding: '0 8px' }}>
          <ChevronLeft size={20} aria-hidden="true" />
          Close route
        </button>
        <div className="fw-rise">
          <span className="fw-over">Nearest safe zone</span>
          <h2 className="fw-h2" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading && <LoaderCircle size={22} className="fw-spin" aria-hidden="true" />}
            {title}
          </h2>
          {route && <p className="fw-body-s" style={{ marginTop: 4 }}>{zoneSummary(result.zone)}</p>}
        </div>
        {body}
      </div>
    );
  }

  return (
    <section className="fw-sheet map-sheet" aria-live="polite">
      <div className="fw-sheet__grip" />
      <div className="fw-sheet__head">
        <div>
          <span className="fw-over">Nearest safe zone</span>
          <h2 className="fw-h3" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading && <LoaderCircle size={18} className="fw-spin" aria-hidden="true" />}
            {title}
          </h2>
        </div>
        <button type="button" className="fw-iconbtn" onClick={onClose} aria-label="Close route">
          <X size={22} aria-hidden="true" />
        </button>
      </div>
      {body}
    </section>
  );
}
