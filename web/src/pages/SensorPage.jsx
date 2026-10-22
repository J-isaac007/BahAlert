import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import AlertTable from '../components/alerts/AlertTable.jsx';
import EtaCard from '../components/sensor/EtaCard.jsx';
import LevelChart from '../components/sensor/LevelChart.jsx';
import StatCard from '../components/sensor/StatCard.jsx';
import WaterGauge from '../components/sensor/WaterGauge.jsx';
import OnlineBadge from '../components/ui/OnlineBadge.jsx';
import RangePicker, { RANGES } from '../components/ui/RangePicker.jsx';
import { useAlerts } from '../hooks/useAlerts.js';
import { useReadings } from '../hooks/useReadings.js';
import { useSensor } from '../hooks/useSensor.js';
import { downloadCsv, toCsv } from '../lib/csv.js';
import { computeRate, minutesToOverflow } from '../lib/flood.js';

const STATUS_TEXT = { green: 'Normal', yellow: 'Warning — water rising', red: 'DANGER — prepare to evacuate', offline: 'Sensor offline' };

const CSV_COLUMNS = [
  { key: 'ts', label: 'time', format: (ts) => new Date(ts).toISOString() },
  { key: 'levelCm', label: 'level_cm' },
  { key: 'distanceCm', label: 'distance_cm' },
  { key: 'tempC', label: 'temp_c' },
];

export default function SensorPage() {
  const { id } = useParams();
  const { sensor, loading, error } = useSensor(id);
  const [range, setRange] = useState('1h');
  // TODO: downsample long ranges (7d at 5 s = ~120k points) before charting
  const { readings } = useReadings(id, RANGES[range]);
  const { alerts } = useAlerts(id);

  const rate = useMemo(() => computeRate(readings), [readings]);
  const summary = useMemo(() => {
    if (!readings.length) return null;
    const levels = readings.map((r) => r.levelCm);
    return {
      min: Math.min(...levels),
      max: Math.max(...levels),
      avg: levels.reduce((a, b) => a + b, 0) / levels.length,
    };
  }, [readings]);

  if (loading) return <p className="page">Loading…</p>;
  if (error) return <p className="page notice">{error.message}</p>;
  if (!sensor) return <p className="page">Sensor not found. <Link to="/">Back to map</Link></p>;

  const level = sensor.live?.levelCm;
  const eta = minutesToOverflow(level, rate, sensor.config.dangerCm);

  return (
    <main className="page">
      <Link to="/">← Map</Link>
      <h1>{sensor.name}</h1>
      <p className="muted">{sensor.barangay}</p>

      <div className={`status-banner status-${sensor.status}`}>{STATUS_TEXT[sensor.status]}</div>
      <OnlineBadge sensor={sensor} />

      <section className="sensor-top">
        <WaterGauge levelCm={level} status={sensor.status} config={sensor.config} />
        <div className="stat-grid">
          <EtaCard eta={eta} rate={rate} />
          <StatCard label="Water temp" value={sensor.live?.tempC != null ? `${sensor.live.tempC.toFixed(1)} °C` : '—'} />
          {summary && (
            <>
              <StatCard label={`Max (${range})`} value={`${summary.max.toFixed(1)} cm`} />
              <StatCard label={`Average (${range})`} value={`${summary.avg.toFixed(1)} cm`} />
            </>
          )}
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>History</h2>
          <RangePicker value={range} onChange={setRange} />
          <button
            type="button"
            className="btn"
            disabled={!readings.length}
            onClick={() => downloadCsv(`${sensor.id}-${range}.csv`, toCsv(readings, CSV_COLUMNS))}
          >
            Export CSV
          </button>
        </div>
        <LevelChart readings={readings} config={sensor.config} />
      </section>

      <section>
        <h2>Alert log</h2>
        <AlertTable alerts={alerts} />
      </section>
    </main>
  );
}
