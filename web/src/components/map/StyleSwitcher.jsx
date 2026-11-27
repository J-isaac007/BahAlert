import { Check } from 'lucide-react';
import { BASE_STYLES } from '../../lib/mapStyles.js';

export default function StyleSwitcher({ value, onChange }) {
  return (
    <fieldset className="modes-group">
      <legend className="fw-over">Base map</legend>
      <div className="modes-bases" role="radiogroup" aria-label="Base map">
        {Object.entries(BASE_STYLES).map(([key, s]) => (
          <button
            key={key}
            type="button"
            className="fw-choice"
            role="radio"
            aria-checked={value === key}
            onClick={() => onChange(key)}
          >
            <span className="fw-choice__swatch" aria-hidden="true" style={{ background: s.swatch }} />
            {s.label}
            <Check size={18} strokeWidth={2.5} className="fw-choice__check" aria-hidden="true" />
          </button>
        ))}
      </div>
    </fieldset>
  );
}
