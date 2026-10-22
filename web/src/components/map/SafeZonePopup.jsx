export default function SafeZonePopup({ zone, onNavigate }) {
  return (
    <div className="popup">
      <strong>{zone.name}</strong>
      <div className="muted">
        {zone.type} · capacity {zone.capacity ?? '?'}
      </div>
      {zone.address && <div>{zone.address}</div>}
      {zone.contact && <a href={`tel:${zone.contact}`}>Call {zone.contact}</a>}
      {zone.active === false ? (
        <div className="muted">Not open right now</div>
      ) : (
        <button type="button" className="btn btn-primary" onClick={onNavigate}>
          Navigate here
        </button>
      )}
    </div>
  );
}
