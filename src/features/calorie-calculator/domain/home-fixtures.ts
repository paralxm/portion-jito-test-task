/**
 * Demonstration entries for Home (docs/ux/ui-contract.md §1): two synthetic foods whose
 * displayed energies sum to 1,350 kcal with 90 / 135 / 50 g of protein / carbohydrates /
 * fat — oatmeal at breakfast, the salad at lunch. They demonstrate the composition; they
 * are not nutrition data for real foods.
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

/** The populated Home specimen (S01-2): 300 g oatmeal at breakfast + 350 g salad at lunch, logged today. */
export function homeEntries(now = Date.now()): FoodEntry[] {
  return [
    createEntry(oatmealWithBerries, { quantity: 300, unitId: 'g' }, 'breakfast', { now, id: 'demo-oatmeal' }),
    createEntry(chickenCaesarSalad, { quantity: 350, unitId: 'g' }, 'lunch', { now: now + 1, id: 'demo-caesar' }),
  ].filter((entry): entry is FoodEntry => entry !== null);
}

/** The brief's partial-progress fixture: 400 of 2,000 kcal, 24 / 48 / 14 g against 120 / 220 / 65 g targets. */
export const budgetFixtureFood: FoodCandidate = {
  id: 'home-budget-fixture',
  name: 'Yoghurt bowl with oats',
  detail: 'Entered manually',
  source: 'manual',
  reference: { quantity: 1, unitId: 'serving' },
  nutrition: { energyKcal: 400, proteinG: 24, carbohydratesG: 48, fatG: 14 },
  units: [{ id: 'serving', label: 'serving', toReference: 1 }],
};

export function budgetFixtureEntries(now = Date.now()): FoodEntry[] {
  return [createEntry(budgetFixtureFood, { quantity: 1, unitId: 'serving' }, 'breakfast', { now, id: 'demo-budget' })].filter((e): e is FoodEntry => e !== null);
}

export const budgetFixtureGoal = { kcal: 2000, proteinG: 120, carbohydratesG: 220, fatG: 65 } as const;
