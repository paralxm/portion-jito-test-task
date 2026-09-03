import { useId, type ReactNode } from 'react';

import { Text } from '../../primitives/Text/Text';
import styles from './FormField.module.css';

export interface FormFieldRenderProps {
  /** Id to place on the control so the label is associated. */
  id: string;
  /** Space-separated ids of the helper and error text, for `aria-describedby`. */
  describedBy: string | undefined;
  invalid: boolean;
}

export interface FormFieldProps {
  /** Persistent visible label (label 14/20). A placeholder is never the only label. */
  label: ReactNode;
  /** Marks a field the user may leave blank; rendered as part of the label line. */
  optional?: boolean;
  /** Contextual guidance shown below the control (supporting 14/20). */
  helper?: ReactNode;
  /** Actionable validation message; replaces the helper while present and is announced politely. */
  error?: ReactNode;
  id?: string;
  className?: string;
  children: (field: FormFieldRenderProps) => ReactNode;
}

/**
 * FormField wires a label, helper and error to any control through a render prop, so
 * the association and announcement logic lives in one place. The control itself decides
 * its visual invalid state from `invalid`.
 */
export function FormField({ label, optional = false, helper, error, id: idProp, className, children }: FormFieldProps) {
  const generated = useId();
  const id = idProp ?? `field-${generated}`;
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const invalid = Boolean(error);
  const describedBy = [helper ? helperId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label htmlFor={id} className={styles.label}>
        <Text variant="label" color="primary">
          {label}
        </Text>
        {optional ? (
          <Text variant="supporting" color="secondary">
            {' '}
            (optional)
          </Text>
        ) : null}
      </label>
      {children({ id, describedBy, invalid })}
      {helper && !error ? (
        <Text as="p" id={helperId} variant="supporting" color="secondary" className={styles.message}>
          {helper}
        </Text>
      ) : null}
      {/* A persistent polite live region: the error text changes inside it rather than
          appearing as a brand-new alert on every keystroke. */}
      <div aria-live="polite" className={styles.live}>
        {error ? (
          <Text as="p" id={errorId} variant="supporting" color="error" className={styles.message}>
            {error}
          </Text>
        ) : null}
      </div>
    </div>
  );
}
