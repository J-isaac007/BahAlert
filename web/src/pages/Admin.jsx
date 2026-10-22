import { useState } from 'react';
import { push, ref, remove } from 'firebase/database';
import MapPicker from '../components/map/MapPicker.jsx';
import { logout } from '../hooks/useAuth.js';
import { useHotlines } from '../hooks/useHotlines.js';
import { useSafeZones } from '../hooks/useSafeZones.js';
import { useSensors } from '../hooks/useSensors.js';
import { db } from '../lib/firebase.js';

const TABS = { sensors: 'Sensors', zones: 'Safe Zones', hotlines: 'Hotlines' };

export default function Admin() {
  const [tab, setTab] = useState('zones');
  return (
    <main className="page">
      <div className="section-head">
        <h1>Admin</h1>
        <button type="button" className="btn" onClick={logout}>Log out</button>
      </div>
      <div className="segmented" role="tablist">
        {Object.entries(TABS).map(([k, label]) => (
          <button key={k} type="button" role="tab" className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'sensors' && <SensorsTab />}
      {tab === 'zones' && <SafeZonesTab />}
      {tab === 'hotlines' && <HotlinesTab />}
    </main>
  );
}

// TODO(M3): edit meta (name, barangay, pin, dangerRadiusM) and config thresholds; "calibrate empty channel"
// button sets config.sensorHeightCm = live.distanceCm.
function SensorsTab() {
  const { sensors } = useSensors();
  return (
    <section>
      <p className="notice">TODO: edit form. Pattern: copy SafeZonesTab, write to devices/{'{id}'}/meta and /config.</p>
      <ul>
        {sensors.map((s) => (
          <li key={s.id}>
            {s.name} — {s.barangay} — r={s.radiusM} m — {s.status}
          </li>
        ))}
      </ul>
    </section>
  );
}

const EMPTY_ZONE = { name: '', type: 'evac', address: '', capacity: '', contact: '' };

// Working example of the admin CRUD pattern
function SafeZonesTab() {
  const { safeZones } = useSafeZones();
  const [form, setForm] = useState(EMPTY_ZONE);
  const [pos, setPos] = useState(null);
  const [saving, setSaving] = useState(false);

  const field = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

  const save = async (e) => {
    e.preventDefault();
    if (!pos) return alert('Click the map to place the safe zone.');
    setSaving(true);
    try {
      await push(ref(db, 'safeZones'), { ...form, capacity: Number(form.capacity) || null, ...pos, active: true });
      setForm(EMPTY_ZONE);
      setPos(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-grid">
      <form className="card form" onSubmit={save}>
        <h2>Add safe zone</h2>
        <label>Name <input required {...field('name')} /></label>
        <label>
          Type
          <select {...field('type')}>
            <option value="evac">Evacuation center</option>
            <option value="school">School</option>
            <option value="court">Covered court</option>
            <option value="church">Church</option>
          </select>
        </label>
        <label>Address <input {...field('address')} /></label>
        <label>Capacity <input type="number" min="0" {...field('capacity')} /></label>
        <label>Contact number <input {...field('contact')} /></label>
        <p className="muted">{pos ? `${pos.lat}, ${pos.lng}` : 'Click the map to place it.'}</p>
        <button type="submit" className="btn btn-primary" disabled={saving}>Save</button>
      </form>
      <MapPicker value={pos} onChange={setPos} />
      <ul className="admin-list">
        {safeZones.map((z) => (
          <li key={z.id}>
            {z.name} ({z.type})
            <button type="button" className="btn" onClick={() => confirm(`Delete ${z.name}?`) && remove(ref(db, `safeZones/${z.id}`))}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

// TODO(M5): add/edit form; set verified=true only after checking the number from an official source
function HotlinesTab() {
  const { hotlines } = useHotlines();
  return (
    <section>
      <p className="notice">TODO: add/edit form (copy SafeZonesTab pattern, write to /hotlines).</p>
      <ul>
        {hotlines.map((h) => (
          <li key={h.id}>
            [{h.category}] {h.name} — {h.number || 'no number'} {h.verified ? '✓' : '(unverified)'}
          </li>
        ))}
      </ul>
    </section>
  );
}
