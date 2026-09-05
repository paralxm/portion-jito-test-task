import { useId, type ReactNode } from 'react';

import { FilterChip } from '../../../design-system/components/Chip/Chip';
import { EmptyState } from '../../../design-system/components/EmptyState/EmptyState';
import { LoadingState } from '../../../design-system/components/LoadingState/LoadingState';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Text } from '../../../design-system/primitives/Text/Text';
import { AppHeader } from '../../../design-system/patterns/AppHeader/AppHeader';
import { RecipeCard } from '../../../design-system/patterns/RecipeCard/RecipeCard';
import { RootScreenLayout } from '../../../design-system/templates/RootScreenLayout/RootScreenLayout';
import { FeaturedRecipeCard } from '../components/FeaturedRecipeCard';
import { dietaryLabels } from '../components/RecipeList';
import { discoveryCount, discoveryGroups, featuredRecipe, HIGH_PROTEIN_MIN_G, preferenceCount, QUICK_MAX_MINUTES, selectedTime, TIME_OPTIONS, type DiscoveryGroup } from '../domain/discovery';
import { activeCriteriaCount, dietaryOf, DIETARY_OPTIONS, matchEvidence, type DietaryPreference, type Recipe, type RecipeCriteria } from '../domain/matching';
import styles from './RecipesScreen.module.css';

export type RecipesStatus = 'loading' | 'ready' | 'failure';

export interface RecipesScreenProps {
  /** The whole catalogue; the screen derives its featured recipe, collections and count from it and the preferences. */
  recipes: readonly Recipe[];
  /** The discovery preferences (the dietary set and one time bound) as shared criteria. */
  criteria: RecipeCriteria;
  status: RecipesStatus;
  /** A dietary chip toggles one constraint and applies at once. */
  onToggleDietary: (id: DietaryPreference) => void;
  /** A time chip chooses one bound (or clears it when it is already chosen) and applies at once. */
  onToggleTime: (minutes: number) => void;
  /** Reset clears every preference. */
  onClearCriteria: () => void;
  onRetry: () => void;
  onOpenRecipe: (id: string) => void;
  /** Opens shared Search in the Recipes scope with a deliberate criteria snapshot: the preferences, plus a collection's rule for its View all. */
  onOpenSearch: (snapshot: RecipeCriteria) => void;
  navigation: ReactNode;
}

/** The criteria snapshot a collection's "View all" hands to Search: the active preferences plus the collection's own rule. */
export function groupSnapshot(group: DiscoveryGroup['id'], criteria: RecipeCriteria): RecipeCriteria {
  if (group === 'quick') return { ...criteria, preparationMax: Math.min(criteria.preparationMax ?? QUICK_MAX_MINUTES, QUICK_MAX_MINUTES) };
  return { ...criteria, proteinMin: Math.max(criteria.proteinMin ?? HIGH_PROTEIN_MIN_G, HIGH_PROTEIN_MIN_G) };
}

/**
 * S03 — Recipes as discovery without a search field (ledger §13, after H-REF 2): the
 * section header → one featured recipe with prominent photography → quick preferences
 * (dietary toggles combined with AND, one exclusive time bound, the active count and
 * Reset) → thematic collections derived from each recipe's record, as photographic rails
 * → Browse all recipes. Text search and the numeric filters live in Search's Recipes
 * scope, which every "View all" and "Browse all" opens with the preferences applied.
 */
export function RecipesScreen({ recipes, criteria, status, onToggleDietary, onToggleTime, onClearCriteria, onRetry, onOpenRecipe, onOpenSearch, navigation }: RecipesScreenProps) {
  const id = useId();
  const active = activeCriteriaCount(criteria);
  const quick = preferenceCount(criteria);
  const dietary = dietaryOf(criteria);
  const time = selectedTime(criteria);
  const ready = status === 'ready';
  const featured = ready ? featuredRecipe(recipes, criteria) : null;
  const groups = ready ? discoveryGroups(recipes, criteria) : [];
  const count = ready ? discoveryCount(recipes, criteria) : 0;
  const countText = !ready ? '' : count === 0 ? (active > 0 ? 'No recipes match your preferences' : 'No recipes available') : active > 0 ? `${count} ${count === 1 ? 'recipe matches' : 'recipes match'} your preferences` : `${count} ${count === 1 ? 'recipe' : 'recipes'}`;

  const preferences = (
    <section aria-labelledby={`${id}-preferences`} className={styles.preferences}>
      <div className={styles.preferencesHeader}>
        <div className={styles.preferencesTitle}>
          <Text as="h2" id={`${id}-preferences`} variant="label" color="primary">
            Quick preferences
          </Text>
          <Text as="p" variant="supporting" color="secondary" numeric aria-live="polite">
            {quick === 0 ? 'None active' : `${quick} active`}
          </Text>
        </div>
        {active > 0 ? (
          <Button variant="text" size="small" onClick={onClearCriteria}>
            Reset
          </Button>
        ) : null}
      </div>
      <div className={styles.chips} role="group" aria-label="Dietary">
        {DIETARY_OPTIONS.map((option) => (
          <FilterChip key={option.id} selected={dietary.includes(option.id)} onClick={() => onToggleDietary(option.id)}>
            {option.label}
          </FilterChip>
        ))}
      </div>
      <div className={styles.chips} role="group" aria-label="Preparation time, one at a time">
        {TIME_OPTIONS.map((option) => (
          <FilterChip key={option.minutes} selected={time === option.minutes} onClick={() => onToggleTime(option.minutes)}>
            {option.label}
          </FilterChip>
        ))}
      </div>
    </section>
  );

  let content: ReactNode;
  if (status === 'loading') {
    content = <LoadingState label="Loading recipes" />;
  } else if (status === 'failure') {
    content = (
      <EmptyState
        kind="failure"
        title="Recipes could not be loaded"
        actions={
          <Button variant="primary" onClick={onRetry}>
            Try again
          </Button>
        }
      >
        The recipe service did not respond. Your preferences are kept.
      </EmptyState>
    );
  } else if (count === 0 && active > 0) {
    content = (
      <>
        {preferences}
        <EmptyState
          kind="no-match"
          title="No recipes match your preferences"
          actions={
            <Button variant="primary" onClick={onClearCriteria}>
              Reset preferences
            </Button>
          }
        >
          Every recipe is compared with all of your preferences. Reset them to see every recipe.
        </EmptyState>
      </>
    );
  } else if (count === 0) {
    content = <EmptyState title="No recipes available">There is nothing to show yet.</EmptyState>;
  } else {
    content = (
      <>
        {featured ? <FeaturedRecipeCard recipe={featured} onOpen={onOpenRecipe} /> : null}
        {preferences}
        <Text as="p" variant="supporting" color="secondary" numeric role="status" aria-label="Results summary" className={styles.count}>
          {countText}
        </Text>
        {groups.map((group) => (
          <section key={group.id} className={styles.group} aria-labelledby={`${id}-${group.id}`}>
            <div className={styles.groupHeader}>
              <div className={styles.groupTitle}>
                <Text as="h2" id={`${id}-${group.id}`} variant="section-title" color="primary">
                  {group.title}
                </Text>
                <Text as="p" variant="supporting" color="secondary" wrap>
                  {group.description}
                </Text>
              </div>
              <Button variant="text" size="small" onClick={() => onOpenSearch(groupSnapshot(group.id, criteria))} aria-label={`View all ${group.recipes.length} in ${group.title}`}>
                View all {group.recipes.length}
              </Button>
            </div>
            <ul className={styles.rail} aria-labelledby={`${id}-${group.id}`}>
              {group.recipes.map((recipe) => (
                <li key={recipe.id} className={styles.tile}>
                  <RecipeCard
                    presentation="tile"
                    title={recipe.title}
                    imageUrl={recipe.imageUrl}
                    calories={recipe.energyKcal}
                    protein={recipe.proteinG}
                    servingBasis={`per serving (${recipe.servingGrams} g)`}
                    preparationMinutes={recipe.preparationMinutes}
                    dietary={dietaryLabels(recipe.dietary)}
                    criteria={active > 0 ? matchEvidence(recipe, criteria) : undefined}
                    onOpen={() => onOpenRecipe(recipe.id)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
        <div className={styles.all}>
          <Button variant="secondary" block onClick={() => onOpenSearch({ ...criteria })}>
            {active > 0 ? `Browse all ${count} matching ${count === 1 ? 'recipe' : 'recipes'}` : `Browse all ${count} recipes`}
          </Button>
        </div>
      </>
    );
  }

  return (
    <RootScreenLayout header={<AppHeader variant="section" title="Recipes" />} navigation={navigation}>
      {content}
    </RootScreenLayout>
  );
}
