import { useEffect, useState } from 'react';

// useState that remembers its value in localStorage (per browser). Storage may be blocked — never throw.
export function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return initial;
      const saved = JSON.parse(raw);
      // Objects: fill keys a newer version added (or an old save is missing) from the defaults
      const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
      return isObj(initial) && isObj(saved) ? { ...initial, ...saved } : (saved ?? initial);
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value]);

  return [value, setValue];
}
