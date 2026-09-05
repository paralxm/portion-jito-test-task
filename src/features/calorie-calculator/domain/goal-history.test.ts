import { describe, expect, it } from 'vitest';

import { cancelPending, currentGoal, currentPeriod, goalForDay, migrateLegacyGoal, pendingPeriod, setGoalFrom } from './goal-history';

describe('goal history', () => {
  it('has no goal before the first period and the period goal from its day on', () => {
    const history = migrateLegacyGoal({ kcal: 2000, proteinG: 120, carbohydratesG: null, fatG: null }, '2026-09-05');
    expect(goalForDay(history, '2026-09-04')).toBeNull();
    expect(goalForDay(history, '2026-09-05')?.kcal).toBe(2000);
    expect(goalForDay(history, '2026-10-01')?.proteinG).toBe(120);
    expect(migrateLegacyGoal(null, '2026-09-05')).toEqual([]);
  });

  it('starts a new period from a day and keeps earlier periods', () => {
    const first = setGoalFrom([], '2026-09-01', { kcal: 2000 });
    const second = setGoalFrom(first, '2026-09-05', { kcal: 1800 });
    expect(goalForDay(second, '2026-09-03')?.kcal).toBe(2000);
    expect(goalForDay(second, '2026-09-05')?.kcal).toBe(1800);
    expect(goalForDay(second, '2026-09-06')?.kcal).toBe(1800);
    expect(currentGoal(second)?.kcal).toBe(1800);
  });

  it('a clear is a period too: earlier days keep their goal, later days have none', () => {
    const history = setGoalFrom(setGoalFrom([], '2026-09-01', { kcal: 2000 }), '2026-09-05', null);
    expect(goalForDay(history, '2026-09-04')?.kcal).toBe(2000);
    expect(goalForDay(history, '2026-09-05')).toBeNull();
    expect(currentGoal(history)).toBeNull();
  });

  it('editing the same day replaces that day\'s period and drops later ones', () => {
    const history = setGoalFrom(setGoalFrom([], '2026-09-01', { kcal: 2000 }), '2026-09-10', { kcal: 2500 });
    const edited = setGoalFrom(history, '2026-09-05', { kcal: 1900 });
    expect(edited.map((p) => p.from)).toEqual(['2026-09-01', '2026-09-05']);
    expect(goalForDay(edited, '2026-09-12')?.kcal).toBe(1900);
    expect(setGoalFrom(edited, '2026-09-05', { kcal: 2100 }).map((p) => p.goal?.kcal)).toEqual([2000, 2100]);
  });

  it('ignores an invalid stored goal for a day', () => {
    expect(goalForDay([{ from: '2026-09-01', goal: { kcal: -1 } }], '2026-09-02')).toBeNull();
  });

  it('a future-dated save leaves today unchanged and becomes the one pending change; another future save replaces it', () => {
    const today = '2026-09-05';
    const base = setGoalFrom([], '2026-09-01', { kcal: 2000 });
    const scheduled = setGoalFrom(base, '2026-09-08', { kcal: 1800 });
    expect(goalForDay(scheduled, today)?.kcal).toBe(2000);
    expect(goalForDay(scheduled, '2026-09-08')?.kcal).toBe(1800);
    expect(pendingPeriod(scheduled, today)).toEqual({ from: '2026-09-08', goal: { kcal: 1800 } });
    expect(currentPeriod(scheduled, today)?.from).toBe('2026-09-01');
    const replaced = setGoalFrom(cancelPending(scheduled, today), '2026-09-10', { kcal: 1700 });
    expect(replaced.filter((p) => p.from > today)).toEqual([{ from: '2026-09-10', goal: { kcal: 1700 } }]);
  });

  it('an immediate save keeps a pending change only when asked; a removal from today cancels it', () => {
    const today = '2026-09-05';
    const scheduled = setGoalFrom(setGoalFrom([], '2026-09-01', { kcal: 2000 }), '2026-09-08', { kcal: 1800 });
    const kept = setGoalFrom(scheduled, today, { kcal: 2100 }, { keepLater: true });
    expect(goalForDay(kept, today)?.kcal).toBe(2100);
    expect(pendingPeriod(kept, today)?.goal?.kcal).toBe(1800);
    const removed = setGoalFrom(scheduled, today, null);
    expect(goalForDay(removed, today)).toBeNull();
    expect(pendingPeriod(removed, today)).toBeNull();
    expect(goalForDay(removed, '2026-09-04')?.kcal).toBe(2000);
    expect(cancelPending(scheduled, today)).toEqual(setGoalFrom([], '2026-09-01', { kcal: 2000 }));
  });
});
