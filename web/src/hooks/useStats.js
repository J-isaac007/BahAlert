import { useDbValue } from './useDbValue.js';

// Raw /stats: { deviceId: { 'yyyy-mm-dd': { maxLevelCm, redMinutes } } } — feeds the heatmap.
export function useStats() {
  const { data, loading, error } = useDbValue('stats');
  return { stats: data ?? {}, loading, error };
}
