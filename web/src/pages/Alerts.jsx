import { useMemo, useState } from 'react';
import AlertTable from '../components/alerts/AlertTable.jsx';
import { useAlerts } from '../hooks/useAlerts.js';
import { useSensors } from '../hooks/useSensors.js';

export default function Alerts() {
  const { alerts, loading, error } = useAlerts();
  const { sensors } = useSensors();
  const [filter, setFilter] = useState('all');

  const sensorNames = useMemo(() => Object.fromEntries(sensors.map((s) => [s.id, s.name])), [sensors]);
  const shown = filter === 'all' ? alerts : alerts.filter((a) => a.to === filter);

  return (
    <main className="page">
      <div className="section-head">
        <h1>Alert Log</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter alerts">
          <option value="all">All</option>
          <option value="red">Turned red</option>
          <option value="yellow">Turned yellow</option>
          <option value="green">Back to green</option>
        </select>
      </div>
      {error && <p className="notice">{error.message}</p>}
      {loading ? <p>Loading…</p> : <AlertTable alerts={shown} sensorNames={sensorNames} />}
    </main>
  );
}
