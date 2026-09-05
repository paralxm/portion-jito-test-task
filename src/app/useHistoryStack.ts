import { useEffect, useRef } from 'react';

/**
 * Mirrors the focused-step stack into browser history (ledger §12 D4) so the browser's
 * Back button and swipe-back gestures behave like the header's Back: each pushed step
 * adds one history entry; leaving steps through the UI walks the history back the same
 * number of entries; a history move that would leave a dirty step is handed to that
 * step's guard and, when intercepted, the entry is restored. Only the step stack is
 * mirrored — root switches and sheets are not history entries.
 */
export function useHistoryStack(depth: number, onHistoryBack: (steps: number) => boolean) {
  const mirrored = useRef(0);
  const ignore = useRef(0);
  const back = useRef(onHistoryBack);
  back.current = onHistoryBack;

  useEffect(() => {
    if (typeof window === 'undefined' || !window.history?.pushState) return;
    if (depth > mirrored.current) {
      for (let d = mirrored.current + 1; d <= depth; d += 1) window.history.pushState({ portionDepth: d }, '');
      mirrored.current = depth;
    } else if (depth < mirrored.current) {
      const steps = mirrored.current - depth;
      mirrored.current = depth;
      ignore.current += steps;
      window.history.go(-steps);
    }
  }, [depth]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPop = (event: PopStateEvent) => {
      if (ignore.current > 0) {
        ignore.current -= 1;
        return;
      }
      const target = typeof event.state?.portionDepth === 'number' ? event.state.portionDepth : 0;
      if (target >= mirrored.current) return; // forward or unrelated: nothing to leave
      const steps = mirrored.current - target;
      const intercepted = back.current(steps);
      if (intercepted) {
        // The step keeps its history entry while its confirmation is open.
        ignore.current += steps;
        window.history.go(steps);
      } else {
        mirrored.current = target;
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
}
