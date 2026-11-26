// SMS through "SMS Gateway for Android" (sms-gate.app): an Android phone with a SIM sends the texts,
// so they arrive in residents' normal Messages app. Docs: https://docs.sms-gate.app
//   Cloud mode (default): SMS_GATEWAY_URL=https://api.sms-gate.app/3rdparty/v1/messages
//   Local mode (same Wi-Fi as this service): SMS_GATEWAY_URL=http://<phone-ip>:8080/message
// Without SMS_GATEWAY_USER / SMS_GATEWAY_PASS it only logs (dry run), handy for testing.

const BATCH = 20; // numbers per request
const PAUSE_MS = 1500; // between batches, so the phone and the carrier aren't flooded

const env = () => ({
  url: process.env.SMS_GATEWAY_URL || 'https://api.sms-gate.app/3rdparty/v1/messages',
  user: process.env.SMS_GATEWAY_USER,
  pass: process.env.SMS_GATEWAY_PASS,
});

export const smsConfigured = () => Boolean(env().user && env().pass);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// phones: E.164 (+639...). Resolves to the number sent; throws if the gateway refuses a batch.
export async function sendSms(phones, text) {
  const list = [...new Set(phones.filter(Boolean))];
  if (!list.length) return 0;
  const { url, user, pass } = env();
  if (!user || !pass) {
    console.log(`[sms dry run] ${list.length} recipient(s): ${text}`);
    return list.length;
  }
  const authHeader = `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
  for (let i = 0; i < list.length; i += BATCH) {
    if (i) await sleep(PAUSE_MS);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: authHeader },
      body: JSON.stringify({ textMessage: { text }, phoneNumbers: list.slice(i, i + BATCH) }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`SMS gateway ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  return list.length;
}
