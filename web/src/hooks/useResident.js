import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase.js';
import { isResidentUid } from '../lib/phone.js';
import { useDbValue } from './useDbValue.js';
import { useNow } from './useNow.js';

// The signed-in resident (phone account ph_639...), if any. Admins and anonymous users are not residents.
export function useResident() {
  const [user, setUser] = useState(auth?.currentUser ?? null);
  const [ready, setReady] = useState(!auth);

  useEffect(() => {
    if (!auth) return undefined;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
  }, []);

  const rid = user && isResidentUid(user.uid) ? user.uid : null;
  const { data, loading } = useDbValue(rid ? `residents/${rid}` : null);
  return { rid, resident: data, loading: !ready || Boolean(rid && loading) };
}

// Is the alert service (service/index.mjs) running? It writes a heartbeat every 30 s.
export function useAlertService() {
  const { data, loading } = useDbValue('settings/service');
  const now = useNow();
  const online = Boolean(data?.heartbeatAt && now - data.heartbeatAt < 90_000);
  return { loading, online, telegramBot: online ? (data?.telegramBot ?? null) : null, sms: Boolean(data?.sms) };
}
