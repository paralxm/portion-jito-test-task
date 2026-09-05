/**
 * Small stateful harnesses for the mapped product-state stories: they compose production
 * screens the way App does (a screen plus the app-level toast or sheet) so a story can
 * freeze a state that only the runtime's state holds. They are Storybook-only.
 */
import { useState, type ReactNode } from 'react';

import { NavigationBar, Toast, type ViewMode } from '../../design-system';
import { AddToMealSheet } from '../../features/calorie-calculator/components/AddToMealSheet';
import type { FoodCandidate, Portion } from '../../features/calorie-calculator/domain/calculation';
import { entriesForDay, type DailyGoal, type FoodEntry } from '../../features/calorie-calculator/domain/daily-log';
import { dayPhrase } from '../../features/calorie-calculator/domain/day-keys';
import { computeStreak } from '../../features/calorie-calculator/domain/streak';
import type { MealType } from '../../features/calorie-calculator/domain/meal';
import { announceWaterAdded } from '../../features/calorie-calculator/domain/water';
import { HomeScreen, type HomeScreenProps } from '../../features/calorie-calculator/screens/HomeScreen';
import { foodCatalogue, searchFoods } from '../../features/calorie-calculator/domain/fixtures';
import { recipeCatalogue } from '../../features/recipe-discovery/domain/fixtures';
import { filterRecipes, searchRecipes, type RecipeCriteria } from '../../features/recipe-discovery/domain/matching';
import { NO_FOOD_FILTERS, type FoodFilters } from '../../features/calorie-calculator/domain/food-search';
import { SearchScreen, type SearchScope } from '../screens/SearchScreen';

export interface HomeWithWaterProps extends Omit<HomeScreenProps, 'waterMl' | 'onAddWater' | 'onSetWaterTotal' | 'entries' | 'goal' | 'onGoalChange' | 'selectedDayKey' | 'todayKey' | 'onSelectDay' | 'streak'> {
  /** Entries of any day; the harness selects the day's subset the way App does. */
  entries: readonly FoodEntry[];
  goal: DailyGoal | null;
  /** Water for the initially selected day (other days start at 0). */
  initialWaterMl: number;
  todayKey: string;
  initialSelectedDayKey?: string;
  onSelectDay?: (dayKey: string) => void;
}

/**
 * Home with what the app owns held locally — the selected day, the water record per day,
 * the streak from the entries and the confirmation toast — so day selection, quick add
 * and Undo can be exercised in one story.
 */
export function HomeWithWater({ initialWaterMl, entries, goal, todayKey, initialSelectedDayKey, onSelectDay, ...rest }: HomeWithWaterProps) {
  const [selectedDayKey, setSelectedDayKey] = useState(initialSelectedDayKey ?? todayKey);
  const [water, setWater] = useState<Record<string, number>>({ [selectedDayKey]: initialWaterMl });
  const [goalState, setGoalState] = useState(goal);
  const [toast, setToast] = useState<{ message: string; undo?: () => void } | null>(null);
  const waterMl = water[selectedDayKey] ?? 0;
  return (
    <>
      <HomeScreen
        {...rest}
        entries={entriesForDay(entries, selectedDayKey)}
        goal={goalState}
        onGoalChange={setGoalState}
        selectedDayKey={selectedDayKey}
        todayKey={todayKey}
        onSelectDay={(dayKey) => {
          setSelectedDayKey(dayKey);
          onSelectDay?.(dayKey);
        }}
        streak={computeStreak(entries, todayKey)}
        waterMl={waterMl}
        onAddWater={(ml, source) => {
          const dayKey = selectedDayKey;
          setWater((w) => ({ ...w, [dayKey]: (w[dayKey] ?? 0) + ml }));
          setToast({ message: announceWaterAdded(ml, waterMl + ml), undo: source === 'quick' ? () => setWater((w) => ({ ...w, [dayKey]: Math.max(0, (w[dayKey] ?? 0) - ml) })) : undefined });
        }}
        onSetWaterTotal={(ml) => {
          const dayKey = selectedDayKey;
          setWater((w) => ({ ...w, [dayKey]: ml }));
          setToast({ message: `Water ${dayPhrase(dayKey, todayKey)} set to ${ml} ml.` });
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
  const [criteria, setCriteria] = useState<RecipeCriteria>({});
  const trimmed = query.trim();
  const food = trimmed ? ({ status: 'ready', results: searchFoods(trimmed) } as const) : ({ status: 'idle', results: [] } as const);
  const recipes = trimmed ? ({ status: 'ready', results: filterRecipes(searchRecipes(recipeCatalogue, trimmed), criteria) } as const) : ({ status: 'idle', results: [] } as const);
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
      recipes={recipes}
      recipeCatalogue={recipeCatalogue}
      recipeCatalogueStatus="ready"
      criteria={criteria}
      onApplyCriteria={setCriteria}
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
