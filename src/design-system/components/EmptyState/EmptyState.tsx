import type { ReactNode } from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';

import { Icon } from '../../icons/Icon';
import { Text } from '../../primitives/Text/Text';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  /** Short title (compact-title 18/24), e.g. "No foods match". */
  title: ReactNode;
  /** What happened and what to do next (body 16/24). */
  children?: ReactNode;
  /** Optional 48 px glyph. Decorative; the words carry the meaning. */
  icon?: PhosphorIcon;
  /** Cause-specific next actions. */
  actions?: ReactNode;
  /**
   * `empty` is a legitimate starting point (nothing entered yet); `no-match` is a result
   * of the current query or criteria; `failure` is a service condition. Only the copy and
   * actions differ — the layout is the same so the distinction is in the words.
   */
  kind?: 'empty' | 'no-match' | 'failure';
  className?: string;
}

/** An invitation to act, not a mood. Each kind names its cause and offers the right recovery. */
export function EmptyState({ title, children, icon, actions, kind = 'empty', className }: EmptyStateProps) {
  return (
    <div className={[styles.empty, className].filter(Boolean).join(' ')} data-kind={kind} role={kind === 'failure' ? 'alert' : undefined}>
      {icon ? (
        <span className={styles.glyph}>
          <Icon icon={icon} size="empty-state" />
        </span>
      ) : null}
      <Text as="p" variant="compact-title" color="primary" align="center" wrap>
        {title}
      </Text>
      {children ? (
        <Text as="p" variant="body" color="secondary" align="center" wrap>
          {children}
        </Text>
      ) : null}
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}
