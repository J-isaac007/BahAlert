import { useMemo } from 'react';
import { checkDanger } from '../lib/geo.js';

// { level: 'danger' | 'approaching' | 'caution' | 'safe', sensor, distanceM } or null without a position
export function useDangerCheck(position, sensors) {
  return useMemo(() => (position ? checkDanger(position, sensors) : null), [position, sensors]);
}
