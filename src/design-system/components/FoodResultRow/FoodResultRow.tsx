import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { CaretRight } from '@phosphor-icons/react';

import { Icon } from '../../icons/Icon';
import { Text } from '../../primitives/Text/Text';
import { formatQuantity, MISSING_GLYPH, NOT_AVAILABLE } from '../../nutrition/nutrition';
import { VisuallyHidden } from '../../primitives/VisuallyHidden/VisuallyHidden';
import styles from './FoodResultRow.module.css';

export interface FoodResultRowProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type' | 'name'> {
  /** Food name (item-title 16/24). Wraps; never truncated before the user commits a choice. */
  name: ReactNode;
  /** Brand, source or distinguishing detail (supporting 14/20). */
  detail?: ReactNode;
  /** Calories for the reference basis, or `null` when unknown. */
  calories: number | null;
  /** The basis the calories belong to, e.g. "per 100 g". */
  basis: ReactNode;
}

/**
 * Compact search-result row. Selecting it opens review — it does not replace the
 * current calculation. Identity wraps; the calorie value stays inline at 16/24.
 */
export function FoodResultRow({ name, detail, calories, basis, className, ...rest }: FoodResultRowProps) {
  return (
    <button type="button" className={[styles.row, className].filter(Boolean).join(' ')} {...rest}>
      <span className={styles.identity}>
        <Text variant="item-title" color="primary" wrap>
          {name}
        </Text>
        {detail ? (
          <Text variant="supporting" color="secondary" wrap>
            {detail}
          </Text>
        ) : null}
      </span>
      <span className={styles.figure}>
        {calories === null ? (
          <>
            <Text variant="metric-inline" color="secondary" aria-hidden="true">
              {MISSING_GLYPH}
            </Text>
            <VisuallyHidden>{NOT_AVAILABLE}</VisuallyHidden>
          </>
        ) : (
          <Text variant="metric-inline" numeric color="primary">
            {formatQuantity(calories, 'kcal')} kcal
          </Text>
        )}
        <Text variant="supporting" color="secondary">
          {basis}
        </Text>
      </span>
      <span className={styles.chevron}>
        <Icon icon={CaretRight} size="small-action" />
      </span>
    </button>
  );
}
