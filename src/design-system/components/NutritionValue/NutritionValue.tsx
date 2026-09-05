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

export type NutritionValueSize = 'main' | 'secondary' | 'compact' | 'inline';

export interface NutritionValueProps {
  value: number | null;
  unit: NutrientUnit;
  /**
   * `main` is the single 40/48 calorie result; `secondary` is a 20/28 summary metric
   * with its label above; `compact` is the same stacked shape at 16/24 for a subordinate
   * row (Home's daily macros); `inline` is a 16/24 value on one line in rows and cards.
   */
  size?: NutritionValueSize;
  /** Category label rendered above or beside the value (label 14/20). */
  label?: ReactNode;
  /** Category marker colour; the number itself stays neutral. */
  category?: NutrientCategory;
  /** The basis this value belongs to, e.g. "For 250 g" or "Per serving (300 g)". */
  basis?: ReactNode;
  /**
   * A user-entered target the value is measured against, rendered as "24 / 120 g" with
   * the target in the secondary colour. Only known values show it; it is never derived.
   */
  target?: number | null;
  status?: NutritionValueStatus;
  className?: string;
}

const VALUE_VARIANT = { main: 'main-result', secondary: 'metric-secondary', compact: 'metric-inline', inline: 'metric-inline' } as const;
const UNIT_VARIANT = { main: 'body', secondary: 'supporting', compact: 'supporting', inline: 'metric-inline' } as const;

/**
 * A value with its unit, category and basis kept together — visually and in the
 * accessible text. Tabular figures stabilise updates; the box is allowed to grow when
 * a digit is added. Unknown values are named, never rendered as zero.
 */
export function NutritionValue({ value, unit, size = 'inline', label, category, basis, target, status = 'known', className }: NutritionValueProps) {
  const isKnown = status === 'known' && value !== null;
  const valueVariant = VALUE_VARIANT[size];
  const unitVariant = UNIT_VARIANT[size];
  const hasTarget = isKnown && typeof target === 'number' && Number.isFinite(target) && target > 0;

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
            <span className={styles.pair}>
              {hasTarget ? (
                <Text variant={unitVariant} numeric color="secondary" className={styles.target}>
                  <VisuallyHidden>of </VisuallyHidden>
                  <span aria-hidden="true">/ </span>
                  {formatQuantity(target as number, unit)}
                </Text>
              ) : null}
              <Text variant={unitVariant} color={size === 'inline' ? 'primary' : 'secondary'} className={styles.unit}>
                {unit}
              </Text>
            </span>
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
      {/* A stale draft states its guidance once, under the main result; the subordinate
          values show the dash and keep the hidden text so the sentence is not repeated. */}
      {!isKnown && size !== 'inline' && (status !== 'stale' || size === 'main') ? (
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
