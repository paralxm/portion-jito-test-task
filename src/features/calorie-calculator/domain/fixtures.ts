/**
 * Deterministic demo fixtures for the calorie calculator. These are fictional foods with
 * synthetic values — not database records, not nutrition advice and not derived from any
 * photograph. Fixture C matches docs/ux/ui-contract.md exactly.
 */
import { sampleCapturePhoto } from '../../../assets/images';
import type { FoodCandidate, SupportedUnit } from './calculation';

const GRAMS: SupportedUnit = { id: 'g', label: 'g', toReference: 1 };
const MILLILITRES: SupportedUnit = { id: 'ml', label: 'ml', toReference: 1 };
const serving = (grams: number, unitLabel = 'g'): SupportedUnit => ({
  id: 'serving',
  label: 'serving',
  description: `1 serving = ${grams} ${unitLabel}`,
  toReference: grams,
});

/** Fixture C — per 100 g: 180 kcal, 6 g protein, 21 g carbohydrates, 8 g fat. */
export const fixtureC: FoodCandidate = {
  id: 'food-c',
  name: 'Vegetable rice bowl',
  detail: 'Fixture C',
  source: 'search',
  reference: { quantity: 100, unitId: 'g' },
  nutrition: { energyKcal: 180, proteinG: 6, carbohydratesG: 21, fatG: 8, fibreG: 3.2 },
  units: [GRAMS, serving(300)],
};

/** Search catalogue used by the Food scope. */
export const foodCatalogue: readonly FoodCandidate[] = [
  fixtureC,
  {
    id: 'food-lentil-soup',
    name: 'Lentil soup',
    detail: 'Homemade',
    source: 'search',
    reference: { quantity: 100, unitId: 'g' },
    nutrition: { energyKcal: 150, proteinG: 8, carbohydratesG: 16, fatG: 6, fibreG: 2.7 },
    units: [GRAMS, serving(300)],
  },
  {
    id: 'food-pasta-long',
    name: 'Wholegrain pasta with roasted vegetables and tahini dressing',
    detail: 'Prepared dish',
    source: 'search',
    reference: { quantity: 100, unitId: 'g' },
    nutrition: { energyKcal: 152, proteinG: 5.2, carbohydratesG: 24, fatG: 4.1, fibreG: 4.4 },
    units: [GRAMS],
  },
  {
    id: 'food-yoghurt',
    name: 'Greek yoghurt, plain',
    detail: 'Dairy',
    source: 'search',
    reference: { quantity: 100, unitId: 'g' },
    nutrition: { energyKcal: 97, proteinG: 9, carbohydratesG: 3.6, fatG: 5 },
    units: [GRAMS],
  },
  {
    id: 'food-almond-butter',
    name: 'Almond butter',
    detail: 'Spread',
    source: 'search',
    reference: { quantity: 100, unitId: 'g' },
    nutrition: { energyKcal: 614, proteinG: 21, carbohydratesG: 19, fatG: 56, fibreG: 10.5 },
    units: [GRAMS],
  },
  {
    id: 'food-salad-leaves',
    name: 'Mixed salad leaves',
    detail: 'Fresh · partial nutrition',
    source: 'search',
    reference: { quantity: 100, unitId: 'g' },
    nutrition: { energyKcal: 17, proteinG: 1.4, carbohydratesG: null, fatG: null },
    units: [GRAMS],
  },
  {
    id: 'food-sparkling-water',
    name: 'Sparkling water',
    detail: 'Drink',
    source: 'search',
    reference: { quantity: 100, unitId: 'ml' },
    nutrition: { energyKcal: 0, proteinG: 0, carbohydratesG: 0, fatG: 0 },
    units: [MILLILITRES],
  },
];

/** Barcode lookup fixtures keyed by code. Unknown codes produce "product not found". */
export const barcodeCatalogue: Readonly<Record<string, FoodCandidate>> = {
  '5012345678900': {
    id: 'food-oat-drink',
    name: 'Oat drink, unsweetened',
    detail: 'Scanned',
    source: 'barcode',
    reference: { quantity: 100, unitId: 'ml' },
    nutrition: { energyKcal: 43, proteinG: 1, carbohydratesG: 6.6, fatG: 1.5, fibreG: 0.8 },
    units: [MILLILITRES, serving(250, 'ml')],
  },
};

/** Photo analysis fixtures: suggestions the user must review; none is authoritative. */
export const photoSuggestions: readonly FoodCandidate[] = [
  { ...foodCatalogue[1], id: 'photo-lentil-soup', source: 'photo', detail: 'Suggested from your photo' },
  { ...fixtureC, id: 'photo-rice-bowl', source: 'photo', detail: 'Suggested from your photo' },
  { ...foodCatalogue[2], id: 'photo-pasta', source: 'photo', detail: 'Suggested from your photo' },
];

/** Case-insensitive substring search over the catalogue; the demo search engine. */
export function searchFoods(query: string): FoodCandidate[] {
  const q = query.trim().toLowerCase();
  if (q === '') return [];
  return foodCatalogue.filter((f) => f.name.toLowerCase().includes(q) || (f.detail ?? '').toLowerCase().includes(q));
}

/**
 * The "captured" image used by the photo journey: a licensed sample photograph of a rice
 * bowl (docs/design/hifi-decisions.md §5), labelled in the UI as a sample that is not the
 * user's food and does not measure the portion.
 */
export const samplePhotoImage = sampleCapturePhoto;
