import type { ReactNode } from 'react';
import { ArrowLeft } from '@phosphor-icons/react';

import { Container } from '../../primitives/layout/Container';
import { IconButton } from '../../primitives/IconButton/IconButton';
import { PortionLogo } from '../../primitives/PortionLogo/PortionLogo';
import { Text } from '../../primitives/Text/Text';
import { VisuallyHidden } from '../../primitives/VisuallyHidden/VisuallyHidden';
import styles from './AppHeader.module.css';

/**
 * `root`: the brand lockup, a contextual line and an optional trailing action — the
 * screen's name is a visually hidden h1 (Home). `section`: the 28/36 screen title with an
 * optional trailing action (Search, Recipes). `focused`: Back, the 18/24 bar title and an
 * optional trailing action or status (acquisition, review, recipe details).
 */
export type AppHeaderVariant = 'root' | 'section' | 'focused';

export interface AppHeaderProps {
  /** The screen's name. Visible in `section` and `focused`; the hidden h1 in `root`. */
  title: ReactNode;
  variant?: AppHeaderVariant;
  /** `root` only: the contextual line beside the lockup, e.g. "Today · 4 Sep". */
  context?: ReactNode;
  /** Back action for focused steps. Its destination is the actual preceding step, decided by the caller. */
  onBack?: () => void;
  backLabel?: string;
  /** Trailing control: a contextual control (the streak on Home, Filters) or a close. */
  trailing?: ReactNode;
  headingLevel?: 1 | 2;
  className?: string;
}

/**
 * Screen header. A screen shows exactly one variant. Each variant owns the top safe area
 * once through its own padding; content beneath never adds it again.
 */
export function AppHeader({ title, variant = 'section', context, onBack, backLabel = 'Back', trailing, headingLevel = 1, className }: AppHeaderProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';

  if (variant === 'focused') {
    return (
      <header className={[styles.focused, className].filter(Boolean).join(' ')}>
        <Container className={styles.focusedContent}>
          <div className={styles.leading}>{onBack ? <IconButton icon={ArrowLeft} label={backLabel} onClick={onBack} /> : null}</div>
          <Text as={Heading} variant="compact-title" color="primary" className={styles.barTitle} wrap>
            {title}
          </Text>
          <div className={styles.trailing}>{trailing}</div>
        </Container>
      </header>
    );
  }

  if (variant === 'root') {
    return (
      <header className={[styles.root, className].filter(Boolean).join(' ')}>
        <Container className={styles.rootRow}>
          <div className={styles.brand}>
            <PortionLogo />
            <VisuallyHidden as={Heading}>{title}</VisuallyHidden>
            {context ? (
              <>
                <span className={styles.divider} aria-hidden="true" />
                <Text as="p" variant="body" color="secondary" className={styles.context}>
                  {context}
                </Text>
              </>
            ) : null}
          </div>
          {trailing ? <div className={styles.trailing}>{trailing}</div> : null}
        </Container>
      </header>
    );
  }

  return (
    <header className={[styles.section, className].filter(Boolean).join(' ')}>
      <Container className={styles.sectionRow}>
        <Text as={Heading} variant="screen-heading" color="primary" className={styles.sectionTitle} wrap>
          {title}
        </Text>
        {trailing ? <div className={styles.trailing}>{trailing}</div> : null}
      </Container>
    </header>
  );
}
