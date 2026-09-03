import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { CaretRight } from '@phosphor-icons/react';

import { Icon } from '../../icons/Icon';
import { Text } from '../../primitives/Text/Text';
import styles from './MethodRow.module.css';

export interface MethodRowProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type' | 'title'> {
  icon: PhosphorIcon;
  /** Method title (method-title 16/24), e.g. "Search food". */
  title: ReactNode;
  /** One-line explanation of what happens next (supporting 14/20). */
  description?: ReactNode;
}

/**
 * A full-row entry-method choice inside the Add food sheet. Selecting it starts a
 * journey; it never commits food data. The whole row is the 48 px+ hit area.
 */
export function MethodRow({ icon, title, description, className, ...rest }: MethodRowProps) {
  return (
    <button type="button" className={[styles.row, className].filter(Boolean).join(' ')} {...rest}>
      <span className={styles.glyph}>
        <Icon icon={icon} />
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
      <span className={styles.chevron}>
        <Icon icon={CaretRight} size="small-action" />
      </span>
    </button>
  );
}
