import { CookingPot, House, MagnifyingGlass, Plus } from '@phosphor-icons/react';

import { Icon } from '../../icons/Icon';
import { Text } from '../../primitives/Text/Text';
import styles from './NavigationBar.module.css';

/** The three root destinations. Log food is an action, never a destination. */
export type Destination = 'home' | 'search' | 'recipes';

export interface NavigationBarProps {
  selected: Destination;
  onSelect: (destination: Destination) => void;
  /** Opens the shared Log food chooser (O01) over the current screen. */
  onLogFood: () => void;
  /** Hide the whole bar as a unit while a root text field has the software keyboard. */
  hidden?: boolean;
  className?: string;
}

const DESTINATIONS: ReadonlyArray<{ id: Destination; label: string; icon: typeof House }> = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'search', label: 'Search', icon: MagnifyingGlass },
  { id: 'recipes', label: 'Recipes', icon: CookingPot },
];

/**
 * The bottom navigation: one compact group of the three destinations — Home, Search,
 * Recipes — and, beside it, the separate circular Log food action. Both align in one row
 * and read as one navigation area while keeping different functions.
 *
 * The active destination shows its bold glyph, its 10/14 label and a contained selected
 * surface, and is exposed with `aria-current="page"`; inactive destinations show only
 * their regular glyph but keep an accessible name. Re-tapping the current destination is
 * ignored so it can never reset that destination. Log food is a plain labelled button
 * that never takes `aria-current` and never becomes selected. The bar owns no state.
 */
export function NavigationBar({ selected, onSelect, onLogFood, hidden = false, className }: NavigationBarProps) {
  return (
    <nav aria-label="Main" className={[styles.bar, className].filter(Boolean).join(' ')} hidden={hidden}>
      <div className={styles.group}>
        {DESTINATIONS.map(({ id, label, icon }) => {
          const current = id === selected;
          return (
            <button
              key={id}
              type="button"
              className={styles.destination}
              aria-current={current ? 'page' : undefined}
              aria-label={current ? undefined : label}
              data-selected={current || undefined}
              onClick={() => {
                if (!current) onSelect(id);
              }}
            >
              <Icon icon={icon} size="default" weight={current ? 'bold' : 'regular'} />
              {current ? (
                <Text as="span" variant="nav-label-active" color="inherit" className={styles.label}>
                  {label}
                </Text>
              ) : null}
            </button>
          );
        })}
      </div>
      <button type="button" className={styles.action} aria-label="Log food" onClick={onLogFood}>
        <Icon icon={Plus} size="default" weight="bold" />
      </button>
    </nav>
  );
}
