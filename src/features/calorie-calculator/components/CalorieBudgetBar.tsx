import { Button } from '../../../design-system/primitives/Button/Button';
import { ProgressBar } from '../../../design-system/primitives/ProgressBar/ProgressBar';
import { Text } from '../../../design-system/primitives/Text/Text';
import { NBSP } from '../../../design-system/nutrition/nutrition';
import { formatKcal, type DailySummary } from '../domain/daily-log';
import styles from './CalorieBudgetBar.module.css';

export interface CalorieBudgetBarProps {
  /** Prepared display data from `summarizeDay`; the component owns no arithmetic or records. */
  summary: DailySummary;
  /** The one targets action on Home: Set targets without a calorie target, Edit targets with one. Applies from today. */
  onSetTargets?: () => void;
  /** True when the shown day is before today: a missing target is explained as "none was set for this day". */
  pastDay?: boolean;
  className?: string;
}

/**
 * What the figure means, per state (docs/ux/low-fidelity.md §4.3, ui-contract §3,
 * ledger D-19/D-20): remaining while below the target, 0 remaining at it, the excess above
 * it; without a target or with a partial total the logged amount itself, so the number and
 * the bar never contradict each other.
 */
function figure(summary: DailySummary): { number: string; caption: string } {
  switch (summary.state) {
    case 'below':
    case 'reached':
      return { number: formatKcal(summary.remainingKcal ?? 0), caption: 'kcal remaining' };
    case 'exceeded':
      return { number: formatKcal(summary.overKcal ?? 0), caption: 'kcal over target' };
    case 'incomplete':
      return { number: formatKcal(summary.energy.kcal), caption: 'kcal logged so far' };
    case 'no-goal':
      return { number: formatKcal(summary.energy.kcal), caption: 'kcal logged' };
  }
}

/** The status line; only states that need an explanation have one. Nothing is inferred from the amount logged so far. */
function status(summary: DailySummary): string | null {
  switch (summary.state) {
    case 'reached':
      return 'Daily target reached.';
    case 'exceeded':
      return `${formatKcal(summary.overKcal ?? 0)} kcal over your target.`;
    case 'incomplete':
      return 'Some entries have no calorie data, so the total is partial and the remaining amount is not available.';
    case 'no-goal':
      return 'Set a calorie target to see what remains for the day. It is optional.';
    case 'below':
      return null;
  }
}

/** The no-target note for a day before today: nothing is invented for it, and a new target starts today. */
const PAST_NO_GOAL = 'No target was set for this day, so only the logged amount is shown. A new target applies from today onward.';

/** Accessible description of the bar, with units and state. */
function describeBar(summary: DailySummary): string {
  const percent = Math.round((summary.ratio ?? 0) * 100);
  return `${formatKcal(summary.energy.kcal)} of ${formatKcal(summary.goalKcal ?? 0)} kcal, ${percent} %`;
}

/**
 * Home's calorie card (ledger §13, after H-REF 1): the remaining / logged figure with the
 * one `Set targets` / `Edit targets` action at its end, the horizontal track with the
 * target marked, then the consumed amount (with the legend dot) and the target stated beneath it. Controlled and
 * presentational — it formats and labels the summary it is given; entries, targets,
 * arithmetic and persistence belong to the feature. Without a target no bar is drawn (a
 * meaningless empty track is not a state) and no percentage or remainder is invented.
 */
export function CalorieBudgetBar({ summary, onSetTargets, pastDay = false, className }: CalorieBudgetBarProps) {
  const f = figure(summary);
  const note = summary.state === 'no-goal' && pastDay ? PAST_NO_GOAL : status(summary);
  const hasTarget = summary.goalKcal !== null;
  const percent = summary.ratio === null ? null : Math.round((summary.energy.kcal / (summary.goalKcal as number)) * 100);

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
        {onSetTargets ? (
          <Button variant={hasTarget ? 'text' : 'secondary'} size="small" onClick={onSetTargets} aria-haspopup="dialog" className={styles.action}>
            {hasTarget ? 'Edit targets' : 'Set targets'}
          </Button>
        ) : null}
      </div>

      {hasTarget ? (
        <>
          <ProgressBar
            value={summary.ratio === null ? null : summary.energy.kcal}
            max={summary.goalKcal}
            label="Calories logged against your target"
            valueText={summary.ratio === null ? undefined : describeBar(summary)}
            marker
          />
          <dl className={styles.stats}>
            <div className={styles.stat}>
              <dt className={styles.consumed}>
                <span className={styles.legendDot} aria-hidden="true" />
                <Text variant="supporting" color="secondary">
                  <Text variant="action-md" numeric color="primary">
                    {formatKcal(summary.energy.kcal)}
                  </Text>{' '}
                  consumed
                  {summary.energy.complete ? null : ' (partial)'}
                  {percent === null ? null : (
                    <>
                      {' '}
                      · <span className="portion-numeric">{percent}{NBSP}%</span>
                    </>
                  )}
                </Text>
              </dt>
              <dd className={styles.goal}>
                <Text variant="supporting" color="secondary">
                  Target{' '}
                  <Text variant="supporting" numeric color="primary">
                    {formatKcal(summary.goalKcal ?? 0)} kcal
                  </Text>
                </Text>
              </dd>
            </div>
          </dl>
        </>
      ) : null}

      {note ? (
        <Text as="p" variant="supporting" color="secondary" wrap className={styles.note}>
          {note}
        </Text>
      ) : null}
    </div>
  );
}
