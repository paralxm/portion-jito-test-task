import { describe, expect, it } from 'vitest';

import { isMealType, MEAL_ORDER, mealAddLabel, mealPhrase, suggestMeal } from './meal';

describe('meals', () => {
  it('suggests a meal from the local hour with fixed boundaries', () => {
    const at = (h: number, m = 0) => suggestMeal(new Date(2026, 8, 4, h, m));
    expect(at(4, 59)).toBe('snack');
    expect(at(5)).toBe('breakfast');
    expect(at(10, 59)).toBe('breakfast');
    expect(at(11)).toBe('lunch');
    expect(at(12)).toBe('lunch');
    expect(at(15, 59)).toBe('lunch');
    expect(at(16)).toBe('dinner');
    expect(at(21, 59)).toBe('dinner');
    expect(at(22)).toBe('snack');
    expect(at(0)).toBe('snack');
  });

  it('keeps the four meals in a fixed order with stable wording', () => {
    expect(MEAL_ORDER).toEqual(['breakfast', 'lunch', 'dinner', 'snack']);
    expect(mealPhrase('snack')).toBe('snacks');
    expect(mealAddLabel('dinner', false)).toBe('Add dinner');
    expect(mealAddLabel('snack', false)).toBe('Add snack');
    expect(mealAddLabel('lunch', true)).toBe('Add to lunch');
    expect(isMealType('lunch')).toBe(true);
    expect(isMealType('brunch')).toBe(false);
  });
});
