import { NutritionMacros } from '../../../design-system/components/NutritionMacros/NutritionMacros';
import { Button } from '../../../design-system/primitives/Button/Button';
import { ProgressBar } from '../../../design-system/primitives/ProgressBar/ProgressBar';
import { Separator } from '../../../design-system/primitives/Separator/Separator';
import { Text } from '../../../design-system/primitives/Text/Text';
import { formatKcal, type DailyGoal, type DailySummary } from '../domain/daily-log';
import styles from './CalorieBudgetBar.module.css';

export interface CalorieBudgetBarProps {
  /** Prepared display data from `summarizeDay`; the component owns no arithmetic or records. */
  summary: DailySummary;
  /** The committed goal, for the optional macro targets. `null` when none is set. */
  goal: DailyGoal | null;
  /** The one goal action on Home: Set goal without a goal, Edit goal with one. Applies from today. */
  onSetGoal?: () => void;
  /** True when the shown day is before today: a missing goal is explained as "none was set for this day". */
  pastDay?: boolean;
  className?: string;
}

/**
 * What the figure means, per state (docs/ux/low-fidelity.md §4.3, ui-contract §3,
 * ledger D-19/D-20): remaining while below the goal, 0 remaining at it, the excess above
 * it; without a goal or with a partial total the logged amount itself, so the number and
 * the bar never contradict each other.
 */
function figure(summary: DailySummary): { number: string; caption: string } {
  switch (summary.state) {
    case 'below':
    case 'reached':
      return { number: formatKcal(summary.remainingKcal ?? 0), caption: 'kcal remaining' };
    case 'exceeded':
      return { number: formatKcal(summary.overKcal ?? 0), caption: 'kcal over goal' };
    case 'incomplete':
      return { number: formatKcal(summary.energy.kcal), caption: 'kcal logged so far' };
    case 'no-goal':
      return { number: formatKcal(summary.energy.kcal), caption: 'kcal logged' };
  }
}

/** The status line; only states that need an explanation have one. */
function status(summary: DailySummary): string | null {
  switch (summary.state) {
    case 'reached':
      return 'Daily goal reached.';
    case 'exceeded':
      return `${formatKcal(summary.overKcal ?? 0)} kcal over your set goal.`;
    case 'incomplete':
      return 'Some entries have no calorie data, so the total is partial and the remaining amount is not available.';
    case 'no-goal':
      return 'Set a goal to see what remains for the day. It is optional.';
    case 'below':
      return null;
  }
}

/** The no-goal note for a day before today: nothing is invented for it, and a new goal starts today. */
const PAST_NO_GOAL = 'No goal was set for this day, so only the logged amount is shown. A new goal applies from today onward.';

/** Accessible description of the bar, with units and state. */
function describeBar(summary: DailySummary): string {
  const percent = Math.round((summary.ratio ?? 0) * 100);
  return `${formatKcal(summary.energy.kcal)} of ${formatKcal(summary.goalKcal ?? 0)} kcal, ${percent} %`;
}

/**
 * Home's calorie budget: the remaining/logged figure, "consumed · %" and the goal, a
 * horizontal track with the goal marked, and the macro row beneath. Controlled and
 * presentational — it formats and labels the summary it is given; entries, goals,
 * arithmetic and persistence belong to the feature. Without a goal no bar is drawn (a
 * meaningless empty track is not a state), and `Set goal` sits beside the logged amount.
 */
export function CalorieBudgetBar({ summary, goal, onSetGoal, pastDay = false, className }: CalorieBudgetBarProps) {
  const f = figure(summary);
  const note = summary.state === 'no-goal' && pastDay ? PAST_NO_GOAL : status(summary);
  const hasGoal = summary.goalKcal !== null;
  const percent = summary.ratio === null ? null : Math.round((summary.energy.kcal / (summary.goalKcal as number)) * 100);
  const macros = {
    protein: { value: summary.protein.value, partial: !summary.protein.complete, target: goal?.proteinG ?? null },
    carbohydrates: { value: summary.carbohydrates.value, partial: !summary.carbohydrates.complete, target: goal?.carbohydratesG ?? null },
    fat: { value: summary.fat.value, partial: !summary.fat.complete, target: goal?.fatG ?? null },
  };

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')} data-state={summary.state}>
      <div className={styles.headline}>
        <p className={styles.figure}>
          <Text variant="main-result" numeric color="primary" className={styles.number}>
            {f.number}
          </Text>
          <Text variant="body" color="secondary" className={styles.caption}>
            {f.caption}
          </Text>
        </p>
        {onSetGoal ? (
          <Button variant={hasGoal ? 'text' : 'secondary'} size="small" onClick={onSetGoal} aria-haspopup="dialog">
            {hasGoal ? 'Edit goal' : 'Set goal'}
          </Button>
        ) : null}
      </div>

      {hasGoal ? (
        <>
          <dl className={styles.stats}>
            <div className={styles.stat}>
              <dt>
                <Text variant="supporting" color="secondary">
                  <Text variant="action-md" numeric color="primary">
                    {formatKcal(summary.energy.kcal)}
                  </Text>{' '}
                  consumed
                  {summary.energy.complete ? null : ' (partial)'}
                  {percent === null ? null : (
                    <>
                      {' '}
                      · <span className="portion-numeric">{percent} %</span>
                    </>
                  )}
                </Text>
              </dt>
              <dd className={styles.goal}>
                <Text variant="supporting" color="secondary">
                  Goal{' '}
                  <Text variant="supporting" numeric color="primary">
                    {formatKcal(summary.goalKcal ?? 0)}
                  </Text>
                </Text>
              </dd>
            </div>
          </dl>
          <ProgressBar
            value={summary.ratio === null ? null : summary.energy.kcal}
            max={summary.goalKcal}
            label="Calories logged against your goal"
            valueText={summary.ratio === null ? undefined : describeBar(summary)}
            marker
          />
        </>
      ) : null}

      {note ? (
        <Text as="p" variant="supporting" color="secondary" wrap className={styles.note}>
          {note}
        </Text>
      ) : null}

      <Separator />
      <div aria-label="Nutrition logged today">
        <NutritionMacros size="compact" protein={macros.protein} carbohydrates={macros.carbohydrates} fat={macros.fat} />
      </div>
    </div>
  );
}
