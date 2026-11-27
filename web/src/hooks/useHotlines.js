import { useEffect, useMemo } from 'react';
import { toList, useDbValue } from './useDbValue.js';

const CACHE_KEY = 'fw.hotlines';
const CATEGORY_ORDER = { national: 0, city: 1, barangay: 2 };

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) ?? null;
  } catch {
    return null;
  }
}

// Hotlines must work with no signal: last good copy is kept in localStorage.
export function useHotlines() {
  const { data, loading, error } = useDbValue('hotlines');

  useEffect(() => {
    if (!data) return;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [data]);

  const cache = useMemo(readCache, []);
  const source = data ?? cache;
  const hotlines = useMemo(
    () =>
      toList(source).sort(
        (a, b) => (CATEGORY_ORDER[a.category] ?? 9) - (CATEGORY_ORDER[b.category] ?? 9) || (a.order ?? 0) - (b.order ?? 0),
      ),
    [source],
  );

  return { hotlines, loading: loading && !source, error: source ? null : error, cached: !data && Boolean(source) };
}
