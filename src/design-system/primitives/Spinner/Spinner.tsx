import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  /** 20 px inside compact controls, 24 px default, 32 px for a region-level pending state. */
  size?: 'small-action' | 'default' | 'emphasis';
  /** Accessible wording. Progress must be readable text, never only a shape. */
  label?: string;
  /**
   * Announce as a live status region. Turn off when the host control already reports
   * `aria-busy` and its own label, to avoid double announcements.
   */
  announce?: boolean;
  className?: string;
}

/**
 * Indeterminate progress. Under reduced motion the ring stops rotating but remains
 * visible with its text, so progress information is never removed.
 */
export function Spinner({ size = 'default', label = 'Loading', announce = true, className }: SpinnerProps) {
  return (
    <span
      className={[styles.spinner, className].filter(Boolean).join(' ')}
      data-size={size}
      role={announce ? 'status' : undefined}
    >
      <svg className={styles.ring} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle className={styles.track} cx="12" cy="12" r="9" />
        <circle className={styles.arc} cx="12" cy="12" r="9" />
      </svg>
      <VisuallyHidden>{label}</VisuallyHidden>
    </span>
  );
}
