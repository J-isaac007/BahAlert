import { Navigation, Phone, X } from 'lucide-react';
import { zoneSummary } from '../../lib/zones.js';
import { StatusChip } from '../ui/Status.jsx';

export default function SafeZonePopup({ zone, onNavigate, onClose, className = '' }) {
  const open = zone.active !== false;
  return (
    <section className={`fw-popup fw-glass ${className}`} aria-labelledby={`zone-${zone.id}`} style={{ gap: 12 }}>
      <div className="map-card__head">
        <div>
          <span className="fw-over">Safe zone</span>
          <h2 id={`zone-${zone.id}`} className="fw-h3">
            {zone.name}
          </h2>
          <span className="fw-caption">{zoneSummary(zone)}</span>
        </div>
        {onClose && (
          <button type="button" className="fw-iconbtn" aria-label="Close" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </button>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span className="fw-body-s">{zone.address}</span>
        <StatusChip tone={open ? 'normal' : 'offline'} label={open ? 'Open' : 'Closed'} icon={false} />
      </div>
      {open ? (
        <div className="fw-card__actions">
          {zone.contact && (
            <a className="fw-btn fw-btn--secondary" href={`tel:${zone.contact}`}>
              <Phone size={20} aria-hidden="true" />
              Call
            </a>
          )}
          <button type="button" className="fw-btn fw-btn--primary" onClick={onNavigate}>
            <Navigation size={20} aria-hidden="true" />
            Route
          </button>
        </div>
      ) : (
        <p className="fw-body-s">Not open as a shelter right now.</p>
      )}
    </section>
  );
}
