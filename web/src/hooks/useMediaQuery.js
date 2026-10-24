import { useEffect, useState } from 'react';

const match = (query) => typeof window !== 'undefined' && window.matchMedia(query).matches;

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => match(query));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

// Same breakpoint as styles/global.css
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
