import type { ButtonHTMLAttributes, ReactNode } from 'react';
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
}

/**
 * One entry-method choice inside the Log food sheet — the whole surface is the single
 * control, so there is nothing nested to focus or mis-tap. Selecting it starts a
 * journey; it never commits food data.
 *
 * Layout is decided by the container it sits in: inside the sheet's `method-grid`
 * container it is a tile (icon above title) while the container is at least 17 rem
 * wide — every supported viewport at 100 % text — and a full-width row (icon beside
 * title) below that, i.e. under enlarged text, so four options always keep legible
 * labels and 48 px targets.
 */
export function MethodOption({ icon, title, description, className, ...rest }: MethodOptionProps) {
  return (
    <button type="button" className={[styles.option, className].filter(Boolean).join(' ')} {...rest}>
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
    </button>
  );
}
