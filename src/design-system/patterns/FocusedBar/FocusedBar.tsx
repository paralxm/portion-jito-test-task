import type { ReactNode } from 'react';
import { ArrowLeft } from '@phosphor-icons/react';

import { Container } from '../../primitives/layout/Container';
import { IconButton } from '../../primitives/IconButton/IconButton';
import { Text } from '../../primitives/Text/Text';
import { VisuallyHidden } from '../../primitives/VisuallyHidden/VisuallyHidden';
import styles from './FocusedBar.module.css';

export interface FocusedBarProps {
  onBack: () => void;
  backLabel?: string;
  /**
   * A step position (`{ current, total }`) shown as tabular "1/3" in the centre and
   * announced as "Step 1 of 3"; omitted on screens without a step (the bar keeps its
   * geometry so nothing moves between steps and the review).
   */
  step?: { current: number; total: number };
  /** The trailing 48 px slot, normally the contextual Help action. */
  trailing?: ReactNode;
  className?: string;
}

/**
 * The compact top bar of a multi-step focused task (ledger §14): equal 48 px leading and
 * trailing action slots around a flexible centre, so the step count is centred on the
 * container rather than on the space between unequal controls. The screen's heading is
 * content beneath the bar, not part of it. Owns the top safe area once.
 */
export function FocusedBar({ onBack, backLabel = 'Back', step, trailing, className }: FocusedBarProps) {
  return (
    <header className={[styles.bar, className].filter(Boolean).join(' ')}>
      <Container className={styles.row}>
        <div className={styles.slot}>
          <IconButton icon={ArrowLeft} label={backLabel} onClick={onBack} />
        </div>
        <div className={styles.centre}>
          {step ? (
            <Text as="p" variant="supporting" color="secondary" numeric className={styles.step}>
              <VisuallyHidden>
                Step {step.current} of {step.total}
              </VisuallyHidden>
              <span aria-hidden="true">
                {step.current}/{step.total}
              </span>
            </Text>
          ) : null}
        </div>
        <div className={styles.slot}>{trailing}</div>
      </Container>
    </header>
  );
}
