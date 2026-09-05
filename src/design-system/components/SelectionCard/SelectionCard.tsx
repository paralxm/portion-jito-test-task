import { useId, type ReactNode } from 'react';
import { Check } from '@phosphor-icons/react';

import { Icon } from '../../icons/Icon';
import { Text } from '../../primitives/Text/Text';
import styles from './SelectionCard.module.css';

export interface SelectionCardProps {
  /** The radio group's shared name. */
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  /** Concise title (ideally three words). */
  title: ReactNode;
  /** One optional supporting sentence. */
  description?: ReactNode;
  /**
   * `card` (default): title and supporting line in a flexible column with a reserved
   * indicator slot at the end; for a vertical stack. `tile`: a centred title for an
   * equal-width horizontal pair (the indicator slot sits before the title).
   */
  presentation?: 'card' | 'tile';
  disabled?: boolean;
  className?: string;
}

/**
 * One selectable option of a small set — a native radio drawn as a card whose whole
 * surface is the control (ledger §14). Selection is carried by the selected boundary,
 * the selected surface and the check mark in a reserved slot, never by colour alone;
 * the slot is always laid out, so choosing an option moves no text. Height follows the
 * content; the group is an ordinary radio group for the keyboard.
 */
export function SelectionCard({ name, value, checked, onChange, title, description, presentation = 'card', disabled, className }: SelectionCardProps) {
  const id = useId();
  return (
    <label htmlFor={id} className={[styles.card, className].filter(Boolean).join(' ')} data-presentation={presentation} data-checked={checked || undefined} data-disabled={disabled || undefined}>
      <input id={id} type="radio" name={name} value={value} checked={checked} disabled={disabled} onChange={() => onChange(value)} className={styles.input} />
      <span className={styles.text}>
        <Text as="span" variant="action-md" color="primary" wrap className={styles.title}>
          {title}
        </Text>
        {description ? (
          <Text as="span" variant="supporting" color="secondary" wrap>
            {description}
          </Text>
        ) : null}
      </span>
      <span className={styles.indicator} aria-hidden="true">
        {checked ? <Icon icon={Check} size="small-action" weight="bold" /> : null}
      </span>
    </label>
  );
}
