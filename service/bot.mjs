// Telegram commands: /start <code> links a resident's account (code from the website's Account page),
// /status lists the sensors they watch, /stop unlinks.
import { sendTelegram } from './telegram.mjs';

const LINK_TTL_MS = 30 * 60 * 1000;
const STATUS_WORD = { green: 'Normal', yellow: 'Warning', red: 'DANGER' };

export function makeBotHandler({ db, siteUrl, alerts }) {
  const say = (chatId, text) => sendTelegram(chatId, text);

  async function residentForChat(chatId) {
    const snap = await db.ref('residents').orderByChild('telegramChatId').equalTo(chatId).limitToFirst(1).get();
    let found = null;
    snap.forEach((child) => {
      found = { rid: child.key, ...child.val() };
    });
    return found;
  }

  function statusLines(watch) {
    const ids = Object.keys(watch ?? {});
    if (!ids.length) return 'You are not watching any sensors yet. Pick them on the website: ' + `${siteUrl}/account`;
    return ids
      .map((id) => {
        const d = alerts.devices.get(id);
        if (!d) return `${id}: unknown sensor`;
        const fresh = d.live?.ts && Date.now() - d.live.ts < 60_000;
        const state = fresh ? `${STATUS_WORD[d.live.status] ?? d.live.status}, ${Math.round(d.live.levelCm)} cm` : 'Offline';
        return `${d.meta?.name ?? id}: ${state}`;
      })
      .join('\n');
  }

  return async function onCommand(chatId, command, arg) {
    if (command === 'start' && arg) {
      const linkRef = db.ref(`telegramLinks/${arg.replace(/[^A-Za-z0-9_-]/g, '')}`);
      const link = (await linkRef.get()).val();
      await linkRef.remove().catch(() => {});
      if (!link?.rid || Date.now() - link.ts > LINK_TTL_MS) {
        return say(chatId, `This link has expired. Open ${siteUrl}/account and tap "Connect Telegram" again.`);
      }
      const resident = (await db.ref(`residents/${link.rid}`).get()).val();
      if (!resident) return say(chatId, 'That BahAlert account no longer exists.');
      await db.ref(`residents/${link.rid}`).update({ telegramChatId: chatId, 'channels/telegram': true });
      return say(
        chatId,
        `Connected! BahAlert will message you here when the water rises at the sensors you watch.\n\n${statusLines(resident.watch)}\n\nSend /status any time, or /stop to turn off Telegram alerts.`,
      );
    }

    if (command === 'status') {
      const r = await residentForChat(chatId);
      if (!r) return say(chatId, `This chat isn't linked yet. Open ${siteUrl}/account and tap "Connect Telegram".`);
      return say(chatId, statusLines(r.watch));
    }

    if (command === 'stop') {
      const r = await residentForChat(chatId);
      if (!r) return say(chatId, 'This chat is not linked to any BahAlert account.');
      await db.ref(`residents/${r.rid}`).update({ telegramChatId: null, 'channels/telegram': false });
      return say(chatId, 'Telegram alerts are off. SMS alerts (if on) keep working. Reconnect any time from the website.');
    }

    return say(
      chatId,
      `BahAlert sends flood warnings for Batangas City.\nTo get them here, open ${siteUrl}/account, sign in with your mobile number and tap "Connect Telegram".\n\n/status - water levels at your sensors\n/stop - turn off Telegram alerts`,
    );
  };
}
