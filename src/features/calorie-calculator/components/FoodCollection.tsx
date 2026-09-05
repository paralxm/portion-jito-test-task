import type { ViewMode } from '../../../design-system/components/ViewToggle/ViewToggle';
import { FoodResultRow } from '../../../design-system/components/FoodResultRow/FoodResultRow';
import { FoodCard } from '../../../design-system/patterns/FoodCard/FoodCard';
import type { FoodCandidate } from '../domain/calculation';
import { describeCatalogueBasis } from '../domain/food-search';
import styles from './FoodCollection.module.css';

export interface FoodCollectionProps {
  items: readonly FoodCandidate[];
  view: ViewMode;
  /** Opening an item starts review of that candidate; it never commits anything. */
  onOpen: (candidate: FoodCandidate) => void;
  'aria-labelledby'?: string;
}

/**
 * One collection of food items in either presentation (ledger §11.1): the list shows
 * rows with a thumbnail, the grid shows cards with the photo above the text. Both share
 * the items, their order, the calorie basis and the opening behaviour; the grid reflows
 * from two columns to one under 20 rem of width (320 px, or 200 % text on any supported
 * viewport) without shrinking type or targets.
 */
export function FoodCollection({ items, view, onOpen, 'aria-labelledby': labelledBy }: FoodCollectionProps) {
  return (
    <div className={styles.frame}>
      <ul className={view === 'grid' ? styles.grid : styles.list} aria-labelledby={labelledBy} data-view={view}>
        {items.map((candidate) => (
          <li key={candidate.id}>
            {view === 'grid' ? (
              <FoodCard name={candidate.name} detail={candidate.detail} imageUrl={candidate.imageUrl} calories={candidate.nutrition.energyKcal} basis={describeCatalogueBasis(candidate)} onOpen={() => onOpen(candidate)} />
            ) : (
              <FoodResultRow name={candidate.name} detail={candidate.detail} imageUrl={candidate.imageUrl} calories={candidate.nutrition.energyKcal} basis={describeCatalogueBasis(candidate)} onClick={() => onOpen(candidate)} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
