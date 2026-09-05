import { Text } from '../Text/Text';
import styles from './PortionLogo.module.css';

export type PortionLogoSize = 'default' | 'compact';
export type PortionLogoTone = 'default' | 'monochrome' | 'inverse';

export interface PortionLogoProps {
  /** `default` is the 24/32 header lockup; `compact` is 18/24 for tight rows. */
  size?: PortionLogoSize;
  /** `default`: neutral wordmark, blue dot. `monochrome`: both neutral. `inverse`: both white, for a dark or action-coloured surface. */
  tone?: PortionLogoTone;
  /** The one accessible name of the lockup. The dot is decorative and never announced. */
  label?: string;
  className?: string;
}

/**
 * The Portion brand lockup: the lowercase `portion` wordmark (Inter Semi Bold, −3 %
 * tracking, the only place negative tracking is used) followed by the portion dot,
 * optically aligned to the x-height. It is the single brand rendering in the product —
 * headers use it, nothing recolours it outside the three tones, and it is never
 * stretched or paired with a second mark. Clear space equal to the dot on every side is
 * part of the component, so callers do not add their own.
 */
export function PortionLogo({ size = 'default', tone = 'default', label = 'Portion', className }: PortionLogoProps) {
  return (
    <span className={[styles.lockup, className].filter(Boolean).join(' ')} data-size={size} data-tone={tone} role="img" aria-label={label}>
      <Text as="span" variant={size === 'compact' ? 'wordmark-compact' : 'wordmark'} color="inherit" className={styles.wordmark} aria-hidden="true">
        portion
      </Text>
      <span className={styles.dot} aria-hidden="true" />
    </span>
  );
}
