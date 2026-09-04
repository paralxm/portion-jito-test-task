import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

/** Semantic type styles defined in tokens.json → semantic.typography. */
export type TextVariant =
  | 'main-result'
  | 'screen-heading'
  | 'detail-heading'
  | 'section-title'
  | 'compact-title'
  /** Medium (default) button label, 16/24 600. */
  | 'action-md'
  | 'body'
  | 'label'
  | 'supporting'
  /** Small button label, 14/20 600. */
  | 'action-sm'
  | 'caption'
  | 'caption-strong'
  | 'item-title'
  | 'method-title'
  | 'metric-inline'
  | 'metric-secondary'
  | 'wordmark';

export type TextColor = 'primary' | 'secondary' | 'on-action' | 'error' | 'inherit';

type OwnProps<T extends ElementType> = {
  /** Rendered element. Choose it for document semantics, not for size. */
  as?: T;
  /** Visual type role. Independent of the element: an 18 px card title may still be an h2. */
  variant?: TextVariant;
  color?: TextColor;
  /** Tabular figures for values that update or align. Not for prose. */
  numeric?: boolean;
  align?: 'start' | 'center';
  /** Allow a long unbroken word to break rather than overflow its column. */
  wrap?: boolean;
  children?: ReactNode;
};

export type TextProps<T extends ElementType = 'span'> = OwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof OwnProps<T>>;

const colorClass: Record<Exclude<TextColor, 'inherit'>, string> = {
  primary: 'portion-text-primary',
  secondary: 'portion-text-secondary',
  'on-action': 'portion-text-on-action',
  error: 'portion-text-error',
};

/**
 * Text — the single entry point for typography. Every visible string in the design
 * system renders through this primitive (or a component that uses it), so the token
 * scale is applied consistently and never restated in component CSS.
 */
export function Text<T extends ElementType = 'span'>({
  as,
  variant = 'body',
  color = 'inherit',
  numeric = false,
  align,
  wrap = false,
  className,
  children,
  ...rest
}: TextProps<T>) {
  const Component = (as ?? 'span') as ElementType;
  const classes = [
    `portion-type-${variant}`,
    color !== 'inherit' ? colorClass[color] : null,
    numeric ? 'portion-numeric' : null,
    align ? `portion-text-${align}` : null,
    wrap ? 'portion-text-wrap' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <Component className={classes} {...rest}>
      {children}
    </Component>
  );
}
