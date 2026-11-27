import { Marker } from 'react-map-gl/mapbox';
import { StatusIcon, STATUS_LABEL, toneOf } from '../../ui/Status.jsx';

// "Sensor 2 — Bridge" -> "Sensor 2"
const shortName = (name) => name.split(' — ')[0];
const levelText = (s) => (s.online ? `${Math.round(s.live.levelCm)} cm` : 'Offline');

// HTML pins (icon + word + colour) so they stay focusable and readable. Few sensors per barangay, so Markers are cheap.
export default function SensorLayer({ sensors, visible, selectedId, showNames, onSelect }) {
  if (!visible) return null;
  return sensors.map((s) => {
    const tone = toneOf(s.status);
    const label = showNames ? `${shortName(s.name)} · ${levelText(s)}` : levelText(s);
    return (
      <Marker
        key={s.id}
        longitude={s.lng}
        latitude={s.lat}
        anchor="top"
        offset={[0, -18]}
        style={{ zIndex: selectedId === s.id ? 3 : 2 }}
        onClick={(e) => {
          e.originalEvent.stopPropagation();
          onSelect?.(selectedId === s.id ? null : { kind: 'sensor', id: s.id });
        }}
      >
        <button
          type="button"
          className="fw-pinbtn"
          aria-pressed={selectedId === s.id}
          aria-label={`${s.name}: ${STATUS_LABEL[s.status] ?? 'Offline'}, ${levelText(s)}`}
        >
          <span className={`fw-pin fw-pin--${tone}`}>
            <StatusIcon tone={tone} />
          </span>
          <span className="fw-pin__label">{label}</span>
        </button>
      </Marker>
    );
  });
}
