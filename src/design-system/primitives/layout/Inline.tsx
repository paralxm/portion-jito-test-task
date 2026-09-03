import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

import styles from './layout.module.css';
import type { LayoutProps } from './Stack';

type InlineProps<T extends ElementType> = LayoutProps & {
  as?: T;
  /** Wrap onto further lines instead of overflowing; the default for chip rows. */
  wrap?: boolean;
  /**
   * `hug` (default): every direct child keeps its own content width, like a chip row.
   * `fill`: every direct child shares the available width equally (`flex: 1 1 0%`) —
   * the mechanism for two or more peer actions that should divide a row evenly, e.g. a
   * dialog's Cancel/Confirm pair. Combine with `align="stretch"` to also equalise their
   * height when one label might wrap and the other doesn't.
   */
  distribute?: 'hug' | 'fill';
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children'>;

/** Horizontal flow with a token gap. Items are vertically centred unless told otherwise. */
export function Inline<T extends ElementType = 'div'>({
  as,
  gap = 8,
  align = 'center',
  justify,
  block = false,
  wrap = false,
  distribute = 'hug',
  className,
  children,
  ...rest
}: InlineProps<T>) {
  const Component = (as ?? 'div') as ElementType;
  return (
    <Component
      className={[styles.inline, className].filter(Boolean).join(' ')}
      data-gap={gap}
      data-align={align}
      data-justify={justify}
      data-block={block ? 'true' : undefined}
      data-wrap={wrap ? 'true' : undefined}
      data-distribute={distribute === 'fill' ? 'fill' : undefined}
      {...rest}
    >
      {children}
    </Component>
  );
}
