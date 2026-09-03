import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Check, X } from '@phosphor-icons/react';

import { Icon } from '../../icons/Icon';
import { Text } from '../../primitives/Text/Text';
import styles from './Chip.module.css';

export interface FilterChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type'> {
  children: ReactNode;
  selected: boolean;
  /**
   * `toggle` (default) is an independent on/off option exposed with `aria-pressed`.
   * `radio` is one of a mutually exclusive set and must live inside a `role="radiogroup"`.
   */
  selectionRole?: 'toggle' | 'radio';
}

/**
 * Selectable chip. Selection is shown by boundary, fill and a check mark, and exposed
 * as accessible state — never by colour alone. The label keeps the same 14/20 style in
 * both states so the row does not reflow on selection.
 */
export function FilterChip({ children, selected, selectionRole = 'toggle', className, ...rest }: FilterChipProps) {
  const stateProps = selectionRole === 'radio' ? { role: 'radio', 'aria-checked': selected } : { 'aria-pressed': selected };
  return (
    <button type="button" className={[styles.chip, styles.selectable, className].filter(Boolean).join(' ')} data-selected={selected || undefined} {...stateProps} {...rest}>
      {selected ? (
        <span className={styles.mark}>
          <Icon icon={Check} size="compact" weight="bold" />
        </span>
      ) : null}
      <Text variant="label" color="inherit" className={styles.label}>
        {children}
      </Text>
    </button>
  );
}

export interface AppliedCriterionChipProps {
  children: ReactNode;
  /** Removing an applied criterion commits immediately; the caller updates results. */
  onRemove: () => void;
  /** Accessible name for the remove action, e.g. "Remove filter: under 500 kcal". */
  removeLabel: string;
  className?: string;
}

/**
 * A committed criterion with its own remove action. Distinct from FilterChip: it is not
 * a toggle, and removing it is an immediate change to the applied set.
 */
export function AppliedCriterionChip({ children, onRemove, removeLabel, className }: AppliedCriterionChipProps) {
  return (
    <span className={[styles.chip, styles.applied, className].filter(Boolean).join(' ')}>
      <Text variant="label" color="inherit" className={styles.label}>
        {children}
      </Text>
      <button type="button" className={styles.remove} aria-label={removeLabel} onClick={onRemove}>
        <Icon icon={X} size="compact" />
      </button>
    </span>
  );
}
