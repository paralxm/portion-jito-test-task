import { useState } from 'react';
import { CalendarCheck } from '@phosphor-icons/react';

import { Icon } from '../../../design-system/icons/Icon';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Text } from '../../../design-system/primitives/Text/Text';
import { ModalSheet } from '../../../design-system/patterns/ModalSheet/ModalSheet';
import { describeStreak, type Streak } from '../domain/streak';
import styles from './StreakIndicator.module.css';

export interface StreakIndicatorProps {
  streak: Streak;
  className?: string;
}

/**
 * The header's streak: a neutral glyph and the count of consecutive days with at least
 * one confirmed food or recipe entry, ending today or yesterday (ledger §12 A5). The
 * control's name reads the full explanation; activating it opens a short sheet with
 * the rule. There is no reward, badge or pressure copy — it is a count, stated plainly.
 */
export function StreakIndicator({ streak, className }: StreakIndicatorProps) {
  const [open, setOpen] = useState(false);
  const explanation = describeStreak(streak);
  return (
    <>
      <button type="button" className={[styles.indicator, className].filter(Boolean).join(' ')} onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={`Streak: ${explanation}`}>
        <Icon icon={CalendarCheck} size="small-action" />
        <Text as="span" variant="action-sm" numeric color="inherit">
          {streak.days}
        </Text>
        <Text as="span" variant="supporting" color="secondary" className={styles.unit}>
          {streak.days === 1 ? 'day' : 'days'}
        </Text>
      </button>
      <ModalSheet open={open} onRequestClose={() => setOpen(false)} title="Logging streak" description={explanation}>
        <Text as="p" variant="body" color="secondary" wrap>
          A day counts when it holds at least one food or recipe added to a meal. Water, opening the app, reaching a goal or looking at a day do not count. The streak always describes the run up to today, whichever day is selected.
        </Text>
        <div className={styles.close}>
          <Button variant="secondary" block onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </ModalSheet>
    </>
  );
}
