import { describe, expect, it } from 'vitest';

import {
  commitCandidate,
  convertQuantity,
  describePortionBasis,
  formatQuantityDraft,
  parseAmount,
  parseNonNegative,
  scaleNutrition,
  updatePortion,
  type FoodCandidate,
} from './calculation';

describe('convertQuantity', () => {
  const food = {
    id: 'x',
    name: 'x',
    source: 'search' as const,
    reference: { quantity: 100, unitId: 'g' },
    nutrition: { energyKcal: 180, proteinG: 6, carbohydratesG: 21, fatG: 8 },
    units: [
      { id: 'g', label: 'g', toReference: 1 },
      { id: 'serving', label: 'serving', toReference: 300 },
    ],
  };

  it('keeps the portion when switching between supported units', () => {
    expect(convertQuantity(food, 300, 'g', 'serving')).toBe(1);
    expect(convertQuantity(food, 2, 'serving', 'g')).toBe(600);
    expect(convertQuantity(food, 100, 'g', 'serving')).toBe(0.333);
  });

  it('refuses unsupported units instead of inventing a factor', () => {
    expect(convertQuantity(food, 100, 'g', 'ml')).toBeNull();
    expect(convertQuantity(food, 1, 'piece', 'g')).toBeNull();
  });

  it('formats drafts without trailing zeros', () => {
    expect(formatQuantityDraft(1)).toBe('1');
    expect(formatQuantityDraft(0.333)).toBe('0.333');
    expect(formatQuantityDraft(2.5)).toBe('2.5');
  });
});


/** Fixture C from docs/ux/ui-contract.md: per 100 g — 180 kcal, 6 g protein, 21 g carbohydrates, 8 g fat. */
const fixtureC: FoodCandidate = {
  id: 'c',
  name: 'Vegetable rice bowl',
  source: 'search',
  reference: { quantity: 100, unitId: 'g' },
  nutrition: { energyKcal: 180, proteinG: 6, carbohydratesG: 21, fatG: 8 },
  units: [
    { id: 'g', label: 'g', toReference: 1 },
    { id: 'serving', label: 'serving', description: '1 serving = 300 g', toReference: 300 },
  ],
};

describe('parseAmount', () => {
  it('accepts whole and decimal quantities with either separator', () => {
    expect(parseAmount('250')).toEqual({ ok: true, value: 250 });
    expect(parseAmount('52.5')).toEqual({ ok: true, value: 52.5 });
    expect(parseAmount('52,5')).toEqual({ ok: true, value: 52.5 });
    expect(parseAmount('.5')).toEqual({ ok: true, value: 0.5 });
  });

  it('keeps an in-progress draft distinguishable from an invalid one', () => {
    expect(parseAmount('')).toEqual({ ok: false, reason: 'empty' });
    expect(parseAmount('12.')).toEqual({ ok: true, value: 12 });
  });

  it('rejects zero, negatives and mixed formats without reinterpreting them', () => {
    expect(parseAmount('0')).toEqual({ ok: false, reason: 'not-positive' });
    expect(parseAmount('-5')).toEqual({ ok: false, reason: 'invalid' });
    expect(parseAmount('1,000.5')).toEqual({ ok: false, reason: 'invalid' });
    expect(parseAmount('abc')).toEqual({ ok: false, reason: 'invalid' });
  });

  it('allows a known zero for nutrient values', () => {
    expect(parseNonNegative('0')).toEqual({ ok: true, value: 0 });
  });
});

describe('scaleNutrition', () => {
  it('reproduces fixture C at 250 g and 300 g', () => {
    expect(scaleNutrition(fixtureC, { quantity: 250, unitId: 'g' })).toMatchObject({ energyKcal: 450, proteinG: 15, carbohydratesG: 52.5, fatG: 20 });
    expect(scaleNutrition(fixtureC, { quantity: 300, unitId: 'g' })).toMatchObject({ energyKcal: 540, proteinG: 18, carbohydratesG: 63, fatG: 24 });
  });

  it('converts a supported serving unit through its declared factor', () => {
    expect(scaleNutrition(fixtureC, { quantity: 1, unitId: 'serving' })).toMatchObject({ energyKcal: 540 });
    expect(describePortionBasis(fixtureC, { quantity: 1, unitId: 'serving' })).toBe('For 1 serving (300 g)');
    expect(describePortionBasis(fixtureC, { quantity: 250, unitId: 'g' })).toBe('For 250 g');
  });

  it('refuses unsupported units rather than assuming an equivalence', () => {
    expect(scaleNutrition(fixtureC, { quantity: 250, unitId: 'ml' })).toBeNull();
  });

  it('keeps unknown values unknown and known zeros zero', () => {
    const partial: FoodCandidate = { ...fixtureC, nutrition: { energyKcal: 17, proteinG: 1.4, carbohydratesG: null, fatG: 0 } };
    expect(scaleNutrition(partial, { quantity: 200, unitId: 'g' })).toMatchObject({ energyKcal: 34, proteinG: 2.8, carbohydratesG: null, fatG: 0 });
  });

  it('does not round intermediate results', () => {
    const r = scaleNutrition(fixtureC, { quantity: 33, unitId: 'g' });
    expect(r?.energyKcal).toBeCloseTo(59.4, 10);
  });
});

describe('commit and update', () => {
  it('refuses to commit a candidate without energy data', () => {
    const noEnergy: FoodCandidate = { ...fixtureC, nutrition: { ...fixtureC.nutrition, energyKcal: null } };
    expect(commitCandidate(noEnergy, { quantity: 100, unitId: 'g' }, 1)).toBeNull();
  });

  it('commits once and then updates in place for valid edits only', () => {
    const current = commitCandidate(fixtureC, { quantity: 250, unitId: 'g' }, 1);
    expect(current?.result.energyKcal).toBe(450);
    const edited = updatePortion(current!, { quantity: 300, unitId: 'g' });
    expect(edited.result.energyKcal).toBe(540);
    // An unsupported edit leaves the previous calculation untouched.
    const unchanged = updatePortion(edited, { quantity: 300, unitId: 'cup' });
    expect(unchanged).toBe(edited);
  });
});
