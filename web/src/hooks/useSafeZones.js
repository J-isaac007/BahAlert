import { useMemo } from 'react';
import { toList, useDbValue } from './useDbValue.js';

export function useSafeZones() {
  const { data, loading, error } = useDbValue('safeZones');
  const safeZones = useMemo(() => toList(data), [data]);
  return { safeZones, loading, error };
}
