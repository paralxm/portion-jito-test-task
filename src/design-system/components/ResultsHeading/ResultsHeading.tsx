import type { ReactNode } from 'react';

import { Text } from '../../primitives/Text/Text';
import { VisuallyHidden } from '../../primitives/VisuallyHidden/VisuallyHidden';
import styles from './ResultsHeading.module.css';

export interface ResultsHeadingProps {
  /** Id the results region's `aria-labelledby` points at. */
  id: string;
  heading: ReactNode;
  /**
   * Announced to assistive technology whenever results change. Loading and failure
   * states announce themselves elsewhere (`role="status"`/`role="alert"`), so pass an
   * empty string while either is active to avoid a duplicate announcement.
   */
  summary: string;
  /** Visible secondary count text, e.g. "3 recipes match your filters". Omit while there is nothing to report. */
  countText?: ReactNode;
  hidden?: boolean;
  className?: string;
}

/**
 * A results section's heading: a visible title, a screen-reader-only live summary, and
 * a visible secondary count line. Shared by every screen that lists search or browse
 * results (Search, Recipes) so the announcement behaviour never drifts between them.
 */
export function ResultsHeading({ id, heading, summary, countText, hidden, className }: ResultsHeadingProps) {
  return (
    <div className={[styles.heading, className].filter(Boolean).join(' ')} hidden={hidden}>
      <Text as="h2" id={id} variant="section-title" color="primary">
        {heading}
      </Text>
      <VisuallyHidden as="p" role="status" aria-label="Results summary">
        {summary}
      </VisuallyHidden>
      {countText ? (
        <Text as="p" variant="supporting" color="secondary" aria-hidden="true">
          {countText}
        </Text>
      ) : null}
    </div>
  );
}
