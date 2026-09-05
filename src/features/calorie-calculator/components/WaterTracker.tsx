import { useRef } from 'react';
import { CaretRight, Drop, Plus } from '@phosphor-icons/react';

import { Icon } from '../../../design-system/icons/Icon';
import { ProgressBar } from '../../../design-system/primitives/ProgressBar/ProgressBar';
import { Surface } from '../../../design-system/primitives/Surface/Surface';
import { Text } from '../../../design-system/primitives/Text/Text';
import { describeWaterState, formatWater, speakWater, WATER_GOAL_ML, WATER_QUICK_ADD_ML } from '../domain/water';
import { useAnimatedNumber } from './useAnimatedNumber';
import styles from './WaterTracker.module.css';

export interface WaterTrackerProps {
  totalMl: number;
  goalMl?: number;
  /** Adds the quick amount at once; the caller announces and offers Undo. */
  onQuickAdd: (ml: number) => void;
  /** Opens the water sheet for other amounts or editing the total. */
  onOpen: () => void;
  quickAddMl?: number;
  className?: string;
}

/**
 * Home's water tracker: one surface with two sibling controls — the content button
 * (`Edit water, 1.25 of 2 litres`) that opens the sheet, and the quick-add button
 * (`Add 250 millilitres of water`). No clickable container wraps another control. The
 * figure and the fill move from the previous to the new total on the value-change token
 * (instant under reduced motion); amount and reference are always stated in text, so
 * the water colour is never the only meaning.
 */
export function WaterTracker({ totalMl, goalMl = WATER_GOAL_ML, onQuickAdd, onOpen, quickAddMl = WATER_QUICK_ADD_ML, className }: WaterTrackerProps) {
  const figureRef = useRef<HTMLSpanElement>(null);
  const shownMl = useAnimatedNumber(totalMl, figureRef);
  const note = describeWaterState(totalMl, goalMl);

  return (
    <section aria-labelledby="home-water-heading" className={[styles.section, className].filter(Boolean).join(' ')}>
      <Surface tone="canvas" border="decorative" radius="grouped" padding={16} className={styles.card}>
        <div className={styles.row}>
          <button type="button" className={styles.content} onClick={onOpen} aria-haspopup="dialog" aria-label={`Edit water, ${speakWater(totalMl)} of ${speakWater(goalMl)}`}>
            <span className={styles.glyph} aria-hidden="true">
              <Icon icon={Drop} size="default" />
            </span>
            <span className={styles.text}>
              <Text as="span" id="home-water-heading" variant="item-title" color="primary">
                Water
              </Text>
              <span className={styles.figure} ref={figureRef}>
                <Text variant="metric-secondary" numeric color="primary">
                  {formatWater(shownMl).replace(/ (ml|L)$/, '')}
                </Text>
                <Text variant="supporting" numeric color="secondary">
                  {formatWater(shownMl).endsWith('ml') ? 'ml' : 'L'} / {formatWater(goalMl)}
                </Text>
              </span>
            </span>
            <span className={styles.chevron} aria-hidden="true">
              <Icon icon={CaretRight} size="small-action" />
            </span>
          </button>
          <button type="button" className={styles.quickAdd} onClick={() => onQuickAdd(quickAddMl)} aria-label={`Add ${quickAddMl} millilitres of water`}>
            <Icon icon={Plus} size="compact" weight="bold" />
            <Text variant="action-sm" color="inherit" numeric>
              {quickAddMl} ml
            </Text>
          </button>
        </div>
        <ProgressBar value={totalMl} max={goalMl} tone="water" label="Water against the daily reference" valueText={`${speakWater(totalMl)} of ${speakWater(goalMl)}`} className={styles.bar} />
        {note ? (
          <Text as="p" variant="supporting" color="secondary" wrap className={styles.note}>
            {note}
          </Text>
        ) : null}
      </Surface>
    </section>
  );
}
