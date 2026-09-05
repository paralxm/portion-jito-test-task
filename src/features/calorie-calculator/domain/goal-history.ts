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

/** Records a goal (or a clear, `null`) from a day onward; later periods are dropped because the edit supersedes them. */
export function setGoalFrom(history: GoalHistory, dayKey: string, goal: DailyGoal | null): GoalPeriod[] {
  const kept = history.filter((period) => compareDayKeys(period.from, dayKey) < 0);
  return normalise([...kept, { from: dayKey, goal }]);
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
