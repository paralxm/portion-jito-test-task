/**
 * Calendar arithmetic on local day keys (YYYY-MM-DD). A day key is the device's local
 * calendar day at the moment something was recorded; it is stored as-is and never
 * reinterpreted from a UTC instant later, so travelling across time zones does not move
 * earlier entries to another day. Arithmetic here works on the key's own calendar
 * fields through local `Date` construction, which is DST-safe because only whole days
 * are ever added or compared.
 */
import { localDayKey } from './daily-log';

export { localDayKey };

const KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isDayKey(value: unknown): value is string {
  return typeof value === 'string' && KEY.test(value);
}

/** Midday on the key's local day: a safe anchor for calendar arithmetic (never crosses a DST gap). */
export function dayKeyToDate(dayKey: string): Date {
  const m = KEY.exec(dayKey);
  if (!m) throw new Error(`Invalid day key: ${dayKey}`);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0);
}

export function addDays(dayKey: string, days: number): string {
  const date = dayKeyToDate(dayKey);
  date.setDate(date.getDate() + days);
  return localDayKey(date);
}

/** Negative when a is before b, 0 when equal, positive when after. Keys compare lexically. */
export function compareDayKeys(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Whole calendar days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  const a = dayKeyToDate(from);
  const b = dayKeyToDate(to);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** The Monday of the week containing the key (weeks start on Monday). */
export function startOfWeek(dayKey: string): string {
  const date = dayKeyToDate(dayKey);
  const weekday = (date.getDay() + 6) % 7; // Monday = 0
  return addDays(dayKey, -weekday);
}

/** The seven keys of the week containing the key, Monday first. */
export function weekOf(dayKey: string): string[] {
  const monday = startOfWeek(dayKey);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

const weekdayShort = new Intl.DateTimeFormat('en', { weekday: 'short' });
const weekdayLong = new Intl.DateTimeFormat('en', { weekday: 'long' });
const monthDay = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });
const longDate = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' });

/** "Sat" and "5" for the strip; "Saturday, September 5" for accessible names. */
export function describeDay(dayKey: string): { weekday: string; dayOfMonth: string; long: string; monthDay: string; weekdayLong: string } {
  const date = dayKeyToDate(dayKey);
  return {
    weekday: weekdayShort.format(date),
    dayOfMonth: String(date.getDate()),
    long: longDate.format(date),
    monthDay: monthDay.format(date),
    weekdayLong: weekdayLong.format(date),
  };
}

/**
 * The header's context line: "Today · Sep 5" for today, "Yesterday · Sep 4" for the day
 * before, otherwise the weekday and date ("Thu · Sep 3").
 */
export function describeSelectedDay(dayKey: string, todayKey: string): string {
  const d = describeDay(dayKey);
  if (dayKey === todayKey) return `Today · ${d.monthDay}`;
  if (dayKey === addDays(todayKey, -1)) return `Yesterday · ${d.monthDay}`;
  return `${d.weekday} · ${d.monthDay}`;
}

/** Short phrase for confirmations and sheet context: "today", "yesterday", "on Thu, Sep 3". */
export function dayPhrase(dayKey: string, todayKey: string): string {
  if (dayKey === todayKey) return 'today';
  if (dayKey === addDays(todayKey, -1)) return 'yesterday';
  const d = describeDay(dayKey);
  return `on ${d.weekday}, ${d.monthDay}`;
}
