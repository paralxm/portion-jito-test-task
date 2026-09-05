/**
 * The logging streak (ledger §12, requirement A5). A day qualifies when it holds at
 * least one confirmed food or recipe entry — water, opening the app, reaching a goal or
 * viewing a day never count. The streak is the run of consecutive local day keys that
 * ends today when today qualifies; otherwise the run ending yesterday while today is
 * still open; 0 when neither qualifies. It always describes the current run relative to
 * today, never the selected historical day, and it is recomputed from the entries every
 * time, so adding, backfilling and removing entries (including a day's last one) are all
 * reflected without a stored counter.
 */
import { addDays } from './day-keys';
import type { FoodEntry } from './daily-log';

export interface Streak {
  /** Consecutive qualifying days ending today or yesterday. */
  days: number;
  /** Whether today itself already qualifies. */
  todayLogged: boolean;
}

export function computeStreak(entries: readonly FoodEntry[], todayKey: string): Streak {
  const days = new Set(entries.map((entry) => entry.dayKey));
  const todayLogged = days.has(todayKey);
  let cursor = todayLogged ? todayKey : addDays(todayKey, -1);
  if (!days.has(cursor)) return { days: 0, todayLogged };
  let count = 0;
  while (days.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return { days: count, todayLogged };
}

/** The short explanation shown beside the count (and read by assistive technology). */
export function describeStreak(streak: Streak): string {
  if (streak.days === 0) return 'No streak yet. A day counts once you add a food or recipe to a meal.';
  const run = `${streak.days} ${streak.days === 1 ? 'day' : 'days'} in a row with at least one food or recipe logged`;
  return streak.todayLogged ? `${run}, including today.` : `${run}, up to yesterday. Log something today to keep it going.`;
}
