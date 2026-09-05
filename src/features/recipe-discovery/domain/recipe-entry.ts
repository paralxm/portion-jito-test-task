/**
 * A recipe added to a meal becomes an ordinary logged entry: its per-serving nutrition is
 * the reference basis (1 serving = the recipe's serving grams), and the only supported
 * units are servings and grams of that serving — nothing is invented across units.
 */
import type { FoodCandidate } from '../../calorie-calculator/domain/calculation';
import type { Recipe } from './matching';

export const RECIPE_CANDIDATE_PREFIX = 'recipe:';

export function recipeToCandidate(recipe: Recipe): FoodCandidate {
  return {
    id: `${RECIPE_CANDIDATE_PREFIX}${recipe.id}`,
    name: recipe.title,
    detail: 'Recipe',
    source: 'recipe',
    imageUrl: recipe.imageUrl,
    reference: { quantity: 1, unitId: 'serving' },
    nutrition: {
      energyKcal: recipe.energyKcal,
      proteinG: recipe.proteinG,
      carbohydratesG: recipe.carbohydratesG,
      fatG: recipe.fatG,
      fibreG: recipe.fibreG,
      vitamins: recipe.vitamins,
      minerals: recipe.minerals,
    },
    units: [
      { id: 'serving', label: 'serving', description: `1 serving = ${recipe.servingGrams} g`, toReference: 1 },
      { id: 'g', label: 'g', toReference: 1 / recipe.servingGrams },
    ],
  };
}
