/**
 * The portion step shared by manual entry's second step and every review (ledger §12 D2,
 * E3): documented quantity increments and presets that come only from what the item's
 * own units support. Nothing here invents a density or a universal serving — a preset
 * exists because the item's record defines the unit it is expressed in.
 */
import { convertQuantity, findUnit, formatQuantityDraft, parseAmount, type FoodCandidate, type Portion } from './calculation';

/** One step of the − / + control per unit: 25 g or ml, a quarter serving, one piece otherwise. */
export function quantityStep(unitId: string): number {
  if (unitId === 'g' || unitId === 'ml') return 25;
  if (unitId === 'serving') return 0.25;
  return 1;
}

/**
 * The quantity after one step from the draft. An unparsable draft steps from zero; the
 * result never drops below one step, so the field never shows zero or a negative amount.
 */
export function stepQuantity(draft: string, unitId: string, direction: 1 | -1): string {
  const step = quantityStep(unitId);
  const parsed = parseAmount(draft);
  const current = parsed.ok ? parsed.value : 0;
  // Snap to the step grid so 110 g → 125 g → 150 g rather than 135 g.
  const snapped = direction > 0 ? Math.floor(current / step + 1e-9) * step + step : Math.ceil(current / step - 1e-9) * step - step;
  return formatQuantityDraft(Math.max(step, Number(snapped.toFixed(3))));
}

export interface PortionPreset {
  quantity: number;
  unitId: string;
  /** The chip text, e.g. "150 g" or "1 serving (300 g)". */
  label: string;
}

const MASS_PRESETS = [50, 100, 150, 200];
const SERVING_PRESETS = [0.5, 1, 1.5, 2];

function unitLabel(candidate: FoodCandidate, unitId: string): string {
  return findUnit(candidate, unitId)?.label ?? unitId;
}

/**
 * Presets the item's data supports: for a gram or millilitre item the documented amounts
 * in that unit plus one serving when the record defines a serving; for a serving-based
 * item half to two servings plus 100 of its mass unit when the record defines one. The
 * currently selected unit's presets come first so the row reads in the field's unit.
 */
export function portionPresets(candidate: FoodCandidate, unitId: string): PortionPreset[] {
  const presets: PortionPreset[] = [];
  const mass = candidate.units.find((u) => u.id === 'g' || u.id === 'ml');
  const serving = candidate.units.find((u) => u.id === 'serving');
  const servingMeasure = serving && mass ? convertQuantity(candidate, 1, 'serving', mass.id) : null;
  const inMass = (q: number): PortionPreset => ({ quantity: q, unitId: mass!.id, label: `${formatQuantityDraft(q)} ${mass!.label}` });
  const inServing = (q: number): PortionPreset => ({
    quantity: q,
    unitId: 'serving',
    label: `${formatQuantityDraft(q)} ${q === 1 ? 'serving' : 'servings'}${servingMeasure ? ` (${formatQuantityDraft(Number((q * servingMeasure).toFixed(3)))} ${mass!.label})` : ''}`,
  });
  if (unitId === 'serving' && serving) {
    presets.push(...SERVING_PRESETS.map(inServing));
    if (mass) presets.push(inMass(100));
  } else if (mass) {
    presets.push(...MASS_PRESETS.map(inMass));
    if (serving) presets.push(inServing(1));
  } else if (serving) {
    presets.push(...SERVING_PRESETS.map(inServing));
  } else {
    // A unit with no mass or serving (a piece): a few counts in that unit.
    const label = unitLabel(candidate, unitId);
    presets.push(...[1, 2, 3].map((q) => ({ quantity: q, unitId, label: `${q} ${label}${q === 1 ? '' : 's'}` })));
  }
  return presets;
}

/** Whether a preset is the current draft: same unit, same value. */
export function presetSelected(preset: PortionPreset, draft: string, unitId: string): boolean {
  const parsed = parseAmount(draft);
  return parsed.ok && unitId === preset.unitId && Math.abs(parsed.value - preset.quantity) < 1e-9;
}

/**
 * Carries a retained portion onto a candidate whose reference data changed (ledger §12
 * D3): kept when its unit is still supported, otherwise replaced by the reference basis
 * with a note that the amount must be entered again — never converted by guesswork.
 */
export function carryPortion(candidate: FoodCandidate, retained: Portion | null): { portion: Portion; reset: boolean } {
  if (retained && findUnit(candidate, retained.unitId)) return { portion: retained, reset: false };
  return { portion: { quantity: candidate.reference.quantity, unitId: candidate.reference.unitId }, reset: retained !== null };
}
