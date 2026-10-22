import { useEffect, useState } from 'react';
import { onValue, query, ref } from 'firebase/database';
import { db } from '../lib/firebase.js';

const NOT_CONFIGURED = new Error('Firebase is not configured — fill in web/.env');

// Live subscription to one RTDB path.
// makeConstraints: optional () => [orderByChild(...), ...]; change depKey to re-subscribe.
export function useDbValue(path, makeConstraints, depKey = '') {
  const [state, setState] = useState({
    data: null,
    loading: Boolean(db && path),
    error: db ? null : NOT_CONFIGURED,
  });

  useEffect(() => {
    if (!db || !path) return undefined;
    setState((s) => ({ ...s, loading: true }));
    const target = makeConstraints ? query(ref(db, path), ...makeConstraints()) : ref(db, path);
    return onValue(
      target,
      (snap) => setState({ data: snap.val(), loading: false, error: null }),
      (error) => setState({ data: null, loading: false, error }),
    );
    // makeConstraints is intentionally keyed by depKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, depKey]);

  return state;
}

// { pushId: {...} } -> [{ id: pushId, ... }]
export const toList = (obj) => Object.entries(obj ?? {}).map(([id, v]) => ({ id, ...v }));
