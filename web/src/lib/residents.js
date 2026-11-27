// Resident accounts: sign in with a mobile number + texted code, choose sensors and channels.
// The alert service (service/otp.mjs) answers code requests through the database.
import { signInAnonymously, signInWithCustomToken, signOut } from 'firebase/auth';
import { onValue, ref, remove, serverTimestamp, set, update } from 'firebase/database';
import { auth, db } from './firebase.js';
import { normalizePhone } from './phone.js';

// Asks the service to text a code. Returns the request id to watch.
export async function requestCode(phoneInput) {
  const phone = normalizePhone(phoneInput);
  if (!phone) throw new Error('bad_phone');
  // A throwaway anonymous login owns the request until the code checks out
  if (!auth.currentUser?.isAnonymous) await signInAnonymously(auth);
  const uid = auth.currentUser.uid;
  await update(ref(db, `otpRequests/${uid}`), { phone, requestedAt: serverTimestamp() });
  return uid;
}

export const watchRequest = (uid, onChange) => onValue(ref(db, `otpRequests/${uid}`), (snap) => onChange(snap.val()));

export const submitCode = (uid, code) => set(ref(db, `otpRequests/${uid}/code`), code);

export const finishSignIn = (token) => signInWithCustomToken(auth, token);

export function saveResident(rid, { name, barangay, watch, channels }) {
  const watched = Object.fromEntries(Object.entries(watch ?? {}).filter(([, on]) => on).map(([id]) => [id, true]));
  return update(ref(db, `residents/${rid}`), {
    name: name.trim(),
    barangay: barangay ?? '',
    watch: Object.keys(watched).length ? watched : null,
    channels: { sms: Boolean(channels?.sms), telegram: Boolean(channels?.telegram) },
  });
}

// One-time code for the Telegram deep link t.me/<bot>?start=<code> (expires after 30 min)
export async function makeTelegramLink(rid) {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  const code = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  await set(ref(db, `telegramLinks/${code}`), { rid, ts: serverTimestamp() });
  return code;
}

export async function deleteResident(rid) {
  await remove(ref(db, `residents/${rid}`));
  await signOut(auth);
}

export const signOutResident = () => signOut(auth);
