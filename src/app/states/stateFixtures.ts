/**
 * Deterministic fixtures for the mapped product-state stories (docs/design/hifi-decisions.md
 * §1 and §10.3). Every date-dependent value derives from one fixed baseline so captures
 * never drift with the host clock; the runtime keeps the real clock.
 */
import type { FoodCandidate } from '../../features/calorie-calculator/domain/calculation';
import { createEntry, type DailyGoal, type FoodEntry } from '../../features/calorie-calculator/domain/daily-log';
import { recentCandidates } from '../../features/calorie-calculator/domain/recents';
import { fixtureC, foodCatalogue, photoSuggestions } from '../../features/calorie-calculator/domain/fixtures';
import { budgetFixtureEntries, budgetFixtureGoal, homeEntries } from '../../features/calorie-calculator/domain/home-fixtures';
import { localDayKey } from '../../features/calorie-calculator/domain/day-keys';
import type { ManualDraft } from '../../features/calorie-calculator/domain/manual-entry';
import type { Streak } from '../../features/calorie-calculator/domain/streak';
import { fixtureR, recipeCatalogue } from '../../features/recipe-discovery/domain/fixtures';
import type { Recipe, RecipeCriteria } from '../../features/recipe-discovery/domain/matching';
import { recipeToCandidate } from '../../features/recipe-discovery/domain/recipe-entry';

/** The one baseline instant for stories, visual fixtures and date-dependent test data. */
export const FIXED_NOW_ISO = '2026-09-04T12:00:00Z';
export const FIXED_NOW = Date.parse(FIXED_NOW_ISO);
/** The header's date line and the meal suggestion read this instant instead of the clock. */
export const FIXED_DATE = new Date(FIXED_NOW);
/** The baseline's local day key: what Home calls "today" in every product-state story. */
export const TODAY_KEY = localDayKey(FIXED_DATE);
/** No streak: the launch state. */
export const NO_STREAK: Streak = { days: 0, todayLogged: false };

/** S01-2: the ui-contract §1 populated Home (1,350 of 2,200 kcal), logged at the baseline. */
export const populatedEntries = homeEntries(FIXED_NOW);
export const GOAL_KCAL = 2200;
export const goal2200: DailyGoal = { kcal: GOAL_KCAL };

/** The brief's partial-progress fixture: 1,600 remaining, 400 consumed · 20 %, goal 2,000, 24 / 120 · 48 / 220 · 14 / 65 g. */
export const budgetEntries = budgetFixtureEntries(FIXED_NOW);
export const budgetGoal: DailyGoal = budgetFixtureGoal;

/** Water fixtures (ledger D-22): the partial total the brief shows, and the reference. */
export const WATER_PARTIAL_ML = 1250;
export const WATER_GOAL_ML = 2000;

/** S03-2 / S02-5: three applied criteria that leave one match in the catalogue. */
export const filteredCriteria: RecipeCriteria = { dietary: ['vegan'], caloriesMax: 500, proteinMin: 10 };
/** S02-6: a query that matches but criteria that nothing satisfies. */
export const impossibleCriteria: RecipeCriteria = { caloriesMax: 200 };
/** S08-1: criteria fixture R satisfies (two met). */
export const detailsCriteria: RecipeCriteria = { caloriesMax: 500, proteinMin: 20 };

/** Fixture C at the contract's 300 g example (540 kcal, 18 / 63 / 24 g). */
export const reviewPortion = { quantity: 300, unitId: 'g' } as const;
export const fixtureCandidate = fixtureC;

/** O05-2: fixture R as a meal candidate (1 serving = 300 g). */
export const recipeCandidate = recipeToCandidate(fixtureR);
export const servingPortion = { quantity: 1, unitId: 'serving' } as const;

/** S07-5: a photo suggestion with partial nutrition, so unknown macros are visible. */
export const photoPartialSuggestion: FoodCandidate = {
  ...foodCatalogue[5],
  id: 'photo-salad-leaves',
  source: 'photo',
  detail: 'Suggested from your photo · partial nutrition',
};
export const photoCandidates = photoSuggestions;

/** S07-6: a manual candidate on a serving basis with an unknown carbohydrate value. */
export const manualCandidate: FoodCandidate = {
  id: 'manual-lentil-soup',
  name: 'Lentil soup',
  detail: 'Entered manually',
  source: 'manual',
  reference: { quantity: 1, unitId: 'serving' },
  nutrition: { energyKcal: 450, proteinG: 24, carbohydratesG: null, fatG: 18 },
  units: [{ id: 'serving', label: 'serving', toReference: 1 }],
};

/** S06-2 / O03: a filled manual draft; S06-3: the same draft with an invalid reference amount. */
export const filledDraft: ManualDraft = { name: 'Lentil soup', referenceQuantity: '300', referenceUnit: 'g', calories: '450', protein: '24', carbohydrates: '', fat: '18' };
export const invalidDraft: ManualDraft = { ...filledDraft, referenceQuantity: 'abc', calories: '' };

/** S08-4: the long-title recipe without a photo and with an unknown protein value (story fixture; the catalogue recipe has a photo, ledger D-28). */
export const longTitleNoPhotoPartial: Recipe = { ...recipeCatalogue[2], imageUrl: undefined, proteinG: null };

export const BARCODE = { found: '5012345678900', unknown: '4009999999990', failing: '0000000000000' } as const;

/**
 * S02-8: confirmed entries that yield "Recently added" — the banana logged yesterday, the
 * yoghurt this morning and the oatmeal just now (newest first: oatmeal, yoghurt, banana).
 * Derived through the same function the app uses, so the fixture demonstrates the rule.
 */
export const recentEntries: FoodEntry[] = [
  createEntry(foodCatalogue[9], { quantity: 120, unitId: 'g' }, 'snack', { now: FIXED_NOW - 26 * 60 * 60 * 1000, id: 'recent-banana' }),
  createEntry(foodCatalogue[3], { quantity: 150, unitId: 'g' }, 'breakfast', { now: FIXED_NOW - 4 * 60 * 60 * 1000, id: 'recent-yoghurt' }),
  createEntry(foodCatalogue[8], { quantity: 1, unitId: 'serving' }, 'breakfast', { now: FIXED_NOW - 60 * 1000, id: 'recent-oatmeal' }),
].filter((entry): entry is FoodEntry => entry !== null);
export const recentFoods: FoodCandidate[] = recentCandidates(recentEntries);
