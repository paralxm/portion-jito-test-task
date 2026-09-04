import type { ReactNode } from 'react';

import { Button } from '../../primitives/Button/Button';
import { Spinner } from '../../primitives/Spinner/Spinner';
import { Text } from '../../primitives/Text/Text';
import styles from './LoadingState.module.css';

export interface LoadingStateProps {
  /** Readable progress text (supporting 14/20), e.g. "Searching foods". */
  label: string;
  /** Extra context line, e.g. what is being analysed. */
  children?: ReactNode;
  /** Offers cancellation where the underlying request can be abandoned. */
  onCancel?: () => void;
  cancelLabel?: string;
  className?: string;
}

/**
 * Region-level pending state with an actual indicator and readable text. It contains
 * no fake content; placeholder bars are never used as loading feedback.
 */
export function LoadingState({ label, children, onCancel, cancelLabel = 'Cancel', className }: LoadingStateProps) {
  return (
    <div className={[styles.loading, className].filter(Boolean).join(' ')} role="status" aria-live="polite">
      <Spinner size="emphasis" label={label} announce={false} />
      <Text as="p" variant="supporting" color="secondary" align="center">
        {label}
      </Text>
      {children ? (
        <Text as="p" variant="supporting" color="secondary" align="center" wrap>
          {children}
        </Text>
      ) : null}
      {onCancel ? (
        <Button variant="text" size="small" onClick={onCancel}>
          {cancelLabel}
        </Button>
      ) : null}
    </div>
  );
}
