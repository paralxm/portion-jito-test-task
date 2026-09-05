/**
 * Water (docs/design/hifi-decisions.md D-22): a per-local-day total in millilitres,
 * session-only like the food entries. The 2,000 ml daily reference is a product default
 * shown as the bound, not advice; nothing here calculates a personal need.
 */

export const WATER_GOAL_ML = 2000;
/** The daily reference can be changed by the person; the bounds keep a typo from setting an implausible bound. */
export const WATER_REFERENCE_RANGE_ML = { min: 500, max: 5000 } as const;
export const WATER_QUICK_ADD_ML = 250;
export const WATER_PRESETS_ML: readonly number[] = [150, 250, 350, 500];
/** A single addition is capped so a typo cannot record an implausible amount. */
export const WATER_ADD_MAX_ML = 5000;
/** The whole day's total when edited directly. */
export const WATER_TOTAL_MAX_ML = 10000;

export interface WaterRecord {
  dayKey: string;
  totalMl: number;
}

export type WaterParse = { ok: true; ml: number } | { ok: false; reason: 'empty' | 'invalid' | 'range' };

/** Whole millilitres within [min, max]; a decimal or a separator is refused so "1.5" cannot silently become 1 ml. */
export function parseWaterAmount(draft: string, bounds: { min: number; max: number }): WaterParse {
  const trimmed = draft.trim();
  if (trimmed === '') return { ok: false, reason: 'empty' };
  if (!/^\d+$/.test(trimmed)) return { ok: false, reason: 'invalid' };
  const ml = Number(trimmed);
  if (!Number.isFinite(ml) || ml < bounds.min || ml > bounds.max) return { ok: false, reason: 'range' };
  return { ok: true, ml };
}

/** "250 ml" below one litre, otherwise litres to at most two decimals: "1.25 L", "2 L". */
export function formatWater(ml: number): string {
  if (ml < 1000) return `${Math.round(ml)} ml`;
  const litres = Math.round(ml / 10) / 100;
  return `${litres} L`;
}

/** The spoken figure: "1.5 litres", "250 millilitres", "2 litres". */
export function speakWater(ml: number): string {
  if (ml < 1000) return `${Math.round(ml)} millilitre${Math.round(ml) === 1 ? '' : 's'}`;
  const litres = Math.round(ml / 10) / 100;
  return `${litres} litre${litres === 1 ? '' : 's'}`;
}

export type WaterState = 'empty' | 'partial' | 'reached' | 'exceeded';

export function waterState(totalMl: number, goalMl = WATER_GOAL_ML): WaterState {
  if (totalMl <= 0) return 'empty';
  if (totalMl < goalMl) return 'partial';
  if (totalMl === goalMl) return 'reached';
  return 'exceeded';
}

/** The one-line status under the figure; only states that need a word get one. */
export function describeWaterState(totalMl: number, goalMl = WATER_GOAL_ML): string | null {
  switch (waterState(totalMl, goalMl)) {
    case 'reached':
      return 'Daily reference reached.';
    case 'exceeded':
      return `${formatWater(totalMl - goalMl)} over the daily reference.`;
    default:
      return null;
  }
}

/** The single polite announcement after a quick add, e.g. "250 ml added. 1.5 litres today." */
export function announceWaterAdded(addedMl: number, totalMl: number): string {
  return `${formatWater(addedMl)} added. ${speakWater(totalMl)} today.`;
}
