import { describe, expect, it } from 'vitest';

import { fixtureC, foodCatalogue } from './fixtures';
import { createEntry, type FoodEntry } from './daily-log';
import { recentCandidates } from './recents';

const at = (candidate: (typeof foodCatalogue)[number], now: number, id: string): FoodEntry =>
  createEntry(candidate, { quantity: 100, unitId: candidate.reference.unitId }, 'lunch', { now, id }) as FoodEntry;

describe('recentCandidates', () => {
  it('is empty without entries', () => {
    expect(recentCandidates([])).toEqual([]);
  });

  it('orders newest first regardless of array order', () => {
    const entries = [at(fixtureC, 1_000, 'a'), at(foodCatalogue[1], 3_000, 'b'), at(foodCatalogue[2], 2_000, 'c')];
    expect(recentCandidates(entries).map((c) => c.id)).toEqual([foodCatalogue[1].id, foodCatalogue[2].id, fixtureC.id]);
  });

  it('keeps one row per candidate identity and moves a re-added food to the top', () => {
    const entries = [at(fixtureC, 1_000, 'a'), at(foodCatalogue[1], 2_000, 'b'), at(fixtureC, 3_000, 'c')];
    expect(recentCandidates(entries).map((c) => c.id)).toEqual([fixtureC.id, foodCatalogue[1].id]);
  });

  it('honours the limit after deduplication', () => {
    const entries = foodCatalogue.map((c, i) => at(c, i + 1, `e${i}`));
    expect(recentCandidates(entries, 2)).toHaveLength(2);
    expect(recentCandidates(entries, 2)[0].id).toBe(foodCatalogue[foodCatalogue.length - 1].id);
  });
});
