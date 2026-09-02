import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

import styles from './layout.module.css';
import type { LayoutProps } from './Stack';

type InlineProps<T extends ElementType> = LayoutProps & {
  as?: T;
  /** Wrap onto further lines instead of overflowing; the default for chip rows. */
  wrap?: boolean;
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
      {...rest}
    >
      {children}
    </Component>
  );
}
