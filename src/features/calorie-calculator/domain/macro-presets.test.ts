import { describe, expect, it } from 'vitest';

import { macroEnergyKcal, macroMismatch, PRESET_SHARES, roundMacros, suggestedMacros, withinAmdr } from './macro-presets';

describe('macro presets', () => {
  it('every preset lies inside the adult AMDR and sums to 100 %', () => {
    for (const shares of Object.values(PRESET_SHARES)) {
      expect(withinAmdr(shares)).toBe(true);
      expect(shares.protein + shares.carbohydrates + shares.fat).toBeCloseTo(1, 10);
    }
  });

  it('derives grams with the Atwater factors at full precision, rounded only for saving', () => {
    const grams = suggestedMacros(2000, 'balanced');
    expect(grams).toEqual({ proteinG: 100, carbohydratesG: 250, fatG: (2000 * 0.3) / 9 });
    expect(roundMacros(grams)).toEqual({ proteinG: 100, carbohydratesG: 250, fatG: 67 });
    expect(roundMacros(suggestedMacros(1850, 'higher-protein'))).toEqual({ proteinG: 139, carbohydratesG: 208, fatG: 51 });
  });

  it('grams follow the calorie target', () => {
    const a = suggestedMacros(1800, 'lower-carb');
    const b = suggestedMacros(2200, 'lower-carb');
    expect(b.proteinG / a.proteinG).toBeCloseTo(2200 / 1800, 10);
  });

  it('states a mismatch only when every custom gram target is set', () => {
    expect(macroEnergyKcal({ proteinG: 150, carbohydratesG: null, fatG: 60 })).toBeNull();
    expect(macroMismatch(2000, { proteinG: 150, carbohydratesG: 200, fatG: 60 })).toEqual({ macroKcal: 1940, differenceKcal: -60 });
    expect(macroMismatch(2000, { proteinG: 100, carbohydratesG: 250, fatG: 67 })?.differenceKcal).toBe(3);
  });
});
