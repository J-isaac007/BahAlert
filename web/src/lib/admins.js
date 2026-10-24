// Invite / remove admins from the browser, without Cloud Functions.
import { deleteApp, initializeApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { ref, serverTimestamp, update } from 'firebase/database';
import { auth, db, firebaseConfig, usingEmulators } from './firebase.js';

// Throwaway password: the invitee sets their own through the reset email
function randomPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...bytes));
}

// The account is created on a second app instance so the inviting admin stays signed in.
export async function inviteAdmin(email, invitedBy) {
  const inviteApp = initializeApp(firebaseConfig, `invite-${Date.now()}`);
  const inviteAuth = getAuth(inviteApp);
  if (usingEmulators) connectAuthEmulator(inviteAuth, 'http://127.0.0.1:9099', { disableWarnings: true });
  let uid;
  try {
    uid = (await createUserWithEmailAndPassword(inviteAuth, email, randomPassword())).user.uid;
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      throw new Error(`${email} already has an account. Ask the team lead to run: npm run make-admin -- ${email}`);
    }
    throw err;
  } finally {
    await deleteApp(inviteApp);
  }
  await update(ref(db), {
    [`admins/${uid}`]: true,
    [`adminProfiles/${uid}`]: { email, addedBy: invitedBy, addedAt: serverTimestamp() },
  });
  await sendPasswordResetEmail(auth, email);
  return uid;
}

// Their login stays; they just can no longer open the Admin page.
export const removeAdmin = (uid) => update(ref(db), { [`admins/${uid}`]: null, [`adminProfiles/${uid}`]: null });
