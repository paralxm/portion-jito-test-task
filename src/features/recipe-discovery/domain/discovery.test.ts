import { describe, expect, it } from 'vitest';

import { discoveryCount, discoveryGroups, featuredRecipe, preferenceCount, selectedTime, toggleTime } from './discovery';
import type { Recipe } from './matching';

const base: Recipe = { id: 'a', title: 'A', servingGrams: 300, energyKcal: 400, proteinG: 10, carbohydratesG: 40, fatG: 10, preparationMinutes: 45, dietary: ['vegetarian'], ingredients: [], instructions: [] };
const recipes: Recipe[] = [
  { ...base, id: 'featured', featured: true, imageUrl: 'featured.webp' },
  { ...base, id: 'quick', preparationMinutes: 15, imageUrl: 'quick.webp' },
  { ...base, id: 'protein', proteinG: 38, imageUrl: 'protein.webp', dietary: ['vegan'] },
  { ...base, id: 'unknown', preparationMinutes: null, proteinG: null },
  { ...base, id: 'quick', preparationMinutes: 15 }, // duplicate identity
];

describe('discovery collections', () => {
  it('builds collections from the record only and omits empty ones', () => {
    const groups = discoveryGroups(recipes, {});
    expect(groups.map((g) => [g.id, g.recipes.map((r) => r.id)])).toEqual([
      ['quick', ['quick']],
      ['protein', ['protein']],
    ]);
  });

  it('never places an unknown value in a collection and counts unique recipes', () => {
    const groups = discoveryGroups(recipes, {});
    expect(groups.flatMap((g) => g.recipes.map((r) => r.id))).not.toContain('unknown');
    expect(discoveryCount(recipes, {})).toBe(4);
  });

  it('applies the active preferences to every collection', () => {
    expect(discoveryGroups(recipes, { dietary: ['gluten-free'] })).toEqual([]);
    expect(discoveryCount(recipes, { proteinMin: 30 })).toBe(1);
    expect(discoveryGroups(recipes, { preparationMax: 15 }).map((g) => g.id)).toEqual(['quick']);
  });
});

describe('featured recipe', () => {
  it('is the first flagged recipe with a photograph that satisfies the preferences', () => {
    expect(featuredRecipe(recipes, {})?.id).toBe('featured');
  });

  it('falls back to the first matching photographed recipe when no flagged one matches, and to null when nothing matches', () => {
    expect(featuredRecipe(recipes, { preparationMax: 15 })?.id).toBe('quick');
    expect(featuredRecipe(recipes, { dietary: ['vegan'] })?.id).toBe('protein');
    expect(featuredRecipe(recipes, { dietary: ['gluten-free'] })).toBeNull();
  });
});

describe('quick preferences', () => {
  it('time options are mutually exclusive and toggle off', () => {
    const one = toggleTime({}, 30);
    expect(one.preparationMax).toBe(30);
    expect(toggleTime(one, 15).preparationMax).toBe(15);
    expect(toggleTime(one, 30).preparationMax).toBeUndefined();
    expect(selectedTime({ preparationMax: 45 })).toBeNull();
  });

  it('counts each dietary constraint and the time bound once', () => {
    expect(preferenceCount({})).toBe(0);
    expect(preferenceCount({ dietary: ['vegan', 'gluten-free'], preparationMax: 30 })).toBe(3);
  });
});
