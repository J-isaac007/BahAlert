import { useMemo } from 'react';
import { toSensor } from '../lib/flood.js';
import { useDbValue } from './useDbValue.js';
import { useNow } from './useNow.js';

export function useSensor(id) {
  const { data, loading, error } = useDbValue(id ? `devices/${id}` : null);
  const now = useNow();
  const sensor = useMemo(() => (data ? toSensor(id, data, now) : null), [id, data, now]);
  return { sensor, loading, error };
}
