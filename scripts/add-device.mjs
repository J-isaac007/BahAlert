// Registers a real sensor board: its own login, /deviceAuth, meta and config.
//   node scripts/add-device.mjs bah-001 "Prototype sensor — BatStateU Alangilan" Alangilan 13.7837 121.0745
// Options:
//   --secrets <path>   write the board's secrets.h there (gitignored) instead of printing the password
//   --reset-password   give an existing board login a new password (needed to rewrite secrets.h)
//   --desk             desk-test thresholds for a sensor 50 cm above the table (default)
//   --height <cm>      real site: sensor height above the channel bed; thresholds scale from it
// Wi-Fi for secrets.h comes from WIFI_SSID / WIFI_PASSWORD in the environment, else placeholders.
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { auth, db } from './admin.mjs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const positional = args.filter((a, i) => !a.startsWith('--') && !['--secrets', '--height'].includes(args[i - 1]));
const [id, name, barangay, latArg, lngArg] = positional;
const lat = Number(latArg);
const lng = Number(lngArg);

if (!/^[a-z0-9-]{3,32}$/.test(id ?? '') || !name || !barangay || !Number.isFinite(lat) || !Number.isFinite(lng)) {
  console.error('Usage: node scripts/add-device.mjs <id> "<name>" <barangay> <lat> <lng> [--secrets <path>] [--reset-password] [--height <cm>]');
  process.exit(1);
}

// Desk test (default): sensor 50 cm above the table; the team's prototype levels were
// LOW at 40 cm away, MEDIUM at 30 cm, HIGH at 23 cm -> water level 10 / 20 / 27 cm.
const height = Number(opt('--height') ?? 50);
const config = flag('--height')
  ? {
      sensorHeightCm: height,
      yellowCm: Math.round(height * 0.4),
      redCm: Math.round(height * 0.6),
      dangerCm: Math.round(height * 0.8),
      intervalSec: 2,
    }
  : { sensorHeightCm: 50, yellowCm: 10, redCm: 20, dangerCm: 27, intervalSec: 2 };

const email = `${id}@bahalert.local`;
const existing = await auth.getUserByEmail(email).catch((err) => {
  if (err.code === 'auth/user-not-found') return null;
  throw err;
});
const password = !existing || flag('--reset-password') ? randomBytes(18).toString('base64url') : null;
const user = existing
  ? password
    ? await auth.updateUser(existing.uid, { password })
    : existing
  : await auth.createUser({ email, password, displayName: name });

const metaRef = db.ref(`devices/${id}/meta`);
const oldMeta = (await metaRef.get()).val() ?? {};
await db.ref().update({
  [`deviceAuth/${id}`]: user.uid,
  // notify stays off until an admin turns on SMS/Telegram alerts for this sensor
  [`devices/${id}/meta`]: { ...oldMeta, name, barangay, lat, lng, dangerRadiusM: oldMeta.dangerRadiusM ?? 300, notify: oldMeta.notify ?? false },
  [`devices/${id}/config`]: config,
});

console.log(`${id}: ${existing ? 'existing' : 'new'} board login ${email} (uid ${user.uid})`);
console.log(`config: ${JSON.stringify(config)}`);

if (!password) {
  console.log('Password unchanged. Use --reset-password with --secrets to write a fresh secrets.h.');
  process.exit(0);
}

const webEnv = (() => {
  try {
    return Object.fromEntries(
      readFileSync(new URL('../web/.env', import.meta.url), 'utf8')
        .split(/\r?\n/)
        .filter((l) => /^[A-Z_]+=/.test(l))
        .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
    );
  } catch {
    return {};
  }
})();
const q = (s) => JSON.stringify(String(s));
const secrets = `#pragma once
// Written by scripts/add-device.mjs for ${id}. Gitignored: never commit this file.

#define WIFI_SSID ${q(process.env.WIFI_SSID ?? 'your-wifi')}
#define WIFI_PASSWORD ${q(process.env.WIFI_PASSWORD ?? 'your-wifi-password')}

#define FIREBASE_API_KEY ${q(webEnv.VITE_FIREBASE_API_KEY ?? 'AIza...')}
#define FIREBASE_DATABASE_URL ${q(process.env.FIREBASE_DATABASE_URL)}

#define DEVICE_ID ${q(id)}
#define DEVICE_EMAIL ${q(email)}
#define DEVICE_PASSWORD ${q(password)}
`;

const out = opt('--secrets');
if (out) {
  writeFileSync(out, secrets);
  console.log(`Wrote ${out} (board password inside; keep it out of git).`);
} else {
  console.log('\nsecrets.h:\n' + secrets);
}
process.exit(0);
