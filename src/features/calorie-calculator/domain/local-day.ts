/**
 * The local calendar day is the basis of "today" everywhere (ledger §11.3): entries and
 * water carry the day key they were recorded under, Home shows the entries whose key is
 * the current local day, and the key is re-evaluated when local midnight passes while
 * the app stays open. The device's time zone is the only time zone; nothing is converted
 * to or from UTC.
 */
import { localDayKey } from './daily-log';

export { localDayKey };

/** Milliseconds from `now` to the next local midnight (never 0: at midnight it is a full day). */
export function msUntilNextLocalMidnight(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return Math.max(1, next.getTime() - now.getTime());
}

/** True when two instants fall on different local calendar days. */
export function crossesLocalDay(from: Date, to: Date): boolean {
  return localDayKey(from) !== localDayKey(to);
}
