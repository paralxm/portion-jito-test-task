import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

import styles from './Surface.module.css';

export interface SurfaceProps {
  /** Background role. `canvas` is white, `surface` the light neutral, `sunken` the deeper neutral. */
  tone?: 'canvas' | 'surface' | 'sunken';
  /** Essential boundaries use the control border; ordinary grouping uses the decorative one. */
  border?: 'none' | 'decorative' | 'control';
  radius?: 'structure' | 'control' | 'card';
  padding?: 0 | 12 | 16 | 24;
}

type Props<T extends ElementType> = SurfaceProps & {
  as?: T;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children'>;

/** A bounded region. Ordinary surfaces use borders and space; elevation is for sheets only. */
export function Surface<T extends ElementType = 'div'>({
  as,
  tone = 'canvas',
  border = 'decorative',
  radius = 'card',
  padding = 16,
  className,
  children,
  ...rest
}: Props<T>) {
  const Component = (as ?? 'div') as ElementType;
  return (
    <Component
      className={[styles.surface, className].filter(Boolean).join(' ')}
      data-tone={tone}
      data-border={border}
      data-radius={radius}
      data-padding={padding}
      {...rest}
    >
      {children}
    </Component>
  );
}
