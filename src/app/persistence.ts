/**
 * The daily record on the device (ledger §11.3, §12 A6): today's and earlier entries,
 * the effective-dated goal history, water totals per local day, and the Search view
 * preference, kept in `localStorage` under one versioned key so a reload never loses
 * what was confirmed.
 *
 * Rules: an unreadable or foreign record is ignored, never wiped by a crash; an entry
 * written before the meal field existed loads with `meal: null` (the unassigned guard,
 * ledger D-16) rather than being classified silently; every entry keeps its own local
 * day key, so yesterday's food never reads as today's after a reload; a candidate's
 * photograph is re-resolved from the current catalogue by its stable id, because a built
 * asset URL is not durable across deployments; a version-1 record's single goal becomes
 * one goal period starting on the migration day, so earlier days never receive a goal
 * that was not in force (§12 A6).
 */
import type { FoodCandidate } from '../features/calorie-calculator/domain/calculation';
import type { DailyGoal, FoodEntry } from '../features/calorie-calculator/domain/daily-log';
import { isDayKey, localDayKey } from '../features/calorie-calculator/domain/day-keys';
import { ACTIVITY_OPTIONS, ESTIMATE_METHOD, GOAL_OPTIONS, SEX_OPTIONS, type EstimateRecord } from '../features/calorie-calculator/domain/energy-estimate';
import { migrateLegacyGoal, normaliseGoalHistory, type GoalHistory, type GoalPeriod } from '../features/calorie-calculator/domain/goal-history';
import { PRESET_OPTIONS, type MacroPreset } from '../features/calorie-calculator/domain/macro-presets';
import { WATER_GOAL_ML, WATER_REFERENCE_RANGE_ML } from '../features/calorie-calculator/domain/water';
import { MEAL_ORDER, type MealType } from '../features/calorie-calculator/domain/meal';

export const RECORD_KEY = 'portion.record';
export const RECORD_VERSION = 2;

export type SearchView = 'list' | 'grid';

export interface PersistedRecord {
  version: typeof RECORD_VERSION;
  entries: FoodEntry[];
  /** Effective-dated goal periods, sorted by day; empty when no goal was ever set. */
  goals: GoalHistory;
  water: Record<string, number>;
  /** The daily water reference the tracker measures against (a product default until the person changes it). */
  waterReferenceMl: number;
  searchView: SearchView;
  /** The presentation of the Recipes scope's results; independent of the Food view. */
  recipeView: SearchView;
}

export const EMPTY_RECORD: PersistedRecord = { version: RECORD_VERSION, entries: [], goals: [], water: {}, waterReferenceMl: WATER_GOAL_ML, searchView: 'list', recipeView: 'list' };

/** The subset of `Storage` the record needs; `localStorage` in the browser, a Map-backed fake in tests. */
export interface RecordStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

function readMeal(value: unknown): MealType | null {
  return typeof value === 'string' && (MEAL_ORDER as readonly string[]).includes(value) ? (value as MealType) : null;
}

/** Keeps an entry only when its identity, day, portion and result are usable; anything else is dropped, not guessed. */
function readEntry(raw: unknown, resolveImage: (candidateId: string) => string | undefined): FoodEntry | null {
  if (!isObject(raw)) return null;
  const { id, dayKey, createdAt, candidate, portion, result } = raw;
  if (typeof id !== 'string' || !isDayKey(dayKey) || !isFiniteNumber(createdAt)) return null;
  if (!isObject(candidate) || typeof candidate.id !== 'string' || typeof candidate.name !== 'string' || !isObject(candidate.reference) || !isObject(candidate.nutrition) || !Array.isArray(candidate.units)) return null;
  if (!isObject(portion) || !isFiniteNumber(portion.quantity) || typeof portion.unitId !== 'string') return null;
  if (!isObject(result) || !('energyKcal' in result)) return null;
  const image = resolveImage(candidate.id);
  const hydrated: FoodCandidate = { ...(candidate as unknown as FoodCandidate), imageUrl: image };
  if (image === undefined) delete hydrated.imageUrl;
  return {
    id,
    dayKey,
    createdAt,
    meal: readMeal(raw.meal),
    candidate: hydrated,
    portion: { quantity: portion.quantity, unitId: portion.unitId },
    result: result as unknown as FoodEntry['result'],
  };
}

const isOneOf = <T extends string>(value: unknown, options: ReadonlyArray<{ id: T }>): value is T => typeof value === 'string' && options.some((o) => o.id === value);

/** A saved estimate is kept only whole; a partial one cannot be explained or recalculated, so it is dropped rather than guessed. */
function readEstimate(raw: unknown): EstimateRecord | undefined {
  if (!isObject(raw) || raw.method !== ESTIMATE_METHOD) return undefined;
  const { age, heightCm, weightKg, eerKcal, adjustmentKcal, sex, activity, goal } = raw;
  if (!isFiniteNumber(age) || !isFiniteNumber(heightCm) || !isFiniteNumber(weightKg) || !isFiniteNumber(eerKcal) || !isFiniteNumber(adjustmentKcal)) return undefined;
  if (!isOneOf(sex, SEX_OPTIONS) || !isOneOf(activity, ACTIVITY_OPTIONS) || !isOneOf(goal, GOAL_OPTIONS)) return undefined;
  return { method: ESTIMATE_METHOD, age, sex, heightCm, weightKg, activity, goal, eerKcal, adjustmentKcal };
}

/** Provenance is additive (§13.4): a goal written before it existed reads as manual; an unreadable source or preset is left out, never invented. */
function readGoal(raw: unknown): DailyGoal | null {
  if (!isObject(raw) || !isFiniteNumber(raw.kcal) || raw.kcal <= 0) return null;
  const target = (value: unknown) => (isFiniteNumber(value) && value > 0 ? value : null);
  const goal: DailyGoal = { kcal: raw.kcal, proteinG: target(raw.proteinG), carbohydratesG: target(raw.carbohydratesG), fatG: target(raw.fatG) };
  if (raw.source === 'manual' || raw.source === 'estimated') goal.source = raw.source;
  if (isOneOf(raw.preset, PRESET_OPTIONS)) goal.preset = raw.preset as MacroPreset;
  const estimate = readEstimate(raw.estimate);
  if (estimate) goal.estimate = estimate;
  return goal;
}

/** The water reference: a whole number inside the supported range, else the product default. */
function readWaterReference(raw: unknown): number {
  return isFiniteNumber(raw) && raw >= WATER_REFERENCE_RANGE_ML.min && raw <= WATER_REFERENCE_RANGE_ML.max ? Math.round(raw) : WATER_GOAL_ML;
}

/** Version 2 periods: each needs a day key; a period whose goal cannot be read is a clear (`null`), never a guess. */
function readGoals(raw: unknown): GoalPeriod[] {
  if (!Array.isArray(raw)) return [];
  const periods: GoalPeriod[] = [];
  for (const item of raw) {
    if (!isObject(item) || !isDayKey(item.from)) continue;
    periods.push({ from: item.from, goal: item.goal === null ? null : readGoal(item.goal) });
  }
  return normaliseGoalHistory(periods);
}

function readWater(raw: unknown): Record<string, number> {
  if (!isObject(raw)) return {};
  const water: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (isDayKey(key) && isFiniteNumber(value) && value >= 0) water[key] = Math.round(value);
  }
  return water;
}

export interface ParseOptions {
  /** Re-resolves a candidate's photograph from the current catalogue by id. */
  resolveImage?: (candidateId: string) => string | undefined;
  /** The local day a version-1 goal starts on (the day the record is migrated); defaults to the device's current day. */
  migrationDayKey?: string;
}

/**
 * Parses a stored record. Older or partial shapes are migrated field by field: what can
 * be read is kept, what cannot is left out. Returns the empty record for nothing stored.
 */
export function parseRecord(text: string | null, options: ParseOptions | ((candidateId: string) => string | undefined) = {}): PersistedRecord {
  const { resolveImage = () => undefined, migrationDayKey = localDayKey() } = typeof options === 'function' ? { resolveImage: options } : options;
  if (!text) return EMPTY_RECORD;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return EMPTY_RECORD;
  }
  if (!isObject(raw)) return EMPTY_RECORD;
  const entries = Array.isArray(raw.entries) ? raw.entries.map((e) => readEntry(e, resolveImage)).filter((e): e is FoodEntry => e !== null) : [];
  // Version 2 keeps a goal history; anything older carried one goal, which starts on the migration day.
  const goals = Array.isArray(raw.goals) ? readGoals(raw.goals) : migrateLegacyGoal(readGoal(raw.goal), migrationDayKey);
  return {
    version: RECORD_VERSION,
    entries,
    goals,
    water: readWater(raw.water),
    waterReferenceMl: readWaterReference(raw.waterReferenceMl),
    searchView: raw.searchView === 'grid' ? 'grid' : 'list',
    recipeView: raw.recipeView === 'grid' ? 'grid' : 'list',
  };
}

/** Strips the photograph before writing: it is re-resolved from the catalogue (or the photo store) on load. */
export function serialiseRecord(record: PersistedRecord): string {
  const entries = record.entries.map((entry) => {
    const { imageUrl: _image, ...candidate } = entry.candidate;
    return { ...entry, candidate };
  });
  return JSON.stringify({ ...record, version: RECORD_VERSION, entries });
}

export function loadRecord(storage: RecordStorage | null, options?: ParseOptions | ((candidateId: string) => string | undefined)): PersistedRecord {
  if (!storage) return EMPTY_RECORD;
  try {
    return parseRecord(storage.getItem(RECORD_KEY), options);
  } catch {
    return EMPTY_RECORD;
  }
}

export function saveRecord(storage: RecordStorage | null, record: PersistedRecord): void {
  if (!storage) return;
  try {
    storage.setItem(RECORD_KEY, serialiseRecord(record));
  } catch {
    // Quota or privacy mode: the session keeps working in memory.
  }
}

/** The browser's storage when it is usable; `null` in privacy modes that throw on access. */
export function browserStorage(): RecordStorage | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}
