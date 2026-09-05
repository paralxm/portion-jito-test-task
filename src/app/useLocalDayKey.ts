import { useEffect, useState } from 'react';

import { localDayKey, msUntilNextLocalMidnight } from '../features/calorie-calculator/domain/local-day';

/**
 * The current local calendar day, re-evaluated when local midnight passes while the app
 * stays open (a timer to the next midnight) and whenever the page becomes visible or
 * focused again (timers are throttled in background tabs and paused in sleep). Every
 * "today" computation derives from this key, so a day change shows the new day's empty
 * record while earlier entries stay under their own day.
 */
export function useLocalDayKey(): string {
  const [dayKey, setDayKey] = useState(() => localDayKey());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      setDayKey((current) => {
        const next = localDayKey();
        return next === current ? current : next;
      });
      clearTimeout(timer);
      timer = setTimeout(refresh, msUntilNextLocalMidnight());
    };
    timer = setTimeout(refresh, msUntilNextLocalMidnight());
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', refresh);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  return dayKey;
}
