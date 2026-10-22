import { BASE_STYLES } from '../../lib/mapStyles.js';

export default function StyleSwitcher({ value, onChange }) {
  return (
    <fieldset className="map-panel-group">
      <legend>Map</legend>
      {Object.entries(BASE_STYLES).map(([key, s]) => (
        <label key={key}>
          <input type="radio" name="base-style" checked={value === key} onChange={() => onChange(key)} />
          {s.label}
        </label>
      ))}
    </fieldset>
  );
}
