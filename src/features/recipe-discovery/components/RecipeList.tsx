import { RecipeCard } from '../../../design-system/patterns/RecipeCard/RecipeCard';
import { activeCriteriaCount, DIETARY_OPTIONS, matchEvidence, type DietaryPreference, type Recipe, type RecipeCriteria } from '../domain/matching';
import styles from './RecipeList.module.css';

export interface RecipeListProps {
  recipes: readonly Recipe[];
  /** Active criteria produce per-card evidence; with none, cards show plain metadata. */
  criteria: RecipeCriteria;
  onOpen: (id: string) => void;
  'aria-labelledby'?: string;
}

/** Human labels for declared dietary types; unknown ids fall back to the id itself. */
export function dietaryLabels(ids: readonly DietaryPreference[] | null | undefined): string[] {
  return (ids ?? []).map((id) => DIETARY_OPTIONS.find((option) => option.id === id)?.label ?? id);
}

/** The single recipe list used by browsing and the Recipes search scope. */
export function RecipeList({ recipes, criteria, onOpen, 'aria-labelledby': labelledBy }: RecipeListProps) {
  const active = activeCriteriaCount(criteria) > 0;
  return (
    <ul className={styles.list} aria-labelledby={labelledBy}>
      {recipes.map((recipe) => (
        <li key={recipe.id}>
          <RecipeCard
            title={recipe.title}
            imageUrl={recipe.imageUrl}
            calories={recipe.energyKcal}
            protein={recipe.proteinG}
            servingBasis={`per serving (${recipe.servingGrams} g)`}
            preparationMinutes={recipe.preparationMinutes}
            dietary={dietaryLabels(recipe.dietary)}
            criteria={active ? matchEvidence(recipe, criteria) : undefined}
            onOpen={() => onOpen(recipe.id)}
          />
        </li>
      ))}
    </ul>
  );
}
