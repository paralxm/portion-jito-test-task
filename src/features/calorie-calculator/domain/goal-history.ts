/**
 * Goal history (ledger §12, requirement A6). The goal and the optional macro targets
 * are kept as effective-dated periods: each period starts on a local day key and lasts
 * until the next period begins. A day before the earliest period has no goal — nothing
 * is invented for it — and a legacy single goal migrates as a period starting on the
 * migration day, so earlier days truthfully show logged amounts alone. Editing writes a
 * new period from the given day (today by default) and leaves earlier periods intact.
 */
import { compareDayKeys } from './day-keys';
import { isValidGoal, type DailyGoal } from './daily-log';

export interface GoalPeriod {
  /** First local day the period applies to (inclusive). */
  from: string;
  /** The goal for the period, or `null` when the goal was cleared from that day on. */
  goal: DailyGoal | null;
}

/** Periods sorted by `from`, one per day key. */
export type GoalHistory = readonly GoalPeriod[];

export const EMPTY_GOAL_HISTORY: GoalHistory = [];

function normalise(periods: readonly GoalPeriod[]): GoalPeriod[] {
  const byDay = new Map<string, GoalPeriod>();
  for (const period of periods) byDay.set(period.from, period);
  return [...byDay.values()].sort((a, b) => compareDayKeys(a.from, b.from));
}

/** The goal in force on a day: the latest period starting on or before it; `null` before the first period. */
export function goalForDay(history: GoalHistory, dayKey: string): DailyGoal | null {
  let current: DailyGoal | null = null;
  for (const period of history) {
    if (compareDayKeys(period.from, dayKey) <= 0) current = period.goal;
    else break;
  }
  return current && isValidGoal(current.kcal) ? current : null;
}

export interface RecordOptions {
  /** Keep periods that start after `dayKey` (an immediate save that leaves a scheduled change in place); by default the save supersedes them. */
  keepLater?: boolean;
}

/**
 * Records a goal (or a clear, `null`) from a day onward. One record per day: saving
 * again on the same day replaces that day's values. Later periods are dropped because
 * the save supersedes them — a future-dated save therefore replaces any other pending
 * change, and a removal from today cancels one — unless `keepLater` asks to keep them.
 */
export function setGoalFrom(history: GoalHistory, dayKey: string, goal: DailyGoal | null, options: RecordOptions = {}): GoalPeriod[] {
  const kept = history.filter((period) => compareDayKeys(period.from, dayKey) < 0 || (options.keepLater === true && compareDayKeys(period.from, dayKey) > 0));
  return normalise([...kept, { from: dayKey, goal }]);
}

/** The period in force today (the latest starting on or before today), or `null` before the first. */
export function currentPeriod(history: GoalHistory, todayKey: string): GoalPeriod | null {
  let current: GoalPeriod | null = null;
  for (const period of history) {
    if (compareDayKeys(period.from, todayKey) <= 0) current = period;
    else break;
  }
  return current;
}

/** The one scheduled change: the earliest period starting after today, or `null`. */
export function pendingPeriod(history: GoalHistory, todayKey: string): GoalPeriod | null {
  return history.find((period) => compareDayKeys(period.from, todayKey) > 0) ?? null;
}

/** Drops every period starting after today; the current period and the past stay as they are. */
export function cancelPending(history: GoalHistory, todayKey: string): GoalPeriod[] {
  return history.filter((period) => compareDayKeys(period.from, todayKey) <= 0);
}

/** The latest period's goal — what "the goal" means once the history is at least one period long. */
export function currentGoal(history: GoalHistory): DailyGoal | null {
  return history.length === 0 ? null : (history[history.length - 1].goal ?? null);
}

/** A legacy single goal becomes one period from the migration day. No goal means no history. */
export function migrateLegacyGoal(goal: DailyGoal | null, migrationDayKey: string): GoalPeriod[] {
  return goal ? [{ from: migrationDayKey, goal }] : [];
}

export { normalise as normaliseGoalHistory };
