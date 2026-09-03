import type { ReactNode } from 'react';

import { Text } from '../Text/Text';
import styles from './Badge.module.css';

export interface BadgeProps {
  children: ReactNode;
  /**
   * `count` is a visually separate numeric badge (caption-strong 12/16, tabular).
   * `label` is a short static descriptor such as a dietary tag (label 14/20).
   */
  kind?: 'count' | 'label';
  className?: string;
}

/** Static, non-interactive marker. It must never look tappable. */
export function Badge({ children, kind = 'label', className }: BadgeProps) {
  return (
    <Text
      as="span"
      variant={kind === 'count' ? 'caption-strong' : 'label'}
      numeric={kind === 'count'}
      color="primary"
      className={[styles.badge, className].filter(Boolean).join(' ')}
      data-kind={kind}
    >
      {children}
    </Text>
  );
}
