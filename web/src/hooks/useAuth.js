import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { get, ref } from 'firebase/database';
import { auth, db } from '../lib/firebase.js';

export const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const logout = () => signOut(auth);

// Admin = uid listed at /admins/{uid} (set by hand in Firebase console)
export function useAuth() {
  const [state, setState] = useState({ user: null, isAdmin: false, loading: Boolean(auth) });

  useEffect(() => {
    if (!auth) return undefined;
    return onAuthStateChanged(auth, async (user) => {
      if (!user) return setState({ user: null, isAdmin: false, loading: false });
      const snap = await get(ref(db, `admins/${user.uid}`)).catch(() => null);
      setState({ user, isAdmin: snap?.val() === true, loading: false });
    });
  }, []);

  return state;
}
