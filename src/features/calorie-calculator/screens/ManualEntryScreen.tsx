import { useId, useState, type ChangeEvent } from 'react';

import { AmountField } from '../../../design-system/components/AmountField/AmountField';
import { InlineMessage } from '../../../design-system/components/InlineMessage/InlineMessage';
import { TextField } from '../../../design-system/components/TextField/TextField';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Text } from '../../../design-system/primitives/Text/Text';
import { AppHeader } from '../../../design-system/patterns/AppHeader/AppHeader';
import { ConfirmDialog } from '../../../design-system/patterns/ConfirmDialog/ConfirmDialog';
import { UnitSheet } from '../../../design-system/patterns/UnitSheet/UnitSheet';
import { FocusedFlowLayout } from '../../../design-system/templates/FocusedFlowLayout/FocusedFlowLayout';
import type { FoodCandidate } from '../domain/calculation';
import { EMPTY_MANUAL_DRAFT, isManualDraftDirty, MANUAL_UNITS, validateManualDraft, type ManualDraft, type ManualErrors, type ManualUnit } from '../domain/manual-entry';
import styles from './ManualEntryScreen.module.css';

export interface ManualEntryScreenProps {
  /** Starting values; the dirty check compares against them. */
  initialDraft?: ManualDraft;
  /** Continue validates and hands a candidate to review. Nothing is committed yet. */
  onContinue: (candidate: FoodCandidate, draft: ManualDraft) => void;
  /** Called once leaving is safe: untouched entry, or Discard confirmed. */
  onBack: () => void;
}

const FIELD_ORDER: readonly (keyof ManualDraft)[] = ['name', 'referenceQuantity', 'calories', 'protein', 'carbohydrates', 'fat'];

/**
 * S06 — Manual entry. Establishes the food's reference basis and nutrition; the portion
 * to calculate is chosen on review. Validation runs on Continue, a meaningful dirty
 * draft asks before discarding, and an untouched form leaves directly.
 */
export function ManualEntryScreen({ initialDraft = EMPTY_MANUAL_DRAFT, onContinue, onBack }: ManualEntryScreenProps) {
  const [draft, setDraft] = useState<ManualDraft>(initialDraft);
  const [errors, setErrors] = useState<ManualErrors>({});
  const [attempts, setAttempts] = useState(0);
  const [unitSheetOpen, setUnitSheetOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const base = useId();
  const fieldId = (key: keyof ManualDraft) => `manual-${key}-${base}`;

  const update = <K extends keyof ManualDraft>(key: K, value: ManualDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const errorCount = FIELD_ORDER.filter((key) => errors[key]).length;

  const submit = () => {
    const result = validateManualDraft(draft);
    setAttempts((n) => n + 1);
    if (!result.ok) {
      setErrors(result.errors);
      const first = FIELD_ORDER.find((key) => result.errors[key]);
      if (first) document.getElementById(fieldId(first))?.focus();
      return;
    }
    onContinue(result.candidate, draft);
  };

  const requestBack = () => {
    if (isManualDraftDirty(draft, initialDraft)) setDiscardOpen(true);
    else onBack();
  };

  return (
    <FocusedFlowLayout
      header={<AppHeader variant="focused" title="Enter manually" onBack={requestBack} />}
      footer={
        <Button variant="primary" size="large" block onClick={submit}>
          Continue to review
        </Button>
      }
    >
      <Text as="p" variant="body" color="secondary" wrap>
        Type the nutrition you know for a set amount. You choose the portion to calculate on the next screen.
      </Text>

      <TextField
        id={fieldId('name')}
        label="Food or dish name"
        value={draft.name}
        onChange={(event: ChangeEvent<HTMLInputElement>) => update('name', event.target.value)}
        error={errors.name}
        placeholder="For example, Lentil soup"
        autoComplete="off"
      />

      <section className={styles.group} aria-labelledby={`${base}-reference`}>
        <div className={styles.groupHeading}>
          <Text as="h2" id={`${base}-reference`} variant="section-title" color="primary">
            Reference amount
          </Text>
          <Text as="p" variant="supporting" color="secondary" wrap>
            The amount your values are for, such as 100 g or 1 serving.
          </Text>
        </div>
        <AmountField
          id={fieldId('referenceQuantity')}
          label="Amount"
          value={draft.referenceQuantity}
          onChange={(value) => update('referenceQuantity', value)}
          unit={draft.referenceUnit}
          onRequestUnitChange={() => setUnitSheetOpen(true)}
          error={errors.referenceQuantity}
        />
      </section>

      <section className={styles.group} aria-labelledby={`${base}-nutrition`}>
        <div className={styles.groupHeading}>
          <Text as="h2" id={`${base}-nutrition`} variant="section-title" color="primary">
            Nutrition for that amount
          </Text>
          <Text as="p" variant="supporting" color="secondary" wrap>
            Leave a value blank if you do not know it. It will show as not available, not as zero.
          </Text>
        </div>
        <AmountField id={fieldId('calories')} label="Calories" value={draft.calories} onChange={(value) => update('calories', value)} unit="kcal" error={errors.calories} />
        <AmountField id={fieldId('protein')} label="Protein" optional value={draft.protein} onChange={(value) => update('protein', value)} unit="g" error={errors.protein} />
        <AmountField id={fieldId('carbohydrates')} label="Carbohydrates" optional value={draft.carbohydrates} onChange={(value) => update('carbohydrates', value)} unit="g" error={errors.carbohydrates} />
        <AmountField id={fieldId('fat')} label="Fat" optional value={draft.fat} onChange={(value) => update('fat', value)} unit="g" error={errors.fat} />
      </section>

      {errorCount > 0 ? (
        <InlineMessage key={attempts} tone="error" announce="alert">
          {errorCount === 1 ? 'Check the highlighted field before continuing.' : `Check the ${errorCount} highlighted fields before continuing.`}
        </InlineMessage>
      ) : null}

      <UnitSheet
        open={unitSheetOpen}
        options={MANUAL_UNITS}
        value={draft.referenceUnit}
        onConfirm={(unitId) => {
          update('referenceUnit', unitId as ManualUnit);
          setUnitSheetOpen(false);
        }}
        onCancel={() => setUnitSheetOpen(false)}
      />

      <ConfirmDialog
        open={discardOpen}
        title="Discard this entry?"
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        destructive
        onConfirm={() => {
          setDiscardOpen(false);
          onBack();
        }}
        onCancel={() => setDiscardOpen(false)}
      >
        The values you typed will be lost. Nothing already added to today changes.
      </ConfirmDialog>
    </FocusedFlowLayout>
  );
}
