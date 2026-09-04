import { describe, expect, it } from 'vitest';

import type { FoodCandidate } from './calculation';
import { createEntry, entriesForDay, formatKcal, localDayKey, parseGoalDraft, summarizeDay, updateEntryPortion, type FoodEntry } from './daily-log';
import { fixtureC, foodCatalogue } from './fixtures';

const GRAMS = { id: 'g', label: 'g', toReference: 1 };

/** Synthetic per-entry fixtures for the Home aggregate (ui-contract §1): 550 + 800 = 1,350 kcal; 90 / 135 / 50 g. */
const oatmeal: FoodCandidate = {
  id: 'oatmeal',
  name: 'Oatmeal with mixed berries',
  source: 'manual',
  reference: { quantity: 300, unitId: 'g' },
  nutrition: { energyKcal: 550, proteinG: 30, carbohydratesG: 75, fatG: 15 },
  units: [GRAMS],
};
const caesar: FoodCandidate = {
  id: 'caesar',
  name: 'Grilled chicken Caesar salad',
  source: 'manual',
  reference: { quantity: 350, unitId: 'g' },
  nutrition: { energyKcal: 800, proteinG: 60, carbohydratesG: 60, fatG: 35 },
  units: [GRAMS],
};

const day = (...entries: (FoodEntry | null)[]) => entries.filter((e): e is FoodEntry => e !== null);

describe('daily log', () => {
  it('creates an entry as a snapshot with a local day key', () => {
    const entry = createEntry(oatmeal, { quantity: 300, unitId: 'g' }, { now: new Date(2026, 8, 4, 8, 30).getTime(), id: 'e1' });
    expect(entry).not.toBeNull();
    expect(entry?.dayKey).toBe('2026-09-04');
    expect(entry?.result.energyKcal).toBe(550);
  });

  it('refuses to create an entry without a calorie value', () => {
    const noEnergy: FoodCandidate = { ...oatmeal, nutrition: { energyKcal: null, proteinG: null, carbohydratesG: null, fatG: null } };
    expect(createEntry(noEnergy, { quantity: 100, unitId: 'g' })).toBeNull();
    expect(createEntry(oatmeal, { quantity: 0, unitId: 'g' })).toBeNull();
  });

  it('updates a portion in place, keeping id and day', () => {
    const entry = createEntry(oatmeal, { quantity: 300, unitId: 'g' }, { now: new Date(2026, 8, 4).getTime(), id: 'e1' })!;
    const updated = updateEntryPortion(entry, { quantity: 150, unitId: 'g' })!;
    expect(updated.id).toBe('e1');
    expect(updated.dayKey).toBe('2026-09-04');
    expect(updated.result.energyKcal).toBe(275);
    expect(updateEntryPortion(entry, { quantity: 150, unitId: 'cups' })).toBeNull();
  });

  it('selects entries by local day; an earlier day stays associated with its own day', () => {
    const yesterday = createEntry(oatmeal, { quantity: 300, unitId: 'g' }, { now: new Date(2026, 8, 3, 23, 50).getTime(), id: 'y' })!;
    const today = createEntry(caesar, { quantity: 350, unitId: 'g' }, { now: new Date(2026, 8, 4, 0, 10).getTime(), id: 't' })!;
    expect(entriesForDay([yesterday, today], '2026-09-04').map((e) => e.id)).toEqual(['t']);
    expect(localDayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('summarises the populated fixture: 1,350 of 2,200, 850 remaining, 61 %', () => {
    const entries = day(createEntry(oatmeal, { quantity: 300, unitId: 'g' }), createEntry(caesar, { quantity: 350, unitId: 'g' }));
    const summary = summarizeDay(entries, 2200);
    expect(summary.entryCount).toBe(2);
    expect(summary.energy).toEqual({ kcal: 1350, complete: true });
    expect(summary.protein).toEqual({ value: 90, complete: true });
    expect(summary.carbohydrates).toEqual({ value: 135, complete: true });
    expect(summary.fat).toEqual({ value: 50, complete: true });
    expect(summary.state).toBe('below');
    expect(summary.remainingKcal).toBe(850);
    expect(summary.overKcal).toBeNull();
    expect(summary.ratio).toBeCloseTo(0.6136, 3);
  });

  it('summarises the empty fixture: 0 logged, 2,200 remaining, 0 %', () => {
    const summary = summarizeDay([], 2200);
    expect(summary.entryCount).toBe(0);
    expect(summary.energy).toEqual({ kcal: 0, complete: true });
    expect(summary.remainingKcal).toBe(2200);
    expect(summary.ratio).toBe(0);
    expect(summary.state).toBe('below');
    // A recorded total of nothing is 0 g, not unknown (low-fidelity §4.2).
    expect(summary.protein).toEqual({ value: 0, complete: true });
  });

  it('has no ratio and no remainder without a goal, and treats an invalid goal as none', () => {
    const entries = day(createEntry(oatmeal, { quantity: 300, unitId: 'g' }));
    for (const goal of [null, 0, -5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const summary = summarizeDay(entries, goal);
      expect(summary.state).toBe('no-goal');
      expect(summary.goalKcal).toBeNull();
      expect(summary.ratio).toBeNull();
      expect(summary.remainingKcal).toBeNull();
      expect(summary.energy.kcal).toBe(550);
    }
  });

  it('reports reached at exactly the goal and exceeded above it, capping the ratio', () => {
    const entries = day(createEntry(oatmeal, { quantity: 300, unitId: 'g' }), createEntry(caesar, { quantity: 350, unitId: 'g' }));
    const reached = summarizeDay(entries, 1350);
    expect(reached.state).toBe('reached');
    expect(reached.remainingKcal).toBe(0);
    expect(reached.ratio).toBe(1);
    const exceeded = summarizeDay(entries, 1200);
    expect(exceeded.state).toBe('exceeded');
    expect(exceeded.remainingKcal).toBeNull();
    expect(exceeded.overKcal).toBe(150);
    expect(exceeded.ratio).toBe(1);
  });

  it('keeps a valid zero-kcal entry as an entry, and unknown macros unknown', () => {
    const water = createEntry(foodCatalogue[6], { quantity: 330, unitId: 'ml' })!;
    const leaves = createEntry(foodCatalogue[5], { quantity: 100, unitId: 'g' })!;
    const summary = summarizeDay([water, leaves], 2000);
    expect(summary.entryCount).toBe(2);
    expect(summary.energy).toEqual({ kcal: 17, complete: true });
    expect(summary.protein).toEqual({ value: 1.4, complete: true });
    // Carbohydrates: water is a known 0, leaves are unknown → known subtotal 0, not complete.
    expect(summary.carbohydrates).toEqual({ value: 0, complete: false });
    expect(summary.fat).toEqual({ value: 0, complete: false });
  });

  it('marks the total incomplete when an entry has no energy value', () => {
    const base = createEntry(fixtureC, { quantity: 100, unitId: 'g' })!;
    const unknownEnergy: FoodEntry = { ...base, id: 'u', result: { ...base.result, energyKcal: null } };
    const summary = summarizeDay([base, unknownEnergy], 2200);
    expect(summary.state).toBe('incomplete');
    expect(summary.energy).toEqual({ kcal: 180, complete: false });
    expect(summary.ratio).toBeNull();
    expect(summary.remainingKcal).toBeNull();
  });

  it('parses goal drafts with the shared decimal policy', () => {
    expect(parseGoalDraft('2200')).toEqual({ ok: true, kcal: 2200 });
    expect(parseGoalDraft('  1,800 ')).toEqual({ ok: true, kcal: 1.8 });
    expect(parseGoalDraft('')).toEqual({ ok: false, reason: 'empty' });
    expect(parseGoalDraft('abc')).toEqual({ ok: false, reason: 'invalid' });
    expect(parseGoalDraft('0')).toEqual({ ok: false, reason: 'not-positive' });
  });

  it('formats daily figures as whole grouped kilocalories', () => {
    expect(formatKcal(1350)).toBe('1,350');
    expect(formatKcal(849.6)).toBe('850');
    expect(formatKcal(0)).toBe('0');
  });
});
