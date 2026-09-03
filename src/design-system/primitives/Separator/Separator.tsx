import styles from './Separator.module.css';

export interface SeparatorProps {
  /**
   * Decorative separators (the default) use the 1.23:1 decorative border and are hidden
   * from assistive technology. A semantic separator marks a real boundary in the
   * document and is exposed with the separator role.
   */
  decorative?: boolean;
  className?: string;
}

export function Separator({ decorative = true, className }: SeparatorProps) {
  return (
    <hr
      className={[styles.separator, className].filter(Boolean).join(' ')}
      aria-hidden={decorative ? true : undefined}
      role={decorative ? 'presentation' : 'separator'}
    />
  );
}
