import type { ReactNode } from 'react';

import { Text } from '../../primitives/Text/Text';
import { VisuallyHidden } from '../../primitives/VisuallyHidden/VisuallyHidden';
import { formatQuantity, MISSING_GLYPH, NOT_AVAILABLE, type NutrientCategory, type NutrientUnit } from '../../nutrition/nutrition';
import styles from './NutritionValue.module.css';

export type NutritionValueStatus =
  /** A known value for the stated basis. */
  | 'known'
  /** No data for this nutrient. Shown as an em dash with "Not available". */
  | 'unavailable'
  /** The draft amount is invalid, so no result belongs to it yet. */
  | 'stale';

export interface NutritionValueProps {
  value: number | null;
  unit: NutrientUnit;
  /**
   * `main` is the single 40/48 calorie result; `secondary` is a 24/32 summary metric;
   * `inline` is the 16/24 value used in rows and cards.
   */
  size?: 'main' | 'secondary' | 'inline';
  /** Category label rendered above or beside the value (label 14/20). */
  label?: ReactNode;
  /** Category marker colour; the number itself stays neutral. */
  category?: NutrientCategory;
  /** The basis this value belongs to, e.g. "For 250 g" or "Per serving (300 g)". */
  basis?: ReactNode;
  status?: NutritionValueStatus;
  className?: string;
}

/**
 * A value with its unit, category and basis kept together — visually and in the
 * accessible text. Tabular figures stabilise updates; the box is allowed to grow when
 * a digit is added. Unknown values are named, never rendered as zero.
 */
export function NutritionValue({ value, unit, size = 'inline', label, category, basis, status = 'known', className }: NutritionValueProps) {
  const isKnown = status === 'known' && value !== null;
  const valueVariant = size === 'main' ? 'main-result' : size === 'secondary' ? 'metric-secondary' : 'metric-inline';
  const unitVariant = size === 'main' ? 'body' : size === 'secondary' ? 'supporting' : 'metric-inline';

  return (
    <div className={[styles.value, className].filter(Boolean).join(' ')} data-size={size} data-status={status}>
      {label ? (
        <span className={styles.labelRow}>
          {category ? <span className={styles.marker} data-category={category} aria-hidden="true" /> : null}
          <Text variant="label" color="secondary">
            {label}
          </Text>
        </span>
      ) : null}
      <span className={styles.figure}>
        {isKnown ? (
          <>
            <Text variant={valueVariant} numeric color="primary" className={styles.number}>
              {formatQuantity(value, unit)}
            </Text>
            <Text variant={unitVariant} color={size === 'inline' ? 'primary' : 'secondary'} className={styles.unit}>
              {unit}
            </Text>
          </>
        ) : (
          <>
            <Text variant={valueVariant} color="secondary" className={styles.number} aria-hidden="true">
              {MISSING_GLYPH}
            </Text>
            <VisuallyHidden>{status === 'stale' ? 'No result for the current amount' : NOT_AVAILABLE}</VisuallyHidden>
          </>
        )}
      </span>
      {!isKnown && size !== 'inline' ? (
        <Text variant="supporting" color="secondary">
          {status === 'stale' ? 'Enter a valid amount to see the result' : NOT_AVAILABLE}
        </Text>
      ) : null}
      {basis && isKnown ? (
        <Text variant="supporting" color="secondary" className={styles.basis}>
          {basis}
        </Text>
      ) : null}
    </div>
  );
}
