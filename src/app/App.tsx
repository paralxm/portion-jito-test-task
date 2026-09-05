import { useEffect, useMemo, useRef, useState } from 'react';

import { MethodSheet, NavigationBar, Toast, type Destination, type EntryMethod, type ViewMode } from '../design-system';
import type { FoodCandidate, Portion } from '../features/calorie-calculator/domain/calculation';
import { createEntry, entriesForDay, updateEntryPortion, type DailyGoal, type FoodEntry } from '../features/calorie-calculator/domain/daily-log';
import { compareDayKeys, dayPhrase } from '../features/calorie-calculator/domain/day-keys';
import { goalForDay, setGoalFrom, type GoalHistory } from '../features/calorie-calculator/domain/goal-history';
import { computeStreak } from '../features/calorie-calculator/domain/streak';
import { foodCatalogue, samplePhotoImage } from '../features/calorie-calculator/domain/fixtures';
import { NO_FOOD_FILTERS, type FoodFilters } from '../features/calorie-calculator/domain/food-search';
import { draftFromCandidate, EMPTY_MANUAL_DRAFT, newManualId, type ManualDraft } from '../features/calorie-calculator/domain/manual-entry';
import { carryPortion } from '../features/calorie-calculator/domain/portion-draft';
import { recentCandidates } from '../features/calorie-calculator/domain/recents';
import { mealPhrase, suggestMeal, type MealType } from '../features/calorie-calculator/domain/meal';
import { announceWaterAdded, formatWater, WATER_GOAL_ML } from '../features/calorie-calculator/domain/water';
import { AddToMealSheet } from '../features/calorie-calculator/components/AddToMealSheet';
import { releasePhotoDraft, type PhotoDraft } from '../features/calorie-calculator/components/PhotoField';
import { PRESELECTED_MEAL_HINT, SUGGESTED_MEAL_HINT } from '../features/calorie-calculator/components/PortionForm';
import { BarcodeScreen } from '../features/calorie-calculator/screens/BarcodeScreen';
import { FoodReviewScreen } from '../features/calorie-calculator/screens/FoodReviewScreen';
import { HomeScreen, type RecommendedRecipe } from '../features/calorie-calculator/screens/HomeScreen';
import { ManualEntryScreen } from '../features/calorie-calculator/screens/ManualEntryScreen';
import { ManualPortionScreen } from '../features/calorie-calculator/screens/ManualPortionScreen';
import { PhotoScreen } from '../features/calorie-calculator/screens/PhotoScreen';
import { activeCriteriaCount, filterRecipes, matchEvidence, removeCriterion, toggleDietary, type CriterionKey, type Recipe, type RecipeCriteria } from '../features/recipe-discovery/domain/matching';
import { recipeToCandidate } from '../features/recipe-discovery/domain/recipe-entry';
import { RecipeDetailsScreen, type RecipeDetailsState } from '../features/recipe-discovery/screens/RecipeDetailsScreen';
import { RecipesScreen, type RecipesStatus } from '../features/recipe-discovery/screens/RecipesScreen';
import { SearchScreen, type SearchResults, type SearchScope } from './screens/SearchScreen';
import { catalogueImageFor } from './catalogue-images';
import { ExitGuardScope, type GuardEntry } from './exit-guard';
import { browserStorage, loadRecord, saveRecord } from './persistence';
import { loadPhotoStore, makePhotoPreview, savePhotoStore, withPhoto, type PhotoStore } from './photo-store';
import { analysePhotoService, browseRecipesService, loadRecipeService, lookupBarcodeService, readBarcodeService, searchFoodService, searchRecipeService } from './services';
import { useHistoryStack } from './useHistoryStack';
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
  /** Manual entry, step 1 of 2: food details (the draft lives in `manualTask`). */
  | { kind: 'manual' }
  /** Manual entry, step 2 of 2: portion and meal for the candidate built from step 1. */
  | { kind: 'manual-portion'; candidate: FoodCandidate }
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

/** What the Add-to-meal sheet is confirming: a recipe from Recipe Details (foods commit on review). */
interface PendingAdd {
  candidate: FoodCandidate;
  portion: Portion;
  meal: MealType;
  hint: string;
}

/**
 * The manual task's draft, owned at flow level (ledger §12 D3) so Back and Edit between
 * the two steps keep every value: the details, the optional photo, the retained portion
 * and meal, and the correction provenance when the task started from a barcode or photo
 * review ("Edit label values").
 */
interface ManualTask {
  id: string;
  details: ManualDraft;
  initialDetails: ManualDraft;
  photo: PhotoDraft | null;
  portion: Portion | null;
  meal: MealType | null;
  provenance?: NonNullable<FoodCandidate['provenance']>;
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

/** The record and the photo store as they were on the device when the app started (ledger §11.3, §12 D1). */
const storage = browserStorage();
const initialPhotos = loadPhotoStore(storage);
const initialRecord = loadRecord(storage, { resolveImage: (id) => catalogueImageFor(id) ?? initialPhotos.photos[id]?.dataUrl });

/**
 * The Portion runtime: in-memory navigation over fixture-backed screens. The daily record
 * (entries with their meals and days, the goal history, water per day) and the Search
 * view preference persist on the device and are restored on launch.
 */
export default function App() {
  const [root, setRoot] = useState<Destination>('home');
  const [flow, setFlow] = useState<FlowStep[]>([]);
  const [methodOpen, setMethodOpen] = useState(false);
  // Where the food task was started from (root + focused stack when Log food was opened,
  // plus the meal when a Home meal row started it, and the day Home showed), so Cancel
  // can return there, the commit can preselect the meal and land on the bound day — a
  // midnight rollover during the task never moves the entry to another day (§12 A4).
  const [taskOrigin, setTaskOrigin] = useState<{ root: Destination; flow: FlowStep[]; meal: MealType | null; dayKey: string } | null>(null);
  const keyboardOpen = useSoftwareKeyboard();

  // Daily record --------------------------------------------------------------
  const [entries, setEntries] = useState<FoodEntry[]>(initialRecord.entries);
  const [goals, setGoals] = useState<GoalHistory>(initialRecord.goals);
  const [water, setWater] = useState<Record<string, number>>(initialRecord.water);
  const [foodView, setFoodView] = useState<ViewMode>(initialRecord.searchView);
  const [foodFilters, setFoodFilters] = useState<FoodFilters>(NO_FOOD_FILTERS);
  const [highlightEntryId, setHighlightEntryId] = useState<string | null>(null);
  const [photoStore, setPhotoStore] = useState<PhotoStore>(initialPhotos);
  // The local calendar day, re-evaluated at midnight and on return to the tab, so a day
  // change shows the new day's (empty) list while earlier entries stay under their own day.
  const todayKey = useLocalDayKey();
  // The day Home shows: `null` follows today across midnight; an explicitly selected
  // earlier day stays selected until the user moves (§12 A3/A4).
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const selectedDayKey = selectedDay !== null && compareDayKeys(selectedDay, todayKey) < 0 ? selectedDay : todayKey;
  const selectDay = (dayKey: string) => setSelectedDay(dayKey === todayKey ? null : dayKey);
  const dayEntries = useMemo(() => entriesForDay(entries, selectedDayKey), [entries, selectedDayKey]);
  const waterMl = water[selectedDayKey] ?? 0;
  // The goal in force on the selected day; edits record a new period from today (§12 A6).
  const goal = useMemo(() => goalForDay(goals, selectedDayKey), [goals, selectedDayKey]);
  const changeGoal = (next: DailyGoal | null) => setGoals((history) => setGoalFrom(history, todayKey, next));
  const streak = useMemo(() => computeStreak(entries, todayKey), [entries, todayKey]);
  // Recently added foods derive from confirmed entries only (ledger §11.1).
  const recents = useMemo(() => recentCandidates(entries), [entries]);

  // Every confirmed change is written to the device; nothing is written for drafts.
  useEffect(() => {
    saveRecord(storage, { version: 2, entries, goals, water, searchView: foodView });
  }, [entries, goals, water, foodView]);
  useEffect(() => {
    savePhotoStore(storage, photoStore);
  }, [photoStore]);

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

  // Recipes (discovery) -----------------------------------------------------
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

  const recommended = useMemo(() => recommend(browseRecipes, browseCriteria), [browseRecipes, browseCriteria]);
  /** Discovery → Search: a deliberate criteria snapshot; later Search edits never touch the discovery criteria. */
  const openRecipeSearch = (snapshot: RecipeCriteria) => {
    setSearchCriteria({ ...snapshot });
    setScope('recipes');
    setRoot('search');
  };

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

  // The manual task ----------------------------------------------------------
  const [manualTask, setManualTask] = useState<ManualTask | null>(null);
  const committedPhotoIds = useRef(new Set<string>());
  const endManualTask = () => {
    setManualTask((task) => {
      // A photo that was committed keeps its object URL for the session (Recently added shows it).
      if (task && !committedPhotoIds.current.has(task.id)) releasePhotoDraft(task.photo);
      return null;
    });
  };

  const push = (input: FlowStepInput) => setFlow((f) => [...f, makeStep(input)]);
  const pop = () => {
    detailsRequestId.current += 1;
    setFlow((f) => f.slice(0, -1));
  };
  const switchRoot = (destination: Destination) => {
    detailsRequestId.current += 1;
    setTaskOrigin(null);
    endManualTask();
    setFlow([]);
    setRoot(destination);
  };
  /** Opens the shared Log food chooser and remembers the invoking surface (and meal, from a Home row). */
  const openLogFood = (meal: MealType | null = null) => {
    setTaskOrigin({ root, flow, meal, dayKey: selectedDayKey });
    setMethodOpen(true);
  };
  /** The day a commit lands on: the day bound when the task started, else the day Home shows. */
  const targetDayKey = () => taskOrigin?.dayKey ?? selectedDayKey;
  /** Home shows the day an entry landed on; today follows the clock again. */
  const showDay = (dayKey: string) => setSelectedDay(dayKey === todayKey ? null : dayKey);
  /**
   * Close the food task to the surface it was started from, without logging: the root
   * and focused stack recorded when Log food was opened (Recipe Details included), or the
   * current root when the task began on the Search tab itself.
   */
  const closeTask = () => {
    detailsRequestId.current += 1;
    endManualTask();
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
    endManualTask();
    setFlow([]);
    setScope('food');
    setRoot('search');
  };

  // Exit guard and browser history (§12 D3/D4) ------------------------------
  const guards = useRef(new Map<number, GuardEntry>()).current;
  /** Pops `steps` focused screens the way the header's Back does; leaving the last one closes the task to its origin. */
  const popSteps = (steps: number) => {
    detailsRequestId.current += 1;
    const remaining = Math.max(0, flow.length - steps);
    if (remaining === 0 && taskOrigin) closeTask();
    else setFlow((f) => f.slice(0, remaining));
  };
  useHistoryStack(flow.length, (steps) => {
    const entry = top ? guards.get(top.id) : undefined;
    if (entry?.guard()) return true;
    popSteps(steps);
    return false;
  });
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (![...guards.values()].some((g) => g.dirty)) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [guards]);

  /** Starts manual entry, empty or as a correction of a matched/suggested record (§12 E1). */
  const startManual = (correcting?: FoodCandidate) => {
    const details = correcting ? draftFromCandidate(correcting) : EMPTY_MANUAL_DRAFT;
    setManualTask({
      id: newManualId(),
      details,
      initialDetails: details,
      photo: null,
      portion: null,
      meal: null,
      provenance: correcting && (correcting.source === 'barcode' || correcting.source === 'photo') ? { kind: 'override', from: correcting.source, of: correcting.id, barcode: correcting.barcode } : undefined,
    });
    push({ kind: 'manual' });
  };
  const updateManual = (patch: Partial<ManualTask>) => setManualTask((task) => (task ? { ...task, ...patch } : task));
  const setManualPhoto = (photo: PhotoDraft | null) =>
    setManualTask((task) => {
      if (!task) return task;
      if (task.photo && task.photo !== photo) releasePhotoDraft(task.photo);
      return { ...task, photo };
    });
  const continueManual = (candidate: FoodCandidate) => {
    const task = manualTask;
    const enriched: FoodCandidate = {
      ...candidate,
      imageUrl: task?.photo?.url,
      provenance: task?.provenance,
      detail: task?.provenance ? `Edited from ${task.provenance.from === 'barcode' ? `barcode ${task.provenance.barcode ?? ''}`.trim() : 'a photo suggestion'}` : candidate.detail,
    };
    if (!enriched.imageUrl) delete enriched.imageUrl;
    if (!enriched.provenance) delete enriched.provenance;
    push({ kind: 'manual-portion', candidate: enriched });
  };

  const chooseMethod = (method: EntryMethod) => {
    setMethodOpen(false);
    if (method === 'search') {
      goToFoodSearch();
      return;
    }
    if (method === 'manual') {
      startManual();
      return;
    }
    push({ kind: method });
  };

  const openReview = (candidate: FoodCandidate, from: EntryMethod) => push({ kind: 'review', candidate, from });

  /** The meal the task starts with: the Home row's meal, else the time-of-day suggestion (D-17). */
  const startingMeal = () => (taskOrigin?.meal ? { meal: taskOrigin.meal, hint: PRESELECTED_MEAL_HINT } : { meal: suggestMeal(), hint: SUGGESTED_MEAL_HINT });
  const targetPhrase = () => (targetDayKey() === todayKey ? undefined : dayPhrase(targetDayKey(), todayKey));

  /** The Add-to-meal sheet, used by Recipe Details (a recipe has no portion or meal yet). */
  const openAddToMeal = (candidate: FoodCandidate, portion: Portion) => {
    const start = startingMeal();
    setPendingAdd({ candidate, portion, meal: start.meal, hint: start.hint });
  };

  /** The one commit for a reviewed food or recipe: exactly one entry on the bound day, then Home showing that day. */
  const commitEntry = (candidate: FoodCandidate, portion: Portion, meal: MealType) => {
    const dayKey = targetDayKey();
    const entry = createEntry(candidate, portion, meal, { dayKey });
    if (!entry) return false;
    setEntries((list) => [...list, entry]);
    setHighlightEntryId(entry.id);
    setToast({ message: dayKey === todayKey ? `Added to ${mealPhrase(meal)}.` : `Added to ${mealPhrase(meal)} ${dayPhrase(dayKey, todayKey)}.` });
    showDay(dayKey);
    switchRoot('home');
    return true;
  };

  /** Manual commit: the user's photo becomes a bounded preview in the photo store (§12 D1). */
  const commitManual = async (candidate: FoodCandidate, portion: Portion, meal: MealType) => {
    const task = manualTask;
    if (task?.photo) {
      committedPhotoIds.current.add(task.id);
      const preview = await makePhotoPreview(task.photo.file);
      if (preview) setPhotoStore((store) => withPhoto(store, task.id, preview));
    }
    commitEntry(candidate, portion, meal);
  };

  const confirmAdd = (meal: MealType, portion: Portion) => {
    if (!pendingAdd) return;
    const { candidate } = pendingAdd;
    setPendingAdd(null);
    commitEntry(candidate, portion, meal);
  };

  const updateEntry = (entryId: string, portion: Portion, meal: MealType) => {
    const current = entries.find((entry) => entry.id === entryId);
    setEntries((list) => list.map((entry) => (entry.id === entryId ? (updateEntryPortion(entry, portion, meal) ?? entry) : entry)));
    if (current) showDay(current.dayKey);
    switchRoot('home');
  };

  const removeEntry = (entryId: string) => {
    const current = entries.find((entry) => entry.id === entryId);
    setEntries((list) => list.filter((entry) => entry.id !== entryId));
    if (current) showDay(current.dayKey);
    switchRoot('home');
  };

  // Water is recorded against the day Home shows; Undo is bound to that same day and amount (§12 A7).
  const addWater = (ml: number, source: 'quick' | 'sheet') => {
    const dayKey = selectedDayKey;
    const before = waterMl;
    setWater((w) => ({ ...w, [dayKey]: (w[dayKey] ?? 0) + ml }));
    // Functional update above keeps rapid taps exact; the announcement reads the value they produce.
    setToast({
      message: dayKey === todayKey ? announceWaterAdded(ml, before + ml) : `${formatWater(ml)} added ${dayPhrase(dayKey, todayKey)}. ${formatWater(before + ml)} that day.`,
      undo: source === 'quick' ? () => setWater((w) => ({ ...w, [dayKey]: Math.max(0, (w[dayKey] ?? 0) - ml) })) : undefined,
    });
  };

  const setWaterTotal = (ml: number) => {
    const dayKey = selectedDayKey;
    setWater((w) => ({ ...w, [dayKey]: ml }));
    setToast({ message: dayKey === todayKey ? `Today's water set to ${formatWater(ml)}.` : `Water ${dayPhrase(dayKey, todayKey)} set to ${formatWater(ml)}.` });
  };

  const openRecipe = (recipeId: string, criteriaSource: 'search' | 'browse' | 'home') => {
    push({ kind: 'recipe', recipeId, criteriaSource });
    loadDetails(recipeId);
  };

  /** Photo review → Retake: the photo step below the review starts over at capture. */
  const retakePhoto = () => {
    detailsRequestId.current += 1;
    setFlow((f) => {
      const index = f.map((s) => s.kind).lastIndexOf('photo');
      return index < 0 ? [...f.slice(0, -1), makeStep({ kind: 'photo' })] : [...f.slice(0, index), makeStep({ kind: 'photo' })];
    });
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
            onEnterManually={() => startManual()}
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
            onEnterManually={() => startManual()}
          />
        );
      case 'manual': {
        if (!manualTask) return null;
        const note = manualTask.provenance
          ? `Editing the values ${manualTask.provenance.from === 'barcode' ? `matched from barcode ${manualTask.provenance.barcode ?? ''}`.trim() : 'of the photo suggestion'}. Your edits become your own entry; the original record is unchanged.`
          : undefined;
        return (
          <ManualEntryScreen
            draft={manualTask.details}
            onDraftChange={(details) => updateManual({ details })}
            photo={manualTask.photo}
            onPhotoChange={setManualPhoto}
            initialDraft={manualTask.initialDetails}
            provenanceNote={note}
            candidateId={manualTask.id}
            onContinue={continueManual}
            onCancel={closeTask}
            onBack={manualTask.provenance ? pop : closeTask}
          />
        );
      }
      case 'manual-portion': {
        const carried = carryPortion(step.candidate, manualTask?.portion ?? null);
        const start = startingMeal();
        return (
          <ManualPortionScreen
            candidate={step.candidate}
            photoUrl={manualTask?.photo?.url}
            initialPortion={carried.portion}
            portionResetNote={carried.reset ? 'The reference unit changed, so enter the amount again in the new unit.' : undefined}
            initialMeal={manualTask?.meal ?? start.meal}
            mealHint={start.hint}
            dayPhrase={targetPhrase()}
            onDraftChange={(portion, _unitId, meal) => updateManual({ portion: portion ?? manualTask?.portion ?? null, meal })}
            onEditDetails={pop}
            onAdd={(portion, meal) => void commitManual(step.candidate, portion, meal)}
            onCancel={closeTask}
          />
        );
      }
      case 'review': {
        const start = startingMeal();
        return (
          <FoodReviewScreen
            candidate={step.candidate}
            mode="new"
            initialMeal={start.meal}
            mealHint={start.hint}
            dayPhrase={targetPhrase()}
            capturedImageUrl={step.from === 'photo' ? samplePhotoImage : undefined}
            onAdd={(portion, meal) => commitEntry(step.candidate, portion, meal)}
            onCancel={closeTask}
            onBack={pop}
            onChangeMatch={step.from === 'photo' ? pop : goToFoodSearch}
            onRetake={step.from === 'photo' ? retakePhoto : undefined}
            onEditValues={step.from === 'barcode' || step.from === 'photo' ? () => startManual(step.candidate) : undefined}
          />
        );
      }
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
          entries={dayEntries}
          goal={goal}
          onGoalChange={changeGoal}
          selectedDayKey={selectedDayKey}
          todayKey={todayKey}
          onSelectDay={selectDay}
          streak={streak}
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
          recipeCatalogue={browseRecipes}
          recipeCatalogueStatus={browseStatus}
          criteria={searchCriteria}
          onApplyCriteria={setSearchCriteria}
          onRemoveCriterion={(key: CriterionKey) => setSearchCriteria((c) => removeCriterion(c, key))}
          onOpenFood={(candidate) => openReview(candidate, 'search')}
          onOpenRecipe={(id) => openRecipe(id, 'search')}
          onScanBarcode={() => {
            setTaskOrigin({ root: 'search', flow: [], meal: null, dayKey: selectedDayKey });
            push({ kind: 'barcode' });
          }}
          onRetry={() => {
            setRetryToken((n) => n + 1);
            if (browseStatus === 'failure') setBrowseToken((n) => n + 1);
          }}
          onEnterManually={() => startManual()}
          navigation={navigation('search')}
        />
      </div>

      <div data-screen="recipes" hidden={!rootVisible('recipes')}>
        <RecipesScreen
          recipes={browseRecipes}
          criteria={browseCriteria}
          status={browseStatus}
          onApplyCriteria={setBrowseCriteria}
          onRemoveCriterion={(key) => setBrowseCriteria((c) => removeCriterion(c, key))}
          onClearCriteria={() => setBrowseCriteria({})}
          onToggleDietary={(id) => setBrowseCriteria((c) => toggleDietary(c, id))}
          onRetry={() => setBrowseToken((n) => n + 1)}
          onOpenRecipe={(id) => openRecipe(id, 'browse')}
          onOpenSearch={openRecipeSearch}
          navigation={navigation('recipes')}
        />
      </div>

      {flow.map((step) => (
        <div key={step.id} data-screen={step.kind} hidden={step.id !== top?.id}>
          <ExitGuardScope id={step.id} guards={guards}>
            {renderStep(step)}
          </ExitGuardScope>
        </div>
      ))}

      <MethodSheet open={methodOpen} onRequestClose={() => setMethodOpen(false)} onChoose={chooseMethod} />

      <AddToMealSheet
        open={pendingAdd !== null}
        candidate={pendingAdd?.candidate ?? null}
        initialPortion={pendingAdd?.portion ?? null}
        initialMeal={pendingAdd?.meal ?? null}
        mealHint={pendingAdd?.hint}
        dayPhrase={targetPhrase()}
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
