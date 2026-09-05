import { useEffect, useId, useRef, useState } from 'react';

import { FilterChip } from '../../../design-system/components/Chip/Chip';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Inline } from '../../../design-system/primitives/layout/Inline';
import { Stack } from '../../../design-system/primitives/layout/Stack';
import { Text } from '../../../design-system/primitives/Text/Text';
import { ModalSheet } from '../../../design-system/patterns/ModalSheet/ModalSheet';
import { FOOD_CATEGORY_OPTIONS, NO_FOOD_FILTERS, type FoodFilters } from '../domain/food-search';
import styles from './FoodFiltersSheet.module.css';

export interface FoodFiltersSheetProps {
  open: boolean;
  /** The committed filters; the draft starts from them and Cancel restores them. */
  applied: FoodFilters;
  /** Apply commits the draft; the sheet returns to Search. */
  onApply: (filters: FoodFilters) => void;
  /** Close, backdrop or Escape: unapplied edits are discarded, the previous filters stay. */
  onCancel: () => void;
}

/**
 * O07 — the Food tab's filters in the shared filter-sheet pattern (ledger §11.1): one
 * radio group, All / Foods / Drinks, based on each item's own record. `Clear all` resets
 * the draft to All (it takes effect on Apply); `Apply filters` commits; dismissing keeps
 * whatever was applied before.
 */
export function FoodFiltersSheet({ open, applied, onApply, onCancel }: FoodFiltersSheetProps) {
  const [draft, setDraft] = useState<FoodFilters>(applied);
  const wasOpen = useRef(open);
  const id = useId();
  const legendId = `food-filters-${id}`;

  // The draft starts from the committed filters each time the sheet opens, never on a later re-render.
  useEffect(() => {
    if (open && !wasOpen.current) setDraft(applied);
    wasOpen.current = open;
  }, [open, applied]);

  return (
    <ModalSheet
      open={open}
      onRequestClose={onCancel}
      title="Filters"
      description="Show everything, or only foods or only drinks. Based on each item's own record, not on its photo."
      footer={
        <div className={styles.footer}>
          <Button variant="text" size="small" onClick={() => setDraft(NO_FOOD_FILTERS)}>
            Clear all
          </Button>
          <Button variant="primary" onClick={() => onApply(draft)}>
            Apply filters
          </Button>
        </div>
      }
    >
      <Stack gap={16}>
        <fieldset className={styles.group} role="radiogroup" aria-labelledby={legendId}>
          <Text as="legend" id={legendId} variant="label" color="primary" className={styles.legend}>
            Show
          </Text>
          <Inline gap={8} wrap block>
            {FOOD_CATEGORY_OPTIONS.map((option) => (
              <FilterChip key={option.value} selectionRole="radio" selected={draft.category === option.value} onClick={() => setDraft({ category: option.value })}>
                {option.label}
              </FilterChip>
            ))}
          </Inline>
        </fieldset>
      </Stack>
    </ModalSheet>
  );
}
