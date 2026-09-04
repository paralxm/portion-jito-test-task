import type { ButtonHTMLAttributes, MouseEvent } from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';

import { Icon } from '../../icons/Icon';
import { Spinner } from '../Spinner/Spinner';
import buttonStyles from '../Button/Button.module.css';
import styles from './IconButton.module.css';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> {
  icon: PhosphorIcon;
  /** Required accessible name; the glyph itself is decorative. */
  label: string;
  /** `plain` has no boundary (inside headers); `outlined` uses the control border. */
  variant?: 'plain' | 'outlined';
  /** 48 × 48 by default; `large` is the 56 × 56 action target (the size of the bar's Log food action). */
  size?: 'default' | 'large';
  loading?: boolean;
}

/**
 * Icon-only control with a guaranteed 48 × 48 target and a visible name for assistive
 * technology. The drawn glyph stays 24 px regardless of target size.
 */
export function IconButton({
  icon,
  label,
  variant = 'plain',
  size = 'default',
  loading = false,
  type = 'button',
  className,
  onClick,
  ...rest
}: IconButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };
  return (
    <button
      type={type}
      className={[buttonStyles.button, styles.iconButton, styles[variant], className].filter(Boolean).join(' ')}
      data-size={size}
      aria-label={label}
      aria-busy={loading || undefined}
      onClick={handleClick}
      {...rest}
    >
      {loading ? <Spinner label="Working" announce={false} /> : <Icon icon={icon} />}
    </button>
  );
}
