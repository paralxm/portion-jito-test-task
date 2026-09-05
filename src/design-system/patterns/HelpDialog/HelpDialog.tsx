import { useId, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode, type SyntheticEvent } from 'react';

import { Button } from '../../primitives/Button/Button';
import { Text } from '../../primitives/Text/Text';
import styles from './HelpDialog.module.css';

export interface HelpDialogProps {
  open: boolean;
  /** The topic of the active step, e.g. "Why these details?". */
  title: ReactNode;
  /** One to three short sentences. */
  children: ReactNode;
  /** Longer methodology behind a disclosure inside the same surface. */
  details?: ReactNode;
  detailsLabel?: string;
  /** Close: focus returns to the trigger; nothing else changes. */
  onClose: () => void;
}

/**
 * Contextual help for a focused task (ledger §14): one accessible dialog pattern reused
 * by every step — a topic title, a short explanation, an optional "Calculation details"
 * disclosure for the longer methodology, and a single Close. Built on the native
 * `<dialog>` like ConfirmDialog: modal while open, Escape closes, focus returns to the
 * opener; opening or closing it never touches the task's draft or step.
 */
export function HelpDialog({ open, title, children, details, detailsLabel = 'Calculation details', onClose }: HelpDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const titleId = `help-title-${id}`;
  const bodyId = `help-body-${id}`;

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      closeRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    onClose();
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
  };

  return (
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={titleId} aria-describedby={bodyId} onCancel={handleCancel} onKeyDown={handleKeyDown} onClose={() => open && onClose()}>
      <div className={styles.panel}>
        <Text as="h2" id={titleId} variant="section-title" color="primary" wrap>
          {title}
        </Text>
        <div id={bodyId} className={styles.body}>
          {children}
        </div>
        {details ? (
          <details className={styles.details}>
            <summary className={styles.summary}>
              <Text as="span" variant="action-sm" color="primary">
                {detailsLabel}
              </Text>
            </summary>
            <div className={styles.detailsBody}>{details}</div>
          </details>
        ) : null}
        <div className={styles.actions}>
          <Button ref={closeRef} variant="secondary" block onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </dialog>
  );
}
