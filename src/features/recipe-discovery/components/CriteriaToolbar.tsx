import { AppliedCriterionChip } from '../../../design-system/components/Chip/Chip';
import { Inline } from '../../../design-system/primitives/layout/Inline';
import { activeCriteria, describeCriterion, type CriterionKey, type RecipeCriteria } from '../domain/matching';
import { RecipeFiltersSheet } from './RecipeFiltersSheet';
import styles from './CriteriaToolbar.module.css';

export interface CriteriaToolbarProps {
  /** The committed criteria that currently filter the list. */
  criteria: RecipeCriteria;
  sheetOpen: boolean;
  onCloseSheet: () => void;
  /** Apply from the sheet: commit and close. */
  onApply: (criteria: RecipeCriteria) => void;
  /** Removing an applied chip commits immediately. */
  onRemove: (key: CriterionKey) => void;
  /** Leave dietary constraints out of the applied row (the Recipes root shows them as quick chips). */
  hideDietary?: boolean;
}

/**
 * The applied-criteria chips beneath the search field, plus the filter sheet they come
 * from, shared by recipe browsing and the Recipes search scope. The sheet is opened from
 * the field's trailing `FilterAction` (ledger D-27); the sheet is a draft, the chips are
 * the committed truth. Renders nothing visible when no criterion is applied.
 */
export function CriteriaToolbar({ criteria, sheetOpen, onCloseSheet, onApply, onRemove, hideDietary = false }: CriteriaToolbarProps) {
  const active = activeCriteria(criteria).filter((key) => !hideDietary || !key.startsWith('dietary:'));
  return (
    <>
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
    </>
  );
}
