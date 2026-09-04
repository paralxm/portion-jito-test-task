import { useId, useState, type ReactNode } from 'react';

import { AppHeader, Button, EmptyState, FoodResultRow, LoadingState, ResultsHeading, RootScreenLayout, SearchField, SegmentedControl, segmentedOptionId } from '../../design-system';
import { describeReferenceBasis, type FoodCandidate } from '../../features/calorie-calculator/domain/calculation';
import { CriteriaToolbar } from '../../features/recipe-discovery/components/CriteriaToolbar';
import { RecipeList } from '../../features/recipe-discovery/components/RecipeList';
import { activeCriteriaCount, type CriterionKey, type Recipe, type RecipeCriteria } from '../../features/recipe-discovery/domain/matching';
import styles from './SearchScreen.module.css';

export type SearchScope = 'food' | 'recipes';
export type RequestStatus = 'idle' | 'loading' | 'ready' | 'failure';

export interface SearchResults<T> {
  status: RequestStatus;
  results: readonly T[];
}

export interface SearchScreenProps {
  scope: SearchScope;
  /** Switching scope keeps the query. */
  onScopeChange: (scope: SearchScope) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  food: SearchResults<FoodCandidate>;
  recipes: SearchResults<Recipe>;
  /** Recipes-scope criteria: a snapshot copied from browsing, edited independently here. */
  criteria: RecipeCriteria;
  onApplyCriteria: (criteria: RecipeCriteria) => void;
  onRemoveCriterion: (key: CriterionKey) => void;
  /** A food result opens review; it does not replace the current calculation. */
  onOpenFood: (candidate: FoodCandidate) => void;
  onOpenRecipe: (id: string) => void;
  onRetry: () => void;
  onEnterManually: () => void;
  navigation: ReactNode;
}

/**
 * S02 — shared Search. Two scopes over one query field: Food results are never
 * filtered by recipe criteria; Recipes results combine the query with the applied
 * criteria. Loading, no matches and service failure are distinct states.
 */
export function SearchScreen({
  scope,
  onScopeChange,
  query,
  onQueryChange,
  onSubmit,
  onClear,
  food,
  recipes,
  criteria,
  onApplyCriteria,
  onRemoveCriterion,
  onOpenFood,
  onOpenRecipe,
  onRetry,
  onEnterManually,
  navigation,
}: SearchScreenProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const id = useId();
  const resultsId = `search-results-${id}`;
  const scopeId = `search-scope-${id}`;
  const panelId = `search-panel-${id}`;
  const active = activeCriteriaCount(criteria);
  const current = scope === 'food' ? food : recipes;
  const trimmed = query.trim();

  let countText = '';
  if (current.status === 'ready' && current.results.length > 0) {
    const n = current.results.length;
    countText = scope === 'food' ? `${n} ${n === 1 ? 'food' : 'foods'} found` : `${n} ${n === 1 ? 'recipe' : 'recipes'} ${active > 0 ? 'match your filters' : 'found'}`;
  }
  // Announced when results change; loading and failure announce themselves.
  const summary = current.status !== 'ready' ? '' : current.results.length === 0 ? `No ${scope === 'food' ? 'foods' : 'recipes'} match “${trimmed}”` : countText;

  let content: ReactNode;
  if (current.status === 'idle') {
    content =
      scope === 'food' ? (
        <EmptyState title="Search for a food or dish">Type a name to see matching foods with their calories per reference amount.</EmptyState>
      ) : (
        <EmptyState title="Search for a recipe">Type a recipe name or an ingredient. Filters narrow the results further.</EmptyState>
      );
  } else if (current.status === 'loading') {
    content = <LoadingState label={scope === 'food' ? 'Searching foods' : 'Searching recipes'} />;
  } else if (current.status === 'failure') {
    content = (
      <EmptyState
        kind="failure"
        title="Search is not available right now"
        actions={
          <>
            <Button variant="primary" onClick={onRetry}>
              Try again
            </Button>
            {scope === 'food' ? (
              <Button variant="text" onClick={onEnterManually}>
                Enter manually
              </Button>
            ) : null}
          </>
        }
      >
        The search service did not respond. Your query{scope === 'recipes' ? ' and filters are' : ' is'} kept.
      </EmptyState>
    );
  } else if (current.results.length === 0) {
    content =
      scope === 'food' ? (
        <EmptyState
          kind="no-match"
          title={`No foods match “${trimmed}”`}
          actions={
            <Button variant="secondary" onClick={onEnterManually}>
              Enter manually
            </Button>
          }
        >
          Check the spelling or try a shorter name. You can also enter the nutrition yourself.
        </EmptyState>
      ) : (
        <EmptyState
          kind="no-match"
          title={active > 0 ? `No recipes match “${trimmed}” and your filters` : `No recipes match “${trimmed}”`}
          actions={
            active > 0 ? (
              <Button variant="secondary" onClick={() => setFiltersOpen(true)}>
                Change filters
              </Button>
            ) : undefined
          }
        >
          {active > 0 ? 'Every recipe is compared with the query and all of your filters. Try another word or loosen a filter.' : 'Try another recipe name or an ingredient.'}
        </EmptyState>
      );
  } else if (scope === 'food') {
    content = (
      <ul className={styles.list} aria-labelledby={resultsId}>
        {food.results.map((candidate) => (
          <li key={candidate.id}>
            <FoodResultRow
              name={candidate.name}
              detail={candidate.detail}
              calories={candidate.nutrition.energyKcal}
              basis={describeReferenceBasis(candidate).toLowerCase()}
              onClick={() => onOpenFood(candidate)}
            />
          </li>
        ))}
      </ul>
    );
  } else {
    content = <RecipeList recipes={recipes.results} criteria={criteria} onOpen={onOpenRecipe} aria-labelledby={resultsId} />;
  }

  return (
    <RootScreenLayout header={<AppHeader title="Search" showWordmark />} navigation={navigation}>
      <SearchField
        label={scope === 'food' ? 'Search foods' : 'Search recipes'}
        value={query}
        onChange={onQueryChange}
        onSubmit={() => onSubmit()}
        onClear={onClear}
        placeholder={scope === 'food' ? 'Food or dish name' : 'Recipe name or ingredient'}
      />

      {/* The scope switch owns the results panel below, so it is exposed as tabs. */}
      <SegmentedControl
        id={scopeId}
        pattern="tabs"
        controls={panelId}
        value={scope}
        onValueChange={onScopeChange}
        ariaLabel="Search in"
        options={[
          { value: 'food', label: 'Food' },
          { value: 'recipes', label: 'Recipes' },
        ]}
      />

      {scope === 'recipes' ? (
        <CriteriaToolbar
          criteria={criteria}
          sheetOpen={filtersOpen}
          onOpenSheet={() => setFiltersOpen(true)}
          onCloseSheet={() => setFiltersOpen(false)}
          onApply={onApplyCriteria}
          onRemove={onRemoveCriterion}
        />
      ) : null}

      <section role="tabpanel" id={panelId} className={styles.results} aria-labelledby={segmentedOptionId(scopeId, scope)}>
        <ResultsHeading id={resultsId} heading="Results" summary={summary} countText={countText} hidden={current.status === 'idle'} />
        {content}
      </section>
    </RootScreenLayout>
  );
}
