import { describe, expect, it } from 'vitest';

import type { FoodCandidate } from './calculation';
import { activeFoodFilterCount, collectFoods, describeCatalogueBasis, describeFoodFilter, foodCountText, NO_FOOD_FILTERS } from './food-search';
import { foodCatalogue } from './fixtures';

const item = (id: string, name: string, category?: 'food' | 'drink', detail = ''): FoodCandidate => ({
  id,
  name,
  detail,
  category,
  source: 'search',
  reference: { quantity: 100, unitId: category === 'drink' ? 'ml' : 'g' },
  nutrition: { energyKcal: 100, proteinG: 1, carbohydratesG: 1, fatG: 1 },
  units: [{ id: category === 'drink' ? 'ml' : 'g', label: category === 'drink' ? 'ml' : 'g', toReference: 1 }],
});

const catalogue = [item('a', 'Apple'), item('b', 'Banana'), item('w', 'Sparkling water', 'drink'), item('o', 'Orange juice', 'drink', 'Drink')];

describe('collectFoods', () => {
  it('browses the whole catalogue without a query or history', () => {
    const c = collectFoods({ query: '', recents: [], catalogue, filters: NO_FOOD_FILTERS });
    expect(c.mode).toBe('browse');
    expect(c.recents).toEqual([]);
    expect(c.explore.map((x) => x.id)).toEqual(['a', 'b', 'w', 'o']);
    expect(c.count).toBe(4);
  });

  it('puts recents above the remaining catalogue without duplicating them', () => {
    const c = collectFoods({ query: '', recents: [catalogue[1]], catalogue, filters: NO_FOOD_FILTERS });
    expect(c.recents.map((x) => x.id)).toEqual(['b']);
    expect(c.explore.map((x) => x.id)).toEqual(['a', 'w', 'o']);
    expect(c.count).toBe(4);
  });

  it('applies the category filter in browse mode', () => {
    const c = collectFoods({ query: '', recents: [catalogue[1]], catalogue, filters: { category: 'drink' } });
    expect(c.recents).toEqual([]);
    expect(c.explore.map((x) => x.id)).toEqual(['w', 'o']);
  });

  it('unifies recents and catalogue into one result set for a query', () => {
    const manual = item('m', 'Banana bread');
    const c = collectFoods({ query: 'ban', recents: [manual, catalogue[1]], catalogue, filters: NO_FOOD_FILTERS });
    expect(c.mode).toBe('results');
    expect(c.results.map((x) => x.id)).toEqual(['m', 'b']);
    expect(c.count).toBe(2);
  });

  it('matches the detail line and combines the query with the filter', () => {
    const c = collectFoods({ query: 'drink', recents: [], catalogue, filters: { category: 'food' } });
    expect(c.results).toEqual([]);
    const d = collectFoods({ query: 'drink', recents: [], catalogue, filters: { category: 'drink' } });
    expect(d.results.map((x) => x.id)).toEqual(['o']);
  });
});

describe('describeCatalogueBasis', () => {
  it('states the serving weight for per-serving dishes and the reference amount otherwise', () => {
    expect(describeCatalogueBasis(foodCatalogue[7])).toBe('per serving (320 g)');
    expect(describeCatalogueBasis(foodCatalogue[0])).toBe('per 100 g');
    expect(describeCatalogueBasis(foodCatalogue[6])).toBe('per 100 ml');
  });
});

describe('count wording', () => {
  it('names items, foods or drinks with singular and plural', () => {
    expect(foodCountText(15, NO_FOOD_FILTERS, 'browse')).toBe('15 items');
    expect(foodCountText(1, NO_FOOD_FILTERS, 'browse')).toBe('1 item');
    expect(foodCountText(12, { category: 'food' }, 'browse')).toBe('12 foods');
    expect(foodCountText(1, { category: 'drink' }, 'results')).toBe('1 drink found');
    expect(foodCountText(3, NO_FOOD_FILTERS, 'results')).toBe('3 items found');
  });

  it('describes the applied filter', () => {
    expect(describeFoodFilter(NO_FOOD_FILTERS)).toBeNull();
    expect(activeFoodFilterCount(NO_FOOD_FILTERS)).toBe(0);
    expect(describeFoodFilter({ category: 'drink' })).toBe('Drinks only');
    expect(activeFoodFilterCount({ category: 'food' })).toBe(1);
  });
});
