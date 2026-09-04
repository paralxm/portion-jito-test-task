/**
 * Demonstration entries for Home (docs/ux/ui-contract.md §1): two synthetic foods whose
 * displayed energies sum to 1,350 kcal with 90 / 135 / 50 g of protein / carbohydrates /
 * fat. They demonstrate the composition; they are not nutrition data for real foods.
 */
import type { FoodCandidate } from './calculation';
import { createEntry, type FoodEntry } from './daily-log';

const GRAMS = { id: 'g', label: 'g', toReference: 1 };

export const oatmealWithBerries: FoodCandidate = {
  id: 'home-oatmeal',
  name: 'Oatmeal with mixed berries',
  detail: 'Entered manually',
  source: 'manual',
  reference: { quantity: 300, unitId: 'g' },
  nutrition: { energyKcal: 550, proteinG: 30, carbohydratesG: 75, fatG: 15 },
  units: [GRAMS],
};

export const chickenCaesarSalad: FoodCandidate = {
  id: 'home-caesar',
  name: 'Grilled chicken Caesar salad',
  detail: 'Entered manually',
  source: 'manual',
  reference: { quantity: 350, unitId: 'g' },
  nutrition: { energyKcal: 800, proteinG: 60, carbohydratesG: 60, fatG: 35 },
  units: [GRAMS],
};

/** The populated Home specimen (S01-2): 300 g oatmeal + 350 g salad, logged today. */
export function homeEntries(now = Date.now()): FoodEntry[] {
  return [
    createEntry(oatmealWithBerries, { quantity: 300, unitId: 'g' }, { now, id: 'demo-oatmeal' }),
    createEntry(chickenCaesarSalad, { quantity: 350, unitId: 'g' }, { now: now + 1, id: 'demo-caesar' }),
  ].filter((entry): entry is FoodEntry => entry !== null);
}
