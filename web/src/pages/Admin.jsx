import { useEffect, useState } from 'react';
import { push, ref, remove, update } from 'firebase/database';
import { Check, ChevronDown, ChevronRight, LoaderCircle, LogOut, Plus, Send, Trash2, TriangleAlert } from 'lucide-react';
import MapPicker from '../components/map/MapPicker.jsx';
import { StatusChip } from '../components/ui/Status.jsx';
import { useAdmins } from '../hooks/useAdmins.js';
import { logout, useAuth } from '../hooks/useAuth.js';
import { toList, useDbValue } from '../hooks/useDbValue.js';
import { useAlertService } from '../hooks/useResident.js';
import { maskPhone } from '../lib/phone.js';
import { useHotlines } from '../hooks/useHotlines.js';
import { useSafeZones } from '../hooks/useSafeZones.js';
import { useSensors } from '../hooks/useSensors.js';
import { inviteAdmin, removeAdmin } from '../lib/admins.js';
import { db } from '../lib/firebase.js';
import { ZONE_TYPES, zoneSummary } from '../lib/zones.js';

const TABS = { sensors: 'Sensors', zones: 'Safe zones', hotlines: 'Hotlines', residents: 'Residents', admins: 'Admins' };

export default function Admin() {
  const [tab, setTab] = useState('zones');
  return (
    <div className="page page--wide">
      <div className="admin-head fw-rise">
        <h1 className="page-title">Admin</h1>
        <div className="fw-seg" role="tablist" aria-label="Manage">
          {Object.entries(TABS).map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
              {label}
            </button>
          ))}
        </div>
        <button type="button" className="fw-btn fw-btn--ghost only-mobile" onClick={logout}>
          <LogOut size={20} aria-hidden="true" />
          Log out
        </button>
      </div>
      {tab === 'sensors' && <SensorsTab />}
      {tab === 'zones' && <SafeZonesTab />}
      {tab === 'hotlines' && <HotlinesTab />}
      {tab === 'residents' && <ResidentsTab />}
      {tab === 'admins' && <AdminsTab />}
    </div>
  );
}

function AdminSwitch({ checked, onChange, label, disabled }) {
  return (
    <button type="button" className="fw-switch" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}>
      <span className="fw-switch__thumb" />
    </button>
  );
}

// TODO(M3): edit meta (name, barangay, pin, dangerRadiusM) and config thresholds.
function SensorsTab() {
  const { sensors } = useSensors();
  const { data: settings } = useDbValue('settings/alerts');
  const service = useAlertService();
  const [error, setError] = useState(null);
  const alertsOn = settings?.enabled !== false;

  const run = (p) => p.catch((err) => setError(err.message));
  const setNotify = (id, on) => run(update(ref(db, `devices/${id}/meta`), { notify: on }));
  // Empty channel: whatever the sensor sees now is the bed, so water level reads 0
  const calibrate = (s) => {
    const d = s.live?.distanceCm;
    if (!s.online || !Number.isFinite(d)) return;
    if (!window.confirm(`Set ${s.name}'s height to ${d} cm? Only do this when the channel under it is empty (no water).`)) return;
    run(update(ref(db, `devices/${s.id}/config`), { sensorHeightCm: d }));
  };

  return (
    <section className="admin-list fw-rise fw-d1" style={{ maxWidth: 760 }}>
      <div className="admin-switch">
        <div>
          <div className="fw-strong">SMS and Telegram alerts</div>
          <div className="fw-body-s">
            {alertsOn ? 'On for the sensors switched on below.' : 'Paused: no resident gets a message.'}{' '}
            Alert service {service.online ? 'online' : 'offline'}
            {service.online && !service.sms ? ' (SMS in test mode)' : ''}.
          </div>
        </div>
        <AdminSwitch checked={alertsOn} label="SMS and Telegram alerts" onChange={(on) => run(update(ref(db, 'settings/alerts'), { enabled: on }))} />
      </div>
      {error && <p className="notice notice--danger">{error}</p>}
      <div className="list-box">
        {sensors.map((s) => (
          <div key={s.id} className="list-row admin-sensor">
            <div className="list-row__body">
              <div className="fw-strong">{s.name}</div>
              <div className="fw-body-s">
                {s.barangay} · height {s.config?.sensorHeightCm ?? '?'} cm · yellow {s.config?.yellowCm ?? '?'} / red {s.config?.redCm ?? '?'} cm
              </div>
            </div>
            <StatusChip status={s.status} />
            <button type="button" className="fw-btn fw-btn--ghost" disabled={!s.online} onClick={() => calibrate(s)} title="Use when the channel is empty">
              Calibrate
            </button>
            <AdminSwitch checked={s.notify} label={`Send alerts for ${s.name}`} onChange={(on) => setNotify(s.id, on)} />
          </div>
        ))}
      </div>
      <p className="fw-caption">
        The switch on each sensor sends SMS/Telegram alerts to residents watching it. Keep it off for simulated sensors.
      </p>
    </section>
  );
}

function ResidentsTab() {
  const { data, loading, error } = useDbValue('residents');
  const { sensors } = useSensors();
  const names = Object.fromEntries(sensors.map((s) => [s.id, s.name]));
  const list = toList(data).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  const count = (pred) => list.filter(pred).length;
  return (
    <section className="admin-list fw-rise fw-d1" style={{ maxWidth: 760 }}>
      <p className="fw-body-s">
        {list.length} resident{list.length === 1 ? '' : 's'} signed up · {count((r) => r.channels?.sms)} by SMS ·{' '}
        {count((r) => r.channels?.telegram && r.telegramChatId)} on Telegram
      </p>
      {error && <p className="notice notice--danger">{error.message}</p>}
      {loading ? (
        <p className="loading">Loading…</p>
      ) : list.length === 0 ? (
        <p className="empty">No one has signed up yet. Residents sign up on the Alerts page.</p>
      ) : (
        <div className="list-box">
          {list.map((r) => {
            const watched = Object.keys(r.watch ?? {});
            return (
              <div key={r.id} className="list-row">
                <div className="list-row__body" style={{ padding: '12px 0' }}>
                  <div className="fw-strong">
                    {r.name || 'No name yet'} · {maskPhone(r.phone)}
                  </div>
                  <div className="fw-body-s">
                    {r.barangay || 'No barangay'} · {watched.length ? watched.map((id) => names[id] ?? id).join(', ') : 'no sensors picked'}
                  </div>
                </div>
                {r.channels?.sms && <StatusChip tone="normal" label="SMS" />}
                {r.channels?.telegram && r.telegramChatId && <StatusChip tone="normal" label="Telegram" />}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

const EMPTY_ZONE = { name: '', type: 'evac', address: '', capacity: '', contact: '', active: true };

const toForm = (z) => ({
  name: z.name ?? '',
  type: z.type ?? 'evac',
  address: z.address ?? '',
  capacity: z.capacity ?? '',
  contact: z.contact ?? '',
  active: z.active !== false,
});

// Working example of the admin CRUD pattern
function SafeZonesTab() {
  const { safeZones } = useSafeZones();
  const [editId, setEditId] = useState(null); // null = adding a new zone
  const [form, setForm] = useState(EMPTY_ZONE);
  const [pos, setPos] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | saving | saved
  const editing = editId && safeZones.find((z) => z.id === editId);

  useEffect(() => {
    if (phase !== 'saved') return undefined;
    const t = setTimeout(() => setPhase('idle'), 1800);
    return () => clearTimeout(t);
  }, [phase]);

  const open = (z) => {
    setEditId(z?.id ?? null);
    setForm(z ? toForm(z) : EMPTY_ZONE);
    setPos(z ? { lng: z.lng, lat: z.lat } : null);
    setPhase('idle');
  };

  const field = (key) => ({ id: `z-${key}`, value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

  const save = async (e) => {
    e.preventDefault();
    if (!pos) return alert('Click the map to place the safe zone.');
    setPhase('saving');
    const data = { ...form, capacity: Number(form.capacity) || null, ...pos };
    try {
      if (editId) await update(ref(db, `safeZones/${editId}`), data);
      else setEditId((await push(ref(db, 'safeZones'), data)).key);
      setPhase('saved');
    } catch (err) {
      setPhase('idle');
      alert(err.message);
    }
  };

  const del = async () => {
    if (!editing || !confirm(`Delete ${editing.name}?`)) return;
    await remove(ref(db, `safeZones/${editId}`));
    open(null);
  };

  return (
    <div className="admin-body">
      <section className="admin-list fw-rise fw-d1" aria-labelledby="list-title">
        <div className="admin-list__head">
          <h2 id="list-title" className="section-title">
            Safe zones · {safeZones.length}
          </h2>
          <button type="button" className="fw-btn fw-btn--secondary" onClick={() => open(null)}>
            <Plus size={20} aria-hidden="true" />
            Add safe zone
          </button>
        </div>
        {safeZones.length ? (
          <div className="list-box">
            {safeZones.map((z) => (
              <button
                key={z.id}
                type="button"
                className="list-row fw-rowlink"
                aria-current={z.id === editId ? 'true' : undefined}
                onClick={() => open(z)}
              >
                <div className="list-row__body">
                  <div className="fw-strong">{z.name}</div>
                  <div className="fw-body-s">{zoneSummary(z)}</div>
                </div>
                <StatusChip tone={z.active !== false ? 'normal' : 'offline'} label={z.active !== false ? 'Open' : 'Closed'} icon={false} />
                <ChevronRight size={20} aria-hidden="true" />
              </button>
            ))}
          </div>
        ) : (
          <p className="empty">No safe zones yet. Add the first one.</p>
        )}
      </section>

      <section className="panel admin-edit fw-rise fw-d2" aria-labelledby="edit-title">
        <h2 id="edit-title" className="section-title">
          {editing ? `Edit · ${editing.name}` : 'Add safe zone'}
        </h2>
        <MapPicker key={editId ?? 'new'} value={pos} onChange={setPos} />
        <form className="admin-form" onSubmit={save}>
          <div className="fw-field span-2">
            <label htmlFor="z-name">Name</label>
            <input required {...field('name')} />
          </div>
          <div className="fw-field">
            <label htmlFor="z-type">Type</label>
            <div className="fw-select">
              <select {...field('type')}>
                {Object.entries(ZONE_TYPES).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown size={20} aria-hidden="true" />
            </div>
          </div>
          <div className="fw-field">
            <label htmlFor="z-capacity">Capacity</label>
            <input type="number" min="0" inputMode="numeric" {...field('capacity')} />
          </div>
          <div className="fw-field">
            <label htmlFor="z-address">Address</label>
            <input {...field('address')} />
          </div>
          <div className="fw-field">
            <label htmlFor="z-contact">Contact number</label>
            <input inputMode="tel" placeholder="09XX XXX XXXX" {...field('contact')} />
          </div>
          <div className="admin-switch span-2">
            <div>
              <div className="fw-strong">Open as a shelter</div>
              <div className="fw-body-s">Closed zones are never suggested in routes.</div>
            </div>
            <button
              type="button"
              className="fw-switch"
              role="switch"
              aria-checked={form.active}
              aria-label="Open as a shelter"
              onClick={() => setForm({ ...form, active: !form.active })}
            >
              <span className="fw-switch__thumb" />
            </button>
          </div>
          <div className="admin-actions span-2">
            {editing ? (
              <button type="button" className="fw-btn fw-btn--ghost btn-delete" onClick={del}>
                <Trash2 size={20} aria-hidden="true" />
                Delete
              </button>
            ) : (
              <span />
            )}
            <div>
              <span className="fw-sr" role="status">
                {phase === 'saved' ? 'Changes saved' : ''}
              </span>
              <button type="button" className="fw-btn fw-btn--secondary" onClick={() => open(editing ?? null)}>
                Cancel
              </button>
              <button type="submit" className="fw-btn fw-btn--primary" disabled={phase === 'saving'} style={{ minWidth: 156 }}>
                {phase === 'saving' && <LoaderCircle size={20} strokeWidth={2.5} className="fw-spin" aria-hidden="true" />}
                {phase === 'saved' && <Check size={20} strokeWidth={2.5} aria-hidden="true" />}
                {phase === 'saving' ? 'Saving…' : phase === 'saved' ? 'Saved' : editing ? 'Save changes' : 'Add safe zone'}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

const addedLine = (a) =>
  a.addedBy
    ? `Added by ${a.addedBy}${typeof a.addedAt === 'number' ? ` · ${new Date(a.addedAt).toLocaleDateString()}` : ''}`
    : `Added in Firebase console · UID ${a.uid.slice(0, 8)}…`;

// Nobody signs up: an admin invites the next one. Rules stop anyone changing their own entry.
function AdminsTab() {
  const { user } = useAuth();
  const { admins } = useAdmins();
  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | sending | sent
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState(null);

  const invite = async (e) => {
    e.preventDefault();
    const target = email.trim().toLowerCase();
    setError(null);
    setPhase('sending');
    try {
      await inviteAdmin(target, user.email);
      setSentTo(target);
      setEmail('');
      setPhase('sent');
    } catch (err) {
      setPhase('idle');
      setError(err.message);
    }
  };

  const remove = async (a) => {
    if (!confirm(`Remove ${a.email ?? 'this admin'}? They will no longer be able to open the Admin page.`)) return;
    try {
      await removeAdmin(a.uid);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="admin-body">
      <section className="admin-list fw-rise fw-d1" aria-labelledby="admins-title">
        <div className="admin-list__head">
          <h2 id="admins-title" className="section-title">
            Admins · {admins.length}
          </h2>
        </div>
        <div className="list-box">
          {admins.map((a) => (
            <div key={a.uid} className="list-row">
              <div className="list-row__body">
                <div className="fw-strong">{a.email ?? 'Unnamed admin'}</div>
                <div className="fw-body-s">{addedLine(a)}</div>
              </div>
              {a.uid === user?.uid ? (
                <StatusChip tone="normal" label="You" icon={false} />
              ) : (
                <button type="button" className="fw-btn fw-btn--ghost btn-delete" onClick={() => remove(a)}>
                  <Trash2 size={20} aria-hidden="true" />
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="panel admin-edit fw-rise fw-d2" aria-labelledby="invite-title">
        <div className="fw-col" style={{ gap: 4 }}>
          <h2 id="invite-title" className="section-title">
            Invite an admin
          </h2>
          <p className="fw-body-s">
            They get an email with a link to set their password, then log in here. Only invite DRRM officers and team
            members you know.
          </p>
        </div>
        <form className="admin-form" onSubmit={invite}>
          <div className={`fw-field span-2 ${error ? 'fw-field--error' : ''}`}>
            <label htmlFor="a-email">Email</label>
            <input
              id="a-email"
              type="email"
              required
              autoComplete="off"
              value={email}
              aria-describedby={error || phase === 'sent' ? 'a-help' : undefined}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
            />
            {error ? (
              <span id="a-help" className="fw-field__help" role="alert">
                <TriangleAlert size={14} aria-hidden="true" />
                {error}
              </span>
            ) : (
              phase === 'sent' && (
                <span id="a-help" className="fw-field__help" role="status">
                  <Check size={14} aria-hidden="true" />
                  Invite sent. {sentTo} will get an email to set a password.
                </span>
              )
            )}
          </div>
          <div className="admin-actions span-2">
            <span />
            <button type="submit" className="fw-btn fw-btn--primary" disabled={phase === 'sending'} style={{ minWidth: 156 }}>
              {phase === 'sending' ? (
                <LoaderCircle size={20} strokeWidth={2.5} className="fw-spin" aria-hidden="true" />
              ) : (
                <Send size={20} aria-hidden="true" />
              )}
              {phase === 'sending' ? 'Sending…' : 'Send invite'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

// TODO(M5): add/edit form; set verified=true only after checking the number from an official source
function HotlinesTab() {
  const { hotlines } = useHotlines();
  return (
    <section className="admin-list fw-rise fw-d1" style={{ maxWidth: 720 }}>
      <p className="notice">TODO: add/edit form (copy SafeZonesTab pattern, write to /hotlines).</p>
      <div className="list-box">
        {hotlines.map((h) => (
          <div key={h.id} className="list-row">
            <div className="list-row__body">
              <div className="fw-strong">{h.name}</div>
              <div className="fw-body-s">
                {h.category} · {h.number || 'no number'}
              </div>
            </div>
            <StatusChip tone={h.verified ? 'normal' : 'offline'} label={h.verified ? 'Verified' : 'Unverified'} />
          </div>
        ))}
      </div>
    </section>
  );
}
