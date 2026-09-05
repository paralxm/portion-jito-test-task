/**
 * Daily record (Home's daily overview): explicitly logged entries, each in one meal,
 * the optional daily goal and the arithmetic from docs/ux/ui-contract.md §3.
 *
 *   todayEntries  = entries whose day key is today's local day
 *   loggedKcal    = sum(todayEntries.energyKcal), when every energy is known
 *   remainingKcal = goalKcal − loggedKcal, when goal and total are valid
 *   visualRatio   = clamp(loggedKcal / goalKcal, 0, 1)
 *
 * Persistence belongs to the app shell (src/app/persistence.ts); this module owns the
 * arithmetic and the entry shape. Unknown values stay unknown — a missing nutrient never
 * becomes zero, and a partial total says so instead of pretending to be complete.
 */
import { parseAmount, scaleNutrition, type FoodCandidate, type NutritionValues, type Portion } from './calculation';
import { MEAL_ORDER, type MealType } from './meal';

/** One explicitly logged food or recipe: an identity/portion/nutrition snapshot taken at Add to {meal}. */
export interface FoodEntry {
  id: string;
  /** Local calendar day the entry belongs to (YYYY-MM-DD). Editing keeps it. */
  dayKey: string;
  createdAt: number;
  /**
   * The meal the entry belongs to. `null` is the unassigned guard for a record written
   * before the meal field existed (ledger D-16): it is never produced by this module and
   * is shown as "Unassigned" with a Choose meal resolution, never classified silently.
   */
  meal: MealType | null;
  candidate: FoodCandidate;
  portion: Portion;
  result: NutritionValues;
}

/** The optional daily goal: calories, plus optional user-entered macro targets in grams (never derived). */
export interface DailyGoal {
  kcal: number;
  proteinG?: number | null;
  carbohydratesG?: number | null;
  fatG?: number | null;
}

/** Local calendar-day key, e.g. 2026-09-04. Never a UTC date. */
export function localDayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

let entrySequence = 0;

/**
 * Creates an entry from a reviewed candidate, portion and meal. Returns `null` when the
 * portion cannot be calculated or the food has no energy value — such a food can be
 * reviewed but never logged, so Home never receives an entry without calories.
 */
export function createEntry(candidate: FoodCandidate, portion: Portion, meal: MealType, options: { now?: number; id?: string } = {}): FoodEntry | null {
  const result = scaleNutrition(candidate, portion);
  if (!result || result.energyKcal === null) return null;
  const now = options.now ?? Date.now();
  return { id: options.id ?? `entry-${now.toString(36)}-${++entrySequence}`, dayKey: localDayKey(new Date(now)), createdAt: now, meal, candidate, portion, result };
}

/** Applies a new portion (and optionally a new meal) to an existing entry, preserving its id and day. `null` when the portion cannot be calculated. */
export function updateEntryPortion(entry: FoodEntry, portion: Portion, meal: MealType | null = entry.meal): FoodEntry | null {
  const result = scaleNutrition(entry.candidate, portion);
  if (!result || result.energyKcal === null) return null;
  return { ...entry, portion, result, meal };
}

export function entriesForDay(entries: readonly FoodEntry[], dayKey: string): FoodEntry[] {
  return entries.filter((entry) => entry.dayKey === dayKey);
}

/** Entries grouped by meal in the fixed order, plus any unassigned ones (normally none). */
export function groupByMeal(entries: readonly FoodEntry[]): { meals: Record<MealType, FoodEntry[]>; unassigned: FoodEntry[] } {
  const meals = Object.fromEntries(MEAL_ORDER.map((meal) => [meal, [] as FoodEntry[]])) as Record<MealType, FoodEntry[]>;
  const unassigned: FoodEntry[] = [];
  for (const entry of entries) {
    if (entry.meal === null) unassigned.push(entry);
    else meals[entry.meal].push(entry);
  }
  return { meals, unassigned };
}

/** A sum over entries. `value` is `null` when entries exist but none contributed a known value; 0 with no entries. */
export interface AggregateValue {
  value: number | null;
  /** True when every entry contributed a known value (vacuously true with no entries). */
  complete: boolean;
}

function aggregate(values: readonly (number | null | undefined)[]): AggregateValue {
  const known = values.filter((v): v is number => typeof v === 'number');
  // No entries at all: a recorded total of nothing is 0 (low-fidelity §4.2), not unknown.
  if (values.length === 0) return { value: 0, complete: true };
  if (known.length === 0) return { value: null, complete: false };
  return { value: known.reduce((sum, v) => sum + v, 0), complete: known.length === values.length };
}

/** The known energy subtotal of a set of entries (a meal), and whether it is complete. */
export function energyOf(entries: readonly FoodEntry[]): { kcal: number; complete: boolean } {
  const total = aggregate(entries.map((entry) => entry.result.energyKcal));
  return { kcal: total.value ?? 0, complete: total.complete };
}

export type DailyEnergyState =
  /** No valid goal: logged energy is shown, the remainder is unavailable. */
  | 'no-goal'
  /** A goal exists but at least one entry has no energy value: the total is partial. */
  | 'incomplete'
  /** Below the goal. */
  | 'below'
  /** Exactly at the goal: 0 kcal remaining. */
  | 'reached'
  /** Above the goal: the excess is stated, never hidden behind 0 remaining. */
  | 'exceeded';

export interface DailySummary {
  entryCount: number;
  /** Known energy subtotal; `complete` is false when an entry has no energy value. */
  energy: { kcal: number; complete: boolean };
  protein: AggregateValue;
  carbohydrates: AggregateValue;
  fat: AggregateValue;
  /** The valid goal, or `null` when none is set (an invalid stored value counts as none). */
  goalKcal: number | null;
  /** goal − logged, only while below or at the goal; `null` otherwise. */
  remainingKcal: number | null;
  /** logged − goal, only above the goal; `null` otherwise. */
  overKcal: number | null;
  /** clamp(logged / goal, 0, 1) for a valid goal and complete energy; `null` otherwise. */
  ratio: number | null;
  state: DailyEnergyState;
}

export function isValidGoal(goal: number | null | undefined): goal is number {
  return typeof goal === 'number' && Number.isFinite(goal) && goal > 0;
}

/** Aggregates today's entries against the optional goal. Pure; the caller selects the day. */
export function summarizeDay(entries: readonly FoodEntry[], goalKcal: number | null): DailySummary {
  const energy = energyOf(entries);
  const protein = aggregate(entries.map((entry) => entry.result.proteinG));
  const carbohydrates = aggregate(entries.map((entry) => entry.result.carbohydratesG));
  const fat = aggregate(entries.map((entry) => entry.result.fatG));
  const goal = isValidGoal(goalKcal) ? goalKcal : null;

  let state: DailyEnergyState;
  if (goal === null) state = 'no-goal';
  else if (!energy.complete) state = 'incomplete';
  else if (energy.kcal < goal) state = 'below';
  else if (energy.kcal === goal) state = 'reached';
  else state = 'exceeded';

  const ratio = goal !== null && energy.complete ? Math.min(1, Math.max(0, energy.kcal / goal)) : null;
  const remainingKcal = state === 'below' || state === 'reached' ? (goal as number) - energy.kcal : null;
  const overKcal = state === 'exceeded' ? energy.kcal - (goal as number) : null;

  return { entryCount: entries.length, energy, protein, carbohydrates, fat, goalKcal: goal, remainingKcal, overKcal, ratio, state };
}

export type GoalParse = { ok: true; kcal: number } | { ok: false; reason: 'empty' | 'invalid' | 'not-positive' };

/** Same decimal policy as every other numeric field; a goal must be a positive finite number. */
export function parseGoalDraft(draft: string): GoalParse {
  const parsed = parseAmount(draft);
  if (!parsed.ok) return { ok: false, reason: parsed.reason };
  return { ok: true, kcal: parsed.value };
}

/** An optional macro target: blank means none; otherwise the shared positive-number policy. */
export function parseTargetDraft(draft: string): { ok: true; grams: number | null } | { ok: false; reason: 'invalid' | 'not-positive' } {
  if (draft.trim() === '') return { ok: true, grams: null };
  const parsed = parseAmount(draft);
  if (!parsed.ok) return { ok: false, reason: parsed.reason === 'not-positive' ? 'not-positive' : 'invalid' };
  return { ok: true, grams: parsed.value };
}

/** Whole kilocalories with digit grouping for the daily figures, e.g. "1,350". */
export function formatKcal(value: number): string {
  return new Intl.NumberFormat('en').format(Math.round(value));
}
