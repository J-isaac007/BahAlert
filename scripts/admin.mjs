// Shared firebase-admin setup for dev scripts. Admin SDK bypasses security rules.
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

try {
  process.loadEnvFile('.env');
} catch {
  /* no .env — rely on real env vars */
}

const databaseURL = process.env.FIREBASE_DATABASE_URL;
if (!databaseURL) {
  console.error('Set FIREBASE_DATABASE_URL in .env (see .env.example)');
  process.exit(1);
}

const useEmulator = Boolean(process.env.FIREBASE_DATABASE_EMULATOR_HOST);
const app = initializeApp(useEmulator ? { databaseURL, projectId: 'floodwatch-lite' } : { credential: applicationDefault(), databaseURL });

export const db = getDatabase(app);
