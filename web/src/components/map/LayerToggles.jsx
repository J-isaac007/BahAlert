import { Droplet, Navigation, OctagonAlert, ShieldCheck } from 'lucide-react';
import { OVERLAYS } from '../../lib/mapStyles.js';

const ICONS = { flood: OctagonAlert, safeZones: ShieldCheck, heatmap: Droplet, route: Navigation };

export default function LayerToggles({ value, onChange }) {
  return (
    <fieldset className="modes-group">
      <legend className="fw-over" style={{ marginBottom: 4 }}>
        Layers
      </legend>
      {Object.entries(OVERLAYS).map(([key, { label, hint }]) => {
        const Icon = ICONS[key];
        return (
          <div key={key} className="modes-layer">
            <span className={`modes-layer__icon ${key === 'flood' ? 'modes-layer__icon--danger' : ''}`}>
              <Icon size={18} aria-hidden="true" />
            </span>
            <div className="modes-layer__text">
              <div className="fw-strong">{label}</div>
              <div className="fw-body-s">{hint}</div>
            </div>
            <button
              type="button"
              className="fw-switch"
              role="switch"
              aria-checked={Boolean(value[key])}
              aria-label={label}
              onClick={() => onChange({ ...value, [key]: !value[key] })}
            >
              <span className="fw-switch__thumb" />
            </button>
          </div>
        );
      })}
    </fieldset>
  );
}
