import { useEffect, useId, useState } from 'react';

import { AmountField } from '../../../design-system/components/AmountField/AmountField';
import { FilterChip } from '../../../design-system/components/Chip/Chip';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Stack } from '../../../design-system/primitives/layout/Stack';
import { Inline } from '../../../design-system/primitives/layout/Inline';
import { Text } from '../../../design-system/primitives/Text/Text';
import { ModalSheet } from '../../../design-system/patterns/ModalSheet/ModalSheet';
import { canonicalDietary, DIETARY_OPTIONS, draftFromCriteria, EMPTY_DRAFT, validateDraft, type CriteriaDraft, type DietaryPreference, type DraftErrors, type RecipeCriteria } from '../domain/matching';
import styles from './RecipeFiltersSheet.module.css';

export interface RecipeFiltersSheetProps {
  open: boolean;
  /** The committed criteria; the draft starts from them and Cancel restores them. */
  applied: RecipeCriteria;
  /** Apply validates the draft and commits it; the sheet returns to the invoking surface. */
  onApply: (criteria: RecipeCriteria) => void;
  /** Close, backdrop or Escape: unapplied edits are discarded. */
  onCancel: () => void;
}

/**
 * O02 — recipe filters as a modal draft over the same criteria the quick chips edit
 * (ledger §12 B3): dietary constraints as a set of toggles combined with AND, a calorie
 * range (one criterion), a protein minimum and a preparation maximum. Reset all clears
 * the draft only (it takes effect on Apply); Apply validates, refuses an invalid range
 * and commits; Cancel keeps the previously applied criteria untouched.
 */
export function RecipeFiltersSheet({ open, applied, onApply, onCancel }: RecipeFiltersSheetProps) {
  const [draft, setDraft] = useState<CriteriaDraft>(() => draftFromCriteria(applied));
  const [errors, setErrors] = useState<DraftErrors>({});
  const id = useId();
  const dietaryLabelId = `dietary-${id}`;

  useEffect(() => {
    if (open) {
      setDraft(draftFromCriteria(applied));
      setErrors({});
    }
  }, [open, applied]);

  const update = <K extends keyof CriteriaDraft>(key: K, value: CriteriaDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const toggle = (option: DietaryPreference) => {
    const current = draft.dietary;
    update('dietary', canonicalDietary(current.includes(option) ? current.filter((d) => d !== option) : [...current, option]));
  };

  const apply = () => {
    const result = validateDraft(draft);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onApply(result.criteria);
  };

  return (
    <ModalSheet
      open={open}
      onRequestClose={onCancel}
      title="Filters"
      description="Recipes must match every filter you set. Leave a field blank to skip it."
      footer={
        <div className={styles.footer}>
          <Button variant="text" size="small" onClick={() => { setDraft(EMPTY_DRAFT); setErrors({}); }}>
            Reset all
          </Button>
          <Button variant="primary" onClick={apply}>
            Apply filters
          </Button>
        </div>
      }
    >
      {/* Gap between this form's own field-groups matches ManualEntryScreen's
          spacing.form-group (16 px) — the same "gap between groups within one form"
          concept both forms use, not spacing.section (24 px), which is for major
          screen-level regions. */}
      <Stack gap={16}>
        <fieldset className={styles.group} role="group" aria-labelledby={dietaryLabelId}>
          <Text as="legend" id={dietaryLabelId} variant="label" color="primary" className={styles.legend}>
            Dietary
          </Text>
          <Text as="p" variant="supporting" color="secondary" className={styles.hint}>
            Choose any that apply; a recipe must satisfy all of them. Based on what each recipe declares — a vegan recipe also counts as vegetarian. Not an allergen check.
          </Text>
          <Inline gap={8} wrap block>
            <FilterChip selected={draft.dietary.length === 0} onClick={() => update('dietary', [])}>
              All
            </FilterChip>
            {DIETARY_OPTIONS.map((option) => (
              <FilterChip key={option.id} selected={draft.dietary.includes(option.id)} onClick={() => toggle(option.id)}>
                {option.label}
              </FilterChip>
            ))}
          </Inline>
        </fieldset>

        <fieldset className={styles.group}>
          <Text as="legend" variant="label" color="primary" className={styles.legend}>
            Calories per serving
          </Text>
          <div className={styles.range}>
            <AmountField label="Minimum" optional value={draft.caloriesMin} onChange={(v) => update('caloriesMin', v)} unit="kcal" error={errors.caloriesMin} placeholder="Any" />
            <AmountField label="Maximum" optional value={draft.caloriesMax} onChange={(v) => update('caloriesMax', v)} unit="kcal" error={errors.caloriesMax} placeholder="Any" />
          </div>
        </fieldset>

        <AmountField label="Protein per serving, at least" optional value={draft.proteinMin} onChange={(v) => update('proteinMin', v)} unit="g" error={errors.proteinMin} placeholder="Any" />

        <AmountField label="Preparation time, at most" optional value={draft.preparationMax} onChange={(v) => update('preparationMax', v)} unit="min" error={errors.preparationMax} placeholder="Any" />
      </Stack>
    </ModalSheet>
  );
}
