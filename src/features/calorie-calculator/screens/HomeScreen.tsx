import { useMemo, useState, type ReactNode } from 'react';

import { FoodResultRow } from '../../../design-system/components/FoodResultRow/FoodResultRow';
import { NutritionMacros } from '../../../design-system/components/NutritionMacros/NutritionMacros';
import { AppHeader } from '../../../design-system/patterns/AppHeader/AppHeader';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Separator } from '../../../design-system/primitives/Separator/Separator';
import { Surface } from '../../../design-system/primitives/Surface/Surface';
import { Text } from '../../../design-system/primitives/Text/Text';
import { RootScreenLayout } from '../../../design-system/templates/RootScreenLayout/RootScreenLayout';
import { CalorieProgressRing } from '../components/CalorieProgressRing';
import { GoalSheet } from '../components/GoalSheet';
import { describePortion } from '../domain/calculation';
import { formatKcal, summarizeDay, type FoodEntry } from '../domain/daily-log';
import styles from './HomeScreen.module.css';

export interface HomeScreenProps {
  /** Today's committed entries only; the app selects the local day. */
  entries: readonly FoodEntry[];
  /** The committed optional goal. */
  goalKcal: number | null;
  /** Apply (number) or clear (null) from the contextual goal editor. */
  onGoalChange: (goalKcal: number | null) => void;
  /** A logged entry opens S07 in existing-entry mode. */
  onOpenEntry: (entryId: string) => void;
  /** The body Add food action — the same O01 instance as the trailing plus. */
  onAddFood: () => void;
  /** Opens or restores the Recipes browse destination (S03). */
  onFindRecipes: () => void;
  /** Labels of the criteria currently applied in Recipes browse; empty when none. */
  recipeCriteria?: readonly string[];
  /** The four-control NavigationBar, owned by the app shell. */
  navigation: ReactNode;
}

/**
 * S01 — Home, the daily overview. One focal point (today's calorie state), then the
 * supporting macros, today's logged food with the primary Add food action, and the
 * recipe-discovery entry point. S01-1 (no committed entries today) and S01-2 (one or
 * more) share the same region order; only the food section changes. Logging and the
 * goal are optional: neither job needs them.
 */
export function HomeScreen({ entries, goalKcal, onGoalChange, onOpenEntry, onAddFood, onFindRecipes, recipeCriteria = [], navigation }: HomeScreenProps) {
  const [goalOpen, setGoalOpen] = useState(false);
  const summary = useMemo(() => summarizeDay(entries, goalKcal), [entries, goalKcal]);
  const populated = entries.length > 0;

  return (
    <RootScreenLayout header={<AppHeader title="Home" showWordmark />} navigation={navigation}>
      <Surface as="section" tone="surface" border="none" radius="grouped" padding={16} aria-labelledby="home-today-heading" className={styles.today}>
        <div className={styles.groupHeader}>
          <Text as="h2" id="home-today-heading" variant="section-title" color="primary">
            Today
          </Text>
          <Button variant="text" size="small" onClick={() => setGoalOpen(true)} aria-haspopup="dialog">
            {goalKcal === null ? 'Set a daily goal' : 'Edit daily goal'}
          </Button>
        </div>
        <CalorieProgressRing summary={summary} />
        <Separator />
        <div aria-label="Nutrition logged today">
          <NutritionMacros
            size="compact"
            protein={{ value: summary.protein.value, partial: !summary.protein.complete }}
            carbohydrates={{ value: summary.carbohydrates.value, partial: !summary.carbohydrates.complete }}
            fat={{ value: summary.fat.value, partial: !summary.fat.complete }}
          />
        </div>
      </Surface>

      <section aria-labelledby="home-food-heading" className={styles.section}>
        <div className={styles.sectionHeader}>
          <Text as="h2" id="home-food-heading" variant="section-title" color="primary">
            Today&rsquo;s food
          </Text>
          {populated ? (
            <Text as="p" variant="supporting" color="secondary">
              {entries.length === 1 ? '1 entry' : `${entries.length} entries`} · {formatKcal(summary.energy.kcal)} kcal
            </Text>
          ) : null}
        </div>
        {populated ? (
          <ul className={styles.entries}>
            {entries.map((entry) => (
              <li key={entry.id}>
                <FoodResultRow name={entry.candidate.name} detail={describePortion(entry.candidate, entry.portion)} calories={entry.result.energyKcal} onClick={() => onOpenEntry(entry.id)} />
              </li>
            ))}
          </ul>
        ) : (
          <Text as="p" variant="body" color="secondary" wrap>
            Nothing logged today. Add a food or dish to review its portion and nutrition; adding it to today is optional.
          </Text>
        )}
        <Button variant="primary" block onClick={onAddFood}>
          {populated ? 'Add food' : 'Add first food'}
        </Button>
      </section>

      <section aria-labelledby="home-recipes-heading" className={styles.section}>
        <Text as="h2" id="home-recipes-heading" variant="section-title" color="primary">
          Find a recipe
        </Text>
        {recipeCriteria.length > 0 ? (
          <>
            <Text as="p" variant="body" color="secondary" wrap>
              Your applied filters: {recipeCriteria.join(', ')}.
            </Text>
            <Button variant="secondary" block onClick={onFindRecipes}>
              See matching recipes
            </Button>
          </>
        ) : (
          <>
            <Text as="p" variant="body" color="secondary" wrap>
              Browse recipes, or narrow them by calories, protein, preparation time and dietary preference.
            </Text>
            <Button variant="secondary" block onClick={onFindRecipes}>
              Find recipes
            </Button>
          </>
        )}
      </section>

      <GoalSheet
        open={goalOpen}
        goalKcal={goalKcal}
        onApply={(kcal) => {
          onGoalChange(kcal);
          setGoalOpen(false);
        }}
        onClear={() => {
          onGoalChange(null);
          setGoalOpen(false);
        }}
        onCancel={() => setGoalOpen(false)}
      />
    </RootScreenLayout>
  );
}
