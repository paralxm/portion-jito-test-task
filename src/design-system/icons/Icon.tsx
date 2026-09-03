import type { Icon as PhosphorIcon, IconWeight } from '@phosphor-icons/react';

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

/**
 * Icon — the only way the design system renders Phosphor glyphs. It fixes size to the
 * token roles, keeps colour on `currentColor`, and decides accessibility exposure from
 * whether a label was supplied. Source assets are the official React package; no stroke
 * or path edits are applied.
 */
export function Icon({ icon: Glyph, size = 'default', weight = 'regular', label, className }: IconProps) {
  const dimension = sizeVar[size];
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
