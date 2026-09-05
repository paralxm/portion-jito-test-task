import { useLayoutEffect } from 'react';
import type { Icon as PhosphorIcon, IconWeight } from '@phosphor-icons/react';

import { ICON_SYMBOL_IDS, spriteMarkup } from '../../assets/icons';

/** Icon size roles from tokens.json → semantic.size.icon. */
export type IconSize = 'compact' | 'small-action' | 'default' | 'emphasis' | 'empty-state' | 'large-illustrative';

const sizeVar: Record<IconSize, string> = {
  compact: 'var(--portion-size-icon-compact)',
  'small-action': 'var(--portion-size-icon-small-action)',
  default: 'var(--portion-size-icon-default)',
  emphasis: 'var(--portion-size-icon-emphasis)',
  'empty-state': 'var(--portion-size-icon-empty-state)',
  'large-illustrative': 'var(--portion-size-icon-large-illustrative)',
};

export interface IconProps {
  /** A Phosphor icon component, e.g. `MagnifyingGlass` from `@phosphor-icons/react`. */
  icon: PhosphorIcon;
  /** 24 px is the interactive default; `compact` (16) is for non-interactive metadata only. */
  size?: IconSize;
  /**
   * `regular` by default. `bold` is reserved for a persistent selected state such as the
   * current navigation destination — never for hover, press or focus.
   */
  weight?: Extract<IconWeight, 'regular' | 'bold' | 'fill'>;
  /**
   * Accessible name when the glyph carries meaning on its own. Omit it for decorative
   * glyphs inside labelled controls; the icon is then hidden from assistive technology.
   */
  label?: string;
  className?: string;
}

const SPRITE_ID = 'portion-icon-sprite';

/** Inserts the generated sprite into the document once, so `<use href="#…">` resolves locally. */
function ensureSprite() {
  if (typeof document === 'undefined' || document.getElementById(SPRITE_ID)) return;
  const host = document.createElement('div');
  host.id = SPRITE_ID;
  host.hidden = true;
  host.innerHTML = spriteMarkup;
  document.body.prepend(host);
}

/** `MagnifyingGlassIcon` → `magnifying-glass`; Phosphor sets `displayName` on every glyph. */
function symbolIdFor(glyph: PhosphorIcon, weight: string): string | null {
  const name = (glyph as { displayName?: string }).displayName;
  if (!name) return null;
  const id = `${name.replace(/Icon$/, '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}-${weight}`;
  return ICON_SYMBOL_IDS.has(id) ? id : null;
}

/**
 * Icon — the only way the design system renders Phosphor glyphs. It fixes size to the
 * token roles, keeps colour on `currentColor`, and decides accessibility exposure from
 * whether a label was supplied. The glyphs the product uses are served from the
 * repository's own export of the official family (`src/assets/icons`, generated from
 * the installed package by `scripts/icons/export.mjs`) through an SVG sprite; any other
 * glyph — Storybook's catalogue, for instance — renders through the React package. Both
 * paths draw the identical official paths; no stroke or path edits are applied.
 */
export function Icon({ icon: Glyph, size = 'default', weight = 'regular', label, className }: IconProps) {
  const dimension = sizeVar[size];
  const symbolId = symbolIdFor(Glyph, weight);

  useLayoutEffect(() => {
    if (symbolId) ensureSprite();
  }, [symbolId]);

  if (symbolId) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={dimension}
        height={dimension}
        viewBox="0 0 256 256"
        fill="currentColor"
        aria-hidden={label ? undefined : true}
        role={label ? 'img' : undefined}
        aria-label={label}
        focusable="false"
        className={className}
        style={{ flexShrink: 0 }}
        data-symbol={symbolId}
      >
        <use href={`#${symbolId}`} />
      </svg>
    );
  }

  return (
    <Glyph
      size={dimension}
      weight={weight}
      color="currentColor"
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      focusable="false"
      className={className}
      style={{ flexShrink: 0 }}
    />
  );
}
