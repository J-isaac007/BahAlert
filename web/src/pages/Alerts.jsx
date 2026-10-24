import { useMemo, useState } from 'react';
import AlertTable from '../components/alerts/AlertTable.jsx';
import { useAlerts } from '../hooks/useAlerts.js';
import { useSensors } from '../hooks/useSensors.js';

const FILTERS = [
  ['all', 'All'],
  ['red', 'Turned red'],
  ['yellow', 'Turned yellow'],
  ['green', 'Back to green'],
];

export default function Alerts() {
  const { alerts, loading, error } = useAlerts();
  const { sensors } = useSensors();
  const [filter, setFilter] = useState('all');

  const sensorNames = useMemo(() => Object.fromEntries(sensors.map((s) => [s.id, s.name])), [sensors]);
  const shown = filter === 'all' ? alerts : alerts.filter((a) => a.to === filter);
  const count = `${shown.length} ${shown.length === 1 ? 'match' : 'matches'}`;

  return (
    <div className="page">
      <div className="page-head fw-rise">
        <div>
          <h1 className="page-title">Alert log</h1>
          <p className="fw-body-s">Every time a sensor changes colour, newest first.</p>
        </div>
        <div className="fw-seg only-desktop" role="radiogroup" aria-label="Filter alerts" style={{ flexWrap: 'wrap' }}>
          {FILTERS.map(([key, label]) => (
            <button key={key} type="button" role="radio" aria-checked={filter === key} onClick={() => setFilter(key)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="fw-col only-mobile" style={{ gap: 8 }}>
        <div className="filter-row fw-rise fw-d1" role="radiogroup" aria-label="Filter alerts">
          {FILTERS.map(([key, label]) => (
            <button key={key} type="button" className="fw-filter" role="radio" aria-checked={filter === key} onClick={() => setFilter(key)}>
              {label}
            </button>
          ))}
        </div>
        <span className="fw-caption" role="status">
          {count}
        </span>
      </div>

      {error && <p className="notice notice--danger">{error.message}</p>}
      {loading ? (
        <p className="loading">Loading…</p>
      ) : (
        <div className="fw-rise fw-d2 fw-col" style={{ gap: 20 }}>
          <AlertTable alerts={shown} sensorNames={sensorNames} />
        </div>
      )}
      <p className="fw-caption only-desktop" role="status">
        {count} · Showing the newest changes. Older alerts are kept in the database.
      </p>
    </div>
  );
}
