import { useCallback, useState } from 'react';
import { findSafeRoute, routeToZone } from '../lib/routing.js';

const IDLE = { result: null, loading: false, error: null };

export function useRoute() {
  const [state, setState] = useState(IDLE);

  const run = useCallback(async (fn) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      setState({ result: await fn(), loading: false, error: null });
    } catch (error) {
      setState({ result: null, loading: false, error });
    }
  }, []);

  const toNearest = useCallback((args) => run(() => findSafeRoute(args)), [run]);
  const toZone = useCallback((args) => run(() => routeToZone(args)), [run]);
  const clear = useCallback(() => setState(IDLE), []);

  return { ...state, toNearest, toZone, clear };
}
