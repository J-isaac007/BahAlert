// BahAlert alert service: phone sign-in codes, SMS + Telegram flood alerts.
//   node service/index.mjs
// Needs the root .env (FIREBASE_DATABASE_URL + service account, as for the other scripts) plus:
//   SMS_GATEWAY_USER, SMS_GATEWAY_PASS   (SMS Gateway for Android, Cloud mode) - without them SMS is a dry run
//   SMS_GATEWAY_URL                      (optional; local mode: http://<phone-ip>:8080/message)
//   TELEGRAM_BOT_TOKEN                   (from @BotFather) - without it the bot is off
//   PUBLIC_SITE_URL                      (links in messages; default the GitHub Pages site)
// Keep it running (laptop or always-on VM): it must be up to send codes and alerts.
import { ServerValue } from 'firebase-admin/database';
import { auth, db } from '../scripts/admin.mjs';
import { startAlerts } from './alerts.mjs';
import { makeBotHandler } from './bot.mjs';
import { startOtp } from './otp.mjs';
import { smsConfigured } from './sms.mjs';
import { startPolling, telegramConfigured, tg } from './telegram.mjs';

const siteUrl = (process.env.PUBLIC_SITE_URL || 'https://j-isaac007.github.io/BahAlert').replace(/\/$/, '');
const startedAt = Date.now();

console.log(`BahAlert alert service · SMS ${smsConfigured() ? 'on' : 'DRY RUN (no SMS_GATEWAY_USER/PASS)'} · Telegram ${telegramConfigured() ? 'on' : 'off (no TELEGRAM_BOT_TOKEN)'}`);

const stopOtp = startOtp({ db, auth });
const alerts = startAlerts({ db, siteUrl, startedAt });

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
  await statusRef.update({ heartbeatAt: 0 }).catch(() => {});
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
console.log('Running. Ctrl+C to stop.');
