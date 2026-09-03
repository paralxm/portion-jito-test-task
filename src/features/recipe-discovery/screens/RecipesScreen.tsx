import { useId, useState, type ReactNode } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';

import { EmptyState } from '../../../design-system/components/EmptyState/EmptyState';
import { LoadingState } from '../../../design-system/components/LoadingState/LoadingState';
import { Icon } from '../../../design-system/icons/Icon';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Text } from '../../../design-system/primitives/Text/Text';
import { VisuallyHidden } from '../../../design-system/primitives/VisuallyHidden/VisuallyHidden';
import { AppHeader } from '../../../design-system/patterns/AppHeader/AppHeader';
import { RootScreenLayout } from '../../../design-system/templates/RootScreenLayout/RootScreenLayout';
import { CriteriaToolbar } from '../components/CriteriaToolbar';
import { RecipeList } from '../components/RecipeList';
import { activeCriteriaCount, type CriterionKey, type Recipe, type RecipeCriteria } from '../domain/matching';
import styles from './RecipesScreen.module.css';

export type RecipesStatus = 'loading' | 'ready' | 'failure';

export interface RecipesScreenProps {
  /** Recipes that already satisfy the applied criteria. */
  results: readonly Recipe[];
  criteria: RecipeCriteria;
  status: RecipesStatus;
  onApplyCriteria: (criteria: RecipeCriteria) => void;
  onRemoveCriterion: (key: CriterionKey) => void;
  onClearCriteria: () => void;
  onRetry: () => void;
  onOpenRecipe: (id: string) => void;
  /** Opens shared Search in the Recipes scope with a snapshot of these criteria. */
  onOpenSearch: () => void;
  navigation: ReactNode;
}

/**
 * S03 — query-free recipe browsing. Criteria are applied through the same filter sheet
 * as Search; no match, service failure and the plain list are separate states with
 * their own recovery.
 */
export function RecipesScreen({ results, criteria, status, onApplyCriteria, onRemoveCriterion, onClearCriteria, onRetry, onOpenRecipe, onOpenSearch, navigation }: RecipesScreenProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const id = useId();
  const resultsId = `recipes-results-${id}`;
  const active = activeCriteriaCount(criteria);

  const countText =
    status !== 'ready' || results.length === 0
      ? ''
      : active > 0
        ? `${results.length} ${results.length === 1 ? 'recipe matches' : 'recipes match'} your filters`
        : `${results.length} recipes`;
  // Announced when results change; loading and failure announce themselves.
  const summary = status !== 'ready' ? '' : results.length === 0 ? (active > 0 ? 'No recipes match your filters' : 'No recipes available') : countText;

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
        The recipe service did not respond. Your filters are kept.
      </EmptyState>
    );
  } else if (results.length === 0 && active > 0) {
    content = (
      <EmptyState
        kind="no-match"
        title="No recipes match your filters"
        actions={
          <>
            <Button variant="primary" onClick={() => setFiltersOpen(true)}>
              Change filters
            </Button>
            <Button variant="text" onClick={onClearCriteria}>
              Clear all filters
            </Button>
          </>
        }
      >
        Every recipe is compared with all of your filters. Loosen one, or clear them to see every recipe.
      </EmptyState>
    );
  } else if (results.length === 0) {
    content = <EmptyState title="No recipes available">There is nothing to show yet.</EmptyState>;
  } else {
    content = <RecipeList recipes={results} criteria={criteria} onOpen={onOpenRecipe} aria-labelledby={resultsId} />;
  }

  return (
    <RootScreenLayout header={<AppHeader title="Recipes" showWordmark />} navigation={navigation}>
      <button type="button" className={styles.searchEntry} onClick={onOpenSearch}>
        <Icon icon={MagnifyingGlass} size="small-action" />
        <Text variant="body" color="secondary">
          Search recipes
        </Text>
      </button>

      <CriteriaToolbar
        criteria={criteria}
        sheetOpen={filtersOpen}
        onOpenSheet={() => setFiltersOpen(true)}
        onCloseSheet={() => setFiltersOpen(false)}
        onApply={onApplyCriteria}
        onRemove={onRemoveCriterion}
      />

      <section className={styles.results} aria-labelledby={resultsId}>
        <div className={styles.resultsHeading}>
          <Text as="h2" id={resultsId} variant="section-title" color="primary">
            {active > 0 ? 'Matching recipes' : 'All recipes'}
          </Text>
          <VisuallyHidden as="p" role="status" aria-label="Results summary">
            {summary}
          </VisuallyHidden>
          <Text as="p" variant="supporting" color="secondary" aria-hidden="true">
            {countText}
          </Text>
        </div>
        {content}
      </section>
    </RootScreenLayout>
  );
}
