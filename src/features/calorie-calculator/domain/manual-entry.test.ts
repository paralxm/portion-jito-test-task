import { describe, expect, it } from 'vitest';

import { scaleNutrition } from './calculation';
import { EMPTY_MANUAL_DRAFT, isManualDraftDirty, validateManualDraft, type ManualDraft } from './manual-entry';

const valid: ManualDraft = { ...EMPTY_MANUAL_DRAFT, name: 'Lentil soup', calories: '150', protein: '8', carbohydrates: '', fat: '6' };

describe('validateManualDraft', () => {
  it('requires a name, a positive reference amount and calories', () => {
    const result = validateManualDraft({ ...EMPTY_MANUAL_DRAFT, referenceQuantity: '0' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.name).toBeDefined();
      expect(result.errors.referenceQuantity).toBe('Enter an amount greater than zero');
      expect(result.errors.calories).toBeDefined();
      expect(result.errors.protein).toBeUndefined();
    }
  });

  it('keeps blank optional macros unknown rather than zero', () => {
    const result = validateManualDraft(valid, 'manual-test');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.candidate.nutrition).toEqual({ energyKcal: 150, proteinG: 8, carbohydratesG: null, fatG: 6 });
      expect(result.candidate.reference).toEqual({ quantity: 100, unitId: 'g' });
      expect(result.candidate.units).toEqual([{ id: 'g', label: 'g', toReference: 1 }]);
      expect(result.candidate.source).toBe('manual');
    }
  });

  it('accepts a known zero and rejects non-numeric optional values', () => {
    const zero = validateManualDraft({ ...valid, calories: '0', fat: '0' });
    expect(zero.ok).toBe(true);
    if (zero.ok) expect(zero.candidate.nutrition.fatG).toBe(0);
    const bad = validateManualDraft({ ...valid, protein: 'lots' });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.errors.protein).toBe('Enter protein in grams, or leave it blank');
  });

  it('produces a candidate the review screen scales from its own reference basis', () => {
    const result = validateManualDraft({ ...valid, referenceUnit: 'serving', referenceQuantity: '1', calories: '450' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(scaleNutrition(result.candidate, { quantity: 2, unitId: 'serving' })?.energyKcal).toBe(900);
      expect(scaleNutrition(result.candidate, { quantity: 2, unitId: 'g' })).toBeNull();
    }
  });
});

describe('isManualDraftDirty', () => {
  it('is clean for the untouched default and dirty once anything changes', () => {
    expect(isManualDraftDirty(EMPTY_MANUAL_DRAFT)).toBe(false);
    expect(isManualDraftDirty({ ...EMPTY_MANUAL_DRAFT, name: 'x' })).toBe(true);
    expect(isManualDraftDirty(valid, valid)).toBe(false);
  });
});
