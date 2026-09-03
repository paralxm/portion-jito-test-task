import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode, type SyntheticEvent } from 'react';

import { Button } from '../../primitives/Button/Button';
import { Inline } from '../../primitives/layout/Inline';
import { Text } from '../../primitives/Text/Text';
import styles from './ConfirmDialog.module.css';

export interface ConfirmDialogProps {
  open: boolean;
  /** Question in sentence case (section-title 20/28), e.g. "Discard changes?" */
  title: ReactNode;
  /** What will be lost or changed (body 16/24). */
  children: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Use for Discard: the confirm action takes the destructive treatment. */
  destructive?: boolean;
}

/**
 * Centred confirmation on the native `<dialog>` element. Only shown when something
 * meaningful would be lost; the safe choice receives initial focus and Escape cancels.
 */
export function ConfirmDialog({ open, title, children, confirmLabel, cancelLabel, onConfirm, onCancel, destructive = false }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const titleId = `confirm-title-${id}`;
  const bodyId = `confirm-body-${id}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    onCancel();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    // Browsers skip the native cancel event without user activation; handle Escape directly.
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    }
  };

  const handleClose = () => {
    if (open) onCancel();
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onCancel={handleCancel}
      onKeyDown={handleKeyDown}
      onClose={handleClose}
      role="alertdialog"
    >
      <div className={styles.panel}>
        <Text as="h2" id={titleId} variant="section-title" color="primary" wrap>
          {title}
        </Text>
        <Text as="p" id={bodyId} variant="body" color="secondary" wrap>
          {children}
        </Text>
        <div className={styles.actions}>
          <Inline gap={8} distribute="fill" align="stretch">
            <Button ref={cancelRef} variant="secondary" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button variant={destructive ? 'destructive' : 'primary'} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </Inline>
        </div>
      </div>
    </dialog>
  );
}
