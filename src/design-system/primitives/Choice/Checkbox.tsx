import type { InputHTMLAttributes, ReactNode } from 'react';
import { Check } from '@phosphor-icons/react';

import { Icon } from '../../icons/Icon';
import { Text } from '../Text/Text';
import styles from './Choice.module.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> {
  /** Visible option text (body 16/24). Selection never changes its size or weight. */
  label: ReactNode;
  /** Optional secondary description (supporting 14/20), wrapping below the label. */
  description?: ReactNode;
}

/** Native checkbox with a drawn control; the entire row is the 48 px hit area. */
export function Checkbox({ label, description, id, disabled, className, ...rest }: CheckboxProps) {
  return (
    <label className={[styles.choice, className].filter(Boolean).join(' ')} data-kind="checkbox" data-disabled={disabled || undefined} htmlFor={id}>
      <input id={id} type="checkbox" className={styles.input} disabled={disabled} {...rest} />
      <span className={styles.control} aria-hidden="true">
        <span className={styles.mark}>
          <Icon icon={Check} size="compact" weight="bold" />
        </span>
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
