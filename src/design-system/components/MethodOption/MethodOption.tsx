import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { CaretRight } from '@phosphor-icons/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';

import { Icon } from '../../icons/Icon';
import { Text } from '../../primitives/Text/Text';
import styles from './MethodOption.module.css';

export interface MethodOptionProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type' | 'title'> {
  icon: PhosphorIcon;
  /** Method title (method-title 16/24), e.g. "Search food". */
  title: ReactNode;
  /** One short line on what the method needs or gives (supporting 14/20). */
  description?: ReactNode;
  /**
   * `row` (default): icon tile, text and a trailing chevron on one full-width row.
   * `card`: the same parts stacked, for the side-by-side camera pair.
   */
  presentation?: 'row' | 'card';
  /** `quiet` drops the tinted icon tile and the surface fill — the secondary method at the end of the sheet. */
  tone?: 'default' | 'quiet';
}

/**
 * One entry-method choice inside the Log food sheet (after R6) — the whole surface is the
 * single control, so there is nothing nested to focus or mis-tap. Selecting it starts a
 * journey; it never commits food data. The prominent row (Search food), the card pair
 * (Scan barcode, Take a photo) and the quiet row (Enter manually) are the same component
 * in three presentations, so the hierarchy is authored once.
 */
export function MethodOption({ icon, title, description, presentation = 'row', tone = 'default', className, ...rest }: MethodOptionProps) {
  return (
    <button type="button" className={[styles.option, className].filter(Boolean).join(' ')} data-presentation={presentation} data-tone={tone} {...rest}>
      <span className={styles.glyph}>
        <Icon icon={icon} size="default" />
      </span>
      <span className={styles.text}>
        <Text variant="method-title" color="primary" wrap>
          {title}
        </Text>
        {description ? (
          <Text variant="supporting" color="secondary" wrap>
            {description}
          </Text>
        ) : null}
      </span>
      <span className={styles.cue} aria-hidden="true">
        <Icon icon={CaretRight} size="compact" />
      </span>
    </button>
  );
}
