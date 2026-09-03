import { useLayoutEffect, useRef, type ReactNode } from 'react';

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
 * the top; content scrolls between it and the footer. The measured header and footer
 * heights become the document's scroll padding, so focusing or scrolling to a field
 * never leaves it underneath an anchored bar.
 */
export function FocusedFlowLayout({ header, children, footer, className }: FocusedFlowLayoutProps) {
  const layoutRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      // Several focused steps can be mounted at once (earlier steps stay hidden for
      // Back). Only the visible layout may write the document's scroll padding.
      if (!layoutRef.current || layoutRef.current.getClientRects().length === 0) return;
      root.style.scrollPaddingBlockStart = `${headerRef.current?.offsetHeight ?? 0}px`;
      root.style.scrollPaddingBlockEnd = `${footerRef.current?.offsetHeight ?? 0}px`;
    };
    apply();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(apply);
    if (headerRef.current) observer.observe(headerRef.current);
    if (footerRef.current) observer.observe(footerRef.current);
    return () => {
      observer.disconnect();
      root.style.scrollPaddingBlockStart = '';
      root.style.scrollPaddingBlockEnd = '';
    };
  }, [footer]);

  return (
    <div ref={layoutRef} className={[styles.layout, className].filter(Boolean).join(' ')}>
      <div ref={headerRef} className={styles.header}>
        {header}
      </div>
      <main className={styles.content}>{children}</main>
      {footer ? (
        <div ref={footerRef} className={styles.footer}>
          {footer}
        </div>
      ) : null}
    </div>
  );
}
