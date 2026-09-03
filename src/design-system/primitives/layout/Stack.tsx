import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

import styles from './layout.module.css';

/** The approved spacing scale, matching tokens.json → reference.space exactly. */
export type SpaceStep = 0 | 4 | 8 | 12 | 16 | 24 | 32;

export type LayoutAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type LayoutJustify = 'start' | 'center' | 'end' | 'between';

export interface LayoutProps {
  gap?: SpaceStep;
  align?: LayoutAlign;
  justify?: LayoutJustify;
  /** Take the full inline size of the parent. */
  block?: boolean;
}

type StackProps<T extends ElementType> = LayoutProps & {
  as?: T;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children'>;

/** Vertical flow with a token gap. Use it instead of margins between siblings. */
export function Stack<T extends ElementType = 'div'>({
  as,
  gap = 8,
  align = 'stretch',
  justify,
  block = true,
  className,
  children,
  ...rest
}: StackProps<T>) {
  const Component = (as ?? 'div') as ElementType;
  return (
    <Component
      className={[styles.stack, className].filter(Boolean).join(' ')}
      data-gap={gap}
      data-align={align}
      data-justify={justify}
      data-block={block ? 'true' : undefined}
      {...rest}
    >
      {children}
    </Component>
  );
}

/** Marks a child of Stack or Inline that should take the remaining space and still shrink. */
export const growClass = styles.grow;
