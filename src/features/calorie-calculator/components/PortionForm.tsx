import { useState, type ReactNode } from 'react';
import { Minus, Plus } from '@phosphor-icons/react';

import { AmountField } from '../../../design-system/components/AmountField/AmountField';
import { FilterChip } from '../../../design-system/components/Chip/Chip';
import { InlineMessage } from '../../../design-system/components/InlineMessage/InlineMessage';
import { IconButton } from '../../../design-system/primitives/IconButton/IconButton';
import { Surface } from '../../../design-system/primitives/Surface/Surface';
import { NutritionSummary } from '../../../design-system/patterns/NutritionSummary/NutritionSummary';
import { UnitSheet } from '../../../design-system/patterns/UnitSheet/UnitSheet';
import { describePortionBasis, findUnit, type FoodCandidate } from '../domain/calculation';
import type { MealType } from '../domain/meal';
import { MealPicker } from './MealPicker';
import type { PortionDraft } from './usePortionDraft';
import styles from './PortionForm.module.css';

export interface PortionFormProps {
  candidate: FoodCandidate;
  draft: PortionDraft;
  /** The meal choice; omit `onMealChange` to hide the picker (existing-entry review shows it above the form). */
  meal?: MealType | null;
  onMealChange?: (meal: MealType) => void;
  mealHint?: string;
  /** Shown when the commit lands on a day other than today, e.g. "yesterday" or "on Thu, Sep 3". */
  dayPhrase?: string;
  /** A note under the amount, e.g. when a retained portion had to be reset after the unit changed. */
  amountNote?: string;
  amountLabel?: string;
  /** Extra content under the result (e.g. the partial-data note). */
  children?: ReactNode;
  className?: string;
}

/**
 * The shared portion step (ledger §12 D2, E3, after R4): a prominent, directly editable
 * amount with − / + steps in documented increments, presets only from what the item's
 * data supports, the recalculated calories and macros for that amount, then the meal
 * choice and the target-day context. Used by manual entry's second step, every review
 * and the recipe sheet, so there is one commit path and one arithmetic.
 */
export function PortionForm({ candidate, draft, meal, onMealChange, mealHint, dayPhrase, amountNote, amountLabel = 'Amount to calculate', children, className }: PortionFormProps) {
  const [unitSheetOpen, setUnitSheetOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const unit = findUnit(candidate, draft.unitId);
  const unitLabel = unit?.label ?? draft.unitId;
  const stepLabel = draft.unitId === 'serving' ? 'a quarter serving' : draft.unitId === 'g' || draft.unitId === 'ml' ? `25 ${unitLabel}` : `one ${unitLabel}`;

  return (
    <div className={[styles.form, className].filter(Boolean).join(' ')}>
      <div className={styles.amountRow}>
        <IconButton icon={Minus} label={`Decrease by ${stepLabel}`} variant="outlined" onClick={() => draft.step(-1)} disabled={!draft.energyAvailable} className={styles.stepper} />
        <AmountField
          label={amountLabel}
          value={draft.quantity}
          onChange={draft.setQuantity}
          onBlur={draft.markTouched}
          unit={unitLabel}
          onRequestUnitChange={candidate.units.length > 1 ? () => setUnitSheetOpen(true) : undefined}
          error={draft.amountError}
          helper={draft.amountError ? undefined : (amountNote ?? 'The result updates as you type a valid amount.')}
          disabled={!draft.energyAvailable}
          className={styles.amount}
        />
        <IconButton icon={Plus} label={`Increase by ${stepLabel}`} variant="outlined" onClick={() => draft.step(1)} disabled={!draft.energyAvailable} className={styles.stepper} />
      </div>

      {draft.presets.length > 0 && draft.energyAvailable ? (
        <div className={styles.presets} role="group" aria-label="Amount presets">
          {draft.presets.map((preset) => (
            <FilterChip key={`${preset.unitId}-${preset.quantity}`} selected={draft.isPreset(preset)} onClick={() => draft.applyPreset(preset)}>
              {preset.label}
            </FilterChip>
          ))}
        </div>
      ) : null}

      {draft.energyAvailable ? (
        <Surface tone="surface" border="none" radius="card" padding={16} className={styles.result}>
          <NutritionSummary
            energy={draft.result?.energyKcal ?? null}
            protein={draft.result?.proteinG ?? null}
            carbohydrates={draft.result?.carbohydratesG ?? null}
            fat={draft.result?.fatG ?? null}
            basis={draft.portion ? describePortionBasis(candidate, draft.portion) : ''}
            status={draft.portion && draft.result ? 'known' : 'stale'}
            additional={draft.result?.fibreG !== undefined ? { fibre: draft.result?.fibreG ?? null } : undefined}
            expanded={expanded}
            onToggleExpanded={setExpanded}
          />
        </Surface>
      ) : null}

      {children}

      {onMealChange ? <MealPicker value={meal ?? null} onChange={onMealChange} hint={mealHint} /> : null}

      {dayPhrase ? (
        <InlineMessage tone="info" announce="none">
          This adds to your record {dayPhrase}, the day you were viewing when you started.
        </InlineMessage>
      ) : null}

      <UnitSheet
        open={unitSheetOpen}
        options={candidate.units.map((u) => ({ id: u.id, label: u.label, description: u.description }))}
        value={draft.unitId}
        onConfirm={(next) => {
          setUnitSheetOpen(false);
          draft.changeUnit(next);
        }}
        onCancel={() => setUnitSheetOpen(false)}
      />
    </div>
  );
}

/** The short phrase under the picker when the task did not start from a meal row. */
export const SUGGESTED_MEAL_HINT = 'Suggested for this time of day. Change it if you like.';
export const PRESELECTED_MEAL_HINT = 'Preselected from the meal you started from. Change it if you like.';
