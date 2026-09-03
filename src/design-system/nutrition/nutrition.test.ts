import { describe, expect, it } from 'vitest';

import { formatMaybe, formatQuantity, formatWithUnit, NBSP, NUTRIENT_CATEGORIES } from './nutrition';

describe('formatQuantity', () => {
  it('shows whole kilocalories', () => {
    expect(formatQuantity(450, 'kcal')).toBe('450');
    expect(formatQuantity(449.6, 'kcal')).toBe('450');
    expect(formatQuantity(0, 'kcal')).toBe('0');
  });

  it('shows grams with at most one decimal and no trailing zero', () => {
    expect(formatQuantity(52.5, 'g')).toBe('52.5');
    expect(formatQuantity(15, 'g')).toBe('15');
    expect(formatQuantity(63.04, 'g')).toBe('63');
    expect(formatQuantity(18.0, 'g')).toBe('18');
  });

  it('keeps a known non-zero value visible instead of rounding it to zero', () => {
    expect(formatQuantity(0.04, 'g')).toBe('0.04');
    expect(formatQuantity(0.004, 'g')).toBe('0.004');
    expect(formatQuantity(0.4, 'mg')).toBe('0.4');
    expect(formatQuantity(2.4, 'µg')).toBe('2.4');
  });

  it('treats a known zero as zero', () => {
    expect(formatQuantity(0, 'g')).toBe('0');
    expect(formatQuantity(0, 'mg')).toBe('0');
  });

  it('rejects non-finite input rather than inventing a value', () => {
    expect(() => formatQuantity(Number.NaN, 'g')).toThrow();
  });
});

describe('formatWithUnit and formatMaybe', () => {
  it('binds value and unit with a non-breaking space', () => {
    expect(formatWithUnit(450, 'kcal')).toBe(`450${NBSP}kcal`);
    expect(formatWithUnit(120, 'mg')).toBe(`120${NBSP}mg`);
  });

  it('returns null for unknown values so the caller names them, never zero', () => {
    expect(formatMaybe(null, 'g')).toBeNull();
    expect(formatMaybe(undefined, 'g')).toBeNull();
    expect(formatMaybe(0, 'g')).toBe(`0${NBSP}g`);
  });
});

describe('nutrient categories', () => {
  it('orders energy first and keeps a fixed macro order', () => {
    const ordered = Object.entries(NUTRIENT_CATEGORIES).sort((a, b) => a[1].order - b[1].order).map(([key]) => key);
    expect(ordered.slice(0, 4)).toEqual(['energy', 'protein', 'carbohydrates', 'fat']);
  });

  it('does not treat energy as a macronutrient', () => {
    expect(NUTRIENT_CATEGORIES.energy.macro).toBe(false);
    expect(NUTRIENT_CATEGORIES.protein.macro).toBe(true);
  });
});
