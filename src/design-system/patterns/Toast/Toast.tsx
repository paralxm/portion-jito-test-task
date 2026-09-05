import { useEffect, type ReactNode } from 'react';
import { X } from '@phosphor-icons/react';

import { Button } from '../../primitives/Button/Button';
import { IconButton } from '../../primitives/IconButton/IconButton';
import { Text } from '../../primitives/Text/Text';
import styles from './Toast.module.css';

export interface ToastProps {
  open: boolean;
  /** The confirmation, a full sentence, e.g. "250 ml added. 1.5 litres today." */
  message: ReactNode;
  /** Optional single action, e.g. Undo. */
  actionLabel?: string;
  onAction?: () => void;
  /** Called when the toast times out, is closed, or its action is used. */
  onDismiss: () => void;
  /** Auto-dismiss delay; the toast never delays the next action. */
  durationMs?: number;
  className?: string;
}

/**
 * A short, non-modal confirmation anchored above the fixed navigation (or the bottom
 * safe area when no bar is shown). It is a polite status region: assistive technology
 * hears it once; it steals no focus and blocks nothing. Enter and exit use the toast
 * motion token and collapse under reduced motion. One action at most, plus a close.
 */
export function Toast({ open, message, actionLabel, onAction, onDismiss, durationMs = 6000, className }: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
    // A new message restarts the timer; the callback identity does not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, message, durationMs]);

  return (
    <div className={[styles.region, className].filter(Boolean).join(' ')} role="status" aria-live="polite" data-open={open || undefined}>
      {open ? (
        <div className={styles.toast}>
          <Text as="p" variant="body" color="primary" wrap className={styles.message}>
            {message}
          </Text>
          {actionLabel && onAction ? (
            <Button
              variant="text"
              size="small"
              onClick={() => {
                onAction();
                onDismiss();
              }}
            >
              {actionLabel}
            </Button>
          ) : null}
          <IconButton icon={X} label="Close" onClick={onDismiss} className={styles.close} />
        </div>
      ) : null}
    </div>
  );
}
