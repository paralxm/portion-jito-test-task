import { SlidersHorizontal } from '@phosphor-icons/react';

import { AppliedCriterionChip } from '../../../design-system/components/Chip/Chip';
import { Badge } from '../../../design-system/primitives/Badge/Badge';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Inline } from '../../../design-system/primitives/layout/Inline';
import { VisuallyHidden } from '../../../design-system/primitives/VisuallyHidden/VisuallyHidden';
import { activeCriteria, describeCriterion, type CriterionKey, type RecipeCriteria } from '../domain/matching';
import { RecipeFiltersSheet } from './RecipeFiltersSheet';
import styles from './CriteriaToolbar.module.css';

export interface CriteriaToolbarProps {
  /** The committed criteria that currently filter the list. */
  criteria: RecipeCriteria;
  sheetOpen: boolean;
  onOpenSheet: () => void;
  onCloseSheet: () => void;
  /** Apply from the sheet: commit and close. */
  onApply: (criteria: RecipeCriteria) => void;
  /** Removing an applied chip commits immediately. */
  onRemove: (key: CriterionKey) => void;
}

/**
 * Filters entry plus the applied-criteria chips, shared by recipe browsing and the
 * Recipes search scope. The sheet is a draft; the chips are the committed truth.
 */
export function CriteriaToolbar({ criteria, sheetOpen, onOpenSheet, onCloseSheet, onApply, onRemove }: CriteriaToolbarProps) {
  const active = activeCriteria(criteria);
  return (
    <div className={styles.toolbar}>
      <Button variant="secondary" size="compact" icon={SlidersHorizontal} onClick={onOpenSheet} aria-haspopup="dialog" aria-expanded={sheetOpen}>
        Filters
        {active.length > 0 ? (
          <>
            <Badge kind="count" className={styles.count}>
              {active.length}
            </Badge>
            <VisuallyHidden> active</VisuallyHidden>
          </>
        ) : null}
      </Button>
      {active.length > 0 ? (
        <Inline as="ul" gap={8} wrap block className={styles.chips} aria-label="Applied filters">
          {active.map((key) => {
            const label = describeCriterion(criteria, key);
            return (
              <li key={key}>
                <AppliedCriterionChip removeLabel={`Remove filter: ${label}`} onRemove={() => onRemove(key)}>
                  {label}
                </AppliedCriterionChip>
              </li>
            );
          })}
        </Inline>
      ) : null}
      <RecipeFiltersSheet
        open={sheetOpen}
        applied={criteria}
        onApply={(next) => {
          onApply(next);
          onCloseSheet();
        }}
        onCancel={onCloseSheet}
      />
    </div>
  );
}
