import { useMemo } from 'react';
import { toSensor } from '../lib/flood.js';
import { useDbValue } from './useDbValue.js';
import { useNow } from './useNow.js';

const hasCoords = (s) => Number.isFinite(s.lng) && Number.isFinite(s.lat);

export function useSensors() {
  const { data, loading, error } = useDbValue('devices');
  const now = useNow();
  const sensors = useMemo(
    () => Object.entries(data ?? {}).map(([id, d]) => toSensor(id, d, now)).filter(hasCoords),
    [data, now],
  );
  return { sensors, loading, error };
}
