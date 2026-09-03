import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode, type SyntheticEvent } from 'react';
import { X } from '@phosphor-icons/react';

import { IconButton } from '../../primitives/IconButton/IconButton';
import { Text } from '../../primitives/Text/Text';
import styles from './ModalSheet.module.css';

export interface ModalSheetProps {
  open: boolean;
  /**
   * Called for every dismissal route — close control, backdrop, Escape. The caller
   * decides whether to close immediately or first ask about unsaved changes, so a
   * gesture can never bypass the dirty-entry rule.
   */
  onRequestClose: () => void;
  /** Sheet title (section-title 20/28); also the dialog's accessible name. */
  title: ReactNode;
  /** Brief explanation under the title (supporting 14/20). */
  description?: ReactNode;
  children: ReactNode;
  /** Anchored footer for Apply / Reset style actions. It never covers the last field. */
  footer?: ReactNode;
  closeLabel?: string;
  className?: string;
}

/**
 * Bottom sheet built on the native `<dialog>` element: one foreground modal in the top
 * layer, an inert page beneath, focus contained inside and returned to the opener on
 * close. Height fits the content until it needs to scroll; the header and footer stay
 * anchored while the body scrolls, and the bottom safe area is included.
 */
export function ModalSheet({ open, onRequestClose, title, description, children, footer, closeLabel = 'Close', className }: ModalSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();
  const titleId = `sheet-title-${id}`;
  const descriptionId = description ? `sheet-description-${id}` : undefined;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  // The page must not scroll behind an open sheet.
  useEffect(() => {
    if (!open) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, [open]);

  // A text-only body that overflows must still be reachable from the keyboard.
  const bodyRef = useRef<HTMLDivElement>(null);
  const [bodyScrolls, setBodyScrolls] = useState(false);
  useEffect(() => {
    const body = bodyRef.current;
    if (!open || !body || typeof ResizeObserver === 'undefined') return;
    const measure = () => setBodyScrolls(body.scrollHeight > body.clientHeight + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    measure();
    return () => observer.disconnect();
  }, [open]);

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    // Escape: route through the same request so a dirty draft can intercept it.
    event.preventDefault();
    onRequestClose();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    // Handle Escape ourselves as well: the native cancel event is skipped by browsers
    // when there has been no user activation, which would leave state out of sync.
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onRequestClose();
    }
  };

  const handleClose = () => {
    // Native close without a cancel event (e.g. no user activation): keep the owner in sync.
    if (open) onRequestClose();
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) onRequestClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className={[styles.dialog, className].filter(Boolean).join(' ')}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={handleCancel}
      onKeyDown={handleKeyDown}
      onClose={handleClose}
      onClick={handleBackdropClick}
    >
      <div className={styles.sheet}>
        <div className={styles.handle} aria-hidden="true" />
        <header className={styles.header}>
          <div className={styles.titles}>
            <Text as="h2" id={titleId} variant="section-title" color="primary" wrap>
              {title}
            </Text>
            {description ? (
              <Text as="p" id={descriptionId} variant="supporting" color="secondary" wrap>
                {description}
              </Text>
            ) : null}
          </div>
          <IconButton icon={X} label={closeLabel} onClick={onRequestClose} />
        </header>
        <div ref={bodyRef} className={styles.body} tabIndex={bodyScrolls ? 0 : undefined}>
          {children}
        </div>
        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </div>
    </dialog>
  );
}
