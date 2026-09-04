/**
 * Deterministic fixtures for the 41 mapped product-state stories (docs/design/hifi-decisions.md §1).
 * Every date-dependent value derives from one fixed baseline so captures never drift with
 * the host clock; the runtime keeps the real clock.
 */
import type { FoodCandidate } from '../../features/calorie-calculator/domain/calculation';
import { fixtureC, foodCatalogue, photoSuggestions } from '../../features/calorie-calculator/domain/fixtures';
import { homeEntries } from '../../features/calorie-calculator/domain/home-fixtures';
import type { ManualDraft } from '../../features/calorie-calculator/domain/manual-entry';
import { recipeCatalogue } from '../../features/recipe-discovery/domain/fixtures';
import type { Recipe, RecipeCriteria } from '../../features/recipe-discovery/domain/matching';

/** The one baseline instant for stories, visual fixtures and date-dependent test data. */
export const FIXED_NOW_ISO = '2026-09-04T12:00:00Z';
export const FIXED_NOW = Date.parse(FIXED_NOW_ISO);

/** S01-2: the ui-contract §1 populated Home (1,350 of 2,200 kcal), logged at the baseline. */
export const populatedEntries = homeEntries(FIXED_NOW);
export const GOAL_KCAL = 2200;

/** S03-2 / S02-5: three applied criteria that leave one match in the catalogue. */
export const filteredCriteria: RecipeCriteria = { dietary: 'vegan', caloriesMax: 500, proteinMin: 10 };
/** S02-6: a query that matches but criteria that nothing satisfies. */
export const impossibleCriteria: RecipeCriteria = { caloriesMax: 200 };
/** S08-1: criteria fixture R satisfies (two met). */
export const detailsCriteria: RecipeCriteria = { caloriesMax: 500, proteinMin: 20 };

/** Fixture C at the contract's 300 g example (540 kcal, 18 / 63 / 24 g). */
export const reviewPortion = { quantity: 300, unitId: 'g' } as const;
export const fixtureCandidate = fixtureC;

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

/** S08-4: the long-title recipe without a photo and with an unknown protein value. */
export const longTitleNoPhotoPartial: Recipe = { ...recipeCatalogue[2], proteinG: null };

export const BARCODE = { found: '5012345678900', unknown: '4009999999990', failing: '0000000000000' } as const;
