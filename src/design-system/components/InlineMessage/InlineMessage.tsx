import type { ReactNode } from 'react';
import { CheckCircle, Info, Warning, WarningCircle } from '@phosphor-icons/react';

import { Icon } from '../../icons/Icon';
import { Text } from '../../primitives/Text/Text';
import styles from './InlineMessage.module.css';

export type MessageTone = 'error' | 'warning' | 'success' | 'info';

export interface InlineMessageProps {
  /** Describes a system condition — never food quality. */
  tone: MessageTone;
  /** Optional short title (action 16/24). */
  title?: ReactNode;
  /** The explanation (supporting 14/20). Full sentences, wrapping. */
  children: ReactNode;
  /** Cause-specific recovery action(s), rendered below the text. */
  actions?: ReactNode;
  /**
   * Announcement behaviour. Errors that block the task interrupt (`alert`); other
   * messages update politely (`status`). `none` for messages that are part of the
   * initial page content.
   */
  announce?: 'alert' | 'status' | 'none';
  className?: string;
}

const glyph = { error: WarningCircle, warning: Warning, success: CheckCircle, info: Info } as const;

/**
 * Persistent message near the thing it describes. Colour carries the tone, but the
 * glyph, wording and placement carry the meaning so it survives without colour.
 */
export function InlineMessage({ tone, title, children, actions, announce, className }: InlineMessageProps) {
  const role = announce === 'none' ? undefined : announce ?? (tone === 'error' ? 'alert' : 'status');
  return (
    <div className={[styles.message, className].filter(Boolean).join(' ')} data-tone={tone} role={role}>
      <span className={styles.glyph}>
        <Icon icon={glyph[tone]} size="small-action" />
      </span>
      <div className={styles.body}>
        {title ? (
          <Text as="p" variant="action" color="inherit" wrap>
            {title}
          </Text>
        ) : null}
        <Text as="p" variant="supporting" color="inherit" wrap>
          {children}
        </Text>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </div>
  );
}
