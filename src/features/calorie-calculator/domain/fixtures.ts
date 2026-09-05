/**
 * Deterministic demo fixtures for the calorie calculator. These are fictional foods with
 * synthetic values — not database records, not nutrition advice and not derived from any
 * photograph. Fixture C matches docs/ux/ui-contract.md exactly.
 *
 * The catalogue (ledger §11.1) holds 12 foods or dishes and 3 drinks, each with a
 * registered local photograph (docs/design/hifi-decisions.md §5), a name, calories with
 * an explicit basis and one detail line. Drinks carry volume units and never touch the
 * water tracker. Positions 0–6 are stable: stories and tests address them by index.
 */
import {
  almondButterPhoto,
  avocadoToastPhoto,
  bananaPhoto,
  chickenSaladPhoto,
  greekYoghurtPhoto,
  hummusPhoto,
  lentilSoupPhoto,
  oatDrinkPhoto,
  oatmealPhoto,
  orangeJuicePhoto,
  pastaRoastedVegetablesPhoto,
  saladLeavesPhoto,
  sampleCapturePhoto,
  scrambledEggsPhoto,
  sparklingWaterPhoto,
} from '../../../assets/images';
import type { FoodCandidate, SupportedUnit } from './calculation';

const GRAMS: SupportedUnit = { id: 'g', label: 'g', toReference: 1 };
const MILLILITRES: SupportedUnit = { id: 'ml', label: 'ml', toReference: 1 };
const serving = (grams: number, unitLabel = 'g'): SupportedUnit => ({
  id: 'serving',
  label: 'serving',
  description: `1 serving = ${grams} ${unitLabel}`,
  toReference: grams,
});
/** Units for a dish whose nutrition is stated per serving: servings first, grams derived from the serving weight. */
const perServing = (grams: number): SupportedUnit[] => [
  { id: 'serving', label: 'serving', description: `1 serving = ${grams} g`, toReference: 1 },
  { id: 'g', label: 'g', toReference: 1 / grams },
];

/** Fixture C — per 100 g: 180 kcal, 6 g protein, 21 g carbohydrates, 8 g fat. */
export const fixtureC: FoodCandidate = {
  id: 'food-c',
  name: 'Vegetable rice bowl',
  detail: 'Prepared dish',
  source: 'search',
  category: 'food',
  imageUrl: sampleCapturePhoto,
  reference: { quantity: 100, unitId: 'g' },
  nutrition: { energyKcal: 180, proteinG: 6, carbohydratesG: 21, fatG: 8, fibreG: 3.2 },
  units: [GRAMS, serving(300)],
};

/** The oat drink the sample barcode resolves to; also browsable as a catalogue drink under the same identity. */
const oatDrink: FoodCandidate = {
  id: 'food-oat-drink',
  name: 'Oat drink, unsweetened',
  detail: 'Drink',
  source: 'search',
  category: 'drink',
  imageUrl: oatDrinkPhoto,
  reference: { quantity: 100, unitId: 'ml' },
  nutrition: { energyKcal: 43, proteinG: 1, carbohydratesG: 6.6, fatG: 1.5, fibreG: 0.8 },
  units: [MILLILITRES, serving(250, 'ml')],
};

/** Search catalogue used by the Food scope: 12 foods or dishes, then 3 drinks interleaved by position 6. */
export const foodCatalogue: readonly FoodCandidate[] = [
  fixtureC,
  {
    id: 'food-lentil-soup',
    name: 'Lentil soup',
    detail: 'Homemade',
    source: 'search',
    category: 'food',
    imageUrl: lentilSoupPhoto,
    reference: { quantity: 100, unitId: 'g' },
    nutrition: { energyKcal: 150, proteinG: 8, carbohydratesG: 16, fatG: 6, fibreG: 2.7 },
    units: [GRAMS, serving(300)],
  },
  {
    id: 'food-pasta-long',
    name: 'Wholegrain pasta with roasted vegetables and tahini dressing',
    detail: 'Prepared dish',
    source: 'search',
    category: 'food',
    imageUrl: pastaRoastedVegetablesPhoto,
    reference: { quantity: 100, unitId: 'g' },
    nutrition: { energyKcal: 152, proteinG: 5.2, carbohydratesG: 24, fatG: 4.1, fibreG: 4.4 },
    units: [GRAMS, serving(400)],
  },
  {
    id: 'food-yoghurt',
    name: 'Greek yoghurt, plain',
    detail: 'Dairy',
    source: 'search',
    category: 'food',
    imageUrl: greekYoghurtPhoto,
    reference: { quantity: 100, unitId: 'g' },
    nutrition: { energyKcal: 97, proteinG: 9, carbohydratesG: 3.6, fatG: 5 },
    units: [GRAMS, serving(150)],
  },
  {
    id: 'food-almond-butter',
    name: 'Almond butter',
    detail: 'Spread',
    source: 'search',
    category: 'food',
    imageUrl: almondButterPhoto,
    reference: { quantity: 100, unitId: 'g' },
    nutrition: { energyKcal: 614, proteinG: 21, carbohydratesG: 19, fatG: 56, fibreG: 10.5 },
    units: [GRAMS],
  },
  {
    id: 'food-salad-leaves',
    name: 'Mixed salad leaves',
    detail: 'Fresh · partial nutrition',
    source: 'search',
    category: 'food',
    imageUrl: saladLeavesPhoto,
    reference: { quantity: 100, unitId: 'g' },
    nutrition: { energyKcal: 17, proteinG: 1.4, carbohydratesG: null, fatG: null },
    units: [GRAMS],
  },
  {
    id: 'food-sparkling-water',
    name: 'Sparkling water',
    detail: 'Drink',
    source: 'search',
    category: 'drink',
    imageUrl: sparklingWaterPhoto,
    reference: { quantity: 100, unitId: 'ml' },
    nutrition: { energyKcal: 0, proteinG: 0, carbohydratesG: 0, fatG: 0 },
    units: [MILLILITRES, serving(330, 'ml')],
  },
  {
    id: 'food-chicken-salad',
    name: 'Grilled chicken salad with lemon dressing',
    detail: 'Dish',
    source: 'search',
    category: 'food',
    imageUrl: chickenSaladPhoto,
    reference: { quantity: 1, unitId: 'serving' },
    nutrition: { energyKcal: 380, proteinG: 38, carbohydratesG: 12, fatG: 18, fibreG: 3.5 },
    units: perServing(320),
  },
  {
    id: 'food-oatmeal',
    name: 'Oatmeal with blueberries and banana',
    detail: 'Breakfast',
    source: 'search',
    category: 'food',
    imageUrl: oatmealPhoto,
    reference: { quantity: 1, unitId: 'serving' },
    nutrition: { energyKcal: 420, proteinG: 12, carbohydratesG: 68, fatG: 11, fibreG: 7 },
    units: perServing(350),
  },
  {
    id: 'food-banana',
    name: 'Banana',
    detail: 'Fruit',
    source: 'search',
    category: 'food',
    imageUrl: bananaPhoto,
    reference: { quantity: 100, unitId: 'g' },
    nutrition: { energyKcal: 89, proteinG: 1.1, carbohydratesG: 23, fatG: 0.3, fibreG: 2.6 },
    units: [GRAMS, serving(120)],
  },
  {
    id: 'food-avocado-toast',
    name: 'Avocado toast',
    detail: 'Wholegrain bread',
    source: 'search',
    category: 'food',
    imageUrl: avocadoToastPhoto,
    reference: { quantity: 1, unitId: 'serving' },
    nutrition: { energyKcal: 290, proteinG: 8, carbohydratesG: 28, fatG: 17, fibreG: 6.5 },
    units: perServing(150),
  },
  {
    id: 'food-hummus',
    name: 'Hummus',
    detail: 'Dip',
    source: 'search',
    category: 'food',
    imageUrl: hummusPhoto,
    reference: { quantity: 100, unitId: 'g' },
    nutrition: { energyKcal: 166, proteinG: 8, carbohydratesG: 14, fatG: 10, fibreG: 6 },
    units: [GRAMS, serving(60)],
  },
  {
    id: 'food-scrambled-eggs',
    name: 'Scrambled eggs on toast',
    detail: 'Dish',
    source: 'search',
    category: 'food',
    imageUrl: scrambledEggsPhoto,
    reference: { quantity: 1, unitId: 'serving' },
    nutrition: { energyKcal: 360, proteinG: 20, carbohydratesG: 24, fatG: 20, fibreG: 2 },
    units: perServing(200),
  },
  {
    id: 'food-orange-juice',
    name: 'Orange juice',
    detail: 'Drink',
    source: 'search',
    category: 'drink',
    imageUrl: orangeJuicePhoto,
    reference: { quantity: 100, unitId: 'ml' },
    nutrition: { energyKcal: 45, proteinG: 0.7, carbohydratesG: 10, fatG: 0.2, fibreG: 0.2 },
    units: [MILLILITRES, serving(250, 'ml')],
  },
  oatDrink,
];

/** Barcode lookup fixtures keyed by code. Unknown codes produce "product not found". */
export const barcodeCatalogue: Readonly<Record<string, FoodCandidate>> = {
  '5012345678900': { ...oatDrink, source: 'barcode', detail: 'Scanned' },
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

/** The catalogue item with this identity, if any (barcode and photo candidates share catalogue identities where they exist). */
export function findCatalogueFood(id: string): FoodCandidate | undefined {
  return foodCatalogue.find((f) => f.id === id) ?? Object.values(barcodeCatalogue).find((f) => f.id === id) ?? photoSuggestions.find((f) => f.id === id);
}

/**
 * The "captured" image used by the photo journey: a licensed sample photograph of a rice
 * bowl (docs/design/hifi-decisions.md §5), labelled in the UI as a sample that is not the
 * user's food and does not measure the portion.
 */
export const samplePhotoImage = sampleCapturePhoto;
