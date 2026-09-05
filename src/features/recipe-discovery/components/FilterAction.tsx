import { SlidersHorizontal } from '@phosphor-icons/react';

import { IconButton } from '../../../design-system/primitives/IconButton/IconButton';
import { Badge } from '../../../design-system/primitives/Badge/Badge';
import styles from './FilterAction.module.css';

export interface FilterActionProps {
  /** The number of applied criteria; shown as a badge and spoken in the name. */
  count: number;
  expanded: boolean;
  onClick: () => void;
  /** The action's base name; the applied count is appended, e.g. "Food filters, 1 active". */
  label?: string;
  className?: string;
}

/**
 * The recipe filter action that sits at the end of the search field (ledger D-27): an
 * icon button named `Filters` (or `Filters, 2 active`) with the applied count as a
 * visible badge, so the applied state is carried by the number, never by colour alone.
 */
export function FilterAction({ count, expanded, onClick, label = 'Filters', className }: FilterActionProps) {
  return (
    <span className={[styles.wrapper, className].filter(Boolean).join(' ')} data-applied={count > 0 || undefined}>
      <IconButton icon={SlidersHorizontal} label={count > 0 ? `${label}, ${count} active` : label} onClick={onClick} aria-haspopup="dialog" aria-expanded={expanded} className={styles.button} />
      {count > 0 ? (
        <Badge kind="count" className={styles.count} aria-hidden="true">
          {count}
        </Badge>
      ) : null}
    </span>
  );
}
