import { describe, expect, it } from 'vitest';

import {
  ACTIVITY_OPTIONS,
  aboutDraftFromRecord,
  cmFromFeetInches,
  EMPTY_ABOUT_DRAFT,
  estimatedEnergyRequirement,
  estimateRecord,
  estimateTarget,
  feetInchesFromCm,
  kgFromPounds,
  LOSS_DEFICIT_KCAL,
  LOSS_FLOOR_KCAL,
  parseAboutDraft,
} from './energy-estimate';

describe('2023 EER equations (Table S-3, adults 19+)', () => {
  it('reproduces the report’s worked example for a low-active woman', () => {
    // Summary worked example: EER = 575.77 − 7.01·age + 6.60·height + 12.14·weight.
    const eer = estimatedEnergyRequirement({ age: 22, sex: 'female', heightCm: 165, weightKg: 60, activity: 'low-active' });
    expect(eer).toBeCloseTo(575.77 - 7.01 * 22 + 6.6 * 165 + 12.14 * 60, 6);
  });

  it('uses the male coefficients per category', () => {
    const base = { age: 40, sex: 'male' as const, heightCm: 180, weightKg: 80 };
    expect(estimatedEnergyRequirement({ ...base, activity: 'inactive' })).toBeCloseTo(753.07 - 10.83 * 40 + 6.5 * 180 + 14.1 * 80, 6);
    expect(estimatedEnergyRequirement({ ...base, activity: 'very-active' })).toBeCloseTo(-517.88 - 10.83 * 40 + 15.61 * 180 + 19.11 * 80, 6);
  });

  it('rises with each activity category for the same person', () => {
    const person = { age: 30, sex: 'female' as const, heightCm: 168, weightKg: 62 };
    const values = ACTIVITY_OPTIONS.map((o) => estimatedEnergyRequirement({ ...person, activity: o.id }));
    for (let i = 1; i < values.length; i += 1) expect(values[i]).toBeGreaterThan(values[i - 1]);
  });
});

describe('goal policy', () => {
  const inputs = { age: 34, sex: 'female' as const, heightCm: 168, weightKg: 62, activity: 'low-active' as const };

  it('maintain is the rounded EER with no adjustment', () => {
    const result = estimateTarget({ ...inputs, goal: 'maintain' });
    expect(result.ok && result.targetKcal).toBe(Math.round(estimatedEnergyRequirement(inputs)));
    expect(result.ok && result.adjustmentKcal).toBe(0);
    expect(result.ok && result.surplusUnsupported).toBe(false);
  });

  it('lose subtracts the documented 500 kcal/day deficit from the unrounded EER', () => {
    const result = estimateTarget({ ...inputs, goal: 'lose' });
    expect(result.ok && result.adjustmentKcal).toBe(-LOSS_DEFICIT_KCAL);
    expect(result.ok && result.targetKcal).toBe(Math.round(estimatedEnergyRequirement(inputs) - LOSS_DEFICIT_KCAL));
  });

  it('refuses a loss target under the 1,200 kcal floor instead of producing one', () => {
    const small = { age: 80, sex: 'female' as const, heightCm: 145, weightKg: 40, activity: 'inactive' as const };
    expect(estimatedEnergyRequirement(small) - LOSS_DEFICIT_KCAL).toBeLessThan(LOSS_FLOOR_KCAL);
    expect(estimateTarget({ ...small, goal: 'lose' })).toEqual({ ok: false, reason: 'below-floor' });
    expect(estimateTarget({ ...small, goal: 'maintain' }).ok).toBe(true);
  });

  it('gain never invents a surplus: maintenance with the gap flagged', () => {
    const result = estimateTarget({ ...inputs, goal: 'gain' });
    expect(result.ok && result.surplusUnsupported).toBe(true);
    expect(result.ok && result.targetKcal).toBe(result.ok && result.eerKcal);
  });

  it('does not apply the adult equations under 19', () => {
    expect(estimateTarget({ ...inputs, age: 18, goal: 'maintain' })).toEqual({ ok: false, reason: 'under-age' });
  });

  it('keeps the inputs and the adjustment in the saved record', () => {
    const result = estimateTarget({ ...inputs, goal: 'lose' });
    if (!result.ok) throw new Error('expected ok');
    const record = estimateRecord({ ...inputs, goal: 'lose' }, result);
    expect(record).toMatchObject({ method: 'nasem-2023-eer', age: 34, sex: 'female', activity: 'low-active', goal: 'lose', adjustmentKcal: -500 });
    expect(aboutDraftFromRecord(record)).toMatchObject({ age: '34', sex: 'female', heightCm: '168', weight: '62', heightUnit: 'cm', weightUnit: 'kg' });
  });
});

describe('units and the About you draft', () => {
  it('converts feet/inches and pounds exactly', () => {
    expect(cmFromFeetInches(5, 6)).toBeCloseTo(167.64, 6);
    expect(feetInchesFromCm(167.64)).toEqual({ feet: 5, inches: 6 });
    expect(kgFromPounds(150)).toBeCloseTo(68.0388555, 6);
  });

  it('parses a valid metric draft', () => {
    const parsed = parseAboutDraft({ ...EMPTY_ABOUT_DRAFT, age: '34', sex: 'female', heightCm: '168', weight: '62,5' });
    expect(parsed).toEqual({ ok: true, age: 34, sex: 'female', heightCm: 168, weightKg: 62.5 });
  });

  it('parses an imperial draft into cm and kg', () => {
    const parsed = parseAboutDraft({ ...EMPTY_ABOUT_DRAFT, age: '40', sex: 'male', heightUnit: 'ft-in', heightFeet: '5', heightInches: '11', weightUnit: 'lb', weight: '180' });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.heightCm).toBeCloseTo(180.34, 6);
      expect(parsed.weightKg).toBeCloseTo(81.6466266, 6);
    }
  });

  it('distinguishes blank, invalid, under-age and out-of-range inputs without clearing the others', () => {
    const blank = parseAboutDraft(EMPTY_ABOUT_DRAFT);
    expect(blank.ok).toBe(false);
    if (!blank.ok) expect(Object.keys(blank.errors).sort()).toEqual(['age', 'height', 'sex', 'weight']);
    const invalid = parseAboutDraft({ ...EMPTY_ABOUT_DRAFT, age: '34.5', sex: 'male', heightCm: 'tall', weight: '0' });
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) {
      expect(invalid.errors.age).toMatch(/whole number/);
      expect(invalid.errors.height).toMatch(/number of centimetres/);
      expect(invalid.errors.weight).toMatch(/between/);
    }
    const young = parseAboutDraft({ ...EMPTY_ABOUT_DRAFT, age: '16', sex: 'female', heightCm: '160', weight: '55' });
    expect(young.ok).toBe(false);
    if (!young.ok) expect(young.errors.age).toMatch(/adults from 19/);
  });
});
