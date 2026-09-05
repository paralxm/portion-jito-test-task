import { describe, expect, it } from 'vitest';

import { createEntry, type FoodEntry } from '../features/calorie-calculator/domain/daily-log';
import { fixtureC } from '../features/calorie-calculator/domain/fixtures';
import { goalForDay } from '../features/calorie-calculator/domain/goal-history';
import { EMPTY_RECORD, loadRecord, parseRecord, RECORD_KEY, saveRecord, serialiseRecord, type RecordStorage } from './persistence';

const fakeStorage = (): RecordStorage & { map: Map<string, string> } => {
  const map = new Map<string, string>();
  return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v) };
};

const entry = createEntry({ ...fixtureC, imageUrl: '/assets/rice-abc123.webp' }, { quantity: 300, unitId: 'g' }, 'lunch', { now: Date.parse('2026-09-04T12:00:00'), id: 'e1' }) as FoodEntry;

describe('persistence', () => {
  it('round-trips entries, the goal history, water and the view', () => {
    const storage = fakeStorage();
    const goals = [{ from: '2026-09-01', goal: { kcal: 2000, proteinG: 120, carbohydratesG: null, fatG: null } }];
    saveRecord(storage, { version: 2, entries: [entry], goals, water: { '2026-09-04': 750 }, waterReferenceMl: 2500, searchView: 'grid', recipeView: 'grid' });
    const loaded = loadRecord(storage, (id) => (id === fixtureC.id ? '/assets/rice-new456.webp' : undefined));
    expect(loaded.entries).toHaveLength(1);
    expect(loaded.entries[0].id).toBe('e1');
    expect(loaded.entries[0].dayKey).toBe('2026-09-04');
    expect(loaded.entries[0].meal).toBe('lunch');
    expect(loaded.entries[0].result.energyKcal).toBe(540);
    expect(loaded.goals).toEqual(goals);
    expect(loaded.water).toEqual({ '2026-09-04': 750 });
    expect(loaded.searchView).toBe('grid');
    expect(loaded.recipeView).toBe('grid');
    expect(loaded.waterReferenceMl).toBe(2500);
  });

  it('keeps the provenance and estimate, defaults an older goal to no provenance, and drops a partial estimate', () => {
    const estimate = { method: 'nasem-2023-eer', age: 34, sex: 'female', heightCm: 168, weightKg: 62, activity: 'low-active', goal: 'lose', eerKcal: 2050, adjustmentKcal: -500 };
    const goals = [{ from: '2026-09-01', goal: { kcal: 1550, proteinG: 116, carbohydratesG: 174, fatG: 43, source: 'estimated', preset: 'higher-protein', estimate } }];
    const loaded = parseRecord(JSON.stringify({ version: 2, entries: [], goals }));
    expect(loaded.goals[0].goal).toEqual(goals[0].goal);
    const legacy = parseRecord(JSON.stringify({ version: 2, entries: [], goals: [{ from: '2026-09-01', goal: { kcal: 2000 } }] })).goals[0].goal;
    expect(legacy?.source).toBeUndefined();
    const partial = parseRecord(JSON.stringify({ version: 2, entries: [], goals: [{ from: '2026-09-01', goal: { kcal: 2000, source: 'estimated', preset: 'nonsense', estimate: { method: 'nasem-2023-eer', age: 34 } } }] })).goals[0].goal;
    expect(partial?.estimate).toBeUndefined();
    expect(partial?.preset).toBeUndefined();
    expect(partial?.source).toBe('estimated');
  });

  it('falls back to the default water reference outside the supported range', () => {
    expect(parseRecord(JSON.stringify({ version: 2, entries: [], waterReferenceMl: 100 })).waterReferenceMl).toBe(2000);
    expect(parseRecord(JSON.stringify({ version: 2, entries: [], waterReferenceMl: 3000 })).waterReferenceMl).toBe(3000);
    expect(parseRecord(JSON.stringify({ version: 1, entries: [] })).recipeView).toBe('list');
  });

  it('migrates a version-1 record: entries and water kept, the single goal becomes a period from the migration day', () => {
    const text = JSON.stringify({ version: 1, entries: [entry, { ...entry, id: 'y', dayKey: '2026-09-03' }], goal: { kcal: 2000, proteinG: 120 }, water: { '2026-09-03': 500, '2026-09-04': 750 }, searchView: 'grid' });
    const loaded = parseRecord(text, { migrationDayKey: '2026-09-05' });
    expect(loaded.version).toBe(2);
    expect(loaded.entries.map((e) => e.id)).toEqual(['e1', 'y']);
    expect(loaded.water).toEqual({ '2026-09-03': 500, '2026-09-04': 750 });
    expect(loaded.goals).toEqual([{ from: '2026-09-05', goal: { kcal: 2000, proteinG: 120, carbohydratesG: null, fatG: null } }]);
    // Earlier days never receive a goal that was not in force for them.
    expect(goalForDay(loaded.goals, '2026-09-04')).toBeNull();
    expect(goalForDay(loaded.goals, '2026-09-05')?.kcal).toBe(2000);
    expect(parseRecord(JSON.stringify({ version: 1, entries: [] })).goals).toEqual([]);
  });

  it('does not store the built photo URL and re-resolves it from the catalogue on load', () => {
    const text = serialiseRecord({ ...EMPTY_RECORD, entries: [entry] });
    expect(text).not.toContain('rice-abc123');
    expect(parseRecord(text, () => '/assets/rice-new456.webp').entries[0].candidate.imageUrl).toBe('/assets/rice-new456.webp');
    expect(parseRecord(text).entries[0].candidate.imageUrl).toBeUndefined();
  });

  it('loads an entry without a meal as unassigned instead of guessing', () => {
    const text = JSON.stringify({ version: 0, entries: [{ ...entry, meal: undefined }] });
    expect(parseRecord(text).entries[0].meal).toBeNull();
  });

  it('keeps each entry on its own day so yesterday never reads as today', () => {
    const yesterday = { ...entry, id: 'y', dayKey: '2026-09-03' };
    const loaded = parseRecord(JSON.stringify({ version: 2, entries: [yesterday, entry] }));
    expect(loaded.entries.map((e) => e.dayKey)).toEqual(['2026-09-03', '2026-09-04']);
  });

  it('drops unreadable entries, invalid goal periods and negative water instead of failing', () => {
    const text = JSON.stringify({
      version: 2,
      entries: [{ id: 'broken' }, entry],
      goals: [{ from: 'nope', goal: { kcal: 2000 } }, { from: '2026-09-02', goal: { kcal: -5 } }, { from: '2026-09-01', goal: { kcal: 1800 } }],
      water: { '2026-09-04': -10, 'not-a-day': 5, '2026-09-03': 250.4 },
    });
    const loaded = parseRecord(text);
    expect(loaded.entries.map((e) => e.id)).toEqual(['e1']);
    // Sorted by day; an unreadable goal in a valid period is a clear, never a guess.
    expect(loaded.goals).toEqual([
      { from: '2026-09-01', goal: { kcal: 1800, proteinG: null, carbohydratesG: null, fatG: null } },
      { from: '2026-09-02', goal: null },
    ]);
    expect(loaded.water).toEqual({ '2026-09-03': 250 });
  });

  it('treats garbage, foreign shapes and missing storage as the empty record', () => {
    expect(parseRecord('{not json')).toEqual(EMPTY_RECORD);
    expect(parseRecord('[]')).toEqual(EMPTY_RECORD);
    expect(loadRecord(null)).toEqual(EMPTY_RECORD);
    const storage = fakeStorage();
    storage.map.set(RECORD_KEY, '42');
    expect(loadRecord(storage)).toEqual(EMPTY_RECORD);
  });
});
