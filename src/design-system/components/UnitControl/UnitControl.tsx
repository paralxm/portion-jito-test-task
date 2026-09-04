import type { ButtonHTMLAttributes } from 'react';
import { CaretDown } from '@phosphor-icons/react';

import { Icon } from '../../icons/Icon';
import { Text } from '../../primitives/Text/Text';
import styles from './UnitControl.module.css';

export interface UnitControlProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** The currently applied unit label, e.g. `g` or `serving`. */
  unit: string;
  /** Accessible description of what the control changes, e.g. "Change unit". */
  label?: string;
}

/**
 * The clickable unit selector that sits inside AmountField. It opens the unit chooser
 * sheet (a modal draft); it is visually distinct from a read-only unit suffix.
 */
export function UnitControl({ unit, label = 'Change unit', className, type = 'button', ...rest }: UnitControlProps) {
  return (
    <button type={type} className={[styles.unitControl, className].filter(Boolean).join(' ')} aria-haspopup="dialog" aria-label={`${label}, currently ${unit}`} {...rest}>
      <Text variant="action-md" color="primary">
        {unit}
      </Text>
      <Icon icon={CaretDown} size="compact" />
    </button>
  );
}
