import type { ReactNode } from 'react';

import { Container } from '../../primitives/layout/Container';
import { Grid, GridItem } from '../../primitives/layout/Grid';
import styles from './RootScreenLayout.module.css';

export interface RootScreenLayoutProps {
  /** The root heading (AppHeader variant "root"). It scrolls with the content. */
  header: ReactNode;
  children: ReactNode;
  /** The four-control NavigationBar. The caller hides it as a unit while a keyboard is open. */
  navigation: ReactNode;
  /**
   * Content that must stay reachable above the navigation, such as a keyboard-aware
   * action. Rendered in flow so it never covers the last field.
   */
  footer?: ReactNode;
  /** Applies `role="main"` landmark wrapping; disable when the caller supplies its own. */
  className?: string;
}

/**
 * Root destination layout: header, scrolling content, optional in-flow footer and the
 * bottom navigation. The column fills the viewport (dvh) so the bar sits at the bottom
 * on tall screens and simply follows the content on short ones. Nothing is fixed over
 * content; header, navigation and the shared Container own their respective safe areas.
 */
export function RootScreenLayout({ header, children, navigation, footer, className }: RootScreenLayoutProps) {
  return (
    <div className={[styles.layout, className].filter(Boolean).join(' ')}>
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
      {navigation}
    </div>
  );
}
