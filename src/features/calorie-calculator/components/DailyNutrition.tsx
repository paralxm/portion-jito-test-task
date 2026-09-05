import { NutritionMacros } from '../../../design-system/components/NutritionMacros/NutritionMacros';
import { Surface } from '../../../design-system/primitives/Surface/Surface';
import type { DailyGoal, DailySummary } from '../domain/daily-log';
import { CalorieBudgetBar } from './CalorieBudgetBar';
import styles from './DailyNutrition.module.css';

export interface DailyNutritionProps {
  summary: DailySummary;
  /** The targets in force on the shown day, for the optional macro targets. `null` when none. */
  goal: DailyGoal | null;
  onSetTargets?: () => void;
  pastDay?: boolean;
  /** The visible heading text, e.g. "Today's nutrition"; rendered for assistive technology only. */
  heading: string;
  className?: string;
}

/**
 * Home's daily-nutrition section (ledger §13, after H-REF 1): one coordinated group made
 * of the dominant calorie card and, directly beneath it, the three macro cards — Protein,
 * Carbs and Fat — sharing its outer alignment, width and surface (canvas, decorative
 * border, card radius), with close spacing and no extra wrapper border. The calorie card
 * leads through its 40/48 figure, not a darker fill. A calorie target does not imply macro targets:
 * each macro card shows the logged grams, and its target with its own track only when
 * the person entered that target. Unknown and partial values keep their words.
 */
export function DailyNutrition({ summary, goal, onSetTargets, pastDay = false, heading, className }: DailyNutritionProps) {
  const macros = {
    protein: { value: summary.protein.value, partial: !summary.protein.complete, target: goal?.proteinG ?? null },
    carbohydrates: { value: summary.carbohydrates.value, partial: !summary.carbohydrates.complete, target: goal?.carbohydratesG ?? null },
    fat: { value: summary.fat.value, partial: !summary.fat.complete, target: goal?.fatG ?? null },
  };
  return (
    <section aria-labelledby="home-nutrition-heading" className={[styles.section, className].filter(Boolean).join(' ')}>
      <h2 id="home-nutrition-heading" className="portion-visually-hidden">
        {heading}
      </h2>
      <Surface tone="canvas" border="decorative" radius="card" padding={16} className={styles.calories}>
        <CalorieBudgetBar summary={summary} onSetTargets={onSetTargets} pastDay={pastDay} />
      </Surface>
      <div aria-label="Macronutrients logged">
        <NutritionMacros size="compact" presentation="cards" protein={macros.protein} carbohydrates={macros.carbohydrates} fat={macros.fat} />
      </div>
    </section>
  );
}
