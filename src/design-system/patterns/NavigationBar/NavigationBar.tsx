import { useLayoutEffect, useRef } from 'react';
import { Calculator, CookingPot, MagnifyingGlass, Plus } from '@phosphor-icons/react';

import { Icon } from '../../icons/Icon';
import { Text } from '../../primitives/Text/Text';
import styles from './NavigationBar.module.css';

/** The three root destinations. Add food is an action, never a destination. */
export type Destination = 'calculate' | 'search' | 'recipes';

export interface NavigationBarProps {
  selected: Destination;
  onSelect: (destination: Destination) => void;
  onAddFood: () => void;
  /** Hide the whole bar as a unit while a root text field has the software keyboard. */
  hidden?: boolean;
  className?: string;
}

const DESTINATIONS: ReadonlyArray<{ id: Destination; label: string; icon: typeof Calculator }> = [
  { id: 'calculate', label: 'Calculate', icon: Calculator },
  { id: 'search', label: 'Search', icon: MagnifyingGlass },
  { id: 'recipes', label: 'Recipes', icon: CookingPot },
];

/**
 * One bottom row: Calculate | Search | Recipes | + Add food.
 *
 * Selection is shown by the bold glyph, action colour, a 2 px indicator and the label
 * weight, and exposed as `aria-current="page"`. Retapping the current destination is
 * ignored here so it can never reset that destination.
 *
 * Enlarged-text fallback: labels may wrap and the row grows. If a single word (such as
 * "Calculate") cannot fit its cell, the same four controls rearrange into two rows of
 * two in the same reading order. This is measured with ResizeObserver, not guessed, and
 * is an enlargement-only exception rather than the normal navigation pattern.
 */
export function NavigationBar({ selected, onSelect, onAddFood, hidden = false, className }: NavigationBarProps) {
  const navRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav || typeof ResizeObserver === 'undefined') return;
    const measure = () => {
      // Measure in the row layout, then keep whichever layout fits.
      nav.dataset.layout = 'row';
      const labels = nav.querySelectorAll<HTMLElement>('[data-nav-label]');
      const overflows = Array.from(labels).some((label) => label.scrollWidth > label.clientWidth + 1);
      nav.dataset.layout = overflows ? 'stacked' : 'row';
    };
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    measure();
    return () => observer.disconnect();
  }, []);

  return (
    <nav ref={navRef} aria-label="Main" className={[styles.bar, className].filter(Boolean).join(' ')} data-layout="row" hidden={hidden}>
      {DESTINATIONS.map(({ id, label, icon }) => {
        const current = id === selected;
        return (
          <button
            key={id}
            type="button"
            className={styles.destination}
            aria-current={current ? 'page' : undefined}
            data-selected={current || undefined}
            onClick={() => {
              if (!current) onSelect(id);
            }}
          >
            <span className={styles.indicator} aria-hidden="true" />
            <Icon icon={icon} weight={current ? 'bold' : 'regular'} />
            {/* Both weights are laid out so the cell width never changes on selection. */}
            <span className={styles.labelSlot}>
              <Text variant={current ? 'caption-strong' : 'caption'} color="inherit" className={styles.label} data-nav-label>
                {label}
              </Text>
              <Text variant="caption-strong" color="inherit" className={styles.labelGhost} aria-hidden="true">
                {label}
              </Text>
            </span>
          </button>
        );
      })}
      <button type="button" className={styles.addFood} onClick={onAddFood}>
        <span className={styles.addGlyph}>
          <Icon icon={Plus} weight="bold" />
        </span>
        <Text variant="caption-strong" color="inherit" className={styles.label} data-nav-label>
          Add food
        </Text>
      </button>
    </nav>
  );
}
