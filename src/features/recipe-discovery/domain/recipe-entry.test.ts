import { describe, expect, it } from 'vitest';

import { createEntry } from '../../calorie-calculator/domain/daily-log';
import { describePortion, scaleNutrition } from '../../calorie-calculator/domain/calculation';
import { fixtureR } from './fixtures';
import { recipeToCandidate } from './recipe-entry';

describe('recipe as a meal entry', () => {
  const candidate = recipeToCandidate(fixtureR);

  it('uses the recipe serving as the reference basis and supports grams through it', () => {
    expect(candidate.source).toBe('recipe');
    expect(candidate.reference).toEqual({ quantity: 1, unitId: 'serving' });
    expect(scaleNutrition(candidate, { quantity: 1, unitId: 'serving' })).toMatchObject({ energyKcal: 450, proteinG: 24 });
    expect(scaleNutrition(candidate, { quantity: 2, unitId: 'serving' })).toMatchObject({ energyKcal: 900 });
    expect(scaleNutrition(candidate, { quantity: 150, unitId: 'g' })).toMatchObject({ energyKcal: 225 });
  });

  it('describes servings in words with their mass, and never invents a conversion', () => {
    expect(describePortion(candidate, { quantity: 1, unitId: 'serving' })).toBe('1 serving (300 g)');
    expect(describePortion(candidate, { quantity: 2, unitId: 'serving' })).toBe('2 servings (600 g)');
    expect(describePortion(candidate, { quantity: 150, unitId: 'g' })).toBe('150 g (0.5 serving)');
    expect(describePortion(candidate, { quantity: 1, unitId: 'cups' })).toBe('');
  });

  it('becomes an ordinary entry in a meal with the recipe identity kept', () => {
    const entry = createEntry(candidate, { quantity: 2, unitId: 'serving' }, 'dinner', { now: new Date(2026, 8, 5, 19).getTime(), id: 'r' });
    expect(entry?.meal).toBe('dinner');
    expect(entry?.result.energyKcal).toBe(900);
    expect(entry?.candidate.id).toBe('recipe:recipe-lentil-soup');
    expect(entry?.candidate.imageUrl).toBe(fixtureR.imageUrl);
  });
});
