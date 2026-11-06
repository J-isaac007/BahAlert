import { useEffect, useState } from 'react';
import { onServerOffsetChange, serverNow } from '../lib/serverTime.js';

// Server time, re-rendering every `intervalMs` so time-based state (offline badge) stays fresh.
export function useNow(intervalMs = 10_000) {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const tick = () => setNow(serverNow());
    const t = setInterval(tick, intervalMs);
    const off = onServerOffsetChange(tick);
    return () => {
      clearInterval(t);
      off();
    };
  }, [intervalMs]);
  return now;
}
