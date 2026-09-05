import { describe, expect, it } from 'vitest';

import { discoveryCount, discoveryGroups } from './discovery';
import type { Recipe } from './matching';

const base: Recipe = { id: 'a', title: 'A', servingGrams: 300, energyKcal: 400, proteinG: 10, carbohydratesG: 40, fatG: 10, preparationMinutes: 45, dietary: ['vegetarian'], ingredients: [], instructions: [] };
const recipes: Recipe[] = [
  { ...base, id: 'featured', featured: true },
  { ...base, id: 'quick', preparationMinutes: 15 },
  { ...base, id: 'protein', proteinG: 38 },
  { ...base, id: 'unknown', preparationMinutes: null, proteinG: null },
  { ...base, id: 'quick', preparationMinutes: 15 }, // duplicate identity
];

describe('discovery groups', () => {
  it('builds groups from the record only and omits empty groups', () => {
    const groups = discoveryGroups(recipes, {});
    expect(groups.map((g) => [g.id, g.recipes.map((r) => r.id)])).toEqual([
      ['featured', ['featured']],
      ['quick', ['quick']],
      ['protein', ['protein']],
    ]);
  });

  it('never places an unknown value in a group and counts unique recipes', () => {
    const groups = discoveryGroups(recipes, {});
    expect(groups.flatMap((g) => g.recipes.map((r) => r.id))).not.toContain('unknown');
    expect(discoveryCount(recipes, {})).toBe(4);
  });

  it('applies the active criteria to every group', () => {
    const groups = discoveryGroups(recipes, { dietary: ['vegan'] });
    expect(groups).toEqual([]);
    expect(discoveryCount(recipes, { proteinMin: 30 })).toBe(1);
    expect(discoveryGroups(recipes, { proteinMin: 30 }).map((g) => g.id)).toEqual(['protein']);
  });
});
