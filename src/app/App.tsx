import { useEffect, useMemo, useRef, useState } from 'react';

import { MethodSheet, NavigationBar, Toast, type Destination, type EntryMethod, type ViewMode } from '../design-system';
import type { FoodCandidate, Portion } from '../features/calorie-calculator/domain/calculation';
import { createEntry, entriesForDay, updateEntryPortion, type DailyGoal, type FoodEntry } from '../features/calorie-calculator/domain/daily-log';
import { foodCatalogue, samplePhotoImage } from '../features/calorie-calculator/domain/fixtures';
import { NO_FOOD_FILTERS, type FoodFilters } from '../features/calorie-calculator/domain/food-search';
import { recentCandidates } from '../features/calorie-calculator/domain/recents';
import { mealPhrase, suggestMeal, type MealType } from '../features/calorie-calculator/domain/meal';
import { announceWaterAdded, formatWater, WATER_GOAL_ML } from '../features/calorie-calculator/domain/water';
import { AddToMealSheet } from '../features/calorie-calculator/components/AddToMealSheet';
import { BarcodeScreen } from '../features/calorie-calculator/screens/BarcodeScreen';
import { FoodReviewScreen } from '../features/calorie-calculator/screens/FoodReviewScreen';
import { HomeScreen, type RecommendedRecipe } from '../features/calorie-calculator/screens/HomeScreen';
import { ManualEntryScreen } from '../features/calorie-calculator/screens/ManualEntryScreen';
import { PhotoScreen } from '../features/calorie-calculator/screens/PhotoScreen';
import { activeCriteriaCount, filterRecipes, matchEvidence, removeCriterion, type CriterionKey, type Recipe, type RecipeCriteria } from '../features/recipe-discovery/domain/matching';
import { recipeToCandidate } from '../features/recipe-discovery/domain/recipe-entry';
import { RecipeDetailsScreen, type RecipeDetailsState } from '../features/recipe-discovery/screens/RecipeDetailsScreen';
import { RecipesScreen, type RecipesStatus } from '../features/recipe-discovery/screens/RecipesScreen';
import { SearchScreen, type SearchResults, type SearchScope } from './screens/SearchScreen';
import { catalogueImageFor } from './catalogue-images';
import { browserStorage, loadRecord, saveRecord } from './persistence';
import { analysePhotoService, browseRecipesService, loadRecipeService, lookupBarcodeService, readBarcodeService, searchFoodService, searchRecipeService } from './services';
import { useLocalDayKey } from './useLocalDayKey';
import { useScrollMemory } from './useScrollMemory';
import { useSoftwareKeyboard } from './useSoftwareKeyboard';

/**
 * Focused steps stack above the three roots. Every step stays mounted (hidden) while a
 * later one is on top, so Back restores it with its input intact.
 */
type FlowStepInput =
  | { kind: 'barcode' }
  | { kind: 'photo' }
  | { kind: 'manual' }
  | { kind: 'review'; candidate: FoodCandidate; from: EntryMethod }
  | { kind: 'entry'; entryId: string }
  | { kind: 'recipe'; recipeId: string; criteriaSource: 'search' | 'browse' | 'home' };
type FlowStep = FlowStepInput & { id: number };

let stepSequence = 0;
function makeStep(input: FlowStepInput): FlowStep {
  return { ...input, id: ++stepSequence };
}

interface RequestState<T> extends SearchResults<T> {
  query: string;
  criteriaKey: string;
}
const IDLE: RequestState<never> = { status: 'idle', results: [], query: '', criteriaKey: '' };

/** What the Add-to-meal sheet is confirming: a reviewed food or a recipe. */
interface PendingAdd {
  candidate: FoodCandidate;
  portion: Portion;
  meal: MealType;
  hint: string;
}

/** Selects the recommended recipe (ledger D-21): the first browse match with evidence, else the first complete recipe with a photo. */
function recommend(recipes: readonly Recipe[], criteria: RecipeCriteria): RecommendedRecipe | null {
  if (recipes.length === 0) return null;
  if (activeCriteriaCount(criteria) > 0) {
    const match = filterRecipes(recipes, criteria)[0];
    if (match) return { recipe: match, evidence: matchEvidence(match, criteria) };
  }
  const complete = recipes.find((r) => r.imageUrl && r.energyKcal !== null && r.proteinG !== null) ?? recipes.find((r) => r.imageUrl) ?? recipes[0];
  return { recipe: complete, evidence: [] };
}

/** The record as it was on the device when the app started (ledger §11.3). */
const storage = browserStorage();
const initialRecord = loadRecord(storage, catalogueImageFor);

/**
 * The Portion runtime: in-memory navigation over fixture-backed screens. The daily record
 * (entries with their meals and days, the optional goal, water per day) and the Search
 * view preference persist on the device and are restored on launch.
 */
export default function App() {
  const [root, setRoot] = useState<Destination>('home');
  const [flow, setFlow] = useState<FlowStep[]>([]);
  const [methodOpen, setMethodOpen] = useState(false);
  // Where the food task was started from (root + focused stack when Log food was opened,
  // plus the meal when a Home meal row started it), so Done can return there and the
  // Add-to-meal sheet can preselect the meal.
  const [taskOrigin, setTaskOrigin] = useState<{ root: Destination; flow: FlowStep[]; meal: MealType | null } | null>(null);
  const keyboardOpen = useSoftwareKeyboard();

  // Daily record --------------------------------------------------------------
  const [entries, setEntries] = useState<FoodEntry[]>(initialRecord.entries);
  const [goal, setGoal] = useState<DailyGoal | null>(initialRecord.goal);
  const [water, setWater] = useState<Record<string, number>>(initialRecord.water);
  const [foodView, setFoodView] = useState<ViewMode>(initialRecord.searchView);
  const [foodFilters, setFoodFilters] = useState<FoodFilters>(NO_FOOD_FILTERS);
  const [highlightEntryId, setHighlightEntryId] = useState<string | null>(null);
  // The local calendar day, re-evaluated at midnight and on return to the tab, so a day
  // change shows the new day's (empty) list while earlier entries stay under their own day.
  const todayKey = useLocalDayKey();
  const todayEntries = useMemo(() => entriesForDay(entries, todayKey), [entries, todayKey]);
  const waterMl = water[todayKey] ?? 0;
  // Recently added foods derive from confirmed entries only (ledger §11.1).
  const recents = useMemo(() => recentCandidates(entries), [entries]);

  // Every confirmed change is written to the device; nothing is written for drafts.
  useEffect(() => {
    saveRecord(storage, { version: 1, entries, goal, water, searchView: foodView });
  }, [entries, goal, water, foodView]);

  // Feedback ----------------------------------------------------------------
  const [toast, setToast] = useState<{ message: string; undo?: () => void } | null>(null);
  const [pendingAdd, setPendingAdd] = useState<PendingAdd | null>(null);

  // Search ------------------------------------------------------------------
  const [scope, setScope] = useState<SearchScope>('food');
  const [query, setQuery] = useState('');
  const [searchCriteria, setSearchCriteria] = useState<RecipeCriteria>({});
  const [foodRequest, setFoodRequest] = useState<RequestState<FoodCandidate>>(IDLE);
  const [recipeRequest, setRecipeRequest] = useState<RequestState<Recipe>>(IDLE);
  const [retryToken, setRetryToken] = useState(0);
  const latestFood = useRef(foodRequest);
  const latestRecipes = useRef(recipeRequest);
  latestFood.current = foodRequest;
  latestRecipes.current = recipeRequest;
  const searchRequestId = useRef(0);
  const criteriaKey = JSON.stringify(searchCriteria);

  useEffect(() => {
    const trimmed = query.trim();
    const id = ++searchRequestId.current;
    if (scope === 'food') {
      if (trimmed === '') {
        setFoodRequest(IDLE);
        return;
      }
      const existing = latestFood.current;
      if (existing.query === trimmed && existing.status === 'ready') return;
      const timer = setTimeout(() => {
        setFoodRequest({ status: 'loading', results: [], query: trimmed, criteriaKey: '' });
        searchFoodService(trimmed).then((result) => {
          if (id !== searchRequestId.current) return;
          setFoodRequest(
            result.ok ? { status: 'ready', results: result.results, query: trimmed, criteriaKey: '' } : { status: 'failure', results: [], query: trimmed, criteriaKey: '' },
          );
        });
      }, 250);
      return () => clearTimeout(timer);
    }
    if (trimmed === '') {
      setRecipeRequest(IDLE);
      return;
    }
    const existing = latestRecipes.current;
    if (existing.query === trimmed && existing.criteriaKey === criteriaKey && existing.status === 'ready') return;
    const timer = setTimeout(() => {
      setRecipeRequest({ status: 'loading', results: [], query: trimmed, criteriaKey });
      searchRecipeService(trimmed, searchCriteria).then((result) => {
        if (id !== searchRequestId.current) return;
        setRecipeRequest(result.ok ? { status: 'ready', results: result.results, query: trimmed, criteriaKey } : { status: 'failure', results: [], query: trimmed, criteriaKey });
      });
    }, 250);
    return () => clearTimeout(timer);
    // searchCriteria is represented by criteriaKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, scope, criteriaKey, retryToken]);

  // Recipes (browse) --------------------------------------------------------
  const [browseCriteria, setBrowseCriteria] = useState<RecipeCriteria>({});
  const [browseStatus, setBrowseStatus] = useState<RecipesStatus>('loading');
  const [browseRecipes, setBrowseRecipes] = useState<readonly Recipe[]>([]);
  const [browseToken, setBrowseToken] = useState(0);

  useEffect(() => {
    let live = true;
    setBrowseStatus('loading');
    browseRecipesService().then((result) => {
      if (!live) return;
      if (result.ok) {
        setBrowseRecipes(result.results);
        setBrowseStatus('ready');
      } else {
        setBrowseStatus('failure');
      }
    });
    return () => {
      live = false;
    };
  }, [browseToken]);

  const browseResults = useMemo(() => filterRecipes(browseRecipes, browseCriteria), [browseRecipes, browseCriteria]);
  const recommended = useMemo(() => recommend(browseRecipes, browseCriteria), [browseRecipes, browseCriteria]);

  // Recipe details ----------------------------------------------------------
  const [details, setDetails] = useState<RecipeDetailsState>({ status: 'loading' });
  const detailsRequestId = useRef(0);

  const loadDetails = (recipeId: string) => {
    const id = ++detailsRequestId.current;
    setDetails({ status: 'loading' });
    loadRecipeService(recipeId).then((recipe) => {
      if (id !== detailsRequestId.current) return;
      setDetails(recipe ? { status: 'loaded', recipe } : { status: 'unavailable' });
    });
  };

  // Navigation --------------------------------------------------------------
  const top = flow.length > 0 ? flow[flow.length - 1] : null;
  const scrollKey = top ? `flow:${top.id}` : `root:${root}`;
  const scroll = useScrollMemory(scrollKey);
  const previousScrollKey = useRef(scrollKey);

  // Move focus to the new screen's heading when a screen changes, so keyboard and
  // screen-reader users land on the new context rather than on a hidden control.
  useEffect(() => {
    if (previousScrollKey.current === scrollKey) return;
    previousScrollKey.current = scrollKey;
    const heading = document.querySelector<HTMLElement>('[data-screen]:not([hidden]) h1');
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }, [scrollKey]);

  const push = (input: FlowStepInput) => setFlow((f) => [...f, makeStep(input)]);
  const pop = () => {
    detailsRequestId.current += 1;
    setFlow((f) => f.slice(0, -1));
  };
  const switchRoot = (destination: Destination) => {
    detailsRequestId.current += 1;
    setTaskOrigin(null);
    setFlow([]);
    setRoot(destination);
  };
  /** Opens the shared Log food chooser and remembers the invoking surface (and meal, from a Home row). */
  const openLogFood = (meal: MealType | null = null) => {
    setTaskOrigin({ root, flow, meal });
    setMethodOpen(true);
  };
  /**
   * Close the food task to the surface it was started from, without logging: the root
   * and focused stack recorded when Log food was opened (Recipe Details included), or the
   * current root when the task began on the Search tab itself.
   */
  const closeTask = () => {
    detailsRequestId.current += 1;
    if (taskOrigin) {
      setRoot(taskOrigin.root);
      setFlow(taskOrigin.flow);
      setTaskOrigin(null);
    } else {
      setFlow([]);
    }
  };
  const goToFoodSearch = () => {
    detailsRequestId.current += 1;
    setFlow([]);
    setScope('food');
    setRoot('search');
  };

  const chooseMethod = (method: EntryMethod) => {
    setMethodOpen(false);
    if (method === 'search') {
      goToFoodSearch();
      return;
    }
    push({ kind: method });
  };

  const openReview = (candidate: FoodCandidate, from: EntryMethod) => push({ kind: 'review', candidate, from });

  /** The Add-to-meal sheet: preselect the Home row's meal, else the time-of-day suggestion (D-17). */
  const openAddToMeal = (candidate: FoodCandidate, portion: Portion) => {
    const fromRow = taskOrigin?.meal ?? null;
    setPendingAdd({
      candidate,
      portion,
      meal: fromRow ?? suggestMeal(),
      hint: fromRow ? 'Preselected from the meal you started from. Change it if you like.' : 'Suggested for this time of day. Change it if you like.',
    });
  };

  const confirmAdd = (meal: MealType, portion: Portion) => {
    if (!pendingAdd) return;
    const entry = createEntry(pendingAdd.candidate, portion, meal);
    setPendingAdd(null);
    if (!entry) return;
    setEntries((list) => [...list, entry]);
    setHighlightEntryId(entry.id);
    setToast({ message: `Added to ${mealPhrase(meal)}.` });
    switchRoot('home');
  };

  const updateEntry = (entryId: string, portion: Portion, meal: MealType) => {
    setEntries((list) => list.map((entry) => (entry.id === entryId ? (updateEntryPortion(entry, portion, meal) ?? entry) : entry)));
    switchRoot('home');
  };

  const removeEntry = (entryId: string) => {
    setEntries((list) => list.filter((entry) => entry.id !== entryId));
    switchRoot('home');
  };

  const addWater = (ml: number, source: 'quick' | 'sheet') => {
    const before = waterMl;
    setWater((w) => ({ ...w, [todayKey]: (w[todayKey] ?? 0) + ml }));
    // Functional update above keeps rapid taps exact; the announcement reads the value they produce.
    setToast({
      message: announceWaterAdded(ml, before + ml),
      undo: source === 'quick' ? () => setWater((w) => ({ ...w, [todayKey]: Math.max(0, (w[todayKey] ?? 0) - ml) })) : undefined,
    });
  };

  const setWaterTotal = (ml: number) => {
    setWater((w) => ({ ...w, [todayKey]: ml }));
    setToast({ message: `Today's water set to ${formatWater(ml)}.` });
  };

  const openRecipe = (recipeId: string, criteriaSource: 'search' | 'browse' | 'home') => {
    push({ kind: 'recipe', recipeId, criteriaSource });
    loadDetails(recipeId);
  };

  const navigation = (selected: Destination) => <NavigationBar selected={selected} onSelect={switchRoot} onLogFood={() => openLogFood()} hidden={keyboardOpen} />;

  const rootVisible = (destination: Destination) => flow.length === 0 && root === destination;

  const renderStep = (step: FlowStep) => {
    switch (step.kind) {
      case 'barcode':
        return (
          <BarcodeScreen
            read={readBarcodeService}
            lookup={lookupBarcodeService}
            onFound={(candidate) => openReview(candidate, 'barcode')}
            onBack={pop}
            onSearchInstead={goToFoodSearch}
            onEnterManually={() => push({ kind: 'manual' })}
          />
        );
      case 'photo':
        return (
          <PhotoScreen
            analyse={analysePhotoService}
            sampleImageUrl={samplePhotoImage}
            onSuggestionChosen={(candidate) => openReview(candidate, 'photo')}
            onBack={pop}
            onSearchInstead={goToFoodSearch}
            onEnterManually={() => push({ kind: 'manual' })}
          />
        );
      case 'manual':
        return <ManualEntryScreen onContinue={(candidate) => openReview(candidate, 'manual')} onBack={pop} />;
      case 'review':
        return (
          <FoodReviewScreen
            candidate={step.candidate}
            mode="new"
            onAddToToday={(portion) => openAddToMeal(step.candidate, portion)}
            onDone={closeTask}
            onBack={pop}
            onChangeMatch={step.from === 'barcode' || step.from === 'photo' ? goToFoodSearch : pop}
          />
        );
      case 'entry': {
        const entry = entries.find((e) => e.id === step.entryId);
        if (!entry) return null;
        return (
          <FoodReviewScreen
            candidate={entry.candidate}
            mode="existing"
            initialPortion={entry.portion}
            initialMeal={entry.meal}
            onUpdateEntry={(portion, meal) => updateEntry(entry.id, portion, meal)}
            onRemoveEntry={() => removeEntry(entry.id)}
            onBack={pop}
          />
        );
      }
      case 'recipe':
        return (
          <RecipeDetailsScreen
            state={details}
            criteria={step.criteriaSource === 'search' ? searchCriteria : browseCriteria}
            onBack={pop}
            onRetry={() => loadDetails(step.recipeId)}
            onAdd={(recipe) => openAddToMeal(recipeToCandidate(recipe), { quantity: 1, unitId: 'serving' })}
            navigation={navigation(root)}
          />
        );
    }
  };

  return (
    <>
      <div data-screen="home" hidden={!rootVisible('home')}>
        <HomeScreen
          entries={todayEntries}
          goal={goal}
          onGoalChange={setGoal}
          onOpenEntry={(entryId) => push({ kind: 'entry', entryId })}
          onAddToMeal={(meal) => openLogFood(meal)}
          recommended={recommended}
          onOpenRecipe={(id) => openRecipe(id, 'home')}
          onFindRecipes={() => switchRoot('recipes')}
          waterMl={waterMl}
          waterGoalMl={WATER_GOAL_ML}
          onAddWater={addWater}
          onSetWaterTotal={setWaterTotal}
          highlightEntryId={highlightEntryId}
          navigation={navigation('home')}
        />
      </div>

      <div data-screen="search" hidden={!rootVisible('search')}>
        <SearchScreen
          scope={scope}
          onScopeChange={setScope}
          query={query}
          onQueryChange={(next) => {
            setQuery(next);
            scroll.reset('root:search');
          }}
          onSubmit={() => (document.activeElement as HTMLElement | null)?.blur()}
          onClear={() => {
            setQuery('');
            scroll.reset('root:search');
          }}
          food={foodRequest}
          catalogue={foodCatalogue}
          recents={recents}
          foodFilters={foodFilters}
          onApplyFoodFilters={setFoodFilters}
          foodView={foodView}
          onFoodViewChange={setFoodView}
          recipes={recipeRequest}
          criteria={searchCriteria}
          onApplyCriteria={setSearchCriteria}
          onRemoveCriterion={(key: CriterionKey) => setSearchCriteria((c) => removeCriterion(c, key))}
          onOpenFood={(candidate) => openReview(candidate, 'search')}
          onOpenRecipe={(id) => openRecipe(id, 'search')}
          onScanBarcode={() => {
            setTaskOrigin({ root: 'search', flow: [], meal: null });
            push({ kind: 'barcode' });
          }}
          onRetry={() => setRetryToken((n) => n + 1)}
          onEnterManually={() => push({ kind: 'manual' })}
          navigation={navigation('search')}
        />
      </div>

      <div data-screen="recipes" hidden={!rootVisible('recipes')}>
        <RecipesScreen
          results={browseResults}
          criteria={browseCriteria}
          status={browseStatus}
          onApplyCriteria={setBrowseCriteria}
          onRemoveCriterion={(key) => setBrowseCriteria((c) => removeCriterion(c, key))}
          onClearCriteria={() => setBrowseCriteria({})}
          onRetry={() => setBrowseToken((n) => n + 1)}
          onOpenRecipe={(id) => openRecipe(id, 'browse')}
          onOpenSearch={() => {
            // Browse-to-Search copies a snapshot; later Search edits never touch browse criteria.
            setSearchCriteria({ ...browseCriteria });
            setScope('recipes');
            setRoot('search');
          }}
          navigation={navigation('recipes')}
        />
      </div>

      {flow.map((step) => (
        <div key={step.id} data-screen={step.kind} hidden={step.id !== top?.id}>
          {renderStep(step)}
        </div>
      ))}

      <MethodSheet open={methodOpen} onRequestClose={() => setMethodOpen(false)} onChoose={chooseMethod} />

      <AddToMealSheet
        open={pendingAdd !== null}
        candidate={pendingAdd?.candidate ?? null}
        initialPortion={pendingAdd?.portion ?? null}
        initialMeal={pendingAdd?.meal ?? null}
        mealHint={pendingAdd?.hint}
        onConfirm={confirmAdd}
        onCancel={() => setPendingAdd(null)}
      />

      <Toast
        open={toast !== null}
        message={toast?.message ?? ''}
        actionLabel={toast?.undo ? 'Undo' : undefined}
        onAction={toast?.undo}
        onDismiss={() => {
          setToast(null);
          setHighlightEntryId(null);
        }}
      />
    </>
  );
}

