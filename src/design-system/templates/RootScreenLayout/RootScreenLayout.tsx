import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

import { Container } from '../../primitives/layout/Container';
import { Grid, GridItem } from '../../primitives/layout/Grid';
import styles from './RootScreenLayout.module.css';

export interface RootScreenLayoutProps {
  /** The root or section AppHeader. It scrolls with the content. */
  header: ReactNode;
  children: ReactNode;
  /** The four-control NavigationBar. The caller hides it as a unit while a keyboard is open. */
  navigation: ReactNode;
  /**
   * Content that must stay reachable above the navigation, such as a keyboard-aware
   * action. Rendered in flow so it never covers the last field.
   */
  footer?: ReactNode;
  className?: string;
}

/** The layout currently publishing the navigation inset; only it may reset the value to 0. */
let insetOwner: object | null = null;

function publishNavigationInset(owner: object, height: number) {
  const root = document.documentElement;
  if (height > 0) {
    insetOwner = owner;
    root.style.setProperty('--portion-navigation-inset', `${height}px`);
    root.style.scrollPaddingBlockEnd = `${height}px`;
  } else if (insetOwner === owner) {
    insetOwner = null;
    root.style.setProperty('--portion-navigation-inset', '0px');
    root.style.scrollPaddingBlockEnd = '';
  }
}

/**
 * Root destination layout: header, scrolling content, optional in-flow footer and the
 * bottom navigation fixed to the viewport. The slot that holds the bar is the fixed
 * element (the bar itself stays a plain component), centred within the mobile shell.
 * Its measured height becomes the content's bottom padding, the document's scroll
 * padding and the `--portion-navigation-inset` custom property, so content, focused
 * fields and anchored feedback stay clear of the bar at every text size. Several root
 * layouts stay mounted at once (hidden roots keep their state); only the visible one
 * publishes the inset. Header and navigation own their safe areas; content owns none.
 */
export function RootScreenLayout({ header, children, navigation, footer, className }: RootScreenLayoutProps) {
  const slotRef = useRef<HTMLDivElement>(null);
  const owner = useRef({});
  const [navigationHeight, setNavigationHeight] = useState(0);

  useLayoutEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    const measure = () => {
      const height = slot.getClientRects().length === 0 ? 0 : slot.offsetHeight;
      setNavigationHeight(height);
      publishNavigationInset(owner.current, height);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(slot);
    return () => {
      observer.disconnect();
      publishNavigationInset(owner.current, 0);
    };
  }, []);

  return (
    <div className={[styles.layout, className].filter(Boolean).join(' ')} style={{ '--portion-layout-navigation-height': `${navigationHeight}px` } as CSSProperties}>
      {header}
      <main className={styles.content}>
        <Container className={styles.contentContainer}>
          <Grid>
            <GridItem className={styles.contentStack}>{children}</GridItem>
          </Grid>
        </Container>
      </main>
      {footer ? (
        <div className={styles.footer}>
          <Container>{footer}</Container>
        </div>
      ) : null}
      <div ref={slotRef} className={styles.navigationSlot}>
        {navigation}
      </div>
    </div>
  );
}
