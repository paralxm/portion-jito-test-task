import type { ButtonHTMLAttributes, MouseEvent, ReactNode, Ref } from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';

import { Icon } from '../../icons/Icon';
import { Spinner } from '../Spinner/Spinner';
import { Text } from '../Text/Text';
import styles from './Button.module.css';

/**
 * `primary` is the one filled action a screen leads with. `secondary` is a tinted
 * (blue-50) fill for supporting actions — visibly a button, quieter than primary, and
 * never an outline competing with fields. `text` is a bare label for tertiary actions
 * such as Cancel. `destructive` is the tinted red treatment for Discard/Remove.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'destructive';

/**
 * `large` is the 56 px control for the one dominant action of a screen (a sticky footer's
 * Add to today, Continue to review; Home's Log food) with the action-lg label — the same
 * 16/24 600 as medium, so the size is carried by geometry. `medium` (default) is the 48 px
 * control for screen-level actions. `small` is the 40 px in-context control with the
 * action-sm 14/20 label (Filters, Reset all, Show all nutrition); its hit area still
 * reaches 48 px.
 */
export type ButtonSize = 'large' | 'medium' | 'small';

const LABEL_VARIANT: Record<ButtonSize, 'action-lg' | 'action-md' | 'action-sm'> = { large: 'action-lg', medium: 'action-md', small: 'action-sm' };

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
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
 * Button — the single action primitive. Variants change treatment, sizes change the
 * label role and visual height; neither changes hierarchy on its own. The label may
 * wrap onto more than one line and is never truncated, capitalised or condensed to fit.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'medium',
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
      data-size={size}
      data-block={block ? 'true' : undefined}
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={handleClick}
      {...rest}
    >
      {(icon || loading) && (
        <span className={styles.slot}>
          {loading ? (
            <Spinner size={size === 'large' ? 'default' : 'small-action'} label="Working" announce={false} />
          ) : icon ? (
            <Icon icon={icon} size={size === 'large' ? 'default' : 'small-action'} />
          ) : null}
        </span>
      )}
      <Text variant={LABEL_VARIANT[size]} className={styles.label}>
        {children}
      </Text>
    </button>
  );
}
