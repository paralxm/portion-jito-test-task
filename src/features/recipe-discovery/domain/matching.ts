/**
 * Recipe-discovery domain: criteria drafts, validation, AND matching with inclusive
 * bounds, and the evidence shown to the user. Unknown data never establishes a match,
 * filters are never silently relaxed, and no score or health verdict is ever computed.
 */
import type { MatchCriterion } from '../../../design-system/components/MatchCriteria/MatchCriteria';

export type DietaryPreference = 'vegetarian' | 'vegan' | 'gluten-free' | 'dairy-free';

export const DIETARY_OPTIONS: ReadonlyArray<{ id: DietaryPreference; label: string }> = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'gluten-free', label: 'Gluten-free' },
  { id: 'dairy-free', label: 'Dairy-free' },
];

export interface Recipe {
  id: string;
  title: string;
  imageUrl?: string;
  /** Serving basis every value belongs to. */
  servingGrams: number;
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
  ingredients: readonly string[];
  instructions: readonly string[];
}

/** Applied or draft criteria. `null`/`undefined` bounds mean "no constraint", never zero. */
export interface RecipeCriteria {
  caloriesMin?: number | null;
  caloriesMax?: number | null;
  proteinMin?: number | null;
  preparationMax?: number | null;
  dietary?: DietaryPreference | null;
}

export const EMPTY_CRITERIA: RecipeCriteria = {};

/** String drafts as typed in the filter sheet; parsed on Apply. */
export interface CriteriaDraft {
  caloriesMin: string;
  caloriesMax: string;
  proteinMin: string;
  preparationMax: string;
  dietary: DietaryPreference | null;
}

export function draftFromCriteria(criteria: RecipeCriteria): CriteriaDraft {
  const s = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n));
  return {
    caloriesMin: s(criteria.caloriesMin),
    caloriesMax: s(criteria.caloriesMax),
    proteinMin: s(criteria.proteinMin),
    preparationMax: s(criteria.preparationMax),
    dietary: criteria.dietary ?? null,
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
      dietary: draft.dietary,
    },
  };
}

export type CriterionKey = 'calories' | 'protein' | 'preparation' | 'dietary';

export function activeCriteria(criteria: RecipeCriteria): CriterionKey[] {
  const keys: CriterionKey[] = [];
  if (criteria.caloriesMin != null || criteria.caloriesMax != null) keys.push('calories');
  if (criteria.proteinMin != null) keys.push('protein');
  if (criteria.preparationMax != null) keys.push('preparation');
  if (criteria.dietary) keys.push('dietary');
  return keys;
}

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
  if (key === 'dietary') delete next.dietary;
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
    case 'dietary': {
      const wanted = criteria.dietary as DietaryPreference;
      const label = DIETARY_OPTIONS.find((o) => o.id === wanted)?.label ?? wanted;
      if (recipe.dietary === null) return { id: key, text: `Dietary type not specified — ${label} cannot be confirmed`, met: false };
      const met = recipe.dietary.includes(wanted);
      return { id: key, text: met ? `Marked ${label.toLowerCase()} by the source` : `Not marked ${label.toLowerCase()}`, met };
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
    case 'dietary':
      return DIETARY_OPTIONS.find((o) => o.id === criteria.dietary)?.label ?? String(criteria.dietary);
  }
}
