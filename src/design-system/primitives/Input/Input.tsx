import type { InputHTMLAttributes, ReactNode, Ref } from 'react';

import { Text } from '../Text/Text';
import styles from './Input.module.css';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Visual and accessible invalid state. Pair with `aria-describedby` from FormField. */
  invalid?: boolean;
  /**
   * Non-interactive suffix such as a unit (`g`, `kcal`). It is read-only information and
   * must not be styled like a control; it is announced through the field's label.
   */
  suffix?: ReactNode;
  /** Leading decorative slot (for example the search glyph). */
  leading?: ReactNode;
  /** Trailing interactive slot (clear action, unit selector). Rendered outside the input. */
  trailing?: ReactNode;
  /** Apply tabular figures for numeric drafts so digits do not shift while editing. */
  numeric?: boolean;
  ref?: Ref<HTMLInputElement>;
}

/**
 * Input — the base text control. It owns the boundary, focus ring, invalid treatment
 * and the layout of leading/suffix/trailing slots; labels, helper and error wiring live
 * in FormField. Minimum height is 48 px and the control grows with enlarged text.
 */
export function Input({ invalid = false, suffix, leading, trailing, numeric = false, className, disabled, ref, ...rest }: InputProps) {
  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')} data-invalid={invalid || undefined} data-disabled={disabled || undefined}>
      {leading ? <span className={styles.leading}>{leading}</span> : null}
      <input
        ref={ref}
        className={[styles.input, numeric ? 'portion-numeric' : null].filter(Boolean).join(' ')}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        {...rest}
      />
      {suffix ? (
        <Text as="span" variant="body" color="secondary" className={styles.suffix}>
          {suffix}
        </Text>
      ) : null}
      {trailing ? <span className={styles.trailing}>{trailing}</span> : null}
    </div>
  );
}
