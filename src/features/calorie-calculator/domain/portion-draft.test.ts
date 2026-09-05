import { describe, expect, it } from 'vitest';

import { fixtureC, foodCatalogue } from './fixtures';
import { carryPortion, portionPresets, presetSelected, quantityStep, stepQuantity } from './portion-draft';

describe('portion stepping', () => {
  it('uses documented increments per unit', () => {
    expect(quantityStep('g')).toBe(25);
    expect(quantityStep('ml')).toBe(25);
    expect(quantityStep('serving')).toBe(0.25);
    expect(quantityStep('piece')).toBe(1);
  });

  it('steps on the grid and never below one step', () => {
    expect(stepQuantity('100', 'g', 1)).toBe('125');
    expect(stepQuantity('110', 'g', 1)).toBe('125');
    expect(stepQuantity('110', 'g', -1)).toBe('100');
    expect(stepQuantity('25', 'g', -1)).toBe('25');
    expect(stepQuantity('', 'g', 1)).toBe('25');
    expect(stepQuantity('abc', 'g', -1)).toBe('25');
    expect(stepQuantity('1', 'serving', 1)).toBe('1.25');
    expect(stepQuantity('1,5', 'serving', -1)).toBe('1.25');
  });
});

describe('portion presets', () => {
  it('offers only amounts the item defines: grams plus its serving', () => {
    const presets = portionPresets(fixtureC, 'g');
    expect(presets.map((p) => p.label)).toEqual(['50 g', '100 g', '150 g', '200 g', '1 serving (300 g)']);
    expect(presetSelected(presets[1], '100', 'g')).toBe(true);
    expect(presetSelected(presets[1], '100', 'serving')).toBe(false);
  });

  it('leads with the selected unit and never invents a bowl', () => {
    const servings = portionPresets(fixtureC, 'serving');
    expect(servings.map((p) => p.label)).toEqual(['0.5 servings (150 g)', '1 serving (300 g)', '1.5 servings (450 g)', '2 servings (600 g)', '100 g']);
    expect(servings.some((p) => /bowl/i.test(p.label))).toBe(false);
    // Almond butter defines grams only: no serving preset exists.
    expect(portionPresets(foodCatalogue[4], 'g').map((p) => p.label)).toEqual(['50 g', '100 g', '150 g', '200 g']);
  });
});

describe('carryPortion', () => {
  it('keeps a retained portion when its unit is still supported, else resets to the reference with a note', () => {
    expect(carryPortion(fixtureC, { quantity: 250, unitId: 'g' })).toEqual({ portion: { quantity: 250, unitId: 'g' }, reset: false });
    expect(carryPortion(fixtureC, { quantity: 2, unitId: 'ml' })).toEqual({ portion: { quantity: 100, unitId: 'g' }, reset: true });
    expect(carryPortion(fixtureC, null)).toEqual({ portion: { quantity: 100, unitId: 'g' }, reset: false });
  });
});
