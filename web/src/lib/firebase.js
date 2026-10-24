import { initializeApp } from 'firebase/app';
import { connectDatabaseEmulator, getDatabase } from 'firebase/database';
import { connectAuthEmulator, getAuth } from 'firebase/auth';

const env = import.meta.env;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: env.VITE_FIREBASE_DATABASE_URL,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

// Lets the UI render (with a notice) before anyone has filled in .env
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.databaseURL);
export const usingEmulators = env.VITE_USE_EMULATORS === 'true';

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const db = app ? getDatabase(app) : null;
export const auth = app ? getAuth(app) : null;

if (app && usingEmulators) {
  connectDatabaseEmulator(db, '127.0.0.1', 9000);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}
