import { describe, expect, it } from 'vitest';

import { activeCriteriaCount, describeCriterion, draftFromCriteria, filterRecipes, matchEvidence, matchesCriteria, removeCriterion, searchRecipes, validateDraft, type Recipe } from './matching';

/** Fixture R from docs/ux/ui-contract.md. */
const lentilSoup: Recipe = {
  id: 'r',
  title: 'Lentil soup',
  servingGrams: 300,
  energyKcal: 450,
  proteinG: 24,
  carbohydratesG: 48,
  fatG: 18,
  fibreG: 8,
  preparationMinutes: 25,
  dietary: null,
  ingredients: ['red lentils', 'onion', 'carrot'],
  instructions: ['Simmer', 'Blend'],
};

const tofu: Recipe = {
  ...lentilSoup,
  id: 't',
  title: 'Quick tofu stir-fry',
  energyKcal: 395,
  proteinG: null,
  preparationMinutes: 15,
  dietary: ['vegan'],
  ingredients: ['firm tofu', 'broccoli', 'soy sauce'],
};

describe('validateDraft', () => {
  it('treats blank bounds as no constraint, not zero', () => {
    const result = validateDraft({ caloriesMin: '', caloriesMax: '', proteinMin: '', preparationMax: '', dietary: null });
    expect(result).toEqual({ ok: true, criteria: { caloriesMin: null, caloriesMax: null, proteinMin: null, preparationMax: null, dietary: null } });
  });

  it('rejects a minimum above the maximum with a field-level message', () => {
    const result = validateDraft({ caloriesMin: '600', caloriesMax: '500', proteinMin: '', preparationMax: '', dietary: null });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.caloriesMax).toMatch(/at least the minimum/);
  });

  it('rejects malformed numbers without clearing other fields', () => {
    const result = validateDraft({ caloriesMin: '', caloriesMax: '5oo', proteinMin: '20', preparationMax: '', dietary: null });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors)).toEqual(['caloriesMax']);
  });

  it('round-trips criteria through a draft', () => {
    const draft = draftFromCriteria({ caloriesMax: 500, proteinMin: 20, preparationMax: 30, dietary: 'vegan' });
    expect(draft).toEqual({ caloriesMin: '', caloriesMax: '500', proteinMin: '20', preparationMax: '30', dietary: 'vegan' });
  });
});

describe('matching', () => {
  it('matches fixture R against the illustrative filters with inclusive bounds', () => {
    const criteria = { caloriesMax: 500, proteinMin: 20, preparationMax: 30 };
    expect(matchesCriteria(lentilSoup, criteria)).toBe(true);
    expect(matchesCriteria(lentilSoup, { caloriesMax: 450 })).toBe(true);
    expect(matchesCriteria(lentilSoup, { caloriesMax: 449 })).toBe(false);
    expect(matchesCriteria(lentilSoup, { proteinMin: 24 })).toBe(true);
  });

  it('never lets unknown data satisfy a hard criterion', () => {
    expect(matchesCriteria(tofu, { proteinMin: 10 })).toBe(false);
    expect(matchesCriteria(lentilSoup, { dietary: 'vegetarian' })).toBe(false);
    expect(matchEvidence(tofu, { proteinMin: 10 })[0]).toMatchObject({ met: false, text: expect.stringContaining('not available') });
  });

  it('combines criteria with AND and never relaxes a filter', () => {
    expect(filterRecipes([lentilSoup, tofu], { preparationMax: 30, proteinMin: 20 })).toEqual([lentilSoup]);
    expect(filterRecipes([lentilSoup, tofu], { dietary: 'vegan', caloriesMax: 400 })).toEqual([tofu]);
    expect(filterRecipes([lentilSoup, tofu], { dietary: 'vegan', caloriesMax: 300 })).toEqual([]);
  });

  it('produces evidence only for active criteria', () => {
    expect(matchEvidence(lentilSoup, {})).toEqual([]);
    expect(activeCriteriaCount({ caloriesMax: 500, dietary: null })).toBe(1);
    expect(matchEvidence(lentilSoup, { caloriesMax: 500, preparationMax: 30 }).map((e) => e.id)).toEqual(['calories', 'preparation']);
  });

  it('removes one applied criterion at a time', () => {
    expect(removeCriterion({ caloriesMin: 300, caloriesMax: 500, proteinMin: 20 }, 'calories')).toEqual({ proteinMin: 20 });
    expect(describeCriterion({ caloriesMax: 500 }, 'calories')).toBe('Under 500 kcal');
    expect(describeCriterion({ caloriesMin: 300, caloriesMax: 500 }, 'calories')).toBe('300–500 kcal');
  });

  it('searches titles and ingredients; an empty query browses everything', () => {
    expect(searchRecipes([lentilSoup, tofu], '')).toHaveLength(2);
    expect(searchRecipes([lentilSoup, tofu], 'lentil')).toEqual([lentilSoup]);
    expect(searchRecipes([lentilSoup, tofu], 'carrot')).toEqual([lentilSoup]);
    expect(searchRecipes([lentilSoup, tofu], 'pizza')).toEqual([]);
  });
});
