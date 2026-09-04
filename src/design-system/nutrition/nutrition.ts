/**
 * Presentation rules for nutrition values shared by the calculator and recipe surfaces.
 * Calculation and matching live in the features; this module only decides how a known,
 * unknown or draft value is named, ordered and formatted.
 */

export type NutrientUnit = 'kcal' | 'g' | 'mg' | 'µg';

/** Category markers defined in tokens.json → semantic.color.nutrition. */
export type NutrientCategory = 'energy' | 'protein' | 'carbohydrates' | 'fat' | 'fibre' | 'vitamins' | 'minerals';

export interface NutrientCategoryMeta {
  label: string;
  /** Short name for compact rows where the full name would wrap a narrow column (Home). */
  compactLabel?: string;
  unit: NutrientUnit;
  /** Fixed display order across calculator, cards and details. */
  order: number;
  /** Energy is not a fourth macro and never carries a warning-style treatment. */
  macro: boolean;
}

export const NUTRIENT_CATEGORIES: Record<NutrientCategory, NutrientCategoryMeta> = {
  energy: { label: 'Calories', unit: 'kcal', order: 0, macro: false },
  protein: { label: 'Protein', unit: 'g', order: 1, macro: true },
  carbohydrates: { label: 'Carbohydrates', compactLabel: 'Carbs', unit: 'g', order: 2, macro: true },
  fat: { label: 'Fat', unit: 'g', order: 3, macro: true },
  fibre: { label: 'Fibre', unit: 'g', order: 4, macro: false },
  vitamins: { label: 'Vitamins', unit: 'mg', order: 5, macro: false },
  minerals: { label: 'Minerals', unit: 'mg', order: 6, macro: false },
};

export const MACRO_ORDER: readonly NutrientCategory[] = ['protein', 'carbohydrates', 'fat'];

/** Non-breaking space keeps a short value and its unit on one line. */
export const NBSP = ' ';

/** Wording for an unknown value. Unknown is never rendered as zero. */
export const NOT_AVAILABLE = 'Not available';
export const MISSING_GLYPH = '—';

function trimZeros(text: string): string {
  return text.includes('.') ? text.replace(/\.?0+$/, '') : text;
}

/**
 * Format a known quantity for display without turning a known non-zero value into a
 * misleading zero. Calories are whole; grams show up to one decimal; small milligram
 * and microgram values keep enough precision to remain visible.
 */
export function formatQuantity(value: number, unit: NutrientUnit): string {
  if (!Number.isFinite(value)) throw new Error('formatQuantity expects a finite number');
  if (unit === 'kcal') return String(Math.round(value));
  const decimals = unit === 'g' ? 1 : Math.abs(value) < 1 ? 2 : 1;
  let text = trimZeros(value.toFixed(decimals));
  // A known non-zero value must never round to "0".
  let extra = decimals;
  while (value !== 0 && Number(text) === 0 && extra < 4) {
    extra += 1;
    text = trimZeros(value.toFixed(extra));
  }
  return text;
}

/** `450 kcal`, `52.5 g`, `2.4 µg` — value and unit joined with a non-breaking space. */
export function formatWithUnit(value: number, unit: NutrientUnit): string {
  return `${formatQuantity(value, unit)}${NBSP}${unit}`;
}

/** Formats a possibly unknown value; callers decide how to present `null`. */
export function formatMaybe(value: number | null | undefined, unit: NutrientUnit): string | null {
  return value === null || value === undefined ? null : formatWithUnit(value, unit);
}
