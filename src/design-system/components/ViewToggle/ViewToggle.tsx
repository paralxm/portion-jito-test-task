import { List, SquaresFour } from '@phosphor-icons/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';

import { Icon } from '../../icons/Icon';
import { Text } from '../../primitives/Text/Text';
import styles from './ViewToggle.module.css';

export type ViewMode = 'list' | 'grid';

export interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  /** Accessible name of the group. */
  label?: string;
  className?: string;
}

const OPTIONS: ReadonlyArray<{ value: ViewMode; label: string; icon: PhosphorIcon }> = [
  { value: 'list', label: 'List', icon: List },
  { value: 'grid', label: 'Grid', icon: SquaresFour },
];

/**
 * A two-way presentation switch (list or grid of the same items) exposed as a radio
 * group: choosing a view changes only how the collection is laid out, never which items
 * it holds or their order. Each option is a 48 px target with a glyph and a visible
 * label; the selected option carries a contained surface, boundary and weight — never
 * colour alone. Arrow keys move selection like any radio group.
 */
export function ViewToggle({ value, onChange, label = 'View', className }: ViewToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={[styles.group, className].filter(Boolean).join(' ')}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
          event.preventDefault();
          const next = value === 'list' ? 'grid' : 'list';
          onChange(next);
          const target = (event.currentTarget as HTMLElement).querySelector<HTMLButtonElement>(`[data-value="${next}"]`);
          target?.focus();
        }
      }}
    >
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            data-value={option.value}
            data-selected={selected || undefined}
            className={styles.option}
            onClick={() => onChange(option.value)}
          >
            <Icon icon={option.icon} size="small-action" />
            <Text variant="label" color="inherit" className={styles.label}>
              {option.label}
            </Text>
          </button>
        );
      })}
    </div>
  );
}
