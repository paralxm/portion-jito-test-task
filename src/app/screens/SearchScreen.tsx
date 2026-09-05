import { useId, useState, type ReactNode } from 'react';
import { Barcode } from '@phosphor-icons/react';

import { AppHeader, AppliedCriterionChip, Button, EmptyState, LoadingState, ResultsHeading, RootScreenLayout, SearchField, SegmentedControl, segmentedOptionId, Text, ViewToggle, type ViewMode } from '../../design-system';
import type { FoodCandidate } from '../../features/calorie-calculator/domain/calculation';
import { activeFoodFilterCount, collectFoods, describeFoodFilter, foodCountText, NO_FOOD_FILTERS, type FoodFilters } from '../../features/calorie-calculator/domain/food-search';
import { FoodCollection } from '../../features/calorie-calculator/components/FoodCollection';
import { FoodFiltersSheet } from '../../features/calorie-calculator/components/FoodFiltersSheet';
import { CriteriaToolbar } from '../../features/recipe-discovery/components/CriteriaToolbar';
import { FilterAction } from '../../features/recipe-discovery/components/FilterAction';
import { RecipeList } from '../../features/recipe-discovery/components/RecipeList';
import { activeCriteriaCount, filterRecipes, uniqueRecipes, type CriterionKey, type Recipe, type RecipeCriteria } from '../../features/recipe-discovery/domain/matching';
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
  /** Query results from the food service; `idle` with an empty query shows the catalogue instead. */
  food: SearchResults<FoodCandidate>;
  /** The browsable catalogue shown without a query (ledger §11.1). */
  catalogue: readonly FoodCandidate[];
  /** Foods derived from confirmed meal entries, newest first; empty on first use. */
  recents: readonly FoodCandidate[];
  foodFilters: FoodFilters;
  onApplyFoodFilters: (filters: FoodFilters) => void;
  /** The presentation of the food collection; persisted by the app. */
  foodView: ViewMode;
  onFoodViewChange: (view: ViewMode) => void;
  recipes: SearchResults<Recipe>;
  /** The complete recipe catalogue, shown (with the criteria applied) while the Recipes query is empty (ledger §12 B2). */
  recipeCatalogue: readonly Recipe[];
  /** Whether the catalogue has loaded; `idle` is treated as loading. */
  recipeCatalogueStatus: RequestStatus;
  /** Recipes-scope criteria: a snapshot copied from browsing, edited independently here. */
  criteria: RecipeCriteria;
  onApplyCriteria: (criteria: RecipeCriteria) => void;
  onRemoveCriterion: (key: CriterionKey) => void;
  /** A food result opens review; it does not replace the current calculation. */
  onOpenFood: (candidate: FoodCandidate) => void;
  onOpenRecipe: (id: string) => void;
  /** The field's barcode shortcut in Food scope: opens the scanner in one tap (ledger D-27). */
  onScanBarcode: () => void;
  onRetry: () => void;
  onEnterManually: () => void;
  navigation: ReactNode;
}

/**
 * S02 — shared Search. Two scopes over one query field. Food: the barcode shortcut sits
 * in the field; a compact toolbar under it carries the List / Grid toggle and, at its
 * end, the food filter action (All / Foods / Drinks); with an empty query the tab shows
 * "Recently added" (from confirmed entries) above the rest of the catalogue, and a query
 * produces one unified result set across both. Recipes: the filter action sits in the
 * field and applied chips beneath it; results combine the query with the criteria.
 * Loading, no matches and service failure stay distinct states.
 */
export function SearchScreen({
  scope,
  onScopeChange,
  query,
  onQueryChange,
  onSubmit,
  onClear,
  food,
  catalogue,
  recents,
  foodFilters,
  onApplyFoodFilters,
  foodView,
  onFoodViewChange,
  recipes,
  recipeCatalogue,
  recipeCatalogueStatus,
  criteria,
  onApplyCriteria,
  onRemoveCriterion,
  onOpenFood,
  onOpenRecipe,
  onScanBarcode,
  onRetry,
  onEnterManually,
  navigation,
}: SearchScreenProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [foodFiltersOpen, setFoodFiltersOpen] = useState(false);
  const id = useId();
  const resultsId = `search-results-${id}`;
  const recentsId = `search-recents-${id}`;
  const exploreId = `search-explore-${id}`;
  const scopeId = `search-scope-${id}`;
  const panelId = `search-panel-${id}`;
  const active = activeCriteriaCount(criteria);
  const activeFood = activeFoodFilterCount(foodFilters);
  const trimmed = query.trim();

  // --- Food scope --------------------------------------------------------------------
  const browsing = scope === 'food' && trimmed === '';
  const collection = browsing
    ? collectFoods({ query: '', recents, catalogue, filters: foodFilters })
    : collectFoods({ query: trimmed, recents, catalogue: food.results, filters: foodFilters });
  const foodStatus = browsing ? 'ready' : food.status;

  // --- Recipes scope ----------------------------------------------------------------
  // Without a query the whole catalogue shows, narrowed by the criteria; a query yields
  // the service's results (already combined with the criteria by the caller).
  const browsingRecipes = scope === 'recipes' && trimmed === '';
  const recipeStatus: RequestStatus = browsingRecipes ? (recipeCatalogueStatus === 'idle' ? 'loading' : recipeCatalogueStatus) : recipes.status;
  const recipeResults = browsingRecipes ? filterRecipes(uniqueRecipes(recipeCatalogue), criteria) : uniqueRecipes(recipes.results);

  // --- Heading and announcement ---------------------------------------------------------
  let heading: string;
  let countText = '';
  if (scope === 'food') {
    heading = browsing ? (collection.recents.length > 0 ? 'Foods' : 'All foods') : 'Results';
    if (foodStatus === 'ready' && collection.count > 0) countText = foodCountText(collection.count, foodFilters, collection.mode);
  } else {
    heading = browsingRecipes ? (active > 0 ? 'Matching recipes' : 'All recipes') : 'Results';
    if (recipeStatus === 'ready' && recipeResults.length > 0) {
      const n = recipeResults.length;
      countText = active > 0 ? `${n} ${n === 1 ? 'recipe matches' : 'recipes match'} your filters` : browsingRecipes ? `${n} ${n === 1 ? 'recipe' : 'recipes'}` : `${n} ${n === 1 ? 'recipe' : 'recipes'} found`;
    }
  }
  const current = scope === 'food' ? { status: foodStatus, length: collection.count } : { status: recipeStatus, length: recipeResults.length };
  // Announced when results change; loading and failure announce themselves.
  const summary =
    current.status !== 'ready'
      ? ''
      : current.length === 0
        ? scope === 'food'
          ? browsing
            ? 'No foods match your filters'
            : `No foods match “${trimmed}”`
          : browsingRecipes
            ? active > 0
              ? 'No recipes match your filters'
              : 'No recipes available'
            : `No recipes match “${trimmed}”`
        : countText;

  let content: ReactNode;
  if (scope === 'food') {
    if (foodStatus === 'loading') {
      content = <LoadingState label="Searching foods" />;
    } else if (foodStatus === 'failure') {
      content = (
        <EmptyState
          kind="failure"
          title="Search is not available right now"
          actions={
            <>
              <Button variant="primary" onClick={onRetry}>
                Try again
              </Button>
              <Button variant="text" onClick={onEnterManually}>
                Enter manually
              </Button>
            </>
          }
        >
          The search service did not respond. Your query is kept.
        </EmptyState>
      );
    } else if (collection.count === 0) {
      content = browsing ? (
        <EmptyState
          kind="no-match"
          title="Nothing matches your filters"
          actions={
            <Button variant="secondary" onClick={() => onApplyFoodFilters(NO_FOOD_FILTERS)}>
              Clear all filters
            </Button>
          }
        >
          There are no items of that kind yet. Clear the filter to see everything.
        </EmptyState>
      ) : (
        <EmptyState
          kind="no-match"
          title={activeFood > 0 ? `No ${foodFilters.category === 'drink' ? 'drinks' : 'foods'} match “${trimmed}”` : `No foods match “${trimmed}”`}
          actions={
            <>
              {activeFood > 0 ? (
                <Button variant="secondary" onClick={() => setFoodFiltersOpen(true)}>
                  Change filters
                </Button>
              ) : null}
              <Button variant={activeFood > 0 ? 'text' : 'secondary'} onClick={onEnterManually}>
                Enter manually
              </Button>
            </>
          }
        >
          Check the spelling or try a shorter name. You can also enter the nutrition yourself.
        </EmptyState>
      );
    } else if (collection.mode === 'browse' && collection.recents.length > 0) {
      content = (
        <div className={styles.sections}>
          <section aria-labelledby={recentsId} className={styles.subsection}>
            <Text as="h3" id={recentsId} variant="label" color="primary">
              Recently added
            </Text>
            <FoodCollection items={collection.recents} view={foodView} onOpen={onOpenFood} aria-labelledby={recentsId} />
          </section>
          {collection.explore.length > 0 ? (
            <section aria-labelledby={exploreId} className={styles.subsection}>
              <Text as="h3" id={exploreId} variant="label" color="primary">
                Explore foods
              </Text>
              <FoodCollection items={collection.explore} view={foodView} onOpen={onOpenFood} aria-labelledby={exploreId} />
            </section>
          ) : null}
        </div>
      );
    } else {
      content = <FoodCollection items={collection.mode === 'browse' ? collection.explore : collection.results} view={foodView} onOpen={onOpenFood} aria-labelledby={resultsId} />;
    }
  } else if (recipeStatus === 'loading' || recipeStatus === 'idle') {
    content = <LoadingState label={browsingRecipes ? 'Loading recipes' : 'Searching recipes'} />;
  } else if (recipeStatus === 'failure') {
    content = (
      <EmptyState
        kind="failure"
        title={browsingRecipes ? 'Recipes could not be loaded' : 'Search is not available right now'}
        actions={
          <Button variant="primary" onClick={onRetry}>
            Try again
          </Button>
        }
      >
        {browsingRecipes ? 'The recipe service did not respond. Your filters are kept.' : 'The search service did not respond. Your query and filters are kept.'}
      </EmptyState>
    );
  } else if (recipeResults.length === 0 && browsingRecipes) {
    content = (
      <EmptyState
        kind="no-match"
        title={active > 0 ? 'No recipes match your filters' : 'No recipes available'}
        actions={
          active > 0 ? (
            <>
              <Button variant="primary" onClick={() => setFiltersOpen(true)}>
                Change filters
              </Button>
              <Button variant="text" onClick={() => onApplyCriteria({})}>
                Clear all filters
              </Button>
            </>
          ) : undefined
        }
      >
        {active > 0 ? 'Every recipe is compared with all of your filters. Loosen one, or clear them to see every recipe.' : 'There is nothing to show yet.'}
      </EmptyState>
    );
  } else if (recipeResults.length === 0) {
    content = (
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
  } else {
    content = <RecipeList recipes={recipeResults} criteria={criteria} onOpen={onOpenRecipe} aria-labelledby={resultsId} />;
  }

  const appliedFood = describeFoodFilter(foodFilters);

  return (
    <RootScreenLayout header={<AppHeader variant="section" title="Search" />} navigation={navigation}>
      {/* Food scope: the scanner is a sibling action beside the field — a labelled button that
          starts a flow, never a submit or a toggle (ledger §12 B5); under 22 rem it moves below
          the field at full width rather than squeezing its label. Recipes scope keeps the filter
          action inside the field. */}
      <div className={styles.fieldFrame}>
        <div className={styles.fieldRow} data-scope={scope}>
          <SearchField
            label={scope === 'food' ? 'Search foods' : 'Search recipes'}
            value={query}
            onChange={onQueryChange}
            onSubmit={() => onSubmit()}
            onClear={onClear}
            placeholder={scope === 'food' ? 'Food or dish' : 'Recipe name or ingredient'}
            action={scope === 'recipes' ? <FilterAction count={active} expanded={filtersOpen} onClick={() => setFiltersOpen(true)} /> : undefined}
            className={styles.field}
          />
          {scope === 'food' ? (
            <Button variant="secondary" icon={Barcode} onClick={onScanBarcode} className={styles.scan}>
              Scan barcode
            </Button>
          ) : null}
        </div>
      </div>

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

      {scope === 'food' ? (
        <>
          <div className={styles.toolbar}>
            <ViewToggle value={foodView} onChange={onFoodViewChange} label="Food view" />
            <FilterAction count={activeFood} expanded={foodFiltersOpen} onClick={() => setFoodFiltersOpen(true)} label="Food filters" />
          </div>
          {appliedFood ? (
            <ul className={styles.chips} aria-label="Applied filters">
              <li>
                <AppliedCriterionChip removeLabel={`Remove filter: ${appliedFood}`} onRemove={() => onApplyFoodFilters(NO_FOOD_FILTERS)}>
                  {appliedFood}
                </AppliedCriterionChip>
              </li>
            </ul>
          ) : null}
          <FoodFiltersSheet
            open={foodFiltersOpen}
            applied={foodFilters}
            onApply={(next) => {
              onApplyFoodFilters(next);
              setFoodFiltersOpen(false);
            }}
            onCancel={() => setFoodFiltersOpen(false)}
          />
        </>
      ) : (
        <CriteriaToolbar criteria={criteria} sheetOpen={filtersOpen} onCloseSheet={() => setFiltersOpen(false)} onApply={onApplyCriteria} onRemove={onRemoveCriterion} />
      )}

      <section role="tabpanel" id={panelId} className={styles.results} aria-labelledby={segmentedOptionId(scopeId, scope)}>
        <ResultsHeading id={resultsId} heading={heading} summary={summary} countText={countText} />
        {content}
      </section>
    </RootScreenLayout>
  );
}
