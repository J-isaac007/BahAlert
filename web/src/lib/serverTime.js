import { onValue, ref } from 'firebase/database';
import { db } from './firebase.js';

// Readings are stamped by the server, so their age must be measured against server time.
// The viewer's own clock can be wrong: a slow phone would show a dead sensor as Live.
let offsetMs = 0;
const listeners = new Set();

if (db) {
  onValue(ref(db, '.info/serverTimeOffset'), (snap) => {
    offsetMs = snap.val() ?? 0;
    listeners.forEach((listener) => listener());
  });
}

export const serverNow = () => Date.now() + offsetMs;

// Fires when the first connection reveals how far off this device's clock is.
export function onServerOffsetChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
