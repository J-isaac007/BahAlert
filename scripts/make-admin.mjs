// Makes (or removes) a BahAlert admin. Creates the Auth account if needed and prints a set-password link.
//   npm run make-admin -- officer@brgy.gov.ph
//   npm run make-admin -- --remove officer@brgy.gov.ph
import { randomBytes } from 'node:crypto';
import { auth, db } from './admin.mjs';

const args = process.argv.slice(2);
const remove = args.includes('--remove');
const email = args.find((a) => !a.startsWith('--'))?.trim().toLowerCase();
if (!email || !email.includes('@')) {
  console.error('Usage: npm run make-admin -- [--remove] <email>');
  process.exit(1);
}

const existing = await auth.getUserByEmail(email).catch((err) => {
  if (err.code === 'auth/user-not-found') return null;
  throw err;
});

if (remove) {
  if (!existing) {
    console.error(`No account for ${email}.`);
    process.exit(1);
  }
  await db.ref().update({ [`admins/${existing.uid}`]: null, [`adminProfiles/${existing.uid}`]: null });
  console.log(`${email} is no longer an admin. Their login still exists but cannot open the Admin page.`);
  process.exit(0);
}

// Random throwaway password: the officer sets their own through the reset link
const user = existing ?? (await auth.createUser({ email, password: randomBytes(18).toString('base64url') }));
await db.ref().update({
  [`admins/${user.uid}`]: true,
  [`adminProfiles/${user.uid}`]: { email, addedBy: 'make-admin script', addedAt: Date.now() },
});
const link = await auth.generatePasswordResetLink(email);

console.log(`${email} is an admin${existing ? ' (existing account)' : ' (new account)'}. UID ${user.uid}`);
console.log(`Send them this link to set their password:\n${link}`);
process.exit(0);
