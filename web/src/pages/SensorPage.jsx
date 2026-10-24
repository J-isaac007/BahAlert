import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ChevronLeft, Clock, Download, Navigation, OctagonAlert, Thermometer, TriangleAlert, WifiOff } from 'lucide-react';
import AlertTable from '../components/alerts/AlertTable.jsx';
import EtaCard from '../components/sensor/EtaCard.jsx';
import LevelChart from '../components/sensor/LevelChart.jsx';
import StatCard from '../components/sensor/StatCard.jsx';
import WaterGauge, { gaugeLines } from '../components/sensor/WaterGauge.jsx';
import OnlineBadge from '../components/ui/OnlineBadge.jsx';
import RangePicker, { RANGES } from '../components/ui/RangePicker.jsx';
import { StatusChip, timeAgo } from '../components/ui/Status.jsx';
import { useAlerts } from '../hooks/useAlerts.js';
import { useReadings } from '../hooks/useReadings.js';
import { useSensor } from '../hooks/useSensor.js';
import { downloadCsv, toCsv } from '../lib/csv.js';
import { computeRate, minutesToOverflow, STATUS } from '../lib/flood.js';

const CSV_COLUMNS = [
  { key: 'ts', label: 'time', format: (ts) => new Date(ts).toISOString() },
  { key: 'levelCm', label: 'level_cm' },
  { key: 'distanceCm', label: 'distance_cm' },
  { key: 'tempC', label: 'temp_c' },
];

const clock = (ts) => new Date(ts).toLocaleTimeString('en-PH', { timeStyle: 'short' });

// Full-width strip under the title. Nothing when the water is normal.
function StatusStrip({ sensor, alerts }) {
  const { status, config } = sensor;
  if (status === STATUS.GREEN) return null;
  if (status === STATUS.OFFLINE) {
    return (
      <div className="danger-strip danger-strip--offline" role="status">
        <WifiOff size={28} aria-hidden="true" style={{ flex: 'none' }} />
        <div className="danger-strip__text">
          <div className="fw-h3">Sensor offline</div>
          <div>No reading for over a minute. Do not assume it is safe.</div>
        </div>
      </div>
    );
  }
  const red = status === STATUS.RED;
  const since = alerts.find((a) => a.to === status);
  const line = red ? config.redCm : config.yellowCm;
  return (
    <div className={`danger-strip ${red ? 'danger-strip--danger fw-alarm' : 'danger-strip--warning'}`} role="status">
      {red ? (
        <OctagonAlert size={28} aria-hidden="true" style={{ flex: 'none' }} />
      ) : (
        <TriangleAlert size={28} aria-hidden="true" style={{ flex: 'none' }} />
      )}
      <div className="danger-strip__text">
        <div className="fw-h3">{red ? 'Danger — prepare to evacuate' : 'Warning — water rising'}</div>
        <div>
          Water passed the {red ? 'red' : 'yellow'} line{Number.isFinite(line) ? ` (${line} cm)` : ''}
          {since ? ` ${timeAgo(since.ts)}` : ''}.{red ? '' : ' Get your family and documents ready.'}
        </div>
      </div>
      {red && (
        <Link className="fw-btn" to="/?to=nearest">
          <Navigation size={20} aria-hidden="true" />
          Route to safety
        </Link>
      )}
    </div>
  );
}

export default function SensorPage() {
  const { id } = useParams();
  const { sensor, loading, error } = useSensor(id);
  const [range, setRange] = useState('1h');
  // TODO: downsample long ranges (7d at 5 s = ~120k points) before charting
  const { readings } = useReadings(id, RANGES[range]);
  const { alerts } = useAlerts(id);

  const rate = useMemo(() => computeRate(readings), [readings]);
  const peak = useMemo(
    () => readings.reduce((best, r) => (best && best.levelCm >= r.levelCm ? best : r), null),
    [readings],
  );

  if (loading) return <p className="loading">Loading…</p>;
  if (error) return <div className="page"><p className="notice notice--danger">{error.message}</p></div>;
  if (!sensor) {
    return (
      <div className="page">
        <p className="empty">
          Sensor not found. <Link to="/">Back to map</Link>
        </p>
      </div>
    );
  }

  const level = sensor.live?.levelCm;
  // Offline: the last readings are stale, so no rate or overflow estimate (same as the map popup)
  const liveRate = sensor.online ? rate : null;
  const eta = sensor.online ? minutesToOverflow(level, rate, sensor.config.dangerCm) : { kind: 'unknown', minutes: null };
  const tempC = sensor.live?.tempC;
  const csv = () => downloadCsv(`${sensor.id}-${range}.csv`, toCsv(readings, CSV_COLUMNS));

  return (
    <>
      <header className="mobile-head only-mobile">
        <Link className="fw-iconbtn" to="/" aria-label="Back to map">
          <ChevronLeft size={24} aria-hidden="true" />
        </Link>
        Sensor details
      </header>

      <div className="page">
        <Link to="/" className="back-link only-desktop">
          <ChevronLeft size={20} aria-hidden="true" />
          Back to map
        </Link>

        <div className="page-head fw-rise">
          <div>
            <h1 className="page-title">{sensor.name}</h1>
            <p className="fw-body-s" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              {sensor.barangay && <span>{sensor.barangay} ·</span>}
              <OnlineBadge sensor={sensor} />
            </p>
          </div>
          <StatusChip status={sensor.status} className="only-desktop" />
        </div>

        <StatusStrip sensor={sensor} alerts={alerts} />

        <div className="sensor-stats">
          <div className="gauge-card fw-rise fw-d1">
            <WaterGauge levelCm={level} status={sensor.status} config={sensor.config} showScale scaleClassName="only-mobile" />
            <div className="gauge-card__info only-desktop">
              <span className="fw-over">Water level</span>
              <span className="fw-num">{Number.isFinite(level) ? `${Math.round(level)} cm` : '—'}</span>
              {gaugeLines(sensor.config).map((l) => (
                <span key={l.label} style={{ color: l.color }}>
                  {l.label} {l.cm}
                </span>
              ))}
            </div>
            <div className="only-mobile" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
              <span className="fw-over">Water level</span>
              <span className="fw-num">{Number.isFinite(level) ? `${Math.round(level)} cm` : '—'}</span>
              <span>
                <StatusChip status={sensor.status} />
              </span>
            </div>
          </div>

          <EtaCard eta={eta} levelCm={level} dangerCm={sensor.config.dangerCm} offline={!sensor.online} className="fw-rise fw-d2" />
          <StatCard
            label="Rise rate"
            value={liveRate == null ? '—' : liveRate.toFixed(1)}
            hint={!sensor.online ? 'Sensor offline' : liveRate == null ? 'Waiting for readings' : 'cm per minute, last 3 minutes'}
            className="fw-rise fw-d3"
          />
          <StatCard
            label={`Max · ${range}`}
            value={peak ? `${Math.round(peak.levelCm)} cm` : '—'}
            hint={peak ? clock(peak.ts) : 'No readings yet'}
            icon={peak ? Clock : undefined}
            className="fw-rise fw-d4"
          />
          <StatCard
            label="Air temperature"
            value={Number.isFinite(tempC) ? `${tempC.toFixed(1)} °C` : '—'}
            hint="Corrects the speed of sound"
            icon={Thermometer}
            className="fw-rise fw-d5 only-desktop"
          />
        </div>
        {Number.isFinite(tempC) && (
          <p className="fw-body-s only-mobile" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: -8 }}>
            <Thermometer size={16} aria-hidden="true" />
            Air {tempC.toFixed(1)} °C — used to correct the speed of sound
          </p>
        )}

        <section className="panel panel--chart" aria-labelledby="hist">
          <div className="chart-head">
            <h2 id="hist" className="section-title">
              <span className="only-desktop">Water level history</span>
              <span className="only-mobile">History</span>
            </h2>
            <RangePicker value={range} onChange={setRange} />
            <button type="button" className="fw-btn fw-btn--ghost" disabled={!readings.length} onClick={csv}>
              <Download size={20} aria-hidden="true" />
              Export CSV
            </button>
          </div>
          <LevelChart readings={readings} config={sensor.config} />
        </section>

        <section className="section" aria-labelledby="log">
          <h2 id="log" className="section-title">
            Alert log
          </h2>
          <AlertTable alerts={alerts} />
        </section>
      </div>
    </>
  );
}
