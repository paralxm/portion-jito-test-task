import { useMemo, useState, type ReactNode } from 'react';

import type { MatchCriterion } from '../../../design-system/components/MatchCriteria/MatchCriteria';
import { AppHeader } from '../../../design-system/patterns/AppHeader/AppHeader';
import { RecipeCard } from '../../../design-system/patterns/RecipeCard/RecipeCard';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Surface } from '../../../design-system/primitives/Surface/Surface';
import { Text } from '../../../design-system/primitives/Text/Text';
import { RootScreenLayout } from '../../../design-system/templates/RootScreenLayout/RootScreenLayout';
import type { Recipe } from '../../recipe-discovery/domain/matching';
import { dietaryLabels } from '../../recipe-discovery/components/RecipeList';
import { CalorieBudgetBar } from '../components/CalorieBudgetBar';
import { DayStrip } from '../components/DayStrip';
import { GoalSheet } from '../components/GoalSheet';
import { MealGroup } from '../components/MealGroup';
import { StreakIndicator } from '../components/StreakIndicator';
import { WaterSheet, type WaterSheetMode } from '../components/WaterSheet';
import { WaterTracker } from '../components/WaterTracker';
import { summarizeDay, type DailyGoal, type FoodEntry } from '../domain/daily-log';
import { addDays, describeDay, describeSelectedDay } from '../domain/day-keys';
import type { MealType } from '../domain/meal';
import type { Streak } from '../domain/streak';
import { WATER_GOAL_ML } from '../domain/water';
import styles from './HomeScreen.module.css';

export interface RecommendedRecipe {
  recipe: Recipe;
  /** Evidence when Recipes browse has active criteria the recipe satisfies; empty otherwise. */
  evidence: readonly MatchCriterion[];
}

export interface HomeScreenProps {
  /** The selected day's committed entries only; the app selects the day. */
  entries: readonly FoodEntry[];
  /** The goal in force on the selected day, from the goal history (`null` when none was). */
  goal: DailyGoal | null;
  /** Apply (a goal) or clear (null); the app records it from today onward. */
  onGoalChange: (goal: DailyGoal | null) => void;
  /** The day Home shows and the device's current local day. */
  selectedDayKey: string;
  todayKey: string;
  onSelectDay: (dayKey: string) => void;
  /** The logging streak relative to today (never to the selected day). */
  streak: Streak;
  /** A logged entry opens S07 in existing-entry mode. */
  onOpenEntry: (entryId: string) => void;
  /** A meal's add action starts the food task (O01) with that meal preselected, for the selected day. */
  onAddToMeal: (meal: MealType) => void;
  /** The one recommended recipe (ledger D-21), or null when the catalogue is not loaded. */
  recommended: RecommendedRecipe | null;
  /** Opens Recipe Details for the recommended recipe with the Home origin. */
  onOpenRecipe: (recipeId: string) => void;
  /** Opens or restores the Recipes discovery destination (S03). */
  onFindRecipes: () => void;
  /** The selected day's water in millilitres. */
  waterMl: number;
  waterGoalMl?: number;
  /** Quick add and sheet additions for the selected day; the app announces and offers Undo for the quick add. */
  onAddWater: (ml: number, source: 'quick' | 'sheet') => void;
  onSetWaterTotal: (ml: number) => void;
  /** A just-added entry to highlight briefly. */
  highlightEntryId?: string | null;
  /** Deterministic starting mode for the water sheet in stories. */
  waterSheetOpen?: boolean;
  waterSheetMode?: WaterSheetMode;
  /** The four-control NavigationBar, owned by the app shell. */
  navigation: ReactNode;
}

/**
 * S01 — Home, the daily overview (ledger D-31, §12 A1): root header with the lockup, the
 * selected day's context line and the streak → the week strip → the calorie budget with
 * macros (the only Set goal / Edit goal action) → the meals (all four, always) → water →
 * one supporting recipe recommendation → the fixed bar. S01-1 (no committed entries on
 * the day) and S01-2 (one or more) share the same region order; only the meal rows
 * change. Any day up to today can be selected; the record shown is that day's.
 */
export function HomeScreen({
  entries,
  goal,
  onGoalChange,
  selectedDayKey,
  todayKey,
  onSelectDay,
  streak,
  onOpenEntry,
  onAddToMeal,
  recommended,
  onOpenRecipe,
  onFindRecipes,
  waterMl,
  waterGoalMl = WATER_GOAL_ML,
  onAddWater,
  onSetWaterTotal,
  highlightEntryId,
  waterSheetOpen = false,
  waterSheetMode = 'add',
  navigation,
}: HomeScreenProps) {
  const [goalOpen, setGoalOpen] = useState(false);
  const [waterOpen, setWaterOpen] = useState(waterSheetOpen);
  const summary = useMemo(() => summarizeDay(entries, goal?.kcal ?? null), [entries, goal]);
  const isToday = selectedDayKey === todayKey;
  const isYesterday = selectedDayKey === addDays(todayKey, -1);
  const day = describeDay(selectedDayKey);
  const dayLabel = isToday ? 'Today' : isYesterday ? 'Yesterday' : `${day.weekday}, ${day.monthDay}`;
  const mealsHeading = isToday ? 'Today’s meals' : isYesterday ? 'Yesterday’s meals' : `Meals on ${day.weekday}, ${day.monthDay}`;

  return (
    <RootScreenLayout header={<AppHeader variant="root" title="Home" context={describeSelectedDay(selectedDayKey, todayKey)} trailing={<StreakIndicator streak={streak} />} />} navigation={navigation}>
      <DayStrip selectedDayKey={selectedDayKey} todayKey={todayKey} onSelectDay={onSelectDay} />

      <Surface as="section" tone="surface" border="none" radius="grouped" padding={16} aria-labelledby="home-today-heading" className={styles.today}>
        <h2 id="home-today-heading" className="portion-visually-hidden">
          {isToday ? 'Today’s calories' : `Calories on ${day.long}`}
        </h2>
        <CalorieBudgetBar summary={summary} goal={goal} onSetGoal={() => setGoalOpen(true)} pastDay={!isToday} />
      </Surface>

      <MealGroup entries={entries} onOpenEntry={onOpenEntry} onAdd={onAddToMeal} highlightEntryId={highlightEntryId} heading={mealsHeading} />

      <WaterTracker totalMl={waterMl} goalMl={waterGoalMl} onQuickAdd={(ml) => onAddWater(ml, 'quick')} onOpen={() => setWaterOpen(true)} />

      {recommended ? (
        <section aria-labelledby="home-recipe-heading" className={styles.section}>
          <div className={styles.sectionHeader}>
            <Text as="h2" id="home-recipe-heading" variant="section-title" color="primary">
              {recommended.evidence.length > 0 ? 'Matches your filters' : 'Recommended recipe'}
            </Text>
            <Button variant="text" size="small" onClick={onFindRecipes}>
              All recipes
            </Button>
          </div>
          <RecipeCard
            title={recommended.recipe.title}
            imageUrl={recommended.recipe.imageUrl}
            calories={recommended.recipe.energyKcal}
            protein={recommended.recipe.proteinG}
            servingBasis={`per serving (${recommended.recipe.servingGrams} g)`}
            preparationMinutes={recommended.recipe.preparationMinutes}
            dietary={dietaryLabels(recommended.recipe.dietary)}
            criteria={recommended.evidence.length > 0 ? recommended.evidence : undefined}
            onOpen={() => onOpenRecipe(recommended.recipe.id)}
          />
        </section>
      ) : null}

      <GoalSheet
        open={goalOpen}
        goal={goal}
        onApply={(next) => {
          onGoalChange(next);
          setGoalOpen(false);
        }}
        onClear={() => {
          onGoalChange(null);
          setGoalOpen(false);
        }}
        onCancel={() => setGoalOpen(false)}
      />

      <WaterSheet
        open={waterOpen}
        totalMl={waterMl}
        goalMl={waterGoalMl}
        dayLabel={dayLabel}
        initialMode={waterSheetMode}
        onAdd={(ml) => {
          setWaterOpen(false);
          onAddWater(ml, 'sheet');
        }}
        onSaveTotal={(ml) => {
          setWaterOpen(false);
          onSetWaterTotal(ml);
        }}
        onCancel={() => setWaterOpen(false)}
      />
    </RootScreenLayout>
  );
}
