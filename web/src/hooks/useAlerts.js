import { useMemo } from 'react';
import { limitToLast, orderByChild } from 'firebase/database';
import { toList, useDbValue } from './useDbValue.js';

const LIMIT = 200;

// Alerts for one sensor, or all sensors when deviceId is omitted. Newest first.
export function useAlerts(deviceId) {
  const { data, loading, error } = useDbValue(
    deviceId ? `alerts/${deviceId}` : 'alerts',
    deviceId ? () => [orderByChild('ts'), limitToLast(LIMIT)] : undefined,
  );

  const alerts = useMemo(() => {
    // TODO: the all-sensors view downloads every alert; add a per-sensor limit once data grows
    const list = deviceId
      ? toList(data).map((a) => ({ ...a, deviceId }))
      : Object.entries(data ?? {}).flatMap(([id, byPush]) => toList(byPush).map((a) => ({ ...a, deviceId: id })));
    return list.sort((a, b) => b.ts - a.ts);
  }, [data, deviceId]);

  return { alerts, loading, error };
}
