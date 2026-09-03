import type { InputHTMLAttributes, ReactNode } from 'react';

import { Text } from '../Text/Text';
import styles from './Choice.module.css';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> {
  label: ReactNode;
  description?: ReactNode;
}

/** Native radio with a drawn control. Group radios with a shared `name` inside a fieldset. */
export function Radio({ label, description, id, disabled, className, ...rest }: RadioProps) {
  return (
    <label className={[styles.choice, className].filter(Boolean).join(' ')} data-kind="radio" data-disabled={disabled || undefined} htmlFor={id}>
      <input id={id} type="radio" className={styles.input} disabled={disabled} {...rest} />
      <span className={styles.control} aria-hidden="true">
        <span className={styles.mark} />
      </span>
      <span className={styles.text}>
        <Text variant="body" color="inherit">
          {label}
        </Text>
        {description ? (
          <Text variant="supporting" color="secondary">
            {description}
          </Text>
        ) : null}
      </span>
    </label>
  );
}
