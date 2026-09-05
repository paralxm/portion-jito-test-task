import { useId, useRef, useState, type ChangeEvent } from 'react';

import { AmountField } from '../../../design-system/components/AmountField/AmountField';
import { InlineMessage } from '../../../design-system/components/InlineMessage/InlineMessage';
import { TextField } from '../../../design-system/components/TextField/TextField';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Stack } from '../../../design-system/primitives/layout/Stack';
import { Text } from '../../../design-system/primitives/Text/Text';
import { AppHeader } from '../../../design-system/patterns/AppHeader/AppHeader';
import { UnitSheet } from '../../../design-system/patterns/UnitSheet/UnitSheet';
import { FocusedFlowLayout } from '../../../design-system/templates/FocusedFlowLayout/FocusedFlowLayout';
import { useExitGuard } from '../../../app/exit-guard';
import { DiscardChangesDialog } from '../components/DiscardChangesDialog';
import { PhotoField, type PhotoDraft } from '../components/PhotoField';
import type { FoodCandidate } from '../domain/calculation';
import { EMPTY_MANUAL_DRAFT, isManualDraftDirty, MANUAL_UNITS, validateManualDraft, type ManualDraft, type ManualErrors, type ManualUnit } from '../domain/manual-entry';
import styles from './ManualEntryScreen.module.css';

export interface ManualEntryScreenProps {
  /** The task-level draft: the app owns it so Back and Edit between steps keep every value. */
  draft: ManualDraft;
  onDraftChange: (draft: ManualDraft) => void;
  /** The optional photo, also owned by the task. */
  photo: PhotoDraft | null;
  onPhotoChange: (photo: PhotoDraft | null) => void;
  /** What the draft started as (empty, or a record being corrected); the dirty check compares against it. */
  initialDraft?: ManualDraft;
  /** Explains a correction draft, e.g. "Editing the values matched from barcode 5012345678900." */
  provenanceNote?: string;
  /** Continue validates and hands a candidate to the second step. Nothing is committed. */
  onContinue: (candidate: FoodCandidate) => void;
  /** The stable id the candidate keeps across the task (the photo store and recents key on it). */
  candidateId: string;
  /** Leaves the task once leaving is safe: an untouched draft exits at once, a dirty one after Discard changes. */
  onCancel: () => void;
  /** The header's Back when it differs from leaving the task — a correction draft returns to the review it came from. Same guard. */
  onBack?: () => void;
}

const FIELD_ORDER: readonly (keyof ManualDraft)[] = ['name', 'referenceQuantity', 'calories', 'protein', 'carbohydrates', 'fat'];

/**
 * S06 — Manual entry, Step 1 of 2: food details (ledger §12 D1, after R3). Identity
 * (name, optional photo), the reference amount and unit the values belong to, then the
 * nutrition for that amount — calories required, the macronutrients optional, where a
 * blank means unknown. This step defines the nutrition basis; the portion is chosen on
 * the next step and nothing is logged here. Back and Cancel apply the shared exit policy.
 */
export function ManualEntryScreen({ draft, onDraftChange, photo, onPhotoChange, initialDraft = EMPTY_MANUAL_DRAFT, provenanceNote, onContinue, candidateId, onCancel, onBack }: ManualEntryScreenProps) {
  const [errors, setErrors] = useState<ManualErrors>({});
  const [attempts, setAttempts] = useState(0);
  const [unitSheetOpen, setUnitSheetOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const base = useId();
  const fieldId = (key: keyof ManualDraft) => `manual-${key}-${base}`;

  const update = <K extends keyof ManualDraft>(key: K, value: ManualDraft[K]) => {
    onDraftChange({ ...draft, [key]: value });
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const errorCount = FIELD_ORDER.filter((key) => errors[key]).length;
  const dirty = isManualDraftDirty(draft, initialDraft) || photo !== null;

  const submit = () => {
    const result = validateManualDraft(draft, candidateId);
    setAttempts((n) => n + 1);
    if (!result.ok) {
      setErrors(result.errors);
      const first = FIELD_ORDER.find((key) => result.errors[key]);
      if (first) document.getElementById(fieldId(first))?.focus();
      return;
    }
    onContinue(result.candidate);
  };

  // Leaving: untouched exits at once; meaningful input asks first. Back and Cancel share the guard but may lead to different places.
  const leaveTarget = useRef<() => void>(onCancel);
  const requestLeave = (leave: () => void) => () => {
    leaveTarget.current = leave;
    if (dirty) setDiscardOpen(true);
    else leave();
  };
  const requestExit = requestLeave(onCancel);
  const requestBack = requestLeave(onBack ?? onCancel);
  useExitGuard(() => {
    if (!dirty) return false;
    leaveTarget.current = onBack ?? onCancel;
    setDiscardOpen(true);
    return true;
  }, dirty);

  return (
    <FocusedFlowLayout
      header={
        <AppHeader
          variant="focused"
          title="Food details"
          onBack={requestBack}
          trailing={
            <Text as="p" variant="supporting" color="secondary" className={styles.step}>
              Step 1 of 2
            </Text>
          }
        />
      }
      footer={
        <Stack gap={8}>
          <Button variant="primary" size="large" block onClick={submit}>
            Continue to portion
          </Button>
          <Button variant="text" block onClick={requestExit}>
            Cancel
          </Button>
        </Stack>
      }
    >
      <Text as="p" variant="body" color="secondary" wrap>
        Type the nutrition you know for a set amount. You choose the portion to calculate on the next step.
      </Text>

      {provenanceNote ? (
        <InlineMessage tone="info" announce="none">
          {provenanceNote}
        </InlineMessage>
      ) : null}

      <TextField
        id={fieldId('name')}
        label="Food or dish name"
        value={draft.name}
        onChange={(event: ChangeEvent<HTMLInputElement>) => update('name', event.target.value)}
        error={errors.name}
        placeholder="For example, Lentil soup"
        autoComplete="off"
      />

      <PhotoField value={photo} onChange={onPhotoChange} />

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
            Calories are required. A known zero is a value; a blank optional field stays unknown.
          </Text>
        </div>
        <AmountField id={fieldId('calories')} label="Calories" value={draft.calories} onChange={(value) => update('calories', value)} unit="kcal" error={errors.calories} helper={errors.calories ? undefined : 'Required. 0 is a valid value.'} />
        <AmountField id={fieldId('protein')} label="Protein" optional value={draft.protein} onChange={(value) => update('protein', value)} unit="g" error={errors.protein} helper={errors.protein ? undefined : 'Leave blank if unknown; it shows as not available, not as zero.'} />
        <AmountField id={fieldId('carbohydrates')} label="Carbohydrates" optional value={draft.carbohydrates} onChange={(value) => update('carbohydrates', value)} unit="g" error={errors.carbohydrates} helper={errors.carbohydrates ? undefined : 'Leave blank if unknown.'} />
        <AmountField id={fieldId('fat')} label="Fat" optional value={draft.fat} onChange={(value) => update('fat', value)} unit="g" error={errors.fat} helper={errors.fat ? undefined : 'Leave blank if unknown.'} />
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

      <DiscardChangesDialog
        open={discardOpen}
        onKeepEditing={() => setDiscardOpen(false)}
        onDiscard={() => {
          setDiscardOpen(false);
          leaveTarget.current();
        }}
      />
    </FocusedFlowLayout>
  );
}
