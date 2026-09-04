import { useLayoutEffect, useRef, useState } from 'react';

import { ProgressRing } from '../../../design-system/primitives/ProgressRing/ProgressRing';
import { Text } from '../../../design-system/primitives/Text/Text';
import { formatKcal, type DailySummary } from '../domain/daily-log';
import styles from './CalorieProgressRing.module.css';

export interface CalorieProgressRingProps {
  /** Prepared display data from `summarizeDay`; the component owns no arithmetic or records. */
  summary: DailySummary;
  className?: string;
}

/**
 * What the centre number means, per state (docs/ux/low-fidelity.md §4.3 and
 * ui-contract §3): the arc is logged ÷ goal; the number is what is left of the goal —
 * *remaining* — while a goal exists and the total is complete. Above the goal it is the
 * excess, and without a goal or with a partial total it is the logged amount itself, so
 * the number and the arc never contradict each other.
 */
function centre(summary: DailySummary): { number: string; caption: string } {
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

/** The status line under the figures; only states that need an explanation have one. */
function status(summary: DailySummary): string | null {
  switch (summary.state) {
    case 'reached':
      return 'Daily goal reached.';
    case 'exceeded':
      return `${formatKcal(summary.overKcal ?? 0)} kcal over your set goal.`;
    case 'incomplete':
      return 'Some entries have no calorie data, so the total is partial and the remaining amount is not available.';
    case 'no-goal':
      return 'No daily goal set, so there is no remaining amount.';
    case 'below':
      return null;
  }
}

/** Accessible description of the arc, with units and state. */
function describeArc(summary: DailySummary): string {
  const logged = `${formatKcal(summary.energy.kcal)} kcal logged today`;
  switch (summary.state) {
    case 'no-goal':
      return `${logged}, no daily goal set`;
    case 'incomplete':
      return `At least ${logged}; some entries have no calorie data`;
    default: {
      const percent = Math.round((summary.ratio ?? 0) * 100);
      return `${formatKcal(summary.energy.kcal)} of ${formatKcal(summary.goalKcal ?? 0)} kcal logged today, ${percent} %`;
    }
  }
}

/** Below this container width (16 rem: 256 px at 100 % text) the number moves under the ring. */
const STACK_BELOW_REM = 16;

/**
 * Home's daily calorie state: the ProgressRing with the remaining/logged figure inside
 * it, then Logged and Goal beneath. Controlled and presentational — it formats and
 * labels the summary it is given; entries, goals, arithmetic and persistence belong to
 * the feature. When the container is narrower than 16 rem (enlarged text on every
 * supported viewport) or the figure has more than five characters, the ring shrinks to
 * its medium size and the figure sits below it, so the number is never squeezed.
 */
export function CalorieProgressRing({ summary, className }: CalorieProgressRingProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return;
    const measure = () => {
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      setNarrow(root.clientWidth < STACK_BELOW_REM * rem);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    measure();
    return () => observer.disconnect();
  }, []);

  const figure = centre(summary);
  const stacked = narrow || figure.number.length > 5;
  const note = status(summary);
  const ringValue = summary.ratio === null ? null : summary.energy.kcal;
  const ringMax = summary.goalKcal ?? 100;

  const figureBlock = (
    <div className={styles.figure}>
      <Text as="p" variant="main-result" numeric color="primary" className={styles.number}>
        {figure.number}
      </Text>
      <Text as="p" variant="label" color="secondary">
        {figure.caption}
      </Text>
    </div>
  );

  return (
    <div ref={rootRef} className={[styles.root, className].filter(Boolean).join(' ')} data-layout={stacked ? 'stacked' : 'centre'} data-state={summary.state}>
      <div className={styles.ringArea}>
        <ProgressRing value={ringValue} min={0} max={ringMax} size={stacked ? 'medium' : 'large'} label={describeArc(summary)}>
          {stacked ? null : figureBlock}
        </ProgressRing>
        {stacked ? figureBlock : null}
      </div>
      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt>
            <Text variant="supporting" color="secondary">
              Logged
            </Text>
          </dt>
          <dd>
            <Text variant="metric-inline" numeric color="primary">
              {formatKcal(summary.energy.kcal)} kcal
            </Text>
            {summary.energy.complete ? null : (
              <Text variant="caption" color="secondary" className={styles.partial}>
                Partial total
              </Text>
            )}
          </dd>
        </div>
        <div className={styles.stat}>
          <dt>
            <Text variant="supporting" color="secondary">
              Goal
            </Text>
          </dt>
          <dd>
            {summary.goalKcal === null ? (
              <Text variant="metric-inline" color="secondary">
                Not set
              </Text>
            ) : (
              <Text variant="metric-inline" numeric color="primary">
                {formatKcal(summary.goalKcal)} kcal
              </Text>
            )}
          </dd>
        </div>
      </dl>
      {note ? (
        <Text as="p" variant="supporting" color="secondary" align="center" wrap className={styles.note}>
          {note}
        </Text>
      ) : null}
    </div>
  );
}
