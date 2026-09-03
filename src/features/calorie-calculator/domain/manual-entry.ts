/**
 * Manual entry (S06): the user establishes a name, a positive reference amount and the
 * calories for that amount; macronutrients are optional. The desired portion is set on
 * the review screen, never here. Validation happens on Continue, and a blank optional
 * value stays unknown rather than becoming zero.
 */
import { parseAmount, parseNonNegative, type FoodCandidate, type SupportedUnit } from './calculation';

export type ManualUnit = 'g' | 'ml' | 'serving';

export const MANUAL_UNITS: ReadonlyArray<{ id: ManualUnit; label: string; description: string }> = [
  { id: 'g', label: 'g', description: 'Grams' },
  { id: 'ml', label: 'ml', description: 'Millilitres' },
  { id: 'serving', label: 'serving', description: 'One serving as the label or recipe defines it' },
];

export interface ManualDraft {
  name: string;
  referenceQuantity: string;
  referenceUnit: ManualUnit;
  calories: string;
  protein: string;
  carbohydrates: string;
  fat: string;
}

export const EMPTY_MANUAL_DRAFT: ManualDraft = {
  name: '',
  referenceQuantity: '100',
  referenceUnit: 'g',
  calories: '',
  protein: '',
  carbohydrates: '',
  fat: '',
};

export type ManualErrors = Partial<Record<keyof ManualDraft, string>>;

/** True when leaving would lose something the user typed relative to the starting draft. */
export function isManualDraftDirty(draft: ManualDraft, initial: ManualDraft = EMPTY_MANUAL_DRAFT): boolean {
  return (Object.keys(draft) as (keyof ManualDraft)[]).some((key) => draft[key] !== initial[key]);
}

function optionalNutrient(value: string, label: string): { value: number | null; error?: string } {
  if (value.trim() === '') return { value: null };
  const parsed = parseNonNegative(value);
  if (!parsed.ok) return { value: null, error: `Enter ${label} in grams, or leave it blank` };
  return { value: parsed.value };
}

export type ManualValidation = { ok: true; candidate: FoodCandidate } | { ok: false; errors: ManualErrors };

let manualSequence = 0;

/** Validates the draft and, when valid, builds the candidate for review. */
export function validateManualDraft(draft: ManualDraft, id?: string): ManualValidation {
  const errors: ManualErrors = {};
  const name = draft.name.trim();
  if (name === '') errors.name = 'Enter a name for the food or dish';

  const quantity = parseAmount(draft.referenceQuantity);
  if (!quantity.ok) {
    errors.referenceQuantity =
      quantity.reason === 'empty' ? 'Enter the amount the values are for' : quantity.reason === 'not-positive' ? 'Enter an amount greater than zero' : 'Enter a number, for example 100';
  }

  const calories = parseNonNegative(draft.calories);
  if (!calories.ok) errors.calories = calories.reason === 'empty' ? 'Enter the calories for this amount' : 'Enter a number of calories, for example 180';

  const protein = optionalNutrient(draft.protein, 'protein');
  const carbohydrates = optionalNutrient(draft.carbohydrates, 'carbohydrates');
  const fat = optionalNutrient(draft.fat, 'fat');
  if (protein.error) errors.protein = protein.error;
  if (carbohydrates.error) errors.carbohydrates = carbohydrates.error;
  if (fat.error) errors.fat = fat.error;

  if (Object.keys(errors).length > 0 || !quantity.ok || !calories.ok) return { ok: false, errors };

  const unit: SupportedUnit = { id: draft.referenceUnit, label: draft.referenceUnit, toReference: 1 };
  return {
    ok: true,
    candidate: {
      id: id ?? `manual-${++manualSequence}`,
      name,
      detail: 'Entered manually',
      source: 'manual',
      reference: { quantity: quantity.value, unitId: draft.referenceUnit },
      nutrition: { energyKcal: calories.value, proteinG: protein.value, carbohydratesG: carbohydrates.value, fatG: fat.value },
      units: [unit],
    },
  };
}
