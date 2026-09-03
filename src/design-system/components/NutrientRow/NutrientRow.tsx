import type { ReactNode } from 'react';

import { Text } from '../../primitives/Text/Text';
import { VisuallyHidden } from '../../primitives/VisuallyHidden/VisuallyHidden';
import { formatQuantity, MISSING_GLYPH, NOT_AVAILABLE, type NutrientCategory, type NutrientUnit } from '../../nutrition/nutrition';
import styles from './NutrientRow.module.css';

export interface NutrientRowProps {
  /** Nutrient name (body 16/24). */
  name: ReactNode;
  value: number | null;
  unit: NutrientUnit;
  /** Category marker for macronutrients and group headings; individual vitamins and minerals stay neutral. */
  category?: NutrientCategory;
  /** Indented sub-row such as "of which fibre". */
  nested?: boolean;
  /** Group-heading row (section within the expanded list). */
  heading?: boolean;
}

/**
 * A static, non-interactive nutrition row. Numbers are right-aligned by layout (not
 * spaces), keep their unit, and an unknown value is named rather than shown as zero.
 */
export function NutrientRow({ name, value, unit, category, nested = false, heading = false }: NutrientRowProps) {
  const known = value !== null;
  return (
    <div className={styles.row} data-nested={nested || undefined} data-heading={heading || undefined} role="listitem">
      <span className={styles.name}>
        {category ? <span className={styles.marker} data-category={category} aria-hidden="true" /> : null}
        <Text variant={heading ? 'label' : 'body'} color="primary" wrap>
          {name}
        </Text>
      </span>
      {heading ? null : (
        <span className={styles.figure}>
          {known ? (
            <Text variant="metric-inline" numeric color="primary">
              {formatQuantity(value, unit)}
              {' '}
              {unit}
            </Text>
          ) : (
            <>
              <Text variant="metric-inline" color="secondary" aria-hidden="true">
                {MISSING_GLYPH}
              </Text>
              <VisuallyHidden>{NOT_AVAILABLE}</VisuallyHidden>
            </>
          )}
        </span>
      )}
    </div>
  );
}
