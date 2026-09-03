import { useEffect, useMemo, useRef, useState } from 'react';

import { MethodSheet, NavigationBar, type Destination, type EntryMethod } from '../design-system';
import { commitCandidate, updatePortion, type CurrentCalculation, type FoodCandidate, type Portion } from '../features/calorie-calculator/domain/calculation';
import { samplePhotoImage } from '../features/calorie-calculator/domain/fixtures';
import { BarcodeScreen } from '../features/calorie-calculator/screens/BarcodeScreen';
import { CalculateScreen } from '../features/calorie-calculator/screens/CalculateScreen';
import { FoodReviewScreen } from '../features/calorie-calculator/screens/FoodReviewScreen';
import { ManualEntryScreen } from '../features/calorie-calculator/screens/ManualEntryScreen';
import { PhotoScreen } from '../features/calorie-calculator/screens/PhotoScreen';
import { filterRecipes, removeCriterion, type CriterionKey, type Recipe, type RecipeCriteria } from '../features/recipe-discovery/domain/matching';
import { RecipeDetailsScreen, type RecipeDetailsState } from '../features/recipe-discovery/screens/RecipeDetailsScreen';
import { RecipesScreen, type RecipesStatus } from '../features/recipe-discovery/screens/RecipesScreen';
import { SearchScreen, type SearchResults, type SearchScope } from './screens/SearchScreen';
import { analysePhotoService, BARCODE_DEMO_CODES, browseRecipesService, loadRecipeService, lookupBarcodeService, searchFoodService, searchRecipeService } from './services';
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
  | { kind: 'recipe'; recipeId: string; criteriaSource: 'search' | 'browse' };
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

/** The Portion runtime: in-memory navigation over fixture-backed screens. No persistence is promised. */
export default function App() {
  const [root, setRoot] = useState<Destination>('calculate');
  const [flow, setFlow] = useState<FlowStep[]>([]);
  const [methodOpen, setMethodOpen] = useState(false);
  const keyboardOpen = useSoftwareKeyboard();

  // Calculate ---------------------------------------------------------------
  const [calculation, setCalculation] = useState<CurrentCalculation | null>(null);

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
    setFlow([]);
    setRoot(destination);
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

  const confirmReview = (candidate: FoodCandidate, portion: Portion) => {
    const next = commitCandidate(candidate, portion);
    if (!next) return;
    setCalculation(next);
    setFlow([]);
    setRoot('calculate');
  };

  const openRecipe = (recipeId: string, criteriaSource: 'search' | 'browse') => {
    push({ kind: 'recipe', recipeId, criteriaSource });
    loadDetails(recipeId);
  };

  const navigation = (selected: Destination) => <NavigationBar selected={selected} onSelect={switchRoot} onAddFood={() => setMethodOpen(true)} hidden={keyboardOpen} />;

  const rootVisible = (destination: Destination) => flow.length === 0 && root === destination;

  const renderStep = (step: FlowStep) => {
    switch (step.kind) {
      case 'barcode':
        return (
          <BarcodeScreen
            lookup={lookupBarcodeService}
            demoCodes={BARCODE_DEMO_CODES}
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
            replaces={calculation?.candidate.name ?? null}
            onConfirm={(portion) => confirmReview(step.candidate, portion)}
            onBack={pop}
            onChangeMatch={step.from === 'barcode' || step.from === 'photo' ? goToFoodSearch : pop}
          />
        );
      case 'recipe':
        return (
          <RecipeDetailsScreen
            state={details}
            criteria={step.criteriaSource === 'search' ? searchCriteria : browseCriteria}
            onBack={pop}
            onRetry={() => loadDetails(step.recipeId)}
            navigation={navigation(root)}
          />
        );
    }
  };

  return (
    <>
      <div data-screen="calculate" hidden={!rootVisible('calculate')}>
        <CalculateScreen
          current={calculation}
          onPortionChange={(portion) => setCalculation((c) => (c ? updatePortion(c, portion) : c))}
          onChangeFood={() => setMethodOpen(true)}
          navigation={navigation('calculate')}
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
          recipes={recipeRequest}
          criteria={searchCriteria}
          onApplyCriteria={setSearchCriteria}
          onRemoveCriterion={(key: CriterionKey) => setSearchCriteria((c) => removeCriterion(c, key))}
          onOpenFood={(candidate) => openReview(candidate, 'search')}
          onOpenRecipe={(id) => openRecipe(id, 'search')}
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
    </>
  );
}
