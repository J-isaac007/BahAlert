import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { BellRing } from 'lucide-react';
import AlertTable from '../components/alerts/AlertTable.jsx';
import { useAlerts } from '../hooks/useAlerts.js';
import { useResident } from '../hooks/useResident.js';
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
  const { rid } = useResident();
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

      <section className="panel alerts-cta fw-rise fw-d1" aria-labelledby="alerts-cta">
        <BellRing size={28} aria-hidden="true" style={{ color: 'var(--accent)', flex: 'none' }} />
        <div>
          <h2 id="alerts-cta" className="fw-h3">
            {rid ? 'You get flood alerts' : 'Get these alerts on your phone'}
          </h2>
          <p className="fw-body-s">
            {rid
              ? 'Change your sensors or turn on Telegram any time.'
              : 'Free text message or Telegram alert when the water rises at sensors near you.'}
          </p>
        </div>
        <Link to={rid ? '/account' : '/alerts/get'} className={`fw-btn ${rid ? 'fw-btn--secondary' : 'fw-btn--primary'}`}>
          {rid ? 'My alerts' : 'Sign up with your number'}
        </Link>
      </section>

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
