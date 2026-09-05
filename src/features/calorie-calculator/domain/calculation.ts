/**
 * Calorie-calculator domain: reference data, desired portion, supported unit
 * conversion and the scaling formula from docs/ux/ui-contract.md.
 *
 *   portion nutrition = reference nutrition × desired quantity / reference quantity
 *
 * after the desired quantity has been converted into the reference unit with a
 * conversion the food's data actually supports. Nothing here rounds: display rounding
 * is a presentation concern (see design-system/nutrition).
 */

/** Values for the food's reference basis. `null` means unknown — never zero. */
export interface NutritionValues {
  energyKcal: number | null;
  proteinG: number | null;
  carbohydratesG: number | null;
  fatG: number | null;
  /** Part of carbohydrates for the fixtures in scope; shown as "of which fibre". */
  fibreG?: number | null;
  vitamins?: readonly { id: string; name: string; valueMg: number | null }[];
  minerals?: readonly { id: string; name: string; valueMg: number | null }[];
}

/** A unit the food's data supports, with the factor that converts one unit into the reference unit. */
export interface SupportedUnit {
  id: string;
  label: string;
  description?: string;
  /** How many reference units one of this unit is. The reference unit itself has factor 1. */
  toReference: number;
}

export interface ReferenceBasis {
  quantity: number;
  unitId: string;
}

/** A candidate food or dish under review. It is not the current calculation until confirmed. */
export interface FoodCandidate {
  id: string;
  name: string;
  detail?: string;
  /** Where the candidate came from; drives the review screen's explanation. */
  source: 'search' | 'barcode' | 'photo' | 'manual' | 'recipe';
  /** A photograph of the item where one is registered; evidence of appearance only. */
  imageUrl?: string;
  /** Drinks carry volume units and never touch the water tracker; absent means food (ledger §11.1). */
  category?: 'food' | 'drink';
  reference: ReferenceBasis;
  nutrition: NutritionValues;
  units: readonly SupportedUnit[];
}

export interface Portion {
  quantity: number;
  unitId: string;
}

// ---------------------------------------------------------------------------
// Draft parsing
// ---------------------------------------------------------------------------

export type AmountParse = { ok: true; value: number } | { ok: false; reason: 'empty' | 'invalid' | 'not-positive' };

/**
 * One decimal policy for every numeric field: digits with an optional single decimal
 * separator ("." or ","). The draft is parsed, never rewritten while typing, and the
 * separator is not reinterpreted in the field.
 */
export function parseAmount(draft: string): AmountParse {
  const trimmed = draft.trim();
  if (trimmed === '') return { ok: false, reason: 'empty' };
  if (!/^\d+([.,]\d*)?$|^[.,]\d+$/.test(trimmed)) return { ok: false, reason: 'invalid' };
  const value = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(value)) return { ok: false, reason: 'invalid' };
  if (value <= 0) return { ok: false, reason: 'not-positive' };
  return { ok: true, value };
}

/** Same policy for nutrient values entered manually, where zero is a legitimate known value. */
export function parseNonNegative(draft: string): AmountParse {
  const trimmed = draft.trim();
  if (trimmed === '') return { ok: false, reason: 'empty' };
  if (!/^\d+([.,]\d*)?$|^[.,]\d+$/.test(trimmed)) return { ok: false, reason: 'invalid' };
  const value = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(value) || value < 0) return { ok: false, reason: 'invalid' };
  return { ok: true, value };
}

// ---------------------------------------------------------------------------
// Scaling
// ---------------------------------------------------------------------------

export function findUnit(candidate: FoodCandidate, unitId: string): SupportedUnit | undefined {
  return candidate.units.find((u) => u.id === unitId);
}

/** Converts a desired quantity into the reference unit, or `null` when the unit is not supported. */
export function toReferenceQuantity(candidate: FoodCandidate, portion: Portion): number | null {
  const unit = findUnit(candidate, portion.unitId);
  if (!unit) return null;
  return portion.quantity * unit.toReference;
}

/**
 * Expresses a quantity in another unit the same food supports, so switching units keeps
 * the portion (300 g → 1 serving when 1 serving = 300 g). Returns `null` when either
 * unit is unsupported; nothing is ever invented across g/ml/piece/serving.
 */
export function convertQuantity(candidate: FoodCandidate, quantity: number, fromUnitId: string, toUnitId: string): number | null {
  const from = findUnit(candidate, fromUnitId);
  const to = findUnit(candidate, toUnitId);
  if (!from || !to || !(to.toReference > 0)) return null;
  return Number(((quantity * from.toReference) / to.toReference).toFixed(3));
}

/** The draft string for a numeric quantity: whole numbers plain, otherwise at most three decimals. */
export function formatQuantityDraft(value: number): string {
  return trimNumber(value);
}

function scale(value: number | null | undefined, factor: number): number | null {
  return value === null || value === undefined ? null : value * factor;
}

/**
 * Scales the reference nutrition to the desired portion. Returns `null` when the unit is
 * unsupported or the reference basis is invalid. Unknown values stay unknown; a known
 * zero stays zero. Missing energy means no calorie result can be produced.
 */
export function scaleNutrition(candidate: FoodCandidate, portion: Portion): NutritionValues | null {
  if (!(candidate.reference.quantity > 0) || !(portion.quantity > 0)) return null;
  const inReference = toReferenceQuantity(candidate, portion);
  if (inReference === null) return null;
  const factor = inReference / candidate.reference.quantity;
  return {
    energyKcal: scale(candidate.nutrition.energyKcal, factor),
    proteinG: scale(candidate.nutrition.proteinG, factor),
    carbohydratesG: scale(candidate.nutrition.carbohydratesG, factor),
    fatG: scale(candidate.nutrition.fatG, factor),
    fibreG: candidate.nutrition.fibreG === undefined ? undefined : scale(candidate.nutrition.fibreG, factor),
    vitamins: candidate.nutrition.vitamins?.map((v) => ({ ...v, valueMg: scale(v.valueMg, factor) })),
    minerals: candidate.nutrition.minerals?.map((m) => ({ ...m, valueMg: scale(m.valueMg, factor) })),
  };
}

/** True when the candidate can produce a calorie result at all. */
export function canCalculateEnergy(candidate: FoodCandidate): boolean {
  return candidate.nutrition.energyKcal !== null && candidate.reference.quantity > 0;
}

/** The portion itself, e.g. "250 g" or "1 serving (300 g)". */
export function describePortion(candidate: FoodCandidate, portion: Portion): string {
  const unit = findUnit(candidate, portion.unitId);
  if (!unit) return '';
  const ref = findUnit(candidate, candidate.reference.unitId);
  const q = trimNumber(portion.quantity);
  const isSymbol = (label: string) => label === 'g' || label === 'ml';
  const plural = portion.quantity === 1 || isSymbol(unit.label) ? unit.label : `${unit.label}s`;
  if (unit.id === candidate.reference.unitId || !ref) {
    // A word-based reference unit (serving, piece) states its mass or volume when the
    // food's data defines one, e.g. "2 servings (600 g)" for a recipe.
    const measure = candidate.units.find((u) => u.id !== unit.id && isSymbol(u.label) && u.toReference > 0);
    if (unit.id === candidate.reference.unitId && !isSymbol(unit.label) && measure) {
      return `${q} ${plural} (${trimNumber(portion.quantity / measure.toReference)} ${measure.label})`;
    }
    return `${q} ${plural}`;
  }
  const inRef = trimNumber(portion.quantity * unit.toReference);
  return `${q} ${plural} (${inRef} ${ref.label})`;
}

/** Human-readable basis line, e.g. "For 250 g" or "For 1 serving (300 g)". */
export function describePortionBasis(candidate: FoodCandidate, portion: Portion): string {
  const portionText = describePortion(candidate, portion);
  return portionText === '' ? '' : `For ${portionText}`;
}

export function describeReferenceBasis(candidate: FoodCandidate): string {
  const ref = findUnit(candidate, candidate.reference.unitId);
  return `Per ${trimNumber(candidate.reference.quantity)} ${ref ? ref.label : candidate.reference.unitId}`;
}

function trimNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(3)));
}

// ---------------------------------------------------------------------------
// Draft versus current calculation
// ---------------------------------------------------------------------------

export interface CurrentCalculation {
  candidate: FoodCandidate;
  portion: Portion;
  /** Committed at confirmation and recalculated locally on valid portion edits. */
  result: NutritionValues;
  committedAt: number;
}

/**
 * Commits a reviewed candidate once. Returns `null` when the portion cannot be
 * calculated, so an invalid draft can never become the current calculation.
 */
export function commitCandidate(candidate: FoodCandidate, portion: Portion, now = Date.now()): CurrentCalculation | null {
  const result = scaleNutrition(candidate, portion);
  if (!result || result.energyKcal === null) return null;
  return { candidate, portion, result, committedAt: now };
}

/**
 * Applies a valid portion edit to the current calculation in place. An invalid portion
 * returns the previous calculation untouched — the UI shows a stale state instead of
 * presenting the old value as the answer to the new quantity.
 */
export function updatePortion(current: CurrentCalculation, portion: Portion): CurrentCalculation {
  const result = scaleNutrition(current.candidate, portion);
  if (!result) return current;
  return { ...current, portion, result };
}
