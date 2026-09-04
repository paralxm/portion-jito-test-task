/**
 * Deterministic demo recipes. Fixture R matches docs/ux/ui-contract.md exactly; the
 * others are fictional recipes with synthetic values used to exercise filtering, long
 * titles, missing data and the no-photo treatment. None is nutrition advice.
 *
 * Photographs are local, licensed assets registered in docs/design/hifi-decisions.md §5.
 * The traybake and the long-title pasta deliberately have no photo: they exercise the
 * No photo treatment on cards (S03-1) and details (S08-4).
 */
import { chickenSaladPhoto, lentilSoupPhoto, tofuStirFryPhoto } from '../../../assets/images';
import type { Recipe } from './matching';

/** A neutral, clearly artificial placeholder image (not a photograph), kept for component stories. */
export const placeholderImage =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#e4e8ec"/><circle cx="200" cy="150" r="70" fill="#c2c7cd"/><circle cx="200" cy="150" r="46" fill="#f7f8fa"/></svg>`,
  );

/** Fixture R — Lentil soup, 1 serving = 300 g. Fibre is part of the carbohydrate total. */
export const fixtureR: Recipe = {
  id: 'recipe-lentil-soup',
  title: 'Lentil soup',
  imageUrl: lentilSoupPhoto,
  servingGrams: 300,
  energyKcal: 450,
  proteinG: 24,
  carbohydratesG: 48,
  fatG: 18,
  fibreG: 8,
  vitamins: [
    { id: 'vitamin-c', name: 'Vitamin C', valueMg: 12 },
    { id: 'vitamin-d', name: 'Vitamin D', valueMg: null },
  ],
  minerals: [
    { id: 'calcium', name: 'Calcium', valueMg: 120 },
    { id: 'iron', name: 'Iron', valueMg: 3 },
  ],
  preparationMinutes: 25,
  dietary: null,
  ingredients: ['200 g red lentils', '1 onion, chopped', '2 carrots, diced', '1 tbsp olive oil', '1 tsp ground cumin', '900 ml vegetable stock', 'Salt and pepper'],
  instructions: [
    'Warm the oil in a large pan and soften the onion and carrots for 6–8 minutes.',
    'Stir in the cumin and lentils, then add the stock and bring to a simmer.',
    'Cook for 20 minutes until the lentils are soft, then season to taste and blend if you prefer a smooth soup.',
  ],
};

export const recipeCatalogue: readonly Recipe[] = [
  fixtureR,
  {
    id: 'recipe-traybake',
    title: 'Roasted vegetable and chickpea traybake',
    servingGrams: 350,
    energyKcal: 420,
    proteinG: 14,
    carbohydratesG: 52,
    fatG: 16,
    fibreG: 11,
    preparationMinutes: 40,
    dietary: ['vegan', 'gluten-free', 'dairy-free'],
    ingredients: ['1 can chickpeas', '2 peppers', '1 courgette', '1 red onion', '2 tbsp olive oil', '1 tsp smoked paprika'],
    instructions: ['Heat the oven to 200 °C.', 'Toss everything with the oil and paprika on a tray.', 'Roast for 30–35 minutes, turning once.'],
  },
  {
    id: 'recipe-pasta-long',
    title: 'Wholegrain pasta with roasted vegetables and tahini dressing',
    servingGrams: 400,
    energyKcal: 610,
    proteinG: 19,
    carbohydratesG: 84,
    fatG: 21,
    fibreG: 12,
    preparationMinutes: 35,
    dietary: ['vegetarian'],
    ingredients: ['320 g wholegrain pasta', '1 aubergine', '2 peppers', '3 tbsp tahini', '1 lemon', '1 garlic clove'],
    instructions: ['Roast the vegetables.', 'Cook the pasta.', 'Whisk tahini, lemon and garlic with a little pasta water and toss everything together.'],
  },
  {
    id: 'recipe-chicken-salad',
    title: 'Grilled chicken salad with lemon dressing',
    imageUrl: chickenSaladPhoto,
    servingGrams: 320,
    energyKcal: 380,
    proteinG: 38,
    carbohydratesG: 9,
    fatG: 20,
    fibreG: 3,
    preparationMinutes: 20,
    dietary: ['dairy-free', 'gluten-free'],
    ingredients: ['2 chicken breasts', '150 g mixed leaves', '1 cucumber', '1 lemon', '2 tbsp olive oil'],
    instructions: ['Grill the chicken 5–6 minutes each side.', 'Slice and serve over the leaves with the dressing.'],
  },
  {
    id: 'recipe-tofu',
    title: 'Quick tofu stir-fry',
    imageUrl: tofuStirFryPhoto,
    servingGrams: 300,
    energyKcal: 395,
    proteinG: null,
    carbohydratesG: 30,
    fatG: 20,
    preparationMinutes: 15,
    dietary: ['vegan'],
    ingredients: ['300 g firm tofu', '1 head broccoli', '2 tbsp soy sauce', '1 tbsp sesame oil'],
    instructions: ['Press and cube the tofu.', 'Stir-fry the tofu until golden, add the broccoli and sauce, and cook 4 more minutes.'],
  },
];

export function findRecipe(id: string): Recipe | undefined {
  return recipeCatalogue.find((r) => r.id === id);
}
