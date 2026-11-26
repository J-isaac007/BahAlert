// Turns /alerts/{deviceId} entries into SMS and Telegram messages for the residents watching that sensor.
// Only sensors with devices/{id}/meta/notify === true (Admin > Sensors), and only while
// settings/alerts/enabled isn't false. Simulated sensors stay off, so a demo never texts anyone.
import { COOLDOWN_MS, alertText, cooledDown, notifyKind } from './messages.mjs';
import { sendSms } from './sms.mjs';
import { sendTelegram, telegramConfigured } from './telegram.mjs';

export function startAlerts({ db, siteUrl, startedAt = Date.now() }) {
  const devices = new Map(); // id -> { meta, live }
  const residents = new Map(); // rid -> resident
  const listening = new Map(); // id -> unsubscribe
  let enabled = true;
  let serverOffset = 0; // ms the server clock is ahead of this computer (alert ts are server time)
  const offsetRef = db.ref('.info/serverTimeOffset');
  offsetRef.on('value', (snap) => {
    serverOffset = snap.val() ?? 0;
  });

  async function deliver(deviceId, alertId, alert) {
    const logRef = db.ref(`alertLog/${deviceId}`);
    if ((await logRef.child(`sent/${alertId}`).get()).exists()) return; // already handled (restart)

    const kind = notifyKind(alert.from, alert.to);
    const mark = (fields) => logRef.child(`sent/${alertId}`).set({ at: Date.now(), from: alert.from ?? null, to: alert.to ?? null, ...fields });
    if (!enabled) return mark({ skipped: 'alerts paused' });
    if (!kind) return mark({ skipped: 'not a rise' });

    const levelKey = kind === 'safe' ? 'green' : alert.to;
    const last = (await logRef.child(`last/${levelKey}`).get()).val();
    if (!cooledDown(last, Date.now(), COOLDOWN_MS)) return mark({ skipped: 'cooldown' });

    const meta = devices.get(deviceId)?.meta ?? {};
    const text = alertText({ deviceId, name: meta.name ?? deviceId, barangay: meta.barangay, from: alert.from, to: alert.to, levelCm: alert.levelCm }, siteUrl);
    const watchers = [...residents.values()].filter((r) => r.watch?.[deviceId]);
    const phones = watchers.filter((r) => r.channels?.sms && r.phone).map((r) => r.phone);
    const chats = watchers.filter((r) => r.channels?.telegram && r.telegramChatId).map((r) => r.telegramChatId);

    let sms = 0;
    let telegram = 0;
    const errors = [];
    try {
      sms = await sendSms(phones, text);
    } catch (err) {
      errors.push(err.message);
    }
    if (telegramConfigured()) {
      for (const chatId of chats) {
        try {
          await sendTelegram(chatId, text);
          telegram++;
        } catch (err) {
          errors.push(err.message);
        }
      }
    }
    await logRef.child(`last/${levelKey}`).set(Date.now());
    await mark({ text, sms, telegram, ...(errors.length ? { errors: errors.slice(0, 3) } : {}) });
    console.log(`alert ${deviceId} ${alert.from}->${alert.to}: ${sms} SMS, ${telegram} Telegram${errors.length ? `, errors: ${errors[0]}` : ''}`);
  }

  function listenTo(deviceId) {
    if (listening.has(deviceId)) return;
    // Only alerts from now on (server clock): not ones from before the service started, nor ones
    // written while an admin had this sensor switched off. alertLog stops repeats on restart.
    const from = Math.max(startedAt + serverOffset, Date.now() + serverOffset) - 1000;
    const q = db.ref(`alerts/${deviceId}`).orderByChild('ts').startAt(from);
    const onAdd = (snap) => deliver(deviceId, snap.key, snap.val()).catch((e) => console.error(`alert ${deviceId}:`, e.message));
    q.on('child_added', onAdd);
    listening.set(deviceId, () => q.off('child_added', onAdd));
    console.log(`alerts: watching ${deviceId}`);
  }

  function stopListening(deviceId) {
    listening.get(deviceId)?.();
    if (listening.delete(deviceId)) console.log(`alerts: stopped ${deviceId}`);
  }

  const onDevice = (snap) => {
    const d = snap.val() ?? {};
    devices.set(snap.key, { meta: d.meta ?? {}, live: d.live ?? null, config: d.config ?? {} });
    if (d.meta?.notify === true) listenTo(snap.key);
    else stopListening(snap.key);
  };
  const devicesRef = db.ref('devices');
  devicesRef.on('child_added', onDevice);
  devicesRef.on('child_changed', onDevice);
  devicesRef.on('child_removed', (snap) => {
    devices.delete(snap.key);
    stopListening(snap.key);
  });

  const residentsRef = db.ref('residents');
  const onResident = (snap) => residents.set(snap.key, snap.val());
  residentsRef.on('child_added', onResident);
  residentsRef.on('child_changed', onResident);
  residentsRef.on('child_removed', (snap) => residents.delete(snap.key));

  const enabledRef = db.ref('settings/alerts/enabled');
  enabledRef.on('value', (snap) => {
    enabled = snap.val() !== false;
    console.log(`alerts: ${enabled ? 'on' : 'paused by an admin'}`);
  });

  return {
    devices,
    residents,
    stop() {
      devicesRef.off();
      residentsRef.off();
      enabledRef.off();
      offsetRef.off();
      for (const id of [...listening.keys()]) stopListening(id);
    },
  };
}
