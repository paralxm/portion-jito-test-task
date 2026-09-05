import { useEffect, useId, useRef, type KeyboardEvent, type PointerEvent } from 'react';

import { Button } from '../../../design-system/primitives/Button/Button';
import { Text } from '../../../design-system/primitives/Text/Text';
import { addDays, compareDayKeys, describeDay, weekOf } from '../domain/day-keys';
import styles from './DayStrip.module.css';

export interface DayStripProps {
  /** The day whose record Home shows. */
  selectedDayKey: string;
  /** The device's current local day; days after it are unavailable. */
  todayKey: string;
  onSelectDay: (dayKey: string) => void;
  className?: string;
}

/** How far back the strip reaches before the selected day extends it: three weeks before today's week. */
const WEEKS_BEFORE_TODAY = 3;

const monthFormat = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' });

/**
 * The days the strip lists: whole weeks, Monday first, from a week before the earlier of
 * (today − 3 weeks) and the selected day, to the end of today's week. Selecting the
 * earliest tile therefore always reveals another week, so every past day stays reachable
 * by touch as well as by keyboard; days after today are unavailable.
 */
export function stripDays(selectedDayKey: string, todayKey: string): string[] {
  const back = addDays(todayKey, -7 * WEEKS_BEFORE_TODAY);
  const base = compareDayKeys(selectedDayKey, back) < 0 ? selectedDayKey : back;
  const start = addDays(weekOf(base)[0], -7);
  const end = weekOf(todayKey)[6];
  const days: string[] = [];
  for (let day = start; compareDayKeys(day, end) <= 0; day = addDays(day, 1)) days.push(day);
  return days;
}

/**
 * Home's compact day strip (ledger §13, after H-REF 1): one row of 48 px day tiles that
 * scrolls sideways — by touch, trackpad, mouse drag and the keyboard — with today marked
 * by a dot and the word "today" in its name, the selected day as the filled tile and
 * future days unavailable. There is no calendar container and no previous / next week
 * control: the row itself is the navigation, `Today` returns from an earlier day, and
 * arrow keys move the selection (Home and End jump to the earliest listed day and today).
 * The selected tile is scrolled into view whenever it changes.
 */
export function DayStrip({ selectedDayKey, todayKey, onSelectDay, className }: DayStripProps) {
  const id = useId();
  const days = stripDays(selectedDayKey, todayKey);
  const listRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; startLeft: number; moved: boolean; pointerId: number } | null>(null);

  // Keep the selected tile in view: centred on first render, nearest edge afterwards.
  const first = useRef(true);
  useEffect(() => {
    const list = listRef.current;
    const tile = list?.querySelector<HTMLElement>('[aria-checked="true"]');
    if (!list || !tile || list.scrollWidth <= list.clientWidth) return;
    if (first.current) {
      first.current = false;
      list.scrollTo({ left: tile.offsetLeft - (list.clientWidth - tile.offsetWidth) / 2, behavior: 'auto' });
      return;
    }
    const left = tile.offsetLeft - list.scrollLeft;
    const right = left + tile.offsetWidth;
    if (left < 0) list.scrollBy({ left: left - 8, behavior: 'auto' });
    else if (right > list.clientWidth) list.scrollBy({ left: right - list.clientWidth + 8, behavior: 'auto' });
  }, [selectedDayKey, days.length]);

  const select = (dayKey: string) => {
    if (compareDayKeys(dayKey, todayKey) > 0) return;
    onSelectDay(dayKey);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    let target: string | null = null;
    if (event.key === 'ArrowRight') target = addDays(selectedDayKey, 1);
    else if (event.key === 'ArrowLeft') target = addDays(selectedDayKey, -1);
    else if (event.key === 'End') target = todayKey;
    else if (event.key === 'Home') target = days[0];
    if (target === null || compareDayKeys(target, todayKey) > 0) return;
    event.preventDefault();
    select(target);
    requestAnimationFrame(() => listRef.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus({ preventScroll: true }));
  };

  // Mouse drag scrolls the row like a touch swipe; a drag never counts as a tap.
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || !listRef.current) return;
    drag.current = { startX: event.clientX, startLeft: listRef.current.scrollLeft, moved: false, pointerId: event.pointerId };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    const list = listRef.current;
    if (!state || !list || event.pointerId !== state.pointerId) return;
    const delta = event.clientX - state.startX;
    if (!state.moved && Math.abs(delta) < 6) return;
    if (!state.moved) {
      state.moved = true;
      list.setPointerCapture(event.pointerId);
    }
    list.scrollLeft = state.startLeft - delta;
  };
  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || event.pointerId !== state.pointerId) return;
    if (state.moved) listRef.current?.releasePointerCapture(event.pointerId);
    // Leave the flag for the click that follows a drag, then clear it.
    requestAnimationFrame(() => {
      drag.current = null;
    });
  };
  const onClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (drag.current?.moved) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const selected = describeDay(selectedDayKey);

  return (
    <section className={[styles.strip, className].filter(Boolean).join(' ')} aria-labelledby={`${id}-label`}>
      <div className={styles.caption}>
        <Text as="p" id={`${id}-label`} variant="supporting" color="secondary" className={styles.month}>
          <span className="portion-visually-hidden">Day, </span>
          {monthFormat.format(new Date(selectedDayKey.replace(/-/g, '/')))}
        </Text>
        {selectedDayKey !== todayKey ? (
          <Button variant="text" size="small" onClick={() => onSelectDay(todayKey)} className={styles.today}>
            Today
          </Button>
        ) : null}
      </div>
      <div
        ref={listRef}
        className={styles.days}
        role="radiogroup"
        aria-label="Day"
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        data-selected-day={selected.long}
      >
        {days.map((dayKey) => {
          const d = describeDay(dayKey);
          const isToday = dayKey === todayKey;
          const isSelected = dayKey === selectedDayKey;
          const future = compareDayKeys(dayKey, todayKey) > 0;
          return (
            <button
              key={dayKey}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${d.long}${isToday ? ', today' : ''}${future ? ', not available yet' : ''}`}
              disabled={future}
              tabIndex={isSelected ? 0 : -1}
              className={styles.day}
              data-selected={isSelected || undefined}
              data-today={isToday || undefined}
              onClick={() => select(dayKey)}
            >
              <Text as="span" variant="caption" color="inherit" className={styles.weekday}>
                {d.weekday}
              </Text>
              <Text as="span" variant="action-md" numeric color="inherit" className={styles.number}>
                {d.dayOfMonth}
              </Text>
              <span className={styles.dot} aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
