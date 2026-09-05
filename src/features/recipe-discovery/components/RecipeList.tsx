import type { ViewMode } from '../../../design-system/components/ViewToggle/ViewToggle';
import { RecipeCard } from '../../../design-system/patterns/RecipeCard/RecipeCard';
import { activeCriteriaCount, DIETARY_OPTIONS, matchEvidence, type DietaryPreference, type Recipe, type RecipeCriteria } from '../domain/matching';
import styles from './RecipeList.module.css';

export interface RecipeListProps {
  recipes: readonly Recipe[];
  /** Active criteria produce per-card evidence; with none, cards show plain metadata. */
  criteria: RecipeCriteria;
  onOpen: (id: string) => void;
  /** `list` (default): row cards; `grid`: tile cards in two columns, one under 20 rem. Same items, same order. */
  view?: ViewMode;
  'aria-labelledby'?: string;
}

/** Human labels for declared dietary types; unknown ids fall back to the id itself. */
export function dietaryLabels(ids: readonly DietaryPreference[] | null | undefined): string[] {
  return (ids ?? []).map((id) => DIETARY_OPTIONS.find((option) => option.id === id)?.label ?? id);
}

/**
 * The single recipe collection used by the Recipes search scope (ledger §13): the same
 * recipes, order, evidence and opening behaviour in either presentation — rows with the
 * thumbnail beside the text, or a grid of photo tiles.
 */
export function RecipeList({ recipes, criteria, onOpen, view = 'list', 'aria-labelledby': labelledBy }: RecipeListProps) {
  const active = activeCriteriaCount(criteria) > 0;
  return (
    <div className={styles.frame}>
      <ul className={view === 'grid' ? styles.grid : styles.list} aria-labelledby={labelledBy} data-view={view}>
        {recipes.map((recipe) => (
          <li key={recipe.id}>
            <RecipeCard
              presentation={view === 'grid' ? 'tile' : 'row'}
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
    </div>
  );
}
