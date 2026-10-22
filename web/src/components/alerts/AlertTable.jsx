const fmt = (ts) => new Date(ts).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });

// sensorNames: optional { deviceId: name } to show a Sensor column
export default function AlertTable({ alerts, sensorNames }) {
  if (!alerts.length) return <p className="muted">No alerts yet.</p>;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Time</th>
            {sensorNames && <th>Sensor</th>}
            <th>Change</th>
            <th>Level</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((a) => (
            <tr key={`${a.deviceId}-${a.id}`}>
              <td>{fmt(a.ts)}</td>
              {sensorNames && <td>{sensorNames[a.deviceId] ?? a.deviceId}</td>}
              <td>
                <span className={`dot dot-${a.from}`} /> {a.from} → <span className={`dot dot-${a.to}`} /> {a.to}
              </td>
              <td>{a.levelCm?.toFixed(1)} cm</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
