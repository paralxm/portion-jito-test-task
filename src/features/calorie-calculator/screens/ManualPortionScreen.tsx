import { useEffect, useRef, useState } from 'react';
import { PencilSimple } from '@phosphor-icons/react';

import { InlineMessage } from '../../../design-system/components/InlineMessage/InlineMessage';
import { MediaFrame } from '../../../design-system/components/MediaFrame/MediaFrame';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Stack } from '../../../design-system/primitives/layout/Stack';
import { Text } from '../../../design-system/primitives/Text/Text';
import { AppHeader } from '../../../design-system/patterns/AppHeader/AppHeader';
import { FocusedFlowLayout } from '../../../design-system/templates/FocusedFlowLayout/FocusedFlowLayout';
import { useExitGuard } from '../../../app/exit-guard';
import { DiscardChangesDialog } from '../components/DiscardChangesDialog';
import { PortionForm } from '../components/PortionForm';
import { usePortionDraft } from '../components/usePortionDraft';
import { describeReferenceBasis, type FoodCandidate, type Portion } from '../domain/calculation';
import { mealPhrase, type MealType } from '../domain/meal';
import styles from './ManualPortionScreen.module.css';

export interface ManualPortionScreenProps {
  /** The candidate built from the first step's details (name, reference basis, nutrition). */
  candidate: FoodCandidate;
  /** The user's photo preview from the first step, if any. */
  photoUrl?: string;
  /** The retained portion (carried across Back / Edit), or the reference basis at first. */
  initialPortion: Portion;
  /** Set when the retained portion could not be kept because the reference unit changed. */
  portionResetNote?: string;
  initialMeal: MealType | null;
  mealHint?: string;
  /** "today", "yesterday" or "on Thu, Sep 3" — shown when the commit lands on another day. */
  dayPhrase?: string;
  /** Mirrors the draft into the flow-level task so Back / Edit / Continue keep it. */
  onDraftChange?: (portion: Portion | null, unitId: string, meal: MealType | null) => void;
  /** Back and Edit food details return to the first step with everything kept — no confirmation. */
  onEditDetails: () => void;
  /** The one commit: exactly one entry on the bound day. */
  onAdd: (portion: Portion, meal: MealType) => void;
  /** Cancel leaves the whole task; a task with data asks first, then returns to the recorded origin. */
  onCancel: () => void;
}

/**
 * S06-5 — Manual entry, Step 2 of 2: portion and meal (ledger §12 D2, after R4). The
 * identity summary with Edit food details, the prominent editable amount with steps and
 * presets, the live result, the meal choice and the target day, then one final
 * `Add to {meal}`. Back keeps the draft; Cancel applies the shared exit policy.
 */
export function ManualPortionScreen({ candidate, photoUrl, initialPortion, portionResetNote, initialMeal, mealHint, dayPhrase, onDraftChange, onEditDetails, onAdd, onCancel }: ManualPortionScreenProps) {
  const draft = usePortionDraft(candidate, initialPortion);
  const [meal, setMeal] = useState<MealType | null>(initialMeal);
  const [discardOpen, setDiscardOpen] = useState(false);
  const submitted = useRef(false);

  useEffect(() => {
    onDraftChange?.(draft.portion, draft.unitId, meal);
    // The parent keeps the latest draft; identity of the callback is not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.portion, draft.unitId, meal]);

  // Reaching this step means the first step holds data, so leaving the task always asks.
  const requestCancel = () => setDiscardOpen(true);
  useExitGuard(() => {
    setDiscardOpen(true);
    return true;
  }, true);

  const add = () => {
    draft.markTouched();
    if (submitted.current || !draft.committable || !draft.portion || !meal) return;
    submitted.current = true;
    onAdd(draft.portion, meal);
  };

  return (
    <FocusedFlowLayout
      header={
        <AppHeader
          variant="focused"
          title="Portion and meal"
          onBack={onEditDetails}
          trailing={
            <Text as="p" variant="supporting" color="secondary" className={styles.step}>
              Step 2 of 2
            </Text>
          }
        />
      }
      footer={
        <Stack gap={8}>
          <Button variant="primary" size="large" block onClick={add} disabled={!draft.committable || meal === null}>
            {meal ? `Add to ${mealPhrase(meal)}` : 'Add to meal'}
          </Button>
          <Button variant="text" block onClick={requestCancel}>
            Cancel
          </Button>
        </Stack>
      }
    >
      <section className={styles.identity} aria-labelledby="manual-portion-name">
        <div className={styles.summary}>
          {photoUrl ? (
            <div className={styles.thumbnail}>
              <img src={photoUrl} alt="" className={styles.image} />
            </div>
          ) : (
            <div className={styles.thumbnail}>
              <MediaFrame aspect="4:3" compact />
            </div>
          )}
          <div className={styles.text}>
            <Text as="h2" id="manual-portion-name" variant="detail-heading" color="primary" wrap>
              {candidate.name}
            </Text>
            <Text as="p" variant="supporting" color="secondary" wrap>
              Entered by you · nutrition basis <span className={styles.basis}>{describeReferenceBasis(candidate).toLowerCase()}</span>
            </Text>
          </div>
        </div>
        <Button variant="secondary" size="small" icon={PencilSimple} onClick={onEditDetails} className={styles.edit}>
          Edit food details
        </Button>
      </section>

      <PortionForm candidate={candidate} draft={draft} meal={meal} onMealChange={setMeal} mealHint={mealHint} dayPhrase={dayPhrase} amountNote={portionResetNote}>
        {meal === null ? null : (
          <InlineMessage tone="info" announce="none">
            The amount above is the portion you are calculating, not the reference the values were entered for.
          </InlineMessage>
        )}
      </PortionForm>

      <DiscardChangesDialog open={discardOpen} onKeepEditing={() => setDiscardOpen(false)} onDiscard={() => { setDiscardOpen(false); onCancel(); }} />
    </FocusedFlowLayout>
  );
}
