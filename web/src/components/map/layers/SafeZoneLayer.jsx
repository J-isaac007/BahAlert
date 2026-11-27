import { ShieldCheck } from 'lucide-react';
import { Marker } from 'react-map-gl/mapbox';

// TODO: cluster when zones grow past ~30
export default function SafeZoneLayer({ safeZones, visible, selectedId, targetId, onSelect }) {
  if (!visible) return null;
  return safeZones.map((z) => {
    const open = z.active !== false;
    const target = targetId === z.id;
    return (
      <Marker
        key={z.id}
        longitude={z.lng}
        latitude={z.lat}
        anchor="top"
        offset={[0, target ? -24 : -20]}
        style={{ zIndex: target || selectedId === z.id ? 3 : 1 }}
        onClick={(e) => {
          e.originalEvent.stopPropagation();
          onSelect?.(selectedId === z.id ? null : { kind: 'zone', id: z.id });
        }}
      >
        <button
          type="button"
          className="fw-pinbtn"
          aria-pressed={selectedId === z.id}
          aria-label={`Safe zone: ${z.name}${open ? '' : ' (closed)'}`}
        >
          <span
            className={`fw-pin ${open ? 'fw-pin--safe' : 'fw-pin--offline'} ${target ? 'fw-pin--active' : ''}`}
            style={open ? undefined : { width: 32, height: 32 }}
          >
            <ShieldCheck size={18} aria-hidden="true" />
          </span>
          <span className="fw-pin__label" style={target ? { marginTop: 8 } : undefined}>
            {z.name}
          </span>
        </button>
      </Marker>
    );
  });
}
