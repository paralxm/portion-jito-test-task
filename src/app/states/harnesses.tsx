/**
 * Small stateful harnesses for the mapped product-state stories: they compose production
 * screens the way App does (a screen plus the app-level toast or sheet) so a story can
 * freeze a state that only the runtime's state holds. They are Storybook-only.
 */
import { useState, type ReactNode } from 'react';

import { Toast } from '../../design-system';
import { AddToMealSheet } from '../../features/calorie-calculator/components/AddToMealSheet';
import type { FoodCandidate, Portion } from '../../features/calorie-calculator/domain/calculation';
import type { DailyGoal, FoodEntry } from '../../features/calorie-calculator/domain/daily-log';
import type { MealType } from '../../features/calorie-calculator/domain/meal';
import { announceWaterAdded } from '../../features/calorie-calculator/domain/water';
import { HomeScreen, type HomeScreenProps } from '../../features/calorie-calculator/screens/HomeScreen';

export interface HomeWithWaterProps extends Omit<HomeScreenProps, 'waterMl' | 'onAddWater' | 'onSetWaterTotal' | 'entries' | 'goal' | 'onGoalChange'> {
  entries: readonly FoodEntry[];
  goal: DailyGoal | null;
  initialWaterMl: number;
}

/** Home with the water record and the confirmation toast the app owns, so quick add and Undo can be exercised. */
export function HomeWithWater({ initialWaterMl, entries, goal, ...rest }: HomeWithWaterProps) {
  const [waterMl, setWaterMl] = useState(initialWaterMl);
  const [goalState, setGoalState] = useState(goal);
  const [toast, setToast] = useState<{ message: string; undo?: () => void } | null>(null);
  return (
    <>
      <HomeScreen
        {...rest}
        entries={entries}
        goal={goalState}
        onGoalChange={setGoalState}
        waterMl={waterMl}
        onAddWater={(ml, source) => {
          setWaterMl((w) => w + ml);
          setToast({ message: announceWaterAdded(ml, waterMl + ml), undo: source === 'quick' ? () => setWaterMl((w) => Math.max(0, w - ml)) : undefined });
        }}
        onSetWaterTotal={(ml) => {
          setWaterMl(ml);
          setToast({ message: `Today's water set to ${ml} ml.` });
        }}
      />
      <Toast open={toast !== null} message={toast?.message ?? ''} actionLabel={toast?.undo ? 'Undo' : undefined} onAction={toast?.undo} onDismiss={() => setToast(null)} />
    </>
  );
}

export interface WithAddToMealProps {
  candidate: FoodCandidate;
  portion: Portion;
  meal: MealType | null;
  hint?: string;
  onConfirm?: (meal: MealType, portion: Portion) => void;
  children: ReactNode;
}

/** A screen with the Add-to-meal sheet open over it, the way App composes O05 / O05-2. */
export function WithAddToMeal({ candidate, portion, meal, hint, onConfirm, children }: WithAddToMealProps) {
  const [open, setOpen] = useState(true);
  return (
    <>
      {children}
      <AddToMealSheet
        open={open}
        candidate={candidate}
        initialPortion={portion}
        initialMeal={meal}
        mealHint={hint}
        onConfirm={(m, p) => {
          onConfirm?.(m, p);
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
