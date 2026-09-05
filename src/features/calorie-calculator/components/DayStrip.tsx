import { useEffect, useId, useRef } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';

import { IconButton } from '../../../design-system/primitives/IconButton/IconButton';
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

const rangeFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });

/**
 * Home's week strip (ledger §12 A3, after R1): the seven days of the selected day's
 * week, Monday first, as a radio group. Today carries a dot and the word in its name;
 * the selected day is the filled tile; days after today are unavailable (there is no
 * planning). Previous / next week move the window, and `Today` returns to the current
 * day when another one is selected. Nothing depends on swiping: the row scrolls when
 * it is narrower than seven 48 px targets, and every control is a button.
 */
export function DayStrip({ selectedDayKey, todayKey, onSelectDay, className }: DayStripProps) {
  const id = useId();
  const days = weekOf(selectedDayKey);
  const listRef = useRef<HTMLDivElement>(null);
  const nextWeekStart = addDays(days[0], 7);
  const nextAvailable = compareDayKeys(nextWeekStart, todayKey) <= 0;

  // Keep the selected tile in view when the strip has to scroll (320 px or enlarged text).
  useEffect(() => {
    const list = listRef.current;
    const tile = list?.querySelector<HTMLElement>('[aria-checked="true"]');
    if (!list || !tile || list.scrollWidth <= list.clientWidth) return;
    const left = tile.offsetLeft - (list.clientWidth - tile.offsetWidth) / 2;
    list.scrollTo({ left, behavior: 'auto' });
  }, [selectedDayKey]);

  const move = (offset: number) => {
    const target = addDays(selectedDayKey, offset);
    // Moving forward never lands on a future day: clamp to today.
    onSelectDay(compareDayKeys(target, todayKey) > 0 ? todayKey : target);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    const target = addDays(selectedDayKey, step);
    if (compareDayKeys(target, todayKey) > 0) return;
    event.preventDefault();
    onSelectDay(target);
    requestAnimationFrame(() => listRef.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus());
  };

  return (
    <section className={[styles.strip, className].filter(Boolean).join(' ')} aria-labelledby={`${id}-label`}>
      <div className={styles.controls}>
        <IconButton icon={CaretLeft} label="Previous week" onClick={() => move(-7)} />
        <Text as="p" id={`${id}-label`} variant="supporting" color="secondary" className={styles.range}>
          <span className="portion-visually-hidden">Week of </span>
          {rangeFormat.format(new Date(days[0].replace(/-/g, '/')))} – {rangeFormat.format(new Date(days[6].replace(/-/g, '/')))}
        </Text>
        {selectedDayKey !== todayKey ? (
          <Button variant="text" size="small" onClick={() => onSelectDay(todayKey)} className={styles.today}>
            Today
          </Button>
        ) : null}
        <IconButton icon={CaretRight} label="Next week" onClick={() => move(7)} disabled={!nextAvailable} />
      </div>
      <div ref={listRef} className={styles.days} role="radiogroup" aria-label="Day" onKeyDown={onKeyDown}>
        {days.map((dayKey) => {
          const d = describeDay(dayKey);
          const isToday = dayKey === todayKey;
          const selected = dayKey === selectedDayKey;
          const future = compareDayKeys(dayKey, todayKey) > 0;
          return (
            <button
              key={dayKey}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${d.long}${isToday ? ', today' : ''}${future ? ', not available yet' : ''}`}
              disabled={future}
              tabIndex={selected ? 0 : -1}
              className={styles.day}
              data-selected={selected || undefined}
              data-today={isToday || undefined}
              onClick={() => onSelectDay(dayKey)}
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
