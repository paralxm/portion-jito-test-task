/**
 * The daily record on the device (ledger §11.3): today's and earlier entries, the
 * optional goal, water totals per local day, and the Search view preference, kept in
 * `localStorage` under one versioned key so a reload never loses what was confirmed.
 *
 * Rules: an unreadable or foreign record is ignored, never wiped by a crash; an entry
 * written before the meal field existed loads with `meal: null` (the unassigned guard,
 * ledger D-16) rather than being classified silently; every entry keeps its own local
 * day key, so yesterday's food never reads as today's after a reload; a candidate's
 * photograph is re-resolved from the current catalogue by its stable id, because a built
 * asset URL is not durable across deployments.
 */
import type { FoodCandidate } from '../features/calorie-calculator/domain/calculation';
import type { DailyGoal, FoodEntry } from '../features/calorie-calculator/domain/daily-log';
import { MEAL_ORDER, type MealType } from '../features/calorie-calculator/domain/meal';

export const RECORD_KEY = 'portion.record';
export const RECORD_VERSION = 1;

export type SearchView = 'list' | 'grid';

export interface PersistedRecord {
  version: typeof RECORD_VERSION;
  entries: FoodEntry[];
  goal: DailyGoal | null;
  water: Record<string, number>;
  searchView: SearchView;
}

export const EMPTY_RECORD: PersistedRecord = { version: RECORD_VERSION, entries: [], goal: null, water: {}, searchView: 'list' };

/** The subset of `Storage` the record needs; `localStorage` in the browser, a Map-backed fake in tests. */
export interface RecordStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isDayKey = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

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

function readGoal(raw: unknown): DailyGoal | null {
  if (!isObject(raw) || !isFiniteNumber(raw.kcal) || raw.kcal <= 0) return null;
  const target = (value: unknown) => (isFiniteNumber(value) && value > 0 ? value : null);
  return { kcal: raw.kcal, proteinG: target(raw.proteinG), carbohydratesG: target(raw.carbohydratesG), fatG: target(raw.fatG) };
}

function readWater(raw: unknown): Record<string, number> {
  if (!isObject(raw)) return {};
  const water: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (isDayKey(key) && isFiniteNumber(value) && value >= 0) water[key] = Math.round(value);
  }
  return water;
}

/**
 * Parses a stored record. Older or partial shapes are migrated field by field: what can
 * be read is kept, what cannot is left out. Returns the empty record for nothing stored.
 */
export function parseRecord(text: string | null, resolveImage: (candidateId: string) => string | undefined = () => undefined): PersistedRecord {
  if (!text) return EMPTY_RECORD;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return EMPTY_RECORD;
  }
  if (!isObject(raw)) return EMPTY_RECORD;
  const entries = Array.isArray(raw.entries) ? raw.entries.map((e) => readEntry(e, resolveImage)).filter((e): e is FoodEntry => e !== null) : [];
  return {
    version: RECORD_VERSION,
    entries,
    goal: readGoal(raw.goal),
    water: readWater(raw.water),
    searchView: raw.searchView === 'grid' ? 'grid' : 'list',
  };
}

/** Strips the photograph before writing: it is re-resolved from the catalogue on load. */
export function serialiseRecord(record: PersistedRecord): string {
  const entries = record.entries.map((entry) => {
    const { imageUrl: _image, ...candidate } = entry.candidate;
    return { ...entry, candidate };
  });
  return JSON.stringify({ ...record, version: RECORD_VERSION, entries });
}

export function loadRecord(storage: RecordStorage | null, resolveImage?: (candidateId: string) => string | undefined): PersistedRecord {
  if (!storage) return EMPTY_RECORD;
  try {
    return parseRecord(storage.getItem(RECORD_KEY), resolveImage);
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
