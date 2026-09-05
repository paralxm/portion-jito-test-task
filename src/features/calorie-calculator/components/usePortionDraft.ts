import { useMemo, useState } from 'react';

import { canCalculateEnergy, convertQuantity, formatQuantityDraft, parseAmount, scaleNutrition, type FoodCandidate, type NutritionValues, type Portion } from '../domain/calculation';
import { portionPresets, presetSelected, stepQuantity, type PortionPreset } from '../domain/portion-draft';

export interface PortionDraft {
  quantity: string;
  unitId: string;
  setQuantity: (draft: string) => void;
  /** Re-expresses a valid draft in the new unit when the item's data supports it; the draft stays otherwise. */
  changeUnit: (unitId: string) => void;
  step: (direction: 1 | -1) => void;
  applyPreset: (preset: PortionPreset) => void;
  presets: PortionPreset[];
  isPreset: (preset: PortionPreset) => boolean;
  /** The parsed portion, or `null` while the draft is invalid. */
  portion: Portion | null;
  result: NutritionValues | null;
  /** Energy can be calculated for this item at all. */
  energyAvailable: boolean;
  /** A valid portion with a calculable calorie result — the commit's precondition. */
  committable: boolean;
  touched: boolean;
  markTouched: () => void;
  amountError: string | undefined;
  /** True once the draft differs from what it started as. */
  changed: boolean;
}

const AMOUNT_ERRORS = {
  empty: 'Enter the amount you want to calculate',
  'not-positive': 'Enter an amount greater than zero',
  invalid: 'Enter a number, for example 250 or 0.5',
} as const;

/**
 * The portion state every commit surface shares (ledger §12 D2, E3): one string draft
 * parsed with the shared decimal policy, the unit, the recalculated result, the
 * documented − / + steps and the item's own presets. Precision stays internal; display
 * rounding belongs to the presentation.
 */
export function usePortionDraft(candidate: FoodCandidate, initial: Portion): PortionDraft {
  const [quantity, setQuantity] = useState(() => formatQuantityDraft(initial.quantity));
  const [unitId, setUnitId] = useState(initial.unitId);
  const [touched, setTouched] = useState(false);

  const parsed = parseAmount(quantity);
  const portion = useMemo<Portion | null>(() => (parsed.ok ? { quantity: parsed.value, unitId } : null), [parsed.ok, parsed.ok ? parsed.value : null, unitId]);
  const result = useMemo(() => (portion ? scaleNutrition(candidate, portion) : null), [candidate, portion]);
  const energyAvailable = canCalculateEnergy(candidate);
  const committable = energyAvailable && portion !== null && result !== null && result.energyKcal !== null;
  const presets = useMemo(() => portionPresets(candidate, unitId), [candidate, unitId]);

  const changeUnit = (next: string) => {
    if (next === unitId) return;
    if (parsed.ok) {
      const converted = convertQuantity(candidate, parsed.value, unitId, next);
      if (converted !== null && converted > 0) setQuantity(formatQuantityDraft(converted));
    }
    setUnitId(next);
  };

  return {
    quantity,
    unitId,
    setQuantity,
    changeUnit,
    step: (direction) => {
      setQuantity(stepQuantity(quantity, unitId, direction));
      setTouched(true);
    },
    applyPreset: (preset) => {
      setUnitId(preset.unitId);
      setQuantity(formatQuantityDraft(preset.quantity));
      setTouched(true);
    },
    presets,
    isPreset: (preset) => presetSelected(preset, quantity, unitId),
    portion,
    result,
    energyAvailable,
    committable,
    touched,
    markTouched: () => setTouched(true),
    amountError: touched && !parsed.ok ? AMOUNT_ERRORS[parsed.reason] : undefined,
    changed: unitId !== initial.unitId || !(parsed.ok && Math.abs(parsed.value - initial.quantity) < 1e-9),
  };
}
