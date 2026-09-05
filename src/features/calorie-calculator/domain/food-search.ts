/**
 * The Food tab's collection rules (ledger §11.1): a browsable catalogue when the query is
 * empty, "Recently added" above the rest of the catalogue when confirmed entries exist,
 * and one unified result set across recents and catalogue when a query is typed. The
 * All / Foods / Drinks filter applies in both modes and relies on each item's own record
 * (`category`), never on what a photograph appears to show. Counts are of unique items.
 */
import { describeReferenceBasis, type FoodCandidate } from './calculation';

export type FoodCategory = 'food' | 'drink';
export type FoodCategoryFilter = 'all' | FoodCategory;

export interface FoodFilters {
  category: FoodCategoryFilter;
}

export const NO_FOOD_FILTERS: FoodFilters = { category: 'all' };

export const FOOD_CATEGORY_OPTIONS: ReadonlyArray<{ value: FoodCategoryFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'food', label: 'Foods' },
  { value: 'drink', label: 'Drinks' },
];

export const categoryOf = (candidate: FoodCandidate): FoodCategory => candidate.category ?? 'food';

/**
 * The basis line of a catalogue item: "per 100 g", "per 100 ml", or for a dish stated per
 * serving, "per serving (320 g)" when its serving unit declares the weight (a no-break space
 * inside the amount, so the basis only ever wraps between "per serving" and the amount).
 */
export function describeCatalogueBasis(candidate: FoodCandidate): string {
  const { quantity, unitId } = candidate.reference;
  if (unitId === 'serving' && quantity === 1) {
    const serving = candidate.units.find((u) => u.id === 'serving');
    const grams = serving?.description?.match(/=\s*(\d+(?:\.\d+)?)\s*(g|ml)\b/);
    return grams ? `per serving (${grams[1]} ${grams[2]})` : 'per serving';
  }
  return describeReferenceBasis(candidate).toLowerCase();
}

export function activeFoodFilterCount(filters: FoodFilters): number {
  return filters.category === 'all' ? 0 : 1;
}

/** The applied chip's label, or null when nothing is applied. */
export function describeFoodFilter(filters: FoodFilters): string | null {
  return filters.category === 'food' ? 'Foods only' : filters.category === 'drink' ? 'Drinks only' : null;
}

export function matchesFoodFilters(candidate: FoodCandidate, filters: FoodFilters): boolean {
  return filters.category === 'all' || categoryOf(candidate) === filters.category;
}

/** Case-insensitive substring match on the name or the detail line. */
export function matchesQuery(candidate: FoodCandidate, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q === '') return true;
  return candidate.name.toLowerCase().includes(q) || (candidate.detail ?? '').toLowerCase().includes(q);
}

function unique(candidates: readonly FoodCandidate[]): FoodCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
}

export interface FoodCollection {
  /** `browse`: no query — recents (if any) above the remaining catalogue. `results`: one unified set for the query. */
  mode: 'browse' | 'results';
  recents: FoodCandidate[];
  explore: FoodCandidate[];
  results: FoodCandidate[];
  /** Unique items shown across every section. */
  count: number;
}

export function collectFoods({ query, recents, catalogue, filters }: { query: string; recents: readonly FoodCandidate[]; catalogue: readonly FoodCandidate[]; filters: FoodFilters }): FoodCollection {
  const passes = (c: FoodCandidate) => matchesFoodFilters(c, filters);
  if (query.trim() === '') {
    const recent = unique(recents).filter(passes);
    const recentIds = new Set(recent.map((c) => c.id));
    const explore = unique(catalogue).filter((c) => passes(c) && !recentIds.has(c.id));
    return { mode: 'browse', recents: recent, explore, results: [], count: recent.length + explore.length };
  }
  const results = unique([...recents, ...catalogue]).filter((c) => passes(c) && matchesQuery(c, query));
  return { mode: 'results', recents: [], explore: [], results, count: results.length };
}

/** Singular/plural count wording that names what the filter shows: items, foods or drinks. */
export function foodCountText(count: number, filters: FoodFilters, mode: FoodCollection['mode']): string {
  const noun = filters.category === 'food' ? (count === 1 ? 'food' : 'foods') : filters.category === 'drink' ? (count === 1 ? 'drink' : 'drinks') : count === 1 ? 'item' : 'items';
  return mode === 'results' ? `${count} ${noun} found` : `${count} ${noun}`;
}
