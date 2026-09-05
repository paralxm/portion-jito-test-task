/**
 * Suggested macronutrient targets from a calorie target (ledger §13.4).
 *
 * A preset is a share of daily energy for protein, carbohydrate and fat. Every preset
 * sits inside the Acceptable Macronutrient Distribution Ranges for adults from the
 * National Academies' *Dietary Reference Intakes for Energy, Carbohydrate, Fiber, Fat,
 * Fatty Acids, Cholesterol, Protein, and Amino Acids* (2002/2005): protein 10–35 %,
 * carbohydrate 45–65 %, fat 20–35 % of energy. "Higher protein" and "Lower carb" both
 * stop at the carbohydrate floor of 45 % rather than leaving the ranges; they differ in
 * how the remaining energy is split. The shares are product choices inside those ranges
 * — a suggestion, never a personal prescription — and are documented in
 * `docs/ux/targets-and-estimation.md`.
 *
 * Grams follow the general Atwater factors — 4 kcal/g protein, 4 kcal/g carbohydrate,
 * 9 kcal/g fat — the same factors food labels use. Calculation keeps full precision;
 * the editor rounds grams for display and saves whole grams.
 *
 * Sources: https://www.ncbi.nlm.nih.gov/books/NBK610333/ (AMDR description);
 * https://www.nationalacademies.org/read/27957/chapter/5.
 */

export type MacroPreset = 'balanced' | 'higher-protein' | 'lower-carb' | 'custom';

export interface MacroShares {
  protein: number;
  carbohydrates: number;
  fat: number;
}

export const AMDR: Record<keyof MacroShares, { min: number; max: number }> = {
  protein: { min: 0.1, max: 0.35 },
  carbohydrates: { min: 0.45, max: 0.65 },
  fat: { min: 0.2, max: 0.35 },
};

export const ENERGY_PER_GRAM: Record<keyof MacroShares, number> = { protein: 4, carbohydrates: 4, fat: 9 };

export const PRESET_SHARES: Record<Exclude<MacroPreset, 'custom'>, MacroShares> = {
  balanced: { protein: 0.2, carbohydrates: 0.5, fat: 0.3 },
  'higher-protein': { protein: 0.3, carbohydrates: 0.45, fat: 0.25 },
  'lower-carb': { protein: 0.25, carbohydrates: 0.45, fat: 0.3 },
};

export const PRESET_OPTIONS: ReadonlyArray<{ id: MacroPreset; label: string; description: string }> = [
  { id: 'balanced', label: 'Balanced', description: '20 % protein · 50 % carbohydrate · 30 % fat' },
  { id: 'higher-protein', label: 'Higher protein', description: '30 % protein · 45 % carbohydrate · 25 % fat' },
  { id: 'lower-carb', label: 'Lower carb', description: '25 % protein · 45 % carbohydrate · 30 % fat' },
  { id: 'custom', label: 'Custom', description: 'Your own grams; any of them can stay unset' },
];

export function presetLabel(id: MacroPreset): string {
  return PRESET_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

export interface MacroGrams {
  proteinG: number;
  carbohydratesG: number;
  fatG: number;
}

/** Grams at full precision for a calorie target under a preset's shares. */
export function suggestedMacros(kcal: number, preset: Exclude<MacroPreset, 'custom'>): MacroGrams {
  const shares = PRESET_SHARES[preset];
  return {
    proteinG: (kcal * shares.protein) / ENERGY_PER_GRAM.protein,
    carbohydratesG: (kcal * shares.carbohydrates) / ENERGY_PER_GRAM.carbohydrates,
    fatG: (kcal * shares.fat) / ENERGY_PER_GRAM.fat,
  };
}

/** The saved form: whole grams (display rounding), never the raw quotient. */
export function roundMacros(grams: MacroGrams): MacroGrams {
  return { proteinG: Math.round(grams.proteinG), carbohydratesG: Math.round(grams.carbohydratesG), fatG: Math.round(grams.fatG) };
}

/** Energy of a complete set of gram targets, or `null` while any of them is unset. */
export function macroEnergyKcal(targets: { proteinG?: number | null; carbohydratesG?: number | null; fatG?: number | null }): number | null {
  const { proteinG, carbohydratesG, fatG } = targets;
  if (proteinG === null || proteinG === undefined || carbohydratesG === null || carbohydratesG === undefined || fatG === null || fatG === undefined) return null;
  return proteinG * ENERGY_PER_GRAM.protein + carbohydratesG * ENERGY_PER_GRAM.carbohydrates + fatG * ENERGY_PER_GRAM.fat;
}

/** How far the custom grams' energy is from the calorie target, only when every gram target is set; the editor states it and changes nothing. */
export function macroMismatch(kcal: number, targets: { proteinG?: number | null; carbohydratesG?: number | null; fatG?: number | null }): { macroKcal: number; differenceKcal: number } | null {
  const macroKcal = macroEnergyKcal(targets);
  if (macroKcal === null) return null;
  return { macroKcal, differenceKcal: macroKcal - kcal };
}

/** True when every share lies inside the adult AMDR; a guard the tests assert for every preset. */
export function withinAmdr(shares: MacroShares): boolean {
  return (Object.keys(AMDR) as (keyof MacroShares)[]).every((key) => shares[key] >= AMDR[key].min && shares[key] <= AMDR[key].max);
}
