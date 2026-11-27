// Telegram Bot API over plain fetch. Long polling (getUpdates), so the service needs no public URL.
// Create the bot with @BotFather and put its token in TELEGRAM_BOT_TOKEN.

const token = () => process.env.TELEGRAM_BOT_TOKEN;
export const telegramConfigured = () => Boolean(token());

export async function tg(method, body = {}, timeoutMs = 15_000) {
  const res = await fetch(`https://api.telegram.org/bot${token()}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const json = await res.json().catch(() => ({}));
  if (!json.ok) throw new Error(`Telegram ${method}: ${json.description ?? res.status}`);
  return json.result;
}

export const sendTelegram = (chatId, text) => tg('sendMessage', { chat_id: chatId, text, disable_web_page_preview: true });

// Calls onCommand(chatId, command, arg, message) for every "/command arg" message. Returns stop().
export function startPolling(onCommand) {
  let running = true;
  let offset = 0;
  (async () => {
    await tg('deleteWebhook').catch(() => {}); // long polling only works with no webhook set
    while (running) {
      try {
        const updates = await tg('getUpdates', { offset, timeout: 30, allowed_updates: ['message'] }, 40_000);
        for (const u of updates) {
          offset = u.update_id + 1;
          const msg = u.message;
          const m = msg?.text?.match(/^\/(\w+)(?:@\w+)?(?:\s+(.+))?$/s);
          if (!m) {
            if (msg?.chat?.id) await onCommand(msg.chat.id, 'help', '', msg).catch((e) => console.error('telegram:', e.message));
            continue;
          }
          await onCommand(msg.chat.id, m[1].toLowerCase(), (m[2] ?? '').trim(), msg).catch((e) =>
            console.error(`telegram /${m[1]}:`, e.message),
          );
        }
      } catch (err) {
        if (!running) break;
        console.error('telegram polling:', err.message);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  })();
  return () => {
    running = false;
  };
}
