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
import { GoalSheet } from '../components/GoalSheet';
import { MealGroup } from '../components/MealGroup';
import { WaterSheet, type WaterSheetMode } from '../components/WaterSheet';
import { WaterTracker } from '../components/WaterTracker';
import { summarizeDay, type DailyGoal, type FoodEntry } from '../domain/daily-log';
import type { MealType } from '../domain/meal';
import { WATER_GOAL_ML } from '../domain/water';
import styles from './HomeScreen.module.css';

export interface RecommendedRecipe {
  recipe: Recipe;
  /** Evidence when Recipes browse has active criteria the recipe satisfies; empty otherwise. */
  evidence: readonly MatchCriterion[];
}

export interface HomeScreenProps {
  /** Today's committed entries only; the app selects the local day. */
  entries: readonly FoodEntry[];
  /** The committed optional goal (calories plus optional targets). */
  goal: DailyGoal | null;
  /** Apply (a goal) or clear (null) from the contextual goal editor. */
  onGoalChange: (goal: DailyGoal | null) => void;
  /** A logged entry opens S07 in existing-entry mode. */
  onOpenEntry: (entryId: string) => void;
  /** A meal's add action starts the food task (O01) with that meal preselected. */
  onAddToMeal: (meal: MealType) => void;
  /** The one recommended recipe (ledger D-21), or null when the catalogue is not loaded. */
  recommended: RecommendedRecipe | null;
  /** Opens Recipe Details for the recommended recipe with the Home origin. */
  onOpenRecipe: (recipeId: string) => void;
  /** Opens or restores the Recipes browse destination (S03). */
  onFindRecipes: () => void;
  /** Today's water in millilitres. */
  waterMl: number;
  waterGoalMl?: number;
  /** Quick add and sheet additions; the app announces and offers Undo for the quick add. */
  onAddWater: (ml: number, source: 'quick' | 'sheet') => void;
  onSetWaterTotal: (ml: number) => void;
  /** A just-added entry to highlight briefly. */
  highlightEntryId?: string | null;
  /** The local date for the header context line; the app passes the real clock, stories a fixed one. */
  now?: Date;
  /** Deterministic starting mode for the water sheet in stories. */
  waterSheetOpen?: boolean;
  waterSheetMode?: WaterSheetMode;
  /** The four-control NavigationBar, owned by the app shell. */
  navigation: ReactNode;
}

const dateFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });

/**
 * S01 — Home, the daily overview (ledger D-31): header with the lockup, the date and
 * Set/Edit goal → the calorie budget with macros → one recommended recipe → today's
 * meals (all four, always) → water → the fixed bar. S01-1 (no committed entries today)
 * and S01-2 (one or more) share the same region order; only the meal rows change.
 * Logging, the goal and water are optional: neither job needs them.
 */
export function HomeScreen({
  entries,
  goal,
  onGoalChange,
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
  now,
  waterSheetOpen = false,
  waterSheetMode = 'add',
  navigation,
}: HomeScreenProps) {
  const [goalOpen, setGoalOpen] = useState(false);
  const [waterOpen, setWaterOpen] = useState(waterSheetOpen);
  const summary = useMemo(() => summarizeDay(entries, goal?.kcal ?? null), [entries, goal]);
  const today = now ?? new Date();

  return (
    <RootScreenLayout
      header={
        <AppHeader
          variant="root"
          title="Home"
          context={`Today · ${dateFormat.format(today)}`}
          trailing={
            <Button variant="text" size="small" onClick={() => setGoalOpen(true)} aria-haspopup="dialog">
              {goal === null ? 'Set goal' : 'Edit goal'}
            </Button>
          }
        />
      }
      navigation={navigation}
    >
      <Surface as="section" tone="surface" border="none" radius="grouped" padding={16} aria-labelledby="home-today-heading" className={styles.today}>
        <h2 id="home-today-heading" className="portion-visually-hidden">
          Today&rsquo;s calories
        </h2>
        <CalorieBudgetBar summary={summary} goal={goal} onSetGoal={() => setGoalOpen(true)} />
      </Surface>

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

      <MealGroup entries={entries} onOpenEntry={onOpenEntry} onAdd={onAddToMeal} highlightEntryId={highlightEntryId} />

      <WaterTracker totalMl={waterMl} goalMl={waterGoalMl} onQuickAdd={(ml) => onAddWater(ml, 'quick')} onOpen={() => setWaterOpen(true)} />

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
