import { useMemo, useState, type ReactNode } from 'react';

import type { MatchCriterion } from '../../../design-system/components/MatchCriteria/MatchCriteria';
import { AppHeader } from '../../../design-system/patterns/AppHeader/AppHeader';
import { RecipeCard } from '../../../design-system/patterns/RecipeCard/RecipeCard';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Text } from '../../../design-system/primitives/Text/Text';
import { RootScreenLayout } from '../../../design-system/templates/RootScreenLayout/RootScreenLayout';
import type { Recipe } from '../../recipe-discovery/domain/matching';
import { dietaryLabels } from '../../recipe-discovery/components/RecipeList';
import { DailyNutrition } from '../components/DailyNutrition';
import { DayStrip } from '../components/DayStrip';
import { MealGroup } from '../components/MealGroup';
import { StreakIndicator } from '../components/StreakIndicator';
import { WaterSheet, type WaterSheetMode } from '../components/WaterSheet';
import { WaterTracker } from '../components/WaterTracker';
import { formatKcal, summarizeDay, type DailyGoal, type FoodEntry } from '../domain/daily-log';
import { addDays, describeDay, describeSelectedDay } from '../domain/day-keys';
import type { MealType } from '../domain/meal';
import type { Streak } from '../domain/streak';
import { WATER_GOAL_ML } from '../domain/water';
import styles from './HomeScreen.module.css';

export interface RecommendedRecipe {
  recipe: Recipe;
  /** Evidence when Recipes discovery has active preferences the recipe satisfies; empty otherwise. */
  evidence: readonly MatchCriterion[];
}

export interface HomeScreenProps {
  /** The selected day's committed entries only; the app selects the day. */
  entries: readonly FoodEntry[];
  /** The targets in force on the selected day, from the goal history (`null` when none were). */
  goal: DailyGoal | null;
  /** Home's one targets action: the app opens the route choice or the editor (ledger §14). */
  onSetTargets: () => void;
  /** The one scheduled change after today, stated on the calorie card while today is shown. */
  scheduledNote?: string;
  /** Save (targets) or remove (null); the app records it from today onward. */
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
  /** The daily water reference — a product default the person can change; never a personal need. */
  waterGoalMl?: number;
  /** Quick add and sheet additions for the selected day; the app announces and offers Undo for the quick add. */
  onAddWater: (ml: number, source: 'quick' | 'sheet') => void;
  onSetWaterTotal: (ml: number) => void;
  /** Changes the daily water reference for every day. */
  onSetWaterReference?: (ml: number) => void;
  /** A just-added entry to highlight briefly. */
  highlightEntryId?: string | null;
  /** Deterministic starting mode for the water sheet in stories. */
  waterSheetOpen?: boolean;
  waterSheetMode?: WaterSheetMode;
  /** Deterministic starting state for the targets sheet in stories. */
  /** The four-control NavigationBar, owned by the app shell. */
  navigation: ReactNode;
}

/**
 * S01 — Home, the daily overview (ledger §13, after H-REF 1): the root header with the
 * lockup, the selected day's context line and the streak → the compact day strip → the
 * daily nutrition section (the calorie card with the only Set targets / Edit targets
 * action, and the three macro cards) → one compact recipe recommendation → the meals
 * (all four, always) → water → the fixed bar. S01-1 (no committed entries on the day)
 * and S01-2 (one or more) share the same region order; only the meal rows change. Any
 * day up to today can be selected; the record shown is that day's.
 */
export function HomeScreen({
  entries,
  goal,
  onSetTargets,
  scheduledNote,
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
  onSetWaterReference,
  highlightEntryId,
  waterSheetOpen = false,
  waterSheetMode = 'add',
  navigation,
}: HomeScreenProps) {
  const [waterOpen, setWaterOpen] = useState(waterSheetOpen);
  const summary = useMemo(() => summarizeDay(entries, goal?.kcal ?? null), [entries, goal]);
  const isToday = selectedDayKey === todayKey;
  const isYesterday = selectedDayKey === addDays(todayKey, -1);
  const day = describeDay(selectedDayKey);
  const dayLabel = isToday ? 'Today' : isYesterday ? 'Yesterday' : `${day.weekday}, ${day.monthDay}`;
  const mealsHeading = isToday ? 'Today’s meals' : isYesterday ? 'Yesterday’s meals' : `Meals on ${day.weekday}, ${day.monthDay}`;
  const nutritionHeading = isToday ? 'Today’s nutrition' : `Nutrition on ${day.long}`;

  // A factual comparison only: the recipe's per-serving calories against what remains of a
  // complete total below the target. Never a suitability, health or preference claim.
  const fits = recommended && summary.state === 'below' && summary.remainingKcal !== null && recommended.recipe.energyKcal !== null && recommended.recipe.energyKcal <= summary.remainingKcal ? summary.remainingKcal : null;

  return (
    <RootScreenLayout header={<AppHeader variant="root" title="Home" context={describeSelectedDay(selectedDayKey, todayKey)} trailing={<StreakIndicator streak={streak} />} />} navigation={navigation}>
      <DayStrip selectedDayKey={selectedDayKey} todayKey={todayKey} onSelectDay={onSelectDay} />

      <DailyNutrition summary={summary} goal={goal} onSetTargets={onSetTargets} scheduledNote={scheduledNote} pastDay={!isToday} heading={nutritionHeading} />

      {recommended ? (
        <section aria-labelledby="home-recipe-heading" className={styles.section}>
          <div className={styles.sectionHeader}>
            <Text as="h2" id="home-recipe-heading" variant="section-title" color="primary">
              {recommended.evidence.length > 0 ? 'Matches your preferences' : 'Recipe to try'}
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
          >
            {fits !== null ? (
              <Text as="p" variant="supporting" color="secondary" wrap className={styles.fit}>
                One serving fits in your remaining {formatKcal(fits)} kcal.
              </Text>
            ) : null}
          </RecipeCard>
        </section>
      ) : null}

      <MealGroup entries={entries} onOpenEntry={onOpenEntry} onAdd={onAddToMeal} highlightEntryId={highlightEntryId} heading={mealsHeading} />

      <WaterTracker totalMl={waterMl} goalMl={waterGoalMl} onQuickAdd={(ml) => onAddWater(ml, 'quick')} onOpen={() => setWaterOpen(true)} />

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
        onSaveReference={
          onSetWaterReference
            ? (ml) => {
                setWaterOpen(false);
                onSetWaterReference(ml);
              }
            : undefined
        }
        onCancel={() => setWaterOpen(false)}
      />
    </RootScreenLayout>
  );
}
