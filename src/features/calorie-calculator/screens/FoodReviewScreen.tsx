import { useMemo, useRef, useState } from 'react';

import { AmountField } from '../../../design-system/components/AmountField/AmountField';
import { InlineMessage } from '../../../design-system/components/InlineMessage/InlineMessage';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Stack } from '../../../design-system/primitives/layout/Stack';
import { AppHeader } from '../../../design-system/patterns/AppHeader/AppHeader';
import { ConfirmDialog } from '../../../design-system/patterns/ConfirmDialog/ConfirmDialog';
import { NutritionSummary } from '../../../design-system/patterns/NutritionSummary/NutritionSummary';
import { UnitSheet } from '../../../design-system/patterns/UnitSheet/UnitSheet';
import { FocusedFlowLayout } from '../../../design-system/templates/FocusedFlowLayout/FocusedFlowLayout';
import { FoodIdentityHeader } from '../components/FoodIdentityHeader';
import {
  canCalculateEnergy,
  convertQuantity,
  describePortionBasis,
  findUnit,
  formatQuantityDraft,
  parseAmount,
  scaleNutrition,
  type FoodCandidate,
  type Portion,
} from '../domain/calculation';

/**
 * `new` reviews a candidate from any entry method: the result is the task's answer and
 * Add to today is optional. `existing` reviews a logged entry from Home: the draft starts
 * from its committed portion, Update entry commits, Remove entry deletes after confirmation.
 */
export type ReviewMode = 'new' | 'existing';

export interface FoodReviewScreenProps {
  candidate: FoodCandidate;
  mode?: ReviewMode;
  /** Portion to start from; defaults to the reference basis (new) or the entry's portion (existing). */
  initialPortion?: Portion;
  /** Back returns to the actual preceding step (new) or Home (existing) with its input intact. */
  onBack: () => void;
  /** Correction route for a new candidate: search or manual entry, decided by the caller. Not offered for an existing entry. */
  onChangeMatch?: () => void;
  /** new: creates one entry and returns to Home. */
  onAddToToday?: (portion: Portion) => void;
  /** new: closes the food task to its invoking surface without logging. */
  onDone?: () => void;
  /** existing: commits the edited portion to the same entry. */
  onUpdateEntry?: (portion: Portion) => void;
  /** existing: removes the entry after the confirmation. */
  onRemoveEntry?: () => void;
}

const sourceExplanation: Record<FoodCandidate['source'], string | null> = {
  search: null,
  barcode: 'Matched from the barcode. If this is not the right product, change it before adding it.',
  photo: 'Suggested from your photo. Check the food and set the amount you will eat — the photo does not measure it.',
  manual: 'Entered by you. The amount below is the portion you are calculating, not the reference basis.',
};

/**
 * S07 — Food review and portion. Common to every entry method; only the source
 * explanation differs. The result previews as the amount changes; understanding it
 * completes the calorie task. Adding it to today (or updating an existing entry) is the
 * one explicit commit; Back, Done and Cancel never log anything.
 */
export function FoodReviewScreen({ candidate, mode = 'new', initialPortion, onBack, onChangeMatch, onAddToToday, onDone, onUpdateEntry, onRemoveEntry }: FoodReviewScreenProps) {
  const startPortion: Portion = initialPortion ?? { quantity: candidate.reference.quantity, unitId: candidate.reference.unitId };
  const [quantity, setQuantity] = useState(() => formatQuantityDraft(startPortion.quantity));
  const [unitId, setUnitId] = useState(startPortion.unitId);
  const [touched, setTouched] = useState(false);
  const [unitSheetOpen, setUnitSheetOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const submitted = useRef(false);

  const parsed = parseAmount(quantity);
  const portion: Portion | null = parsed.ok ? { quantity: parsed.value, unitId } : null;
  const result = useMemo(() => (portion ? scaleNutrition(candidate, portion) : null), [candidate, portion]);
  const energyAvailable = canCalculateEnergy(candidate);
  const partial = [candidate.nutrition.proteinG, candidate.nutrition.carbohydratesG, candidate.nutrition.fatG].some((v) => v === null);
  const dirty = mode === 'existing' && (!portion || portion.quantity !== startPortion.quantity || portion.unitId !== startPortion.unitId);

  const amountError =
    touched && !parsed.ok
      ? parsed.reason === 'empty'
        ? 'Enter the amount you want to calculate'
        : parsed.reason === 'not-positive'
          ? 'Enter an amount greater than zero'
          : 'Enter a number, for example 250 or 0.5'
      : undefined;

  const explanation = mode === 'new' ? sourceExplanation[candidate.source] : null;
  const unit = findUnit(candidate, unitId);

  // One activation creates or updates one entry; a second tap before the app navigates
  // away must not create a duplicate.
  const commit = (handler: ((portion: Portion) => void) | undefined) => {
    setTouched(true);
    if (submitted.current || !handler) return;
    if (portion && result && result.energyKcal !== null) {
      submitted.current = true;
      handler(portion);
    }
  };

  const requestBack = () => {
    if (dirty) setDiscardOpen(true);
    else onBack();
  };

  const footer =
    mode === 'existing' ? (
      <Stack gap={8}>
        <Button variant="primary" block onClick={() => commit(onUpdateEntry)} disabled={!energyAvailable}>
          Update entry
        </Button>
        <Button variant="destructive" block onClick={() => setRemoveOpen(true)}>
          Remove entry
        </Button>
      </Stack>
    ) : (
      <Stack gap={8}>
        <Button variant="primary" block onClick={() => commit(onAddToToday)} disabled={!energyAvailable}>
          Add to today
        </Button>
        <Button variant="text" block onClick={onDone ?? onBack}>
          Done
        </Button>
      </Stack>
    );

  return (
    <FocusedFlowLayout header={<AppHeader variant="focused" title={mode === 'existing' ? 'Edit entry' : 'Review food'} onBack={requestBack} />} footer={footer}>
      <FoodIdentityHeader candidate={candidate} onChangeFood={mode === 'new' ? onChangeMatch : undefined} headingId="review-food-name" />

      {explanation ? (
        <InlineMessage tone="info" announce="none">
          {explanation}
        </InlineMessage>
      ) : null}

      {!energyAvailable ? (
        <InlineMessage
          tone="error"
          title="Calories are not available for this food"
          announce="none"
          actions={
            onChangeMatch ? (
              <Button variant="secondary" size="small" onClick={onChangeMatch}>
                Choose a different food
              </Button>
            ) : undefined
          }
        >
          Nutrition information is unavailable for this ingredient, so a portion cannot be calculated or added to today. Choose another match or enter the values manually.
        </InlineMessage>
      ) : null}

      <AmountField
        label="Amount to calculate"
        value={quantity}
        onChange={(v) => setQuantity(v)}
        onBlur={() => setTouched(true)}
        unit={unit?.label ?? unitId}
        onRequestUnitChange={candidate.units.length > 1 ? () => setUnitSheetOpen(true) : undefined}
        error={amountError}
        helper={!amountError ? 'The result updates as you type a valid amount.' : undefined}
        disabled={!energyAvailable}
      />

      {energyAvailable ? (
        <NutritionSummary
          energy={result?.energyKcal ?? null}
          protein={result?.proteinG ?? null}
          carbohydrates={result?.carbohydratesG ?? null}
          fat={result?.fatG ?? null}
          basis={portion ? describePortionBasis(candidate, portion) : ''}
          status={portion && result ? 'known' : 'stale'}
          additional={result?.fibreG !== undefined ? { fibre: result?.fibreG ?? null } : undefined}
          expanded={expanded}
          onToggleExpanded={setExpanded}
        />
      ) : null}

      {partial && energyAvailable ? (
        <InlineMessage tone="info" announce="none">
          Some nutrition values are not available for this food. They are shown as not available, not as zero.
        </InlineMessage>
      ) : null}

      <UnitSheet
        open={unitSheetOpen}
        options={candidate.units.map((u) => ({ id: u.id, label: u.label, description: u.description }))}
        value={unitId}
        onConfirm={(next) => {
          setUnitSheetOpen(false);
          if (next === unitId) return;
          // Keep the portion: re-express a valid draft in the new unit.
          if (parsed.ok) {
            const converted = convertQuantity(candidate, parsed.value, unitId, next);
            if (converted !== null && converted > 0) setQuantity(formatQuantityDraft(converted));
          }
          setUnitId(next);
        }}
        onCancel={() => setUnitSheetOpen(false)}
      />

      <ConfirmDialog
        open={removeOpen}
        title={`Remove ${candidate.name} from today?`}
        confirmLabel="Remove"
        cancelLabel="Keep entry"
        destructive
        onConfirm={() => {
          setRemoveOpen(false);
          onRemoveEntry?.();
        }}
        onCancel={() => setRemoveOpen(false)}
      >
        It leaves today&rsquo;s food and totals. Nothing else changes.
      </ConfirmDialog>

      <ConfirmDialog
        open={discardOpen}
        title="Discard the changed amount?"
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        destructive
        onConfirm={() => {
          setDiscardOpen(false);
          onBack();
        }}
        onCancel={() => setDiscardOpen(false)}
      >
        The entry keeps its logged amount. Nothing is removed.
      </ConfirmDialog>
    </FocusedFlowLayout>
  );
}
