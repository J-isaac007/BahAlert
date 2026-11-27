// BahAlert alert service: phone sign-in codes, SMS + Telegram flood alerts.
//   node service/index.mjs
// Needs the root .env (FIREBASE_DATABASE_URL + service account, as for the other scripts) plus:
//   SMS_GATEWAY_USER, SMS_GATEWAY_PASS   (SMS Gateway for Android, Cloud mode) - without them SMS is a dry run
//   SMS_GATEWAY_URL                      (optional; local mode: http://<phone-ip>:8080/message)
//   TELEGRAM_BOT_TOKEN                   (from @BotFather) - without it the bot is off
//   TELEGRAM_ALERT_CHAT_IDS              (optional) chat ids that always get alerts, e.g. the team's: 6142056216,123
//   BRIDGE_PORT                          (default off) e.g. 3000: run the prototype ESP32 endpoints here
//                                        instead of the team's server (firmware/team-server)
//   BRIDGE_DEVICE_ID                     (default bah-001) which sensor those readings belong to
//   PUBLIC_SITE_URL                      (links in messages; default the GitHub Pages site)
// Keep it running (laptop or always-on VM): it must be up to send codes and alerts.
import { networkInterfaces } from 'node:os';
import { ServerValue } from 'firebase-admin/database';
import { auth, db } from '../scripts/admin.mjs';
import { startAlerts } from './alerts.mjs';
import { makeBotHandler } from './bot.mjs';
import { startBridge } from './bridge.mjs';
import { startOtp } from './otp.mjs';
import { smsConfigured } from './sms.mjs';
import { startPolling, telegramConfigured, tg } from './telegram.mjs';

const siteUrl = (process.env.PUBLIC_SITE_URL || 'https://j-isaac007.github.io/BahAlert').replace(/\/$/, '');
const startedAt = Date.now();

console.log(`BahAlert alert service · SMS ${smsConfigured() ? 'on' : 'DRY RUN (no SMS_GATEWAY_USER/PASS)'} · Telegram ${telegramConfigured() ? 'on' : 'off (no TELEGRAM_BOT_TOKEN)'}`);

const stopOtp = startOtp({ db, auth });
const alerts = startAlerts({ db, siteUrl, startedAt });

// Local endpoints for the prototype ESP32 sketches (POST /api/level, GET /api/alarm)
// Off unless BRIDGE_PORT is set: the team's own server (firmware/team-server) normally owns port 3000
const bridgePort = Number(process.env.BRIDGE_PORT || 0);
let bridge = null;
if (bridgePort) {
  bridge = startBridge({ db, port: bridgePort, deviceId: process.env.BRIDGE_DEVICE_ID || 'bah-001' });
  bridge.server.on('listening', () => {
    const ips = Object.values(networkInterfaces())
      .flat()
      .filter((i) => i && i.family === 'IPv4' && !i.internal)
      .map((i) => i.address);
    console.log(`bridge: ESP32 endpoints for ${bridge.state.deviceId} on port ${bridgePort}`);
    for (const ip of ips) console.log(`  sensor -> http://${ip}:${bridgePort}/api/level   alarm -> http://${ip}:${bridgePort}/api/alarm`);
  });
  bridge.server.on('error', (err) => console.error(`bridge: can't listen on port ${bridgePort}: ${err.message}`));
}

let stopBot = () => {};
let botUsername = null;
if (telegramConfigured()) {
  try {
    botUsername = (await tg('getMe')).username;
    stopBot = startPolling(makeBotHandler({ db, siteUrl, alerts }));
    console.log(`telegram: @${botUsername}`);
  } catch (err) {
    console.error('telegram disabled:', err.message);
  }
}

// The website reads this to show whether sign-up codes and Telegram linking will work right now
const statusRef = db.ref('settings/service');
const beat = () =>
  statusRef
    .set({ heartbeatAt: ServerValue.TIMESTAMP, startedAt, sms: smsConfigured(), telegramBot: botUsername })
    .catch((e) => console.error('heartbeat:', e.message));
await beat();
const timer = setInterval(beat, 30_000);

// A resident who deletes their account also loses their login
db.ref('residents').on('child_removed', (snap) => {
  auth.deleteUser(snap.key).catch(() => {});
  console.log(`resident ${snap.key.slice(0, 9)}•••• deleted their account`);
});

async function shutdown() {
  clearInterval(timer);
  stopBot();
  stopOtp();
  alerts.stop();
  bridge?.stop();
  await statusRef.update({ heartbeatAt: 0 }).catch(() => {});
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
console.log('Running. Ctrl+C to stop.');
