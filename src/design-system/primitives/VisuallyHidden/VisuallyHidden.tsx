import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

type Props<T extends ElementType> = {
  as?: T;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children'>;

/**
 * Text available to assistive technology but not drawn on screen. Use it for
 * accessible names and live-region wording that the visual design carries by layout.
 */
export function VisuallyHidden<T extends ElementType = 'span'>({ as, className, children, ...rest }: Props<T>) {
  const Component = (as ?? 'span') as ElementType;
  return (
    <Component className={['portion-visually-hidden', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </Component>
  );
}
