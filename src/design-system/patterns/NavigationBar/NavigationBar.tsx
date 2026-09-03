import { useLayoutEffect, useRef } from 'react';
import { CookingPot, House, MagnifyingGlass, Plus } from '@phosphor-icons/react';

import { Icon } from '../../icons/Icon';
import { Text } from '../../primitives/Text/Text';
import styles from './NavigationBar.module.css';

/** The three root destinations. Add food is an action, never a destination. */
export type Destination = 'home' | 'search' | 'recipes';

export interface NavigationBarProps {
  selected: Destination;
  onSelect: (destination: Destination) => void;
  onAddFood: () => void;
  /** Hide the whole bar as a unit while a root text field has the software keyboard. */
  hidden?: boolean;
  className?: string;
}

const DESTINATIONS: ReadonlyArray<{ id: Destination; label: string; icon: typeof House }> = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'search', label: 'Search', icon: MagnifyingGlass },
  { id: 'recipes', label: 'Recipes', icon: CookingPot },
];

const px = (value: string) => parseFloat(value) || 0;

/**
 * One bottom row: Home | Search | Recipes | + Add food.
 *
 * Selection is shown by the bold glyph, action colour, a 2 px indicator and the label
 * weight, and exposed as `aria-current="page"`. Retapping the current destination is
 * ignored here so it can never reset that destination.
 *
 * Enlarged-text fallback: labels may wrap and the row grows. If a single word (such as
 * "Recipes") cannot fit its cell, the same four controls rearrange into two rows of
 * two in the same reading order. This is measured, not guessed: each label's natural
 * width (an invisible nowrap copy) is compared with the width a row cell would have.
 * The layout is written on the next frame so the observer never loops on itself.
 */
export function NavigationBar({ selected, onSelect, onAddFood, hidden = false, className }: NavigationBarProps) {
  const navRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav || typeof ResizeObserver === 'undefined') return;
    let frame = 0;

    const measure = () => {
      const navStyle = getComputedStyle(nav);
      const inner = nav.clientWidth - px(navStyle.paddingLeft) - px(navStyle.paddingRight);
      if (inner <= 0) return;
      const gap = px(navStyle.columnGap);
      const probes = Array.from(nav.querySelectorAll<HTMLElement>('[data-nav-measure]'));
      const addProbe = probes.find((probe) => probe.dataset.navMeasure === 'add-food');
      const addButton = addProbe?.parentElement;
      const addStyle = addButton ? getComputedStyle(addButton) : null;
      const addWidth = Math.max(px(addStyle?.minWidth ?? '0'), (addProbe?.offsetWidth ?? 0) + px(addStyle?.paddingLeft ?? '0') + px(addStyle?.paddingRight ?? '0'));
      const destination = probes.find((probe) => probe.dataset.navMeasure !== 'add-food')?.parentElement;
      const destinationStyle = destination ? getComputedStyle(destination) : null;
      const cellPadding = px(destinationStyle?.paddingLeft ?? '0') + px(destinationStyle?.paddingRight ?? '0');
      const cell = (inner - addWidth - gap * 3) / 3 - cellPadding;
      const overflows = probes.some((probe) => probe.dataset.navMeasure !== 'add-food' && probe.offsetWidth > cell + 0.5);
      const next = overflows ? 'stacked' : 'row';
      if (nav.dataset.layout === next) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        nav.dataset.layout = next;
      });
    };

    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    nav.querySelectorAll<HTMLElement>('[data-nav-measure]').forEach((probe) => observer.observe(probe));
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
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
            <Icon icon={icon} size="default" weight={current ? 'bold' : 'regular'} />
            {/* Both weights are laid out so the cell width never changes on selection. */}
            <span className={styles.labelSlot}>
              <Text variant={current ? 'caption-strong' : 'caption'} color="inherit" className={styles.label} data-nav-label>
                {label}
              </Text>
              <Text variant="caption-strong" color="inherit" className={styles.labelGhost} aria-hidden="true">
                {label}
              </Text>
            </span>
            {/* Natural width of the label, measured without touching the layout. */}
            <Text variant="caption-strong" className={styles.measure} aria-hidden="true" data-nav-measure={id}>
              {label}
            </Text>
          </button>
        );
      })}
      <button type="button" className={styles.addFood} onClick={onAddFood}>
        <span className={styles.addGlyph}>
          <Icon icon={Plus} size="default" weight="bold" />
        </span>
        <Text variant="caption-strong" color="inherit" className={styles.label} data-nav-label>
          Add food
        </Text>
        <Text variant="caption-strong" className={styles.measure} aria-hidden="true" data-nav-measure="add-food">
          Add food
        </Text>
      </button>
    </nav>
  );
}
