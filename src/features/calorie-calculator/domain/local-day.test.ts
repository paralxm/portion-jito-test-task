import { describe, expect, it } from 'vitest';

import { crossesLocalDay, localDayKey, msUntilNextLocalMidnight } from './local-day';

describe('local day', () => {
  it('keys a date by its local calendar day', () => {
    expect(localDayKey(new Date(2026, 8, 4, 23, 59, 59))).toBe('2026-09-04');
    expect(localDayKey(new Date(2026, 8, 5, 0, 0, 0))).toBe('2026-09-05');
  });

  it('counts down to the next local midnight, never zero', () => {
    expect(msUntilNextLocalMidnight(new Date(2026, 8, 4, 23, 59, 59, 0))).toBe(1000);
    expect(msUntilNextLocalMidnight(new Date(2026, 8, 4, 0, 0, 0, 0))).toBe(24 * 60 * 60 * 1000);
  });

  it('detects a day boundary', () => {
    expect(crossesLocalDay(new Date(2026, 8, 4, 23, 30), new Date(2026, 8, 5, 0, 30))).toBe(true);
    expect(crossesLocalDay(new Date(2026, 8, 4, 8, 0), new Date(2026, 8, 4, 22, 0))).toBe(false);
  });
});
