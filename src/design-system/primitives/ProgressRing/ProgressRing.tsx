import type { ReactNode } from 'react';

import styles from './ProgressRing.module.css';

export type ProgressRingSize = 'large' | 'medium';

export interface ProgressRingProps {
  /**
   * The current amount, or `null` when no ratio can be presented (for example no goal is
   * set). `null` draws the track alone — an "unavailable" presentation, never 0 %.
   */
  value: number | null;
  min?: number;
  max?: number;
  /** `large` (10 rem, 12 px stroke) holds centre content; `medium` (6 rem, 8 px stroke) sits beside its text. */
  size?: ProgressRingSize;
  /**
   * Accessible description of what the arc shows, with units and state, e.g.
   * "1,350 of 2,200 kcal logged today, 61 %". The ring itself is an image; the
   * consuming context owns the readable numbers.
   */
  label: string;
  /** Centre content (large size only); ordinary readable text, not a duplicate of `label`. */
  children?: ReactNode;
  className?: string;
}

/**
 * Geometry per size in SVG user units: the view box is the rendered size at 100 % text,
 * so a 12 px stroke stays 12 px at 100 % and scales with rem like everything else.
 */
const GEOMETRY: Record<ProgressRingSize, { box: number; stroke: number }> = {
  large: { box: 160, stroke: 12 },
  medium: { box: 96, stroke: 8 },
};

/**
 * Normalises the input to a 0–1 ratio. Non-finite numbers or an empty range are treated
 * as unavailable rather than drawn as 0 % or 100 %; anything beyond the range is clamped.
 */
export function progressRatio(value: number | null, min: number, max: number): { ratio: number | null; over: boolean } {
  if (value === null || !Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    return { ratio: null, over: false };
  }
  const raw = (value - min) / (max - min);
  return { ratio: Math.min(1, Math.max(0, raw)), over: raw > 1 };
}

/**
 * ProgressRing — a determinate quantity relative to a bound, drawn as a track and a
 * bounded arc. It is not a loading indicator (see Spinner) and knows nothing about
 * calories: a consumer supplies the numbers, the accessible description and any centre
 * text. 0 % shows the track only; 100 % and over-limit both show the full ring with the
 * same geometry — the words say which. The arc's only motion is a short length
 * transition on update, which reduced motion collapses to none.
 */
export function ProgressRing({ value, min = 0, max = 100, size = 'large', label, children, className }: ProgressRingProps) {
  const { box, stroke } = GEOMETRY[size];
  const radius = (box - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const { ratio, over } = progressRatio(value, min, max);
  const state = ratio === null ? 'unavailable' : over ? 'over' : ratio >= 1 ? 'complete' : ratio === 0 ? 'zero' : 'partial';
  const offset = ratio === null ? circumference : circumference * (1 - ratio);

  return (
    <div className={[styles.ring, className].filter(Boolean).join(' ')} data-size={size} data-state={state}>
      <svg className={styles.svg} viewBox={`0 0 ${box} ${box}`} role="img" aria-label={label} focusable="false">
        <circle className={styles.track} cx={box / 2} cy={box / 2} r={radius} strokeWidth={stroke} />
        {ratio !== null && ratio > 0 ? (
          <circle
            className={styles.arc}
            cx={box / 2}
            cy={box / 2}
            r={radius}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            // Round caps only while the arc is open; a closed ring needs no cap.
            strokeLinecap={ratio < 1 ? 'round' : 'butt'}
          />
        ) : null}
      </svg>
      {children ? <div className={styles.center}>{children}</div> : null}
    </div>
  );
}
