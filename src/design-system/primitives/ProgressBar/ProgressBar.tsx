import styles from './ProgressBar.module.css';

export type ProgressBarTone = 'default' | 'water' | 'protein' | 'carbohydrates' | 'fat';
export type ProgressBarSize = 'default' | 'compact';

export interface ProgressBarProps {
  /** The current amount, or `null` when no ratio can be presented (nothing is drawn as 0 %). */
  value: number | null;
  /** The bound the track represents (a goal or target), or `null` when none exists. */
  max: number | null;
  min?: number;
  /**
   * Accessible name of what the bar measures, e.g. "Calories logged against your goal".
   * The consuming context owns the readable numbers beside the bar.
   */
  label: string;
  /** Readable value for assistive technology, e.g. "400 of 2,000 kcal, 20 %". Defaults to "value of max". */
  valueText?: string;
  /** Draws a tick at the bound so the end of the track reads as the goal, not as the edge of the layout. */
  marker?: boolean;
  tone?: ProgressBarTone;
  /** `default` is 8 px tall; `compact` is 4 px for subordinate rows. */
  size?: ProgressBarSize;
  className?: string;
}

/** Normalises to a 0–1 ratio; unavailable when either number is missing or the range is empty. Over-bound is clamped and reported. */
export function barRatio(value: number | null, min: number, max: number | null): { ratio: number | null; over: boolean } {
  if (value === null || max === null || !Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    return { ratio: null, over: false };
  }
  const raw = (value - min) / (max - min);
  return { ratio: Math.min(1, Math.max(0, raw)), over: raw > 1 };
}

/**
 * ProgressBar — a determinate quantity relative to a bound, drawn as a horizontal track,
 * a bounded fill and an optional marker at the bound. It is a `meter` (an amount against
 * a known range), not a loading indicator and not a task progressbar. The fill's only
 * motion is a short width transition on update (the value-change token), which reduced
 * motion collapses to none. Over the bound the fill stops at the marker and `data-over`
 * is set; the consuming text states the excess — colour never changes for it.
 * With no bound (`max: null`) or no value the track is drawn alone as an unavailable
 * presentation and exposed as an image, never as 0 % or 100 %.
 */
export function ProgressBar({ value, max, min = 0, label, valueText, marker = false, tone = 'default', size = 'default', className }: ProgressBarProps) {
  const { ratio, over } = barRatio(value, min, max);
  const available = ratio !== null;
  const semantics = available
    ? {
        role: 'meter' as const,
        'aria-valuemin': min,
        'aria-valuemax': max as number,
        'aria-valuenow': Math.min(value as number, max as number),
        'aria-valuetext': valueText ?? `${value} of ${max}`,
      }
    : { role: 'img' as const };

  return (
    <div
      className={[styles.bar, className].filter(Boolean).join(' ')}
      data-tone={tone}
      data-size={size}
      data-unavailable={available ? undefined : 'true'}
      data-over={over || undefined}
      aria-label={available ? label : `${label}: not available`}
      {...semantics}
    >
      <div className={styles.track}>
        {available ? <div className={styles.fill} style={{ inlineSize: `${(ratio as number) * 100}%` }} /> : null}
        {marker && available ? <div className={styles.marker} aria-hidden="true" /> : null}
      </div>
    </div>
  );
}
