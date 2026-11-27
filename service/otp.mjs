// Phone sign-in with a texted 6-digit code. The website talks to us through the database only
// (outbound connections), so this service can run on a laptop with no public address.
//
//   site (anonymous user U) writes otpRequests/U { phone, requestedAt }
//   we text a code, keep only its hash in otpSecrets/U, set status 'sent'
//   site writes otpRequests/U/code
//   we check it and write { status: 'verified', token } -- a custom token for residents/ph_639...
//   site signs in with the token: the same account on any phone or browser.
import { createHash, randomInt } from 'node:crypto';
import { normalizePhone, residentIdFor } from '../web/src/lib/phone.js';
import { otpText } from './messages.mjs';
import { sendSms } from './sms.mjs';

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MIN_GAP_MS = 60 * 1000; // per phone
const PER_PHONE_PER_DAY = 5;
const GLOBAL_PER_HOUR = 60; // caps SMS cost if someone spams the form
const CLEANUP_AFTER_MS = 2 * 60 * 1000;

const hash = (uid, code) => createHash('sha256').update(`${uid}:${code}`).digest('hex');
const manilaDay = (ms) => new Date(ms + 8 * 3600 * 1000).toISOString().slice(0, 10);

export function startOtp({ db, auth }) {
  const busy = new Set();
  const sentThisHour = [];

  const reply = (uid, fields) => db.ref(`otpRequests/${uid}`).update(fields);

  async function issueCode(uid, req, secret) {
    const phone = normalizePhone(req.phone);
    if (!phone) return reply(uid, { status: 'bad_phone' });
    const now = Date.now();

    const throttleRef = db.ref(`otpThrottle/${phone.slice(1)}`);
    const t = (await throttleRef.get()).val() ?? {};
    const today = manilaDay(now);
    const countToday = t.day === today ? (t.count ?? 0) : 0;
    if (t.lastAt && now - t.lastAt < MIN_GAP_MS) {
      return reply(uid, { status: 'too_soon', retryAt: t.lastAt + MIN_GAP_MS });
    }
    if (countToday >= PER_PHONE_PER_DAY) return reply(uid, { status: 'daily_limit' });
    while (sentThisHour.length && now - sentThisHour[0] > 3600_000) sentThisHour.shift();
    if (sentThisHour.length >= GLOBAL_PER_HOUR) return reply(uid, { status: 'busy' });

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await db.ref(`otpSecrets/${uid}`).set({
      hash: hash(uid, code),
      phone,
      requestedAt: req.requestedAt,
      expiresAt: now + CODE_TTL_MS,
      attempts: 0,
    });
    try {
      await sendSms([phone], otpText(code));
    } catch (err) {
      console.error('otp sms failed:', err.message);
      return reply(uid, { status: 'sms_failed' });
    }
    sentThisHour.push(now);
    await throttleRef.set({ lastAt: now, day: today, count: countToday + 1 });
    console.log(`otp: code sent to ${phone.slice(0, 6)}••••${phone.slice(-2)}`);
    return reply(uid, { status: 'sent', expiresAt: now + CODE_TTL_MS, retryAt: now + MIN_GAP_MS, attemptsLeft: MAX_ATTEMPTS });
  }

  async function ensureResident(rid, phone) {
    const ref = db.ref(`residents/${rid}`);
    const existing = (await ref.get()).val();
    if (!existing) {
      await ref.set({ phone, createdAt: Date.now(), channels: { sms: true, telegram: false } });
    } else if (existing.phone !== phone) {
      await ref.child('phone').set(phone);
    }
  }

  async function checkCode(uid, code, secret) {
    if (!secret) return reply(uid, { status: 'expired', code: null });
    if (Date.now() > secret.expiresAt) return reply(uid, { status: 'expired', code: null });
    if (secret.attempts >= MAX_ATTEMPTS) return reply(uid, { status: 'locked', code: null });

    if (hash(uid, code) !== secret.hash) {
      const attempts = secret.attempts + 1;
      await db.ref(`otpSecrets/${uid}/attempts`).set(attempts);
      return reply(uid, {
        status: attempts >= MAX_ATTEMPTS ? 'locked' : 'wrong_code',
        attemptsLeft: MAX_ATTEMPTS - attempts,
        code: null,
      });
    }

    const rid = residentIdFor(secret.phone);
    await ensureResident(rid, secret.phone);
    const token = await auth.createCustomToken(rid, { resident: true });
    await db.ref(`otpSecrets/${uid}`).remove();
    await reply(uid, { status: 'verified', token, code: null });
    console.log(`otp: ${rid.slice(0, 9)}•••• signed in`);

    // The site has swapped to the resident account by now: drop the request and the throwaway user
    setTimeout(async () => {
      await db.ref(`otpRequests/${uid}`).remove().catch(() => {});
      const user = await auth.getUser(uid).catch(() => null);
      if (user && user.providerData.length === 0 && !user.email && !user.phoneNumber) await auth.deleteUser(uid).catch(() => {});
    }, CLEANUP_AFTER_MS);
  }

  // requestedAt already answered per user: our own status writes fire child_changed too
  const handled = new Map();

  async function handle(snap) {
    const uid = snap.key;
    const req = snap.val();
    if (!req || req.status === 'verified' || busy.has(uid)) return;
    busy.add(uid);
    try {
      if (req.code) {
        const secret = (await db.ref(`otpSecrets/${uid}`).get()).val();
        await checkCode(uid, req.code, secret);
      } else if (req.phone && req.requestedAt && handled.get(uid) !== req.requestedAt) {
        // A new requestedAt from the site means "send me a code" (first time or "Resend")
        handled.set(uid, req.requestedAt);
        const secret = (await db.ref(`otpSecrets/${uid}`).get()).val();
        if (secret?.requestedAt !== req.requestedAt) await issueCode(uid, req, secret);
      }
    } catch (err) {
      console.error(`otp ${uid}:`, err.message);
      await reply(uid, { status: 'error' }).catch(() => {});
    } finally {
      busy.delete(uid);
    }
  }

  const ref = db.ref('otpRequests');
  ref.on('child_added', handle);
  ref.on('child_changed', handle);
  return () => {
    ref.off('child_added', handle);
    ref.off('child_changed', handle);
  };
}
