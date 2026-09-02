import type { ReactNode } from 'react';
import { ArrowLeft } from '@phosphor-icons/react';

import { IconButton } from '../../primitives/IconButton/IconButton';
import { Text } from '../../primitives/Text/Text';
import styles from './AppHeader.module.css';

export interface AppHeaderProps {
  /** Location or task title. A root screen uses the 28/36 heading; a focused step uses the 18/24 bar title. */
  title: ReactNode;
  variant?: 'root' | 'focused';
  /** Back action for focused steps. Its destination is the actual preceding step, decided by the caller. */
  onBack?: () => void;
  backLabel?: string;
  /** Trailing controls, e.g. a close action. */
  trailing?: ReactNode;
  /** Root screens may show the lowercase wordmark above the heading. */
  showWordmark?: boolean;
  headingLevel?: 1 | 2;
  className?: string;
}

/**
 * Screen header. A root heading and a compact bar title are two placements for the same
 * location label — a screen shows one of them, never both.
 */
export function AppHeader({ title, variant = 'root', onBack, backLabel = 'Back', trailing, showWordmark = false, headingLevel = 1, className }: AppHeaderProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  if (variant === 'focused') {
    return (
      <header className={[styles.focused, className].filter(Boolean).join(' ')}>
        <div className={styles.leading}>{onBack ? <IconButton icon={ArrowLeft} label={backLabel} onClick={onBack} /> : null}</div>
        <Text as={Heading} variant="compact-title" color="primary" className={styles.barTitle} wrap>
          {title}
        </Text>
        <div className={styles.trailing}>{trailing}</div>
      </header>
    );
  }
  return (
    <header className={[styles.root, className].filter(Boolean).join(' ')}>
      {showWordmark ? (
        <Text as="p" variant="wordmark" color="primary" className={styles.wordmark} aria-label="Portion">
          portion
        </Text>
      ) : null}
      <div className={styles.rootRow}>
        <Text as={Heading} variant="screen-heading" color="primary" className={styles.rootTitle} wrap>
          {title}
        </Text>
        {trailing ? <div className={styles.trailing}>{trailing}</div> : null}
      </div>
    </header>
  );
}
