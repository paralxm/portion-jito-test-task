/**
 * The Recipes root's curated discovery groups (ledger §12 B1, after R2). Every group is
 * a rule over the recipe's own record — an editorial `featured` flag, a known preparation
 * time, a known protein value — never a popularity count, rating or suitability score,
 * which the prototype does not have. Groups respect the active criteria (AND), and an
 * unknown value never places a recipe in a group.
 */
import { filterRecipes, uniqueRecipes, type Recipe, type RecipeCriteria } from './matching';

export interface DiscoveryGroup {
  id: 'featured' | 'quick' | 'protein';
  /** The heading, stating the rule in words the record supports. */
  title: string;
  /** Why these recipes are here, in one line. */
  description: string;
  recipes: Recipe[];
}

export const QUICK_MAX_MINUTES = 30;
export const HIGH_PROTEIN_MIN_G = 30;

const RULES: ReadonlyArray<{ id: DiscoveryGroup['id']; title: string; description: string; test: (recipe: Recipe) => boolean }> = [
  { id: 'featured', title: 'Featured', description: 'A small editorial selection, not a popularity measure.', test: (r) => r.featured === true },
  { id: 'quick', title: `Ready in under ${QUICK_MAX_MINUTES} minutes`, description: 'Preparation time as the recipe states it.', test: (r) => r.preparationMinutes !== null && r.preparationMinutes <= QUICK_MAX_MINUTES },
  { id: 'protein', title: `${HIGH_PROTEIN_MIN_G} g protein or more`, description: 'Per serving, from the recipe’s own values.', test: (r) => r.proteinG !== null && r.proteinG >= HIGH_PROTEIN_MIN_G },
];

/** Groups with at least one member after the criteria; empty groups are omitted rather than padded. */
export function discoveryGroups(recipes: readonly Recipe[], criteria: RecipeCriteria): DiscoveryGroup[] {
  const matching = filterRecipes(uniqueRecipes(recipes), criteria);
  return RULES.map((rule) => ({ id: rule.id, title: rule.title, description: rule.description, recipes: matching.filter(rule.test) })).filter((group) => group.recipes.length > 0);
}

/** The number the page states: unique recipes that satisfy the criteria. */
export function discoveryCount(recipes: readonly Recipe[], criteria: RecipeCriteria): number {
  return filterRecipes(uniqueRecipes(recipes), criteria).length;
}
