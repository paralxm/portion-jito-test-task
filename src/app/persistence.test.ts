import { describe, expect, it } from 'vitest';

import { createEntry, type FoodEntry } from '../features/calorie-calculator/domain/daily-log';
import { fixtureC } from '../features/calorie-calculator/domain/fixtures';
import { EMPTY_RECORD, loadRecord, parseRecord, RECORD_KEY, saveRecord, serialiseRecord, type RecordStorage } from './persistence';

const fakeStorage = (): RecordStorage & { map: Map<string, string> } => {
  const map = new Map<string, string>();
  return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v) };
};

const entry = createEntry({ ...fixtureC, imageUrl: '/assets/rice-abc123.webp' }, { quantity: 300, unitId: 'g' }, 'lunch', { now: Date.parse('2026-09-04T12:00:00'), id: 'e1' }) as FoodEntry;

describe('persistence', () => {
  it('round-trips entries, goal, water and the view', () => {
    const storage = fakeStorage();
    saveRecord(storage, { version: 1, entries: [entry], goal: { kcal: 2000, proteinG: 120, carbohydratesG: null, fatG: null }, water: { '2026-09-04': 750 }, searchView: 'grid' });
    const loaded = loadRecord(storage, (id) => (id === fixtureC.id ? '/assets/rice-new456.webp' : undefined));
    expect(loaded.entries).toHaveLength(1);
    expect(loaded.entries[0].id).toBe('e1');
    expect(loaded.entries[0].dayKey).toBe('2026-09-04');
    expect(loaded.entries[0].meal).toBe('lunch');
    expect(loaded.entries[0].result.energyKcal).toBe(540);
    expect(loaded.goal).toEqual({ kcal: 2000, proteinG: 120, carbohydratesG: null, fatG: null });
    expect(loaded.water).toEqual({ '2026-09-04': 750 });
    expect(loaded.searchView).toBe('grid');
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
    const loaded = parseRecord(JSON.stringify({ version: 1, entries: [yesterday, entry] }));
    expect(loaded.entries.map((e) => e.dayKey)).toEqual(['2026-09-03', '2026-09-04']);
  });

  it('drops unreadable entries, invalid goals and negative water instead of failing', () => {
    const text = JSON.stringify({ version: 1, entries: [{ id: 'broken' }, entry], goal: { kcal: -5 }, water: { '2026-09-04': -10, 'not-a-day': 5, '2026-09-03': 250.4 } });
    const loaded = parseRecord(text);
    expect(loaded.entries.map((e) => e.id)).toEqual(['e1']);
    expect(loaded.goal).toBeNull();
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
