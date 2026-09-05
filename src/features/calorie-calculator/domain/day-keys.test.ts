import { describe, expect, it } from 'vitest';

import { addDays, compareDayKeys, daysBetween, dayPhrase, describeDay, describeSelectedDay, isDayKey, startOfWeek, weekOf } from './day-keys';

describe('day keys', () => {
  it('adds whole days across month, year and DST boundaries', () => {
    expect(addDays('2026-09-05', 1)).toBe('2026-09-06');
    expect(addDays('2026-08-31', 1)).toBe('2026-09-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    // European DST ends on 2026-10-25 and starts on 2026-03-29: one calendar day either way.
    expect(addDays('2026-10-24', 1)).toBe('2026-10-25');
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26');
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29');
    expect(addDays('2026-03-29', -1)).toBe('2026-03-28');
  });

  it('compares and measures keys', () => {
    expect(compareDayKeys('2026-09-04', '2026-09-05')).toBeLessThan(0);
    expect(compareDayKeys('2026-09-05', '2026-09-05')).toBe(0);
    expect(daysBetween('2026-09-01', '2026-09-05')).toBe(4);
    expect(daysBetween('2026-10-20', '2026-10-30')).toBe(10);
    expect(isDayKey('2026-09-05')).toBe(true);
    expect(isDayKey('2026-9-5')).toBe(false);
  });

  it('builds the Monday-first week containing a day', () => {
    expect(startOfWeek('2026-09-05')).toBe('2026-08-31'); // Saturday → Monday 31 Aug
    expect(startOfWeek('2026-09-06')).toBe('2026-08-31'); // Sunday belongs to the same week
    expect(startOfWeek('2026-09-07')).toBe('2026-09-07'); // Monday
    expect(weekOf('2026-09-05')).toEqual(['2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06']);
  });

  it('describes days for the strip, the header and confirmations', () => {
    expect(describeDay('2026-09-05')).toMatchObject({ weekday: 'Sat', dayOfMonth: '5', monthDay: 'Sep 5', long: 'Saturday, September 5' });
    expect(describeSelectedDay('2026-09-05', '2026-09-05')).toBe('Today · Sep 5');
    expect(describeSelectedDay('2026-09-04', '2026-09-05')).toBe('Yesterday · Sep 4');
    expect(describeSelectedDay('2026-09-03', '2026-09-05')).toBe('Thu · Sep 3');
    expect(dayPhrase('2026-09-05', '2026-09-05')).toBe('today');
    expect(dayPhrase('2026-09-04', '2026-09-05')).toBe('yesterday');
    expect(dayPhrase('2026-09-03', '2026-09-05')).toBe('on Thu, Sep 3');
  });
});
