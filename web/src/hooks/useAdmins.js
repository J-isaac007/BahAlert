import { useMemo } from 'react';
import { useDbValue } from './useDbValue.js';

// /admins is the source of truth; /adminProfiles adds email and who added them.
// Admins made in the Firebase console before invites existed have no profile.
export function useAdmins() {
  const admins = useDbValue('admins');
  const profiles = useDbValue('adminProfiles');

  const list = useMemo(
    () =>
      Object.keys(admins.data ?? {})
        .filter((uid) => admins.data[uid] === true)
        .map((uid) => ({ uid, ...(profiles.data?.[uid] ?? {}) }))
        .sort((a, b) => (a.addedAt ?? 0) - (b.addedAt ?? 0)),
    [admins.data, profiles.data],
  );

  return { admins: list, loading: admins.loading || profiles.loading, error: admins.error ?? profiles.error };
}
