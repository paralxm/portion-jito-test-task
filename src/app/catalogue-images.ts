import { findCatalogueFood } from '../features/calorie-calculator/domain/fixtures';
import { findRecipe } from '../features/recipe-discovery/domain/fixtures';
import { RECIPE_CANDIDATE_PREFIX } from '../features/recipe-discovery/domain/recipe-entry';

/**
 * Re-resolves a stored entry's photograph from the current catalogues by its stable
 * identity (a built asset URL is not durable across deployments). Foods and drinks come
 * from the food catalogue, recipe entries from the recipe catalogue; anything else — a
 * manual entry, for instance — has no photograph.
 */
export function catalogueImageFor(candidateId: string): string | undefined {
  if (candidateId.startsWith(RECIPE_CANDIDATE_PREFIX)) return findRecipe(candidateId.slice(RECIPE_CANDIDATE_PREFIX.length))?.imageUrl;
  return findCatalogueFood(candidateId)?.imageUrl;
}
