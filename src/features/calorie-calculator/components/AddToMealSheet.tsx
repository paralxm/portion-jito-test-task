import { useEffect, useMemo, useRef, useState } from 'react';

import { AmountField } from '../../../design-system/components/AmountField/AmountField';
import { MediaFrame } from '../../../design-system/components/MediaFrame/MediaFrame';
import { NutritionMacros } from '../../../design-system/components/NutritionMacros/NutritionMacros';
import { NutritionValue } from '../../../design-system/components/NutritionValue/NutritionValue';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Inline } from '../../../design-system/primitives/layout/Inline';
import { Stack } from '../../../design-system/primitives/layout/Stack';
import { Text } from '../../../design-system/primitives/Text/Text';
import { ModalSheet } from '../../../design-system/patterns/ModalSheet/ModalSheet';
import { describePortionBasis, describeReferenceBasis, findUnit, formatQuantityDraft, parseAmount, scaleNutrition, type FoodCandidate, type Portion } from '../domain/calculation';
import { MEAL_LABELS, mealPhrase, type MealType } from '../domain/meal';
import { MealPicker } from './MealPicker';
import styles from './AddToMealSheet.module.css';

export interface AddToMealSheetProps {
  open: boolean;
  /** The reviewed food, or a recipe expressed as a candidate (1 serving = its serving grams). */
  candidate: FoodCandidate | null;
  /** The reviewed portion; the sheet keeps its unit (unit changes stay on review). */
  initialPortion: Portion | null;
  /** Preselected meal: from the Home row that started the task, else the time-of-day suggestion. */
  initialMeal: MealType | null;
  /** Why the meal is preselected, shown under the picker, e.g. "Suggested for this time of day." */
  mealHint?: string;
  /** "yesterday" or "on Thu, Sep 3" when the commit lands on another day (ledger §12 A4). */
  dayPhrase?: string;
  /** The single commit: one entry in the chosen meal. */
  onConfirm: (meal: MealType, portion: Portion) => void;
  /** Cancel, close, backdrop and Escape: nothing changes. */
  onCancel: () => void;
}

/**
 * O05-2 — the Add-to-meal sheet for a recipe from Recipe Details (ledger D-23, §12 E3:
 * foods commit on their review screen and no longer pass through a sheet): thumbnail when the
 * item has one, name and basis, the meal choice, the amount or servings in the review's
 * unit, the recalculated calories and macros, and the single final action `Add to
 * {meal}`. The action is unavailable while the amount is invalid or no meal is chosen,
 * and a second activation before the sheet closes is ignored. No exact time is asked.
 */
export function AddToMealSheet({ open, candidate, initialPortion, initialMeal, mealHint, dayPhrase, onConfirm, onCancel }: AddToMealSheetProps) {
  const [meal, setMeal] = useState<MealType | null>(initialMeal);
  const [quantity, setQuantity] = useState(initialPortion ? formatQuantityDraft(initialPortion.quantity) : '');
  const [touched, setTouched] = useState(false);
  const submitted = useRef(false);
  // Initialised to the mount state: the state initialisers above already reflect the props,
  // so only a later closed-to-open transition resets the draft (a passive effect on mount
  // could otherwise run after a script had already typed into the field).
  const wasOpen = useRef(open);

  // The draft starts from the props each time the sheet opens; later prop identity changes
  // (a parent re-render) never overwrite what the user has typed.
  useEffect(() => {
    if (open && !wasOpen.current) {
      setMeal(initialMeal);
      setQuantity(initialPortion ? formatQuantityDraft(initialPortion.quantity) : '');
      setTouched(false);
      submitted.current = false;
    }
    wasOpen.current = open;
  }, [open, initialMeal, initialPortion]);

  const unitId = initialPortion?.unitId ?? candidate?.reference.unitId ?? 'g';
  const unit = candidate ? findUnit(candidate, unitId) : undefined;
  const parsed = parseAmount(quantity);
  const portion: Portion | null = parsed.ok ? { quantity: parsed.value, unitId } : null;
  const result = useMemo(() => (candidate && portion ? scaleNutrition(candidate, portion) : null), [candidate, portion]);
  const committable = meal !== null && portion !== null && result !== null && result.energyKcal !== null;
  const isServing = unitId === 'serving';

  const amountError =
    touched && !parsed.ok
      ? parsed.reason === 'empty'
        ? `Enter the ${isServing ? 'number of servings' : 'amount'} to add`
        : parsed.reason === 'not-positive'
          ? 'Enter an amount greater than zero'
          : 'Enter a number, for example 1 or 1.5'
      : undefined;

  const confirm = () => {
    setTouched(true);
    if (submitted.current || !committable || !portion || !meal) return;
    submitted.current = true;
    onConfirm(meal, portion);
  };

  return (
    <ModalSheet
      open={open}
      onRequestClose={onCancel}
      title="Add to meal"
      description="Choose the meal and confirm the amount. Nothing is added until you confirm."
      footer={
        <Inline gap={8} distribute="fill" align="stretch">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirm} disabled={!committable}>
            {meal ? `Add to ${mealPhrase(meal)}` : 'Add to meal'}
          </Button>
        </Inline>
      }
    >
      {candidate ? (
        <Stack gap={16}>
          <div className={styles.item}>
            {candidate.imageUrl ? (
              <div className={styles.thumbnail}>
                <MediaFrame aspect="4:3" imageUrl={candidate.imageUrl} imageAlt="" compact eager />
              </div>
            ) : null}
            <div className={styles.identity}>
              <Text as="p" variant="item-title" color="primary" wrap>
                {candidate.name}
              </Text>
              <Text as="p" variant="supporting" color="secondary" wrap>
                Nutrition basis: {describeReferenceBasis(candidate).toLowerCase()}
                {candidate.source === 'recipe' && unit?.description ? ` · ${unit.description}` : ''}
              </Text>
            </div>
          </div>

          <MealPicker value={meal} onChange={setMeal} hint={mealHint} />

          <AmountField
            label={isServing ? 'Servings' : 'Amount'}
            value={quantity}
            onChange={setQuantity}
            onBlur={() => setTouched(true)}
            unit={unit?.label ?? unitId}
            error={amountError}
            helper={amountError ? undefined : 'The preview updates as you type a valid amount.'}
          />

          <div className={styles.preview} aria-label="Preview for this amount">
            <NutritionValue size="secondary" value={result?.energyKcal ?? null} unit="kcal" label="Calories" basis={portion ? describePortionBasis(candidate, portion) : ''} status={portion && result ? 'known' : 'stale'} />
            <NutritionMacros size="compact" protein={{ value: result?.proteinG ?? null }} carbohydrates={{ value: result?.carbohydratesG ?? null }} fat={{ value: result?.fatG ?? null }} status={portion && result ? 'known' : 'stale'} />
          </div>
          {meal ? null : (
            <Text as="p" variant="supporting" color="secondary" wrap>
              Choose {Object.values(MEAL_LABELS).slice(0, 3).join(', ').toLowerCase()} or snacks to continue.
            </Text>
          )}
          {dayPhrase ? (
            <Text as="p" variant="supporting" color="secondary" wrap>
              This adds to your record {dayPhrase}, the day you were viewing when you started.
            </Text>
          ) : null}
        </Stack>
      ) : null}
    </ModalSheet>
  );
}
