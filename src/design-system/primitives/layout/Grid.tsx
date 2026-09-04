import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

import styles from './layout.module.css';
import type { SpaceStep } from './Stack';

export interface GridProps {
  /** Four fluid tracks are the mobile alignment guide; use full span for normal content. */
  columns?: 4;
  gap?: SpaceStep;
}

type GridElementProps<T extends ElementType> = GridProps & {
  as?: T;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children'>;

/** A fluid alignment grid, not a mandate to split ordinary mobile content into columns. */
export function Grid<T extends ElementType = 'div'>({ as, columns = 4, gap = 12, className, children, ...rest }: GridElementProps<T>) {
  const Component = (as ?? 'div') as ElementType;
  return (
    <Component
      className={[styles.grid, className].filter(Boolean).join(' ')}
      data-grid-columns={columns}
      data-grid-gap={gap}
      {...rest}
    >
      {children}
    </Component>
  );
}

export interface GridItemProps<T extends ElementType> {
  /** A normal mobile card, form, result row, or list spans all four tracks. */
  span?: 1 | 2 | 3 | 4;
  /** Stack a paired layout before labels or targets become cramped. */
  collapseAtNarrow?: boolean;
  as?: T;
  children?: ReactNode;
}

/** A semantic track span for the rare paired-field or compact metadata composition. */
export function GridItem<T extends ElementType = 'div'>({ as, span = 4, collapseAtNarrow = false, className, children, ...rest }: GridItemProps<T> & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children'>) {
  const Component = (as ?? 'div') as ElementType;
  return (
    <Component className={[styles.gridItem, className].filter(Boolean).join(' ')} data-grid-span={span} data-collapse-at-narrow={collapseAtNarrow || undefined} {...rest}>
      {children}
    </Component>
  );
}
