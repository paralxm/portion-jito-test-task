import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

import styles from './layout.module.css';

type ContainerProps<T extends ElementType> = {
  as?: T;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children'>;

/**
 * The mobile content boundary. It keeps readable content centred above 430 CSS px and
 * applies the page inset inside — never instead of — runtime side safe areas.
 */
export function Container<T extends ElementType = 'div'>({ as, className, children, ...rest }: ContainerProps<T>) {
  const Component = (as ?? 'div') as ElementType;
  return (
    <Component className={[styles.container, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </Component>
  );
}
