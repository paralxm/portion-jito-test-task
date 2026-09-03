/**
 * Simulated services for the evaluator-facing prototype. Every function resolves from
 * deterministic fixtures after a short delay so loading, failure and late-response
 * handling can be exercised. None of this is a real search, barcode, recognition or
 * recipe backend, and the app labels it as such where a user could mistake it.
 */
import type { FoodCandidate } from '../features/calorie-calculator/domain/calculation';
import { barcodeCatalogue, photoSuggestions, searchFoods } from '../features/calorie-calculator/domain/fixtures';
import type { BarcodeLookupResult } from '../features/calorie-calculator/screens/BarcodeScreen';
import type { PhotoAnalysisResult } from '../features/calorie-calculator/screens/PhotoScreen';
import { findRecipe, recipeCatalogue } from '../features/recipe-discovery/domain/fixtures';
import { filterRecipes, searchRecipes, type Recipe, type RecipeCriteria } from '../features/recipe-discovery/domain/matching';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Typing this word anywhere in a query simulates a search-service failure. */
export const SIMULATED_FAILURE_QUERY = 'offline';

export type ServiceResult<T> = { ok: true; results: T[] } | { ok: false };

export async function searchFoodService(query: string): Promise<ServiceResult<FoodCandidate>> {
  await delay(450);
  if (query.toLowerCase().includes(SIMULATED_FAILURE_QUERY)) return { ok: false };
  return { ok: true, results: searchFoods(query) };
}

export async function searchRecipeService(query: string, criteria: RecipeCriteria): Promise<ServiceResult<Recipe>> {
  await delay(450);
  if (query.toLowerCase().includes(SIMULATED_FAILURE_QUERY)) return { ok: false };
  return { ok: true, results: filterRecipes(searchRecipes(recipeCatalogue, query), criteria) };
}

export async function browseRecipesService(): Promise<ServiceResult<Recipe>> {
  await delay(400);
  return { ok: true, results: [...recipeCatalogue] };
}

export async function loadRecipeService(id: string): Promise<Recipe | null> {
  await delay(600);
  return findRecipe(id) ?? null;
}

export const BARCODE_DEMO_CODES = {
  found: '5012345678900',
  unknown: '4009999999990',
  failing: '0000000000000',
} as const;

export async function lookupBarcodeService(code: string): Promise<BarcodeLookupResult> {
  await delay(700);
  if (code === BARCODE_DEMO_CODES.failing) return { kind: 'failed' };
  const candidate = barcodeCatalogue[code];
  return candidate ? { kind: 'found', candidate } : { kind: 'not-found' };
}

export async function analysePhotoService(_imageId: string, options: { simulateFailure: boolean }): Promise<PhotoAnalysisResult> {
  await delay(900);
  if (options.simulateFailure) return { kind: 'failed' };
  return { kind: 'suggestions', candidates: [...photoSuggestions] };
}
