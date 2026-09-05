/**
 * Meals (docs/design/hifi-decisions.md D-16, D-17). Every committed entry belongs to one
 * of four meals; Home always shows all four. The day is organised by meal, never by a
 * timeline: no eating time is asked or stored.
 */

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/** Fixed display order. */
export const MEAL_ORDER: readonly MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
};

/** The name used inside actions and confirmations, e.g. "Add to lunch", "Added to snacks". */
export function mealPhrase(meal: MealType): string {
  return MEAL_LABELS[meal].toLowerCase();
}

/** The per-meal add action on Home, e.g. "Add breakfast" for an empty meal, "Add to breakfast" for a populated one. */
export function mealAddLabel(meal: MealType, populated: boolean): string {
  const noun = meal === 'snack' ? 'snack' : meal;
  return populated ? `Add to ${mealPhrase(meal)}` : `Add ${noun}`;
}

export function isMealType(value: unknown): value is MealType {
  return typeof value === 'string' && (MEAL_ORDER as readonly string[]).includes(value);
}

/**
 * Deterministic time-of-day suggestion used only to preselect the meal when the task
 * has no meal context (D-17): 05:00–10:59 breakfast, 11:00–15:59 lunch, 16:00–21:59
 * dinner, otherwise snack. Local time. The choice stays visible and editable.
 */
export function suggestMeal(date: Date = new Date()): MealType {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 16 && hour < 22) return 'dinner';
  return 'snack';
}
