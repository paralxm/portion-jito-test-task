/**
 * Recipe-discovery domain: criteria drafts, validation, AND matching with inclusive
 * bounds, and the evidence shown to the user. Unknown data never establishes a match,
 * filters are never silently relaxed, and no score or health verdict is ever computed.
 *
 * Dietary constraints are a set (ledger §12 B3): every selected one must hold (AND). A
 * recipe declared vegan also satisfies "vegetarian" — the canonical implication, so a
 * source that omits the redundant tag is not excluded — while an unspecified dietary
 * record (`null`) satisfies none of them.
 */
import type { MatchCriterion } from '../../../design-system/components/MatchCriteria/MatchCriteria';

export type DietaryPreference = 'vegetarian' | 'vegan' | 'gluten-free' | 'dairy-free';

export const DIETARY_OPTIONS: ReadonlyArray<{ id: DietaryPreference; label: string }> = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'gluten-free', label: 'Gluten-free' },
  { id: 'dairy-free', label: 'Dairy-free' },
];

const DIETARY_ORDER: readonly DietaryPreference[] = DIETARY_OPTIONS.map((o) => o.id);

export function dietaryLabel(id: DietaryPreference): string {
  return DIETARY_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

export interface Recipe {
  id: string;
  title: string;
  imageUrl?: string;
  /** Serving basis every value belongs to. */
  servingGrams: number;
  /** How many servings the ingredient list makes; the nutrition is per one of them. */
  servings?: number;
  energyKcal: number | null;
  proteinG: number | null;
  carbohydratesG: number | null;
  fatG: number | null;
  fibreG?: number | null;
  vitamins?: readonly { id: string; name: string; valueMg: number | null }[];
  minerals?: readonly { id: string; name: string; valueMg: number | null }[];
  preparationMinutes: number | null;
  /** Dietary types the source declares. `null` = not specified; it cannot satisfy a dietary criterion. */
  dietary: readonly DietaryPreference[] | null;
  /** An editorial pick for the discovery page's Featured group; a curation flag, not a popularity metric. */
  featured?: boolean;
  ingredients: readonly string[];
  instructions: readonly string[];
}

/** Applied or draft criteria. `null`/`undefined` bounds mean "no constraint", never zero; an empty dietary set means none. */
export interface RecipeCriteria {
  caloriesMin?: number | null;
  caloriesMax?: number | null;
  proteinMin?: number | null;
  preparationMax?: number | null;
  dietary?: readonly DietaryPreference[] | null;
}

export const EMPTY_CRITERIA: RecipeCriteria = {};

/** String drafts as typed in the filter sheet; parsed on Apply. */
export interface CriteriaDraft {
  caloriesMin: string;
  caloriesMax: string;
  proteinMin: string;
  preparationMax: string;
  dietary: readonly DietaryPreference[];
}

export function draftFromCriteria(criteria: RecipeCriteria): CriteriaDraft {
  const s = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n));
  return {
    caloriesMin: s(criteria.caloriesMin),
    caloriesMax: s(criteria.caloriesMax),
    proteinMin: s(criteria.proteinMin),
    preparationMax: s(criteria.preparationMax),
    dietary: dietaryOf(criteria),
  };
}

export const EMPTY_DRAFT: CriteriaDraft = draftFromCriteria(EMPTY_CRITERIA);

export type DraftErrors = Partial<Record<keyof CriteriaDraft, string>>;

function parseBound(draft: string): number | null | 'invalid' {
  const t = draft.trim();
  if (t === '') return null;
  if (!/^\d+([.,]\d*)?$/.test(t)) return 'invalid';
  const n = Number(t.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : 'invalid';
}

/** Validates a draft; returns criteria when valid, otherwise field-level errors. */
export function validateDraft(draft: CriteriaDraft): { ok: true; criteria: RecipeCriteria } | { ok: false; errors: DraftErrors } {
  const errors: DraftErrors = {};
  const caloriesMin = parseBound(draft.caloriesMin);
  const caloriesMax = parseBound(draft.caloriesMax);
  const proteinMin = parseBound(draft.proteinMin);
  const preparationMax = parseBound(draft.preparationMax);
  if (caloriesMin === 'invalid') errors.caloriesMin = 'Enter a whole or decimal number of calories';
  if (caloriesMax === 'invalid') errors.caloriesMax = 'Enter a whole or decimal number of calories';
  if (proteinMin === 'invalid') errors.proteinMin = 'Enter a number of grams';
  if (preparationMax === 'invalid') errors.preparationMax = 'Enter a number of minutes';
  if (typeof caloriesMin === 'number' && typeof caloriesMax === 'number' && caloriesMin > caloriesMax) {
    errors.caloriesMax = 'The maximum must be at least the minimum';
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    criteria: {
      caloriesMin: caloriesMin as number | null,
      caloriesMax: caloriesMax as number | null,
      proteinMin: proteinMin as number | null,
      preparationMax: preparationMax as number | null,
      dietary: canonicalDietary(draft.dietary),
    },
  };
}

// ---------------------------------------------------------------------------
// Dietary sets
// ---------------------------------------------------------------------------

/** The applied dietary set in option order, without duplicates. */
export function dietaryOf(criteria: RecipeCriteria): DietaryPreference[] {
  return canonicalDietary(criteria.dietary ?? []);
}

export function canonicalDietary(list: readonly DietaryPreference[]): DietaryPreference[] {
  return DIETARY_ORDER.filter((id) => list.includes(id));
}

/** Adds or removes one dietary constraint; the result is committed by the caller (chips apply at once). */
export function toggleDietary(criteria: RecipeCriteria, id: DietaryPreference): RecipeCriteria {
  const current = dietaryOf(criteria);
  const next = current.includes(id) ? current.filter((d) => d !== id) : [...current, id];
  const { dietary: _d, ...rest } = criteria;
  return next.length === 0 ? rest : { ...rest, dietary: canonicalDietary(next) };
}

/** Whether the recipe's declared record satisfies one constraint; vegan implies vegetarian; unknown never qualifies. */
export function satisfiesDietary(recipe: Recipe, id: DietaryPreference): boolean {
  if (recipe.dietary === null) return false;
  if (recipe.dietary.includes(id)) return true;
  return id === 'vegetarian' && recipe.dietary.includes('vegan');
}

// ---------------------------------------------------------------------------
// Active criteria
// ---------------------------------------------------------------------------

export type CriterionKey = 'calories' | 'protein' | 'preparation' | `dietary:${DietaryPreference}`;

const DIETARY_KEY = /^dietary:(.+)$/;

export function activeCriteria(criteria: RecipeCriteria): CriterionKey[] {
  const keys: CriterionKey[] = [];
  if (criteria.caloriesMin != null || criteria.caloriesMax != null) keys.push('calories');
  if (criteria.proteinMin != null) keys.push('protein');
  if (criteria.preparationMax != null) keys.push('preparation');
  for (const id of dietaryOf(criteria)) keys.push(`dietary:${id}`);
  return keys;
}

/** Each numeric constraint counts once (a calorie range is one), and each dietary constraint once. */
export function activeCriteriaCount(criteria: RecipeCriteria): number {
  return activeCriteria(criteria).length;
}

/** Removes one applied criterion; the caller commits the result immediately. */
export function removeCriterion(criteria: RecipeCriteria, key: CriterionKey): RecipeCriteria {
  const next = { ...criteria };
  if (key === 'calories') {
    delete next.caloriesMin;
    delete next.caloriesMax;
  }
  if (key === 'protein') delete next.proteinMin;
  if (key === 'preparation') delete next.preparationMax;
  const dietary = DIETARY_KEY.exec(key);
  if (dietary) {
    const remaining = dietaryOf(criteria).filter((id) => id !== dietary[1]);
    if (remaining.length === 0) delete next.dietary;
    else next.dietary = remaining;
  }
  return next;
}

/** Evidence for one criterion against one recipe. Unknown recipe data is never a match. */
function evaluate(recipe: Recipe, criteria: RecipeCriteria, key: CriterionKey): MatchCriterion {
  switch (key) {
    case 'calories': {
      const { caloriesMin, caloriesMax } = criteria;
      const v = recipe.energyKcal;
      const bounds = [caloriesMin != null ? `at least ${caloriesMin}` : null, caloriesMax != null ? `at most ${caloriesMax}` : null].filter(Boolean).join(' and ');
      if (v === null) return { id: key, text: `Calories per serving not available — needs ${bounds} kcal`, met: false };
      const met = (caloriesMin == null || v >= caloriesMin) && (caloriesMax == null || v <= caloriesMax);
      return { id: key, text: `${Math.round(v)} kcal per serving — ${bounds} kcal`, met };
    }
    case 'protein': {
      const v = recipe.proteinG;
      if (v === null) return { id: key, text: `Protein per serving not available — needs at least ${criteria.proteinMin} g`, met: false };
      return { id: key, text: `${v} g protein per serving — at least ${criteria.proteinMin} g`, met: v >= (criteria.proteinMin as number) };
    }
    case 'preparation': {
      const v = recipe.preparationMinutes;
      if (v === null) return { id: key, text: `Preparation time not available — needs at most ${criteria.preparationMax} min`, met: false };
      return { id: key, text: `${v} min preparation — at most ${criteria.preparationMax} min`, met: v <= (criteria.preparationMax as number) };
    }
    default: {
      const wanted = (DIETARY_KEY.exec(key)?.[1] ?? key) as DietaryPreference;
      const label = dietaryLabel(wanted);
      if (recipe.dietary === null) return { id: key, text: `Dietary type not specified — ${label} cannot be confirmed`, met: false };
      const met = satisfiesDietary(recipe, wanted);
      const implied = met && !recipe.dietary.includes(wanted);
      return { id: key, text: met ? (implied ? `Marked vegan by the source, so ${label.toLowerCase()}` : `Marked ${label.toLowerCase()} by the source`) : `Not marked ${label.toLowerCase()}`, met };
    }
  }
}

/** Evidence for every active criterion, in a fixed order. Empty when nothing is active. */
export function matchEvidence(recipe: Recipe, criteria: RecipeCriteria): MatchCriterion[] {
  return activeCriteria(criteria).map((key) => evaluate(recipe, criteria, key));
}

/** AND over every active criterion with inclusive numeric bounds. */
export function matchesCriteria(recipe: Recipe, criteria: RecipeCriteria): boolean {
  const evidence = matchEvidence(recipe, criteria);
  return evidence.every((e) => e.met);
}

export function filterRecipes(recipes: readonly Recipe[], criteria: RecipeCriteria): Recipe[] {
  return recipes.filter((r) => matchesCriteria(r, criteria));
}

/** Case-insensitive title and ingredient search. Empty query returns everything. */
export function searchRecipes(recipes: readonly Recipe[], query: string): Recipe[] {
  const q = query.trim().toLowerCase();
  if (q === '') return [...recipes];
  return recipes.filter((r) => r.title.toLowerCase().includes(q) || r.ingredients.some((i) => i.toLowerCase().includes(q)));
}

/** Short chip labels for applied criteria, e.g. "Under 500 kcal". */
export function describeCriterion(criteria: RecipeCriteria, key: CriterionKey): string {
  switch (key) {
    case 'calories': {
      const { caloriesMin, caloriesMax } = criteria;
      if (caloriesMin != null && caloriesMax != null) return `${caloriesMin}–${caloriesMax} kcal`;
      if (caloriesMax != null) return `Under ${caloriesMax} kcal`;
      return `Over ${caloriesMin} kcal`;
    }
    case 'protein':
      return `${criteria.proteinMin} g protein or more`;
    case 'preparation':
      return `Under ${criteria.preparationMax} min`;
    default:
      return dietaryLabel((DIETARY_KEY.exec(key)?.[1] ?? key) as DietaryPreference);
  }
}

/** Unique recipes by id, first occurrence kept — the count the UI states is never of duplicates. */
export function uniqueRecipes(recipes: readonly Recipe[]): Recipe[] {
  const seen = new Set<string>();
  return recipes.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
}
