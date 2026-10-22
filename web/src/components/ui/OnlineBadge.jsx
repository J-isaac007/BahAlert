const ago = (ts) => {
  const s = Math.round((Date.now() - ts) / 1000);
  return s < 60 ? `${s}s ago` : `${Math.round(s / 60)} min ago`;
};

export default function OnlineBadge({ sensor }) {
  if (!sensor.live) return <span className="badge badge-offline">No data yet</span>;
  return (
    <span className={`badge ${sensor.online ? 'badge-online' : 'badge-offline'}`}>
      {sensor.online ? 'Live' : 'Offline'} · {ago(sensor.live.ts)}
    </span>
  );
}
