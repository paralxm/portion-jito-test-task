import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

/**
 * Remembers the document scroll position per screen key for the active session, so Back
 * from details restores the list where it was and switching destinations restores each
 * destination's own position. `reset` is for a new query: results start at the top.
 */
export function useScrollMemory(key: string) {
  const positions = useRef(new Map<string, number>());
  const current = useRef(key);

  useEffect(() => {
    const onScroll = () => positions.current.set(current.current, window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useLayoutEffect(() => {
    current.current = key;
    window.scrollTo(0, positions.current.get(key) ?? 0);
  }, [key]);

  const reset = useCallback((target: string) => {
    positions.current.set(target, 0);
    if (current.current === target) window.scrollTo(0, 0);
  }, []);

  return { reset };
}
