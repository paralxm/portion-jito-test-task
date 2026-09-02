import { useId, type ChangeEvent, type KeyboardEvent, type Ref } from 'react';
import { MagnifyingGlass, X } from '@phosphor-icons/react';

import { Icon } from '../../icons/Icon';
import { IconButton } from '../../primitives/IconButton/IconButton';
import { Input } from '../../primitives/Input/Input';
import { VisuallyHidden } from '../../primitives/VisuallyHidden/VisuallyHidden';
import styles from './SearchField.module.css';

export interface SearchFieldProps {
  /** Accessible name. Visually hidden by default because the glyph and placement carry it. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Called when the user presses Enter; the feature decides whether to request results. */
  onSubmit?: (value: string) => void;
  /** Clears the query and returns focus to the input. */
  onClear?: () => void;
  /** A hint only — never the sole label. */
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
  inputRef?: Ref<HTMLInputElement>;
}

/**
 * Search input with the leading glyph and a 48 × 48 clear action that appears once a
 * query exists. Query text is retained by the feature; this field never resets it.
 */
export function SearchField({ label, value, onChange, onSubmit, onClear, placeholder, autoFocus, disabled, className, inputRef }: SearchFieldProps) {
  const id = useId();
  const inputId = `search-${id}`;
  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')} role="search">
      <VisuallyHidden as="label" htmlFor={inputId}>
        {label}
      </VisuallyHidden>
      <Input
        ref={inputRef}
        id={inputId}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onSubmit?.(value);
          }
        }}
        leading={<Icon icon={MagnifyingGlass} size="small-action" />}
        trailing={
          value.length > 0 && onClear ? (
            <IconButton icon={X} label="Clear search" onClick={onClear} disabled={disabled} className={styles.clear} />
          ) : undefined
        }
      />
    </div>
  );
}
