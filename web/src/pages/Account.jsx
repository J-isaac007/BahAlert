import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { BellRing, ChevronDown, LoaderCircle, LogOut, MessageSquare, Send, Trash2, TriangleAlert } from 'lucide-react';
import { useAlertService, useResident } from '../hooks/useResident.js';
import { useSensors } from '../hooks/useSensors.js';
import { formatPhone } from '../lib/phone.js';
import { deleteResident, makeTelegramLink, saveResident, signOutResident } from '../lib/residents.js';

function Switch({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      className="fw-switch"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span className="fw-switch__thumb" />
    </button>
  );
}

export default function Account() {
  const navigate = useNavigate();
  const { rid, resident, loading } = useResident();
  const { sensors } = useSensors();
  const service = useAlertService();
  const [form, setForm] = useState(null);
  const [touchedWatch, setTouchedWatch] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | saving | saved
  const [error, setError] = useState(null);
  const [tgPhase, setTgPhase] = useState('idle'); // idle | opening | waiting

  // Load the saved settings once
  useEffect(() => {
    if (!resident || form) return;
    setForm({
      name: resident.name ?? '',
      barangay: resident.barangay ?? '',
      watch: resident.watch ?? {},
      channels: { sms: resident.channels?.sms ?? true, telegram: resident.channels?.telegram ?? false },
    });
  }, [resident, form]);

  // Telegram links itself in the background; reflect it as soon as the bot writes the chat id
  const telegramLinked = Boolean(resident?.telegramChatId);
  useEffect(() => {
    if (telegramLinked && form && !form.channels.telegram && tgPhase === 'waiting') {
      setForm((f) => ({ ...f, channels: { ...f.channels, telegram: true } }));
      setTgPhase('idle');
    }
  }, [telegramLinked, form, tgPhase]);

  const barangays = useMemo(() => [...new Set(sensors.map((s) => s.barangay).filter(Boolean))].sort(), [sensors]);
  const sorted = useMemo(
    () => [...sensors].sort((a, b) => (form?.barangay ? (b.barangay === form.barangay) - (a.barangay === form.barangay) : 0) || a.name.localeCompare(b.name)),
    [sensors, form?.barangay],
  );

  if (loading) return <p className="loading">Loading…</p>;
  if (!rid) return <Navigate to="/alerts/get" replace />;
  if (!form) return <p className="loading">Loading…</p>;

  const watchedCount = Object.values(form.watch).filter(Boolean).length;
  const firstTime = !resident?.name;
  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setPhase('idle');
  };

  const pickBarangay = (barangay) => {
    // First setup: watching your own barangay's sensors is the sensible default
    if (!touchedWatch && barangay) {
      set({ barangay, watch: Object.fromEntries(sensors.filter((s) => s.barangay === barangay).map((s) => [s.id, true])) });
    } else set({ barangay });
  };

  const toggleSensor = (id) => {
    setTouchedWatch(true);
    set({ watch: { ...form.watch, [id]: !form.watch[id] } });
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Enter your name.');
    setError(null);
    setPhase('saving');
    try {
      await saveResident(rid, form);
      setPhase('saved');
      setTimeout(() => setPhase('idle'), 1800);
      if (firstTime) window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setPhase('idle');
      setError(err.message);
    }
  };

  const connectTelegram = async () => {
    if (!service.telegramBot) return;
    setTgPhase('opening');
    // Open the tab first (popup blockers allow it only straight from the click), then point it at the bot
    const tab = window.open('about:blank', '_blank');
    try {
      const code = await makeTelegramLink(rid);
      const url = `https://t.me/${service.telegramBot}?start=${code}`;
      if (tab) tab.location.href = url;
      else window.location.href = url;
      setTgPhase('waiting');
    } catch (err) {
      tab?.close();
      setTgPhase('idle');
      setError(err.message);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete your BahAlert account? You will stop getting flood alerts and your number is removed.')) return;
    await deleteResident(rid);
    navigate('/alerts', { replace: true });
  };

  const noChannel = !form.channels.sms && !form.channels.telegram;

  return (
    <div className="page account-page">
      <div className="page-head fw-rise">
        <div>
          <h1 className="page-title">My flood alerts</h1>
          <p className="fw-body-s">Signed in as {formatPhone(resident.phone)}</p>
        </div>
        <button type="button" className="fw-btn fw-btn--ghost" onClick={signOutResident}>
          <LogOut size={18} aria-hidden="true" />
          Log out
        </button>
      </div>

      {firstTime && (
        <p className="notice fw-rise fw-d1" role="status">
          <BellRing size={18} aria-hidden="true" style={{ flex: 'none', marginTop: 2 }} />
          Your number is confirmed. Add your name and pick the sensors near you, then save to start getting alerts.
        </p>
      )}
      {!service.loading && !service.online && (
        <p className="notice" role="status">
          <TriangleAlert size={18} aria-hidden="true" style={{ flex: 'none', marginTop: 2 }} />
          The alert service is offline right now, so no messages are going out. Your settings are still saved.
        </p>
      )}

      <form className="account-grid" onSubmit={save}>
        <section className="panel fw-rise fw-d1" aria-labelledby="acc-you">
          <h2 id="acc-you" className="fw-h3">
            About you
          </h2>
          <div className="fw-field">
            <label htmlFor="acc-name">Name</label>
            <input id="acc-name" autoComplete="name" maxLength={60} value={form.name} onChange={(e) => set({ name: e.target.value })} />
          </div>
          <div className="fw-field">
            <label htmlFor="acc-brgy">Barangay</label>
            <div className="fw-select">
              <select id="acc-brgy" value={form.barangay} onChange={(e) => pickBarangay(e.target.value)}>
                <option value="">Choose your barangay</option>
                {barangays.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
              <ChevronDown size={20} aria-hidden="true" />
            </div>
          </div>
        </section>

        <section className="panel fw-rise fw-d2" aria-labelledby="acc-how">
          <h2 id="acc-how" className="fw-h3">
            How to reach you
          </h2>
          <div className="admin-switch">
            <MessageSquare size={20} aria-hidden="true" />
            <div>
              <div className="fw-strong">Text message (SMS)</div>
              <div className="fw-body-s">To {formatPhone(resident.phone)}, in your phone&apos;s Messages app</div>
            </div>
            <Switch checked={form.channels.sms} label="SMS alerts" onChange={(v) => set({ channels: { ...form.channels, sms: v } })} />
          </div>
          <div className="admin-switch">
            <Send size={20} aria-hidden="true" />
            <div>
              <div className="fw-strong">Telegram</div>
              <div className="fw-body-s">
                {telegramLinked ? 'Connected to your Telegram' : tgPhase === 'waiting' ? 'Tap Start in Telegram, then come back' : 'Not connected yet'}
              </div>
            </div>
            {telegramLinked ? (
              <Switch checked={form.channels.telegram} label="Telegram alerts" onChange={(v) => set({ channels: { ...form.channels, telegram: v } })} />
            ) : (
              <button type="button" className="fw-btn fw-btn--secondary" onClick={connectTelegram} disabled={!service.telegramBot || tgPhase === 'opening'}>
                {tgPhase === 'opening' && <LoaderCircle size={18} className="fw-spin" aria-hidden="true" />}
                Connect
              </button>
            )}
          </div>
          {!telegramLinked && !service.telegramBot && <p className="fw-caption">Telegram connect is available while the alert service is online.</p>}
          {noChannel && (
            <p className="fw-field__help" style={{ color: 'var(--status-warning-text)' }}>
              <TriangleAlert size={14} aria-hidden="true" />
              Both are off, so you won&apos;t get any alerts.
            </p>
          )}
        </section>

        <section className="panel fw-rise fw-d3 account-sensors" aria-labelledby="acc-sensors">
          <div className="fw-row" style={{ justifyContent: 'space-between' }}>
            <h2 id="acc-sensors" className="fw-h3">
              Sensors to watch
            </h2>
            <span className="fw-caption">{watchedCount} selected</span>
          </div>
          <p className="fw-body-s">We message you when the water at these sensors rises to yellow or red, and when it&apos;s safe again.</p>
          <div className="list-box">
            {sorted.map((s) => (
              <label key={s.id} className="list-row account-sensor">
                <input type="checkbox" checked={Boolean(form.watch[s.id])} onChange={() => toggleSensor(s.id)} />
                <span className="list-row__body">
                  <span className="fw-strong">{s.name}</span>
                  <span className="fw-body-s">
                    {s.barangay}
                    {!s.notify && ' · alerts not active yet'}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <div className="account-actions fw-rise fw-d3">
          {error && (
            <span className="fw-field__help" role="alert" style={{ color: 'var(--status-danger-text)' }}>
              <TriangleAlert size={14} aria-hidden="true" />
              {error}
            </span>
          )}
          <button type="submit" className="fw-btn fw-btn--primary fw-btn--lg" disabled={phase === 'saving'}>
            {phase === 'saving' && <LoaderCircle size={20} className="fw-spin" aria-hidden="true" />}
            {phase === 'saving' ? 'Saving…' : phase === 'saved' ? 'Saved' : 'Save'}
          </button>
          <button type="button" className="fw-btn fw-btn--ghost account-delete" onClick={remove}>
            <Trash2 size={18} aria-hidden="true" />
            Delete my account
          </button>
        </div>
      </form>
    </div>
  );
}
