import type { ReactNode } from 'react';

import styles from './FocusedFlowLayout.module.css';

export interface FocusedFlowLayoutProps {
  /** AppHeader in its focused variant with the real back destination. */
  header: ReactNode;
  children: ReactNode;
  /**
   * Anchored actions (Continue, Confirm). Rendered in flow after the scrolling content,
   * so the last field and its error are always reachable above it.
   */
  footer?: ReactNode;
  className?: string;
}

/**
 * Focused subtask layout — review, manual entry, camera steps. No bottom navigation is
 * shown, so the step can never be mistaken for a root destination. The header stays at
 * the top; content scrolls between it and the footer.
 */
export function FocusedFlowLayout({ header, children, footer, className }: FocusedFlowLayoutProps) {
  return (
    <div className={[styles.layout, className].filter(Boolean).join(' ')}>
      <div className={styles.header}>{header}</div>
      <main className={styles.content}>{children}</main>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </div>
  );
}
