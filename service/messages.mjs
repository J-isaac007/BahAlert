// Alert texts and send rules. Pure functions (no Firebase), covered by messages.test.mjs.

const RANK = { green: 0, yellow: 1, red: 2 };
export const SMS_MAX = 160; // one GSM-7 SMS
export const COOLDOWN_MS = 15 * 60 * 1000; // the same level for a sensor is sent at most once per 15 min

// Which alerts become a message: rising to yellow or red, or back down to green ("safe again").
// Red -> yellow (still high, going down) stays quiet.
export function notifyKind(from, to) {
  if (!(to in RANK)) return null;
  if (RANK[to] > (RANK[from] ?? 0)) return 'rise';
  if (to === 'green' && from in RANK && from !== 'green') return 'safe';
  return null;
}

export const cooledDown = (lastSentAt, now, cooldownMs = COOLDOWN_MS) => !lastSentAt || now - lastSentAt >= cooldownMs;

// SMS stays one message only with GSM-7 characters: swap dashes/quotes, drop accents and anything else
export function gsmSafe(text) {
  return String(text ?? '')
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7e\n]/g, '')
    .replace(/[\\[\]{}^~|`]/g, '') // these cost two GSM-7 characters each
    .replace(/\s+/g, ' ')
    .trim();
}

const siteLink = (siteUrl, deviceId) => `${String(siteUrl).replace(/\/$/, '')}/sensor/${deviceId}`;

// Builds the text, shortening the place name (never the instructions) to fit one SMS
export function alertText({ deviceId, name, barangay, from, to, levelCm }, siteUrl) {
  const kind = notifyKind(from, to);
  if (!kind) return null;
  const level = Number.isFinite(levelCm) ? `${Math.round(levelCm)} cm` : 'high';
  const link = siteLink(siteUrl, deviceId);
  const build = (place) => {
    if (kind === 'safe') return `BahAlert: water at ${place} is back to a safe level (${level}). ${link}`;
    if (to === 'red') return `BahAlert DANGER: water at ${place} is ${level} and rising. Move to a safe zone now. ${link}`;
    return `BahAlert WARNING: water rising at ${place}, now ${level}. Get your family and documents ready. ${link}`;
  };
  const fullPlace = gsmSafe(barangay ? `${name} (${barangay})` : name) || deviceId;
  let place = fullPlace;
  let text = gsmSafe(build(place));
  while (text.length > SMS_MAX && place.length > 8) {
    place = `${fullPlace.slice(0, place.length - 4).trimEnd()}...`;
    text = gsmSafe(build(place));
  }
  return text;
}

export const otpText = (code) => `BahAlert code: ${code}. It expires in 10 minutes. Do not share it with anyone.`;
