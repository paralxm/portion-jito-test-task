import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Eases a displayed number from its current value to `target` over the value-change
 * motion token, read from the element's computed style so both the OS reduced-motion
 * setting and `data-portion-motion="reduced"` collapse it to an instant update. A new
 * target while a run is in flight restarts from the value currently shown, so rapid
 * repeated updates never jump backwards or drop an increment.
 */
export function useAnimatedNumber(target: number, elementRef: RefObject<HTMLElement | null>): number {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);
  const frame = useRef(0);

  useEffect(() => {
    cancelAnimationFrame(frame.current);
    const element = elementRef.current;
    const duration = element ? parseFloat(getComputedStyle(element).getPropertyValue('--portion-motion-transition-value-change')) || 0 : 0;
    const from = shownRef.current;
    if (duration <= 0 || from === target || typeof requestAnimationFrame === 'undefined') {
      shownRef.current = target;
      setShown(target);
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // The standard easing's shape, ease-out, so the figure settles rather than snaps.
      const eased = 1 - (1 - t) * (1 - t);
      const value = from + (target - from) * eased;
      shownRef.current = value;
      setShown(value);
      if (t < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [target, elementRef]);

  return shown;
}
