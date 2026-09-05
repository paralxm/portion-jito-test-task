import { MediaFrame } from '../../components/MediaFrame/MediaFrame';
import { Text } from '../../primitives/Text/Text';
import { VisuallyHidden } from '../../primitives/VisuallyHidden/VisuallyHidden';
import { formatQuantity, MISSING_GLYPH, NBSP, NOT_AVAILABLE } from '../../nutrition/nutrition';
import styles from './FoodCard.module.css';

export interface FoodCardProps {
  /** Food name (item-title 16/24). Wraps; never truncated. */
  name: string;
  /** Source or distinguishing detail (supporting 14/20). */
  detail?: string;
  /** 4:3 photograph; absent or failed images show the shared No photo fallback. */
  imageUrl?: string;
  /** Calories for the stated basis, or `null` when unknown. */
  calories: number | null;
  /** The basis the calories belong to, e.g. "per 100 g". */
  basis: string;
  onOpen: () => void;
  className?: string;
}

/**
 * The grid presentation of a food item: the same identity, calories and basis as
 * `FoodResultRow`, with the photograph above the text. The name is the single control;
 * its hit area covers the whole card without nesting interactive elements, and the card
 * grows with its text rather than truncating it.
 */
export function FoodCard({ name, detail, imageUrl, calories, basis, onOpen, className }: FoodCardProps) {
  return (
    <article className={[styles.card, className].filter(Boolean).join(' ')}>
      <div className={styles.media}>
        <MediaFrame aspect="4:3" imageUrl={imageUrl} imageAlt="" compact />
      </div>
      <div className={styles.body}>
        <h3 className={styles.titleRow}>
          <button type="button" className={styles.titleButton} onClick={onOpen}>
            <Text variant="item-title" color="primary" wrap>
              {name}
            </Text>
          </button>
        </h3>
        {detail ? (
          <Text as="p" variant="supporting" color="secondary" wrap>
            {detail}
          </Text>
        ) : null}
        <p className={styles.figure}>
          {calories === null ? (
            <>
              <Text variant="metric-inline" color="secondary" aria-hidden="true">
                {MISSING_GLYPH}
              </Text>
              <VisuallyHidden>{NOT_AVAILABLE}</VisuallyHidden>
            </>
          ) : (
            <Text variant="metric-inline" numeric color="primary">
              {formatQuantity(calories, 'kcal')}
              {NBSP}kcal
            </Text>
          )}
          <Text variant="supporting" color="secondary">
            {basis}
          </Text>
        </p>
      </div>
    </article>
  );
}
