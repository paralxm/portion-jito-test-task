import type { ButtonHTMLAttributes, MouseEvent, ReactNode, Ref } from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';

import { Icon } from '../../icons/Icon';
import { Spinner } from '../Spinner/Spinner';
import { Text } from '../Text/Text';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'destructive';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
  variant?: ButtonVariant;
  /**
   * `compact` uses the 14/20 compact-action style for standalone actions such as
   * Clear, Reset or View all. The minimum hit area does not shrink.
   */
  size?: 'default' | 'compact';
  /** Optional leading glyph, rendered decoratively at 20 px. */
  icon?: PhosphorIcon;
  /**
   * Pending state for an asynchronous action. The label stays readable, a spinner
   * takes the icon slot, the control reports busy and repeated activation is ignored.
   * Never use it for synchronous arithmetic.
   */
  loading?: boolean;
  /** Full-width layout for a screen's primary action. */
  block?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

/**
 * Button — the single action primitive. Variants change treatment, not hierarchy; the
 * label always uses the action type style, may wrap onto more than one line, and is
 * never truncated, capitalised or condensed to fit.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'default',
  icon,
  loading = false,
  block = false,
  disabled,
  type = 'button',
  className,
  onClick,
  ref,
  ...rest
}: ButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <button
      ref={ref}
      type={type}
      className={[styles.button, styles[variant], className].filter(Boolean).join(' ')}
      data-block={block ? 'true' : undefined}
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={handleClick}
      {...rest}
    >
      {(icon || loading) && (
        <span className={styles.slot}>
          {loading ? <Spinner size="small-action" label="Working" announce={false} /> : icon ? <Icon icon={icon} size="small-action" /> : null}
        </span>
      )}
      <Text variant={size === 'compact' ? 'compact-action' : 'action'} className={styles.label}>
        {children}
      </Text>
    </button>
  );
}
