import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { StatusChip } from '../ui/Status.jsx';

const fmt = (ts) => new Date(ts).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
const time = (ts) => new Date(ts).toLocaleTimeString('en-PH', { timeStyle: 'short' });
const dayKey = (ts) => new Date(ts).toDateString();

function dayLabel(ts) {
  const d = new Date(ts);
  const date = d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86_400_000);
  if (d.toDateString() === today.toDateString()) return `Today · ${date}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday · ${date}`;
  return d.toLocaleDateString('en-PH', { weekday: 'long', month: 'short', day: 'numeric' });
}

const Change = ({ a }) => (
  <>
    <StatusChip status={a.from} icon={false} />
    <ChevronRight size={16} className="alert-arrow" aria-label="to" />
    <StatusChip status={a.to} icon={false} />
  </>
);

// Rows grouped by day (mobile)
function AlertList({ alerts, sensorNames }) {
  const groups = [];
  for (const a of alerts) {
    const last = groups[groups.length - 1];
    if (last && last.key === dayKey(a.ts)) last.items.push(a);
    else groups.push({ key: dayKey(a.ts), label: dayLabel(a.ts), items: [a] });
  }
  return groups.map((g) => (
    <section key={g.key} className="alert-group" aria-label={g.label}>
      <h3 className="fw-over">{g.label}</h3>
      <div className="list-box">
        {g.items.map((a) => (
          <div key={`${a.deviceId}-${a.id}`} className="fw-alert">
            <div className="fw-alert__body">
              <div className="fw-alert__change">
                <Change a={a} />
              </div>
              <span className="fw-caption">
                {sensorNames ? `${sensorNames[a.deviceId] ?? a.deviceId} · ` : ''}
                {time(a.ts)}
              </span>
            </div>
            <span className="fw-alert__level">{a.levelCm?.toFixed(0)} cm</span>
          </div>
        ))}
      </div>
    </section>
  ));
}

// sensorNames: optional { deviceId: name } to show a Sensor column
export default function AlertTable({ alerts, sensorNames }) {
  if (!alerts.length) return <p className="empty">No alerts yet.</p>;
  return (
    <>
      <div className="table-box only-desktop">
        <table className="fw-table" style={{ minWidth: sensorNames ? 640 : 480 }}>
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
                <td style={{ whiteSpace: 'nowrap' }}>{fmt(a.ts)}</td>
                {sensorNames && (
                  <td>
                    <Link to={`/sensor/${a.deviceId}`}>{sensorNames[a.deviceId] ?? a.deviceId}</Link>
                  </td>
                )}
                <td>
                  <span className="fw-alert__change" style={{ flexWrap: 'nowrap' }}>
                    <Change a={a} />
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>{a.levelCm?.toFixed(1)} cm</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="only-mobile fw-col">
        <AlertList alerts={alerts} sensorNames={sensorNames} />
      </div>
    </>
  );
}
