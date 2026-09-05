/**
 * The Recipes root's discovery model (ledger §12 B1, revised in §13 after H-REF 2). Every
 * element is a rule over the recipe's own record — an editorial `featured` flag, a known
 * preparation time, a known protein value — never a popularity count, rating or
 * suitability score, which the prototype does not have.
 *
 * Quick preferences are a subset of the shared `RecipeCriteria`: the dietary set (AND)
 * and one mutually exclusive preparation-time bound. They narrow the featured recipe and
 * every collection alike; an unknown value never places a recipe anywhere. The numeric
 * calorie and protein criteria stay in Search's filter sheet.
 */
import { activeCriteriaCount, dietaryOf, filterRecipes, uniqueRecipes, type Recipe, type RecipeCriteria } from './matching';

export interface DiscoveryGroup {
  id: 'quick' | 'protein';
  /** The heading, stating the rule in words the record supports. */
  title: string;
  /** Why these recipes are here, in one line. */
  description: string;
  recipes: Recipe[];
}

export const QUICK_MAX_MINUTES = 30;
export const HIGH_PROTEIN_MIN_G = 30;

const RULES: ReadonlyArray<{ id: DiscoveryGroup['id']; title: string; description: string; test: (recipe: Recipe) => boolean }> = [
  { id: 'quick', title: `Ready in under ${QUICK_MAX_MINUTES} minutes`, description: 'Preparation time as the recipe states it.', test: (r) => r.preparationMinutes !== null && r.preparationMinutes <= QUICK_MAX_MINUTES },
  { id: 'protein', title: `${HIGH_PROTEIN_MIN_G} g protein or more`, description: 'Per serving, from the recipe’s own values.', test: (r) => r.proteinG !== null && r.proteinG >= HIGH_PROTEIN_MIN_G },
];

/** The recipes the page works from: unique, and narrowed by the active preferences. */
export function discoveryPool(recipes: readonly Recipe[], criteria: RecipeCriteria): Recipe[] {
  return filterRecipes(uniqueRecipes(recipes), criteria);
}

/** Groups with at least one member after the preferences; empty groups are omitted rather than padded. */
export function discoveryGroups(recipes: readonly Recipe[], criteria: RecipeCriteria): DiscoveryGroup[] {
  const matching = discoveryPool(recipes, criteria);
  return RULES.map((rule) => ({ id: rule.id, title: rule.title, description: rule.description, recipes: matching.filter(rule.test) })).filter((group) => group.recipes.length > 0);
}

/** The number the page states: unique recipes that satisfy the preferences. */
export function discoveryCount(recipes: readonly Recipe[], criteria: RecipeCriteria): number {
  return discoveryPool(recipes, criteria).length;
}

/**
 * The featured recipe: the first editorially flagged recipe (with a photograph) that
 * satisfies the preferences; when none does, the first matching recipe with a
 * photograph, so the page keeps its photographic lead without inventing a flag. `null`
 * only when nothing matches at all.
 */
export function featuredRecipe(recipes: readonly Recipe[], criteria: RecipeCriteria): Recipe | null {
  const pool = discoveryPool(recipes, criteria);
  return pool.find((r) => r.featured === true && r.imageUrl) ?? pool.find((r) => r.featured === true) ?? pool.find((r) => r.imageUrl) ?? pool[0] ?? null;
}

// ---------------------------------------------------------------------------
// Quick preferences
// ---------------------------------------------------------------------------

export interface TimeOption {
  minutes: number;
  label: string;
}

/** Mutually exclusive preparation-time bounds; each is the shared `preparationMax` criterion. */
export const TIME_OPTIONS: readonly TimeOption[] = [
  { minutes: 15, label: 'Under 15 min' },
  { minutes: 30, label: 'Under 30 min' },
  { minutes: 60, label: 'Under 1 h' },
];

/** The chosen time option, or `null` when the bound is not one of the options (or unset). */
export function selectedTime(criteria: RecipeCriteria): number | null {
  const max = criteria.preparationMax;
  return typeof max === 'number' && TIME_OPTIONS.some((o) => o.minutes === max) ? max : null;
}

/** Chooses one time bound, or clears it when it is already the chosen one. */
export function toggleTime(criteria: RecipeCriteria, minutes: number): RecipeCriteria {
  const { preparationMax: _p, ...rest } = criteria;
  return criteria.preparationMax === minutes ? rest : { ...rest, preparationMax: minutes };
}

/** How many quick preferences are active: each dietary constraint and the time bound count once. */
export function preferenceCount(criteria: RecipeCriteria): number {
  return dietaryOf(criteria).length + (selectedTime(criteria) !== null ? 1 : 0);
}

/** Every active criterion, quick preference or not — what "Reset" clears and Search receives. */
export function anyPreference(criteria: RecipeCriteria): boolean {
  return activeCriteriaCount(criteria) > 0;
}
