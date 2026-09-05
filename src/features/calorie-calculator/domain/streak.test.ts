import { describe, expect, it } from 'vitest';

import { createEntry, type FoodEntry } from './daily-log';
import { fixtureC } from './fixtures';
import { computeStreak, describeStreak } from './streak';

const on = (dayKey: string, id = dayKey): FoodEntry => ({ ...(createEntry(fixtureC, { quantity: 100, unitId: 'g' }, 'lunch', { id }) as FoodEntry), dayKey });

describe('streak', () => {
  it('is 0 without entries today or yesterday', () => {
    expect(computeStreak([], '2026-09-05')).toEqual({ days: 0, todayLogged: false });
    expect(computeStreak([on('2026-09-03')], '2026-09-05').days).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    expect(computeStreak([on('2026-09-03'), on('2026-09-04'), on('2026-09-05')], '2026-09-05')).toEqual({ days: 3, todayLogged: true });
  });

  it('keeps the run ending yesterday while today is still open', () => {
    expect(computeStreak([on('2026-09-03'), on('2026-09-04')], '2026-09-05')).toEqual({ days: 2, todayLogged: false });
  });

  it('stops at a gap and ignores days before it', () => {
    expect(computeStreak([on('2026-09-01'), on('2026-09-02'), on('2026-09-04'), on('2026-09-05')], '2026-09-05').days).toBe(2);
  });

  it('counts a day once however many entries it holds, and only confirmed entries count', () => {
    expect(computeStreak([on('2026-09-05', 'a'), on('2026-09-05', 'b')], '2026-09-05').days).toBe(1);
  });

  it('reflects backfill and removal: filling a gap joins the runs, removing the last entry of a day breaks it', () => {
    const base = [on('2026-09-01'), on('2026-09-02'), on('2026-09-04'), on('2026-09-05')];
    expect(computeStreak([...base, on('2026-09-03')], '2026-09-05').days).toBe(5);
    expect(computeStreak(base.filter((e) => e.dayKey !== '2026-09-04'), '2026-09-05').days).toBe(1);
  });

  it('spans a month boundary and describes itself', () => {
    const s = computeStreak([on('2026-08-31'), on('2026-09-01')], '2026-09-01');
    expect(s.days).toBe(2);
    expect(describeStreak(s)).toBe('2 days in a row with at least one food or recipe logged, including today.');
    expect(describeStreak({ days: 1, todayLogged: false })).toBe('1 day in a row with at least one food or recipe logged, up to yesterday. Log something today to keep it going.');
    expect(describeStreak({ days: 0, todayLogged: false })).toMatch(/No streak yet/);
  });
});
