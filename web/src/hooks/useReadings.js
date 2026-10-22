import { useMemo } from 'react';
import { orderByChild, startAt } from 'firebase/database';
import { toList, useDbValue } from './useDbValue.js';

// Readings for one sensor over the last `rangeMs`, sorted oldest -> newest.
export function useReadings(deviceId, rangeMs) {
  const { data, loading, error } = useDbValue(
    deviceId ? `readings/${deviceId}` : null,
    () => [orderByChild('ts'), startAt(Date.now() - rangeMs)],
    String(rangeMs),
  );
  const readings = useMemo(() => toList(data).sort((a, b) => a.ts - b.ts), [data]);
  return { readings, loading, error };
}
