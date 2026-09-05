/**
 * Small stateful harnesses for the mapped product-state stories: they compose production
 * screens the way App does (a screen plus the app-level toast or sheet) so a story can
 * freeze a state that only the runtime's state holds. They are Storybook-only.
 */
import { useState, type ReactNode } from 'react';

import { NavigationBar, Toast, type ViewMode } from '../../design-system';
import { AddToMealSheet } from '../../features/calorie-calculator/components/AddToMealSheet';
import type { FoodCandidate, Portion } from '../../features/calorie-calculator/domain/calculation';
import type { DailyGoal, FoodEntry } from '../../features/calorie-calculator/domain/daily-log';
import type { MealType } from '../../features/calorie-calculator/domain/meal';
import { announceWaterAdded } from '../../features/calorie-calculator/domain/water';
import { HomeScreen, type HomeScreenProps } from '../../features/calorie-calculator/screens/HomeScreen';
import { foodCatalogue, searchFoods } from '../../features/calorie-calculator/domain/fixtures';
import { NO_FOOD_FILTERS, type FoodFilters } from '../../features/calorie-calculator/domain/food-search';
import { SearchScreen, type SearchScope } from '../screens/SearchScreen';

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

export interface WithFoodSearchProps {
  initialQuery?: string;
  initialView?: ViewMode;
  initialFilters?: FoodFilters;
  recents?: readonly FoodCandidate[];
  onOpenFood?: (candidate: FoodCandidate) => void;
  onScanBarcode?: () => void;
  onEnterManually?: () => void;
}

/**
 * Search in the Food scope with the state the app owns (query, view, filters) held
 * locally, over the real catalogue and the demo search engine, so the toolbar, the
 * filter sheet and the unified results can be exercised in one story.
 */
export function WithFoodSearch({ initialQuery = '', initialView = 'list', initialFilters = NO_FOOD_FILTERS, recents = [], onOpenFood = () => {}, onScanBarcode = () => {}, onEnterManually = () => {} }: WithFoodSearchProps) {
  const [scope, setScope] = useState<SearchScope>('food');
  const [query, setQuery] = useState(initialQuery);
  const [view, setView] = useState<ViewMode>(initialView);
  const [filters, setFilters] = useState<FoodFilters>(initialFilters);
  const trimmed = query.trim();
  const food = trimmed ? ({ status: 'ready', results: searchFoods(trimmed) } as const) : ({ status: 'idle', results: [] } as const);
  return (
    <SearchScreen
      scope={scope}
      onScopeChange={setScope}
      query={query}
      onQueryChange={setQuery}
      onSubmit={() => {}}
      onClear={() => setQuery('')}
      food={food}
      catalogue={foodCatalogue}
      recents={recents}
      foodFilters={filters}
      onApplyFoodFilters={setFilters}
      foodView={view}
      onFoodViewChange={setView}
      recipes={{ status: 'idle', results: [] }}
      criteria={{}}
      onApplyCriteria={() => {}}
      onRemoveCriterion={() => {}}
      onOpenFood={onOpenFood}
      onOpenRecipe={() => {}}
      onScanBarcode={onScanBarcode}
      onRetry={() => {}}
      onEnterManually={onEnterManually}
      navigation={<NavigationBar selected="search" onSelect={() => {}} onLogFood={() => {}} />}
    />
  );
}
