import { useId } from 'react';

import { FilterChip } from '../../../design-system/components/Chip/Chip';
import { Inline } from '../../../design-system/primitives/layout/Inline';
import { Text } from '../../../design-system/primitives/Text/Text';
import { MEAL_LABELS, MEAL_ORDER, type MealType } from '../domain/meal';
import styles from './MealPicker.module.css';

export interface MealPickerProps {
  value: MealType | null;
  onChange: (meal: MealType) => void;
  /** Visible group label; defaults to "Meal". */
  label?: string;
  /** Short line under the label, e.g. why a meal is preselected. */
  hint?: string;
  className?: string;
}

/**
 * The one meal choice used by the Add-to-meal sheet and existing-entry review: a radio
 * group of four chips in the fixed order. Selection is shown by boundary, fill and a check
 * mark and exposed as `aria-checked` — never colour alone. Nothing is preselected unless
 * the caller says so, and the choice is always visible and editable.
 */
export function MealPicker({ value, onChange, label = 'Meal', hint, className }: MealPickerProps) {
  const id = useId();
  return (
    <fieldset className={[styles.group, className].filter(Boolean).join(' ')} role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={hint ? `${id}-hint` : undefined}>
      <Text as="legend" id={`${id}-label`} variant="label" color="primary" className={styles.legend}>
        {label}
      </Text>
      {hint ? (
        <Text as="p" id={`${id}-hint`} variant="supporting" color="secondary" className={styles.hint} wrap>
          {hint}
        </Text>
      ) : null}
      <Inline gap={8} wrap block>
        {MEAL_ORDER.map((meal) => (
          <FilterChip key={meal} selectionRole="radio" selected={value === meal} onClick={() => onChange(meal)}>
            {MEAL_LABELS[meal]}
          </FilterChip>
        ))}
      </Inline>
    </fieldset>
  );
}
