import { Plus } from '@phosphor-icons/react';

import { FoodResultRow } from '../../../design-system/components/FoodResultRow/FoodResultRow';
import { Button } from '../../../design-system/primitives/Button/Button';
import { IconButton } from '../../../design-system/primitives/IconButton/IconButton';
import { Surface } from '../../../design-system/primitives/Surface/Surface';
import { Text } from '../../../design-system/primitives/Text/Text';
import { VisuallyHidden } from '../../../design-system/primitives/VisuallyHidden/VisuallyHidden';
import { describePortion } from '../domain/calculation';
import { energyOf, formatKcal, groupByMeal, type FoodEntry } from '../domain/daily-log';
import { MEAL_LABELS, MEAL_ORDER, mealAddLabel, type MealType } from '../domain/meal';
import styles from './MealGroup.module.css';

export interface MealEntryRowProps {
  entry: FoodEntry;
  onOpen: (entryId: string) => void;
  /** A just-added entry is highlighted briefly (disclosure token); the highlight never delays interaction. */
  highlighted?: boolean;
}

/** One logged entry under its meal: name, portion, energy; opens the entry for editing (S07-3). */
export function MealEntryRow({ entry, onOpen, highlighted = false }: MealEntryRowProps) {
  return (
    <FoodResultRow
      name={entry.candidate.name}
      detail={describePortion(entry.candidate, entry.portion)}
      calories={entry.result.energyKcal}
      onClick={() => onOpen(entry.id)}
      className={styles.entry}
      data-highlighted={highlighted || undefined}
    />
  );
}

export interface MealSectionProps {
  meal: MealType | 'unassigned';
  entries: readonly FoodEntry[];
  onOpenEntry: (entryId: string) => void;
  /** Starts the food task with this meal preselected. Not offered for the unassigned guard. */
  onAdd?: (meal: MealType) => void;
  highlightEntryId?: string | null;
}

/**
 * One meal: a header row with the filled/hollow indicator paired with text (the kcal
 * subtotal, or the add action for an empty meal), then its entries. The indicator is
 * never the only cue.
 */
export function MealSection({ meal, entries, onOpenEntry, onAdd, highlightEntryId }: MealSectionProps) {
  const populated = entries.length > 0;
  const energy = energyOf(entries);
  const label = meal === 'unassigned' ? 'Unassigned' : MEAL_LABELS[meal];
  const headingId = `meal-${meal}`;

  return (
    <section className={styles.meal} aria-labelledby={headingId} data-populated={populated || undefined}>
      <div className={styles.header}>
        <span className={styles.indicator} data-populated={populated || undefined} aria-hidden="true" />
        <Text as="h3" id={headingId} variant="item-title" color="primary" className={styles.name}>
          {label}
        </Text>
        {populated ? (
          <Text variant="metric-inline" numeric color="primary" className={styles.subtotal}>
            {formatKcal(energy.kcal)}
            {energy.complete ? '' : '+'} kcal
            {energy.complete ? null : <VisuallyHidden> (partial total)</VisuallyHidden>}
          </Text>
        ) : null}
        {meal === 'unassigned' ? (
          <Text variant="supporting" color="secondary">
            Choose a meal
          </Text>
        ) : populated && onAdd ? (
          <IconButton icon={Plus} label={mealAddLabel(meal, true)} onClick={() => onAdd(meal)} className={styles.addMore} />
        ) : onAdd ? (
          <Button variant="text" size="small" icon={Plus} onClick={() => onAdd(meal)} className={styles.add}>
            {mealAddLabel(meal, false)}
          </Button>
        ) : null}
      </div>
      {populated ? (
        <ul className={styles.entries}>
          {entries.map((entry) => (
            <li key={entry.id}>
              <MealEntryRow entry={entry} onOpen={onOpenEntry} highlighted={entry.id === highlightEntryId} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export interface MealGroupProps {
  /** Today's committed entries only; the app selects the local day. */
  entries: readonly FoodEntry[];
  onOpenEntry: (entryId: string) => void;
  onAdd: (meal: MealType) => void;
  highlightEntryId?: string | null;
  /** The heading: "Today's meals" by default, "Meals on Thu, Sep 3" for another day. */
  heading?: string;
  className?: string;
}

/**
 * Today's meals: one grouped surface with the four meals always present, empty ones
 * included, separated by hairlines. Any entry without a meal (the unassigned guard,
 * ledger D-16) is listed in its own section with a Choose meal resolution — never
 * classified silently.
 */
export function MealGroup({ entries, onOpenEntry, onAdd, highlightEntryId, heading = 'Today’s meals', className }: MealGroupProps) {
  const { meals, unassigned } = groupByMeal(entries);
  const total = energyOf(entries);
  return (
    <section aria-labelledby="home-meals-heading" className={[styles.section, className].filter(Boolean).join(' ')}>
      <div className={styles.sectionHeader}>
        <Text as="h2" id="home-meals-heading" variant="section-title" color="primary">
          {heading}
        </Text>
        <Text as="p" variant="supporting" color="secondary" numeric>
          {entries.length === 0 ? 'Nothing logged' : `${formatKcal(total.kcal)}${total.complete ? '' : '+'} kcal logged`}
        </Text>
      </div>
      <Surface tone="canvas" border="decorative" radius="grouped" padding={0} className={styles.group}>
        {MEAL_ORDER.map((meal) => (
          <MealSection key={meal} meal={meal} entries={meals[meal]} onOpenEntry={onOpenEntry} onAdd={onAdd} highlightEntryId={highlightEntryId} />
        ))}
        {unassigned.length > 0 ? <MealSection meal="unassigned" entries={unassigned} onOpenEntry={onOpenEntry} highlightEntryId={highlightEntryId} /> : null}
      </Surface>
    </section>
  );
}
