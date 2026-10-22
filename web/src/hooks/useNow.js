import { useEffect, useState } from 'react';

// Re-render every `intervalMs` so time-based state (offline badge) stays fresh.
export function useNow(intervalMs = 10_000) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
