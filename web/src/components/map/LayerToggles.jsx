import { OVERLAYS } from '../../lib/mapStyles.js';

export default function LayerToggles({ value, onChange }) {
  return (
    <fieldset className="map-panel-group">
      <legend>Layers</legend>
      {Object.entries(OVERLAYS).map(([key, label]) => (
        <label key={key}>
          <input type="checkbox" checked={Boolean(value[key])} onChange={(e) => onChange({ ...value, [key]: e.target.checked })} />
          {label}
        </label>
      ))}
    </fieldset>
  );
}
