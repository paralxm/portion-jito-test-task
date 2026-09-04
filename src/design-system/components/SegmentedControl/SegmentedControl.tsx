import { useRef, type KeyboardEvent } from 'react';

import { Text } from '../../primitives/Text/Text';
import styles from './SegmentedControl.module.css';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  /** The single selected value. The control never manages its own selection. */
  value: T;
  /** 2–4 mutually exclusive peer options is the supported shape; more than that belongs to a filter, not a mode switch. */
  options: readonly SegmentedControlOption<T>[];
  onValueChange: (value: T) => void;
  /** Accessible name for the group, e.g. "Search in". There is no visible caption slot. */
  ariaLabel: string;
  /** Disables every option. Individual options can also be disabled on their own. */
  disabled?: boolean;
  className?: string;
}

/**
 * Mutually exclusive selection among a small set of peer modes within one task, where
 * choosing an option immediately changes what the surrounding screen shows — Portion's
 * production use is Search's Food/Recipes scope. Exposed as a radiogroup: exactly one
 * value is ever selected, matching the same radio semantics this codebase already uses
 * for other peer-option pickers (recipe filters' dietary preference), and matching how
 * segmented controls are conventionally exposed on other platforms (including iOS's own
 * `UISegmentedControl`, which reports itself as a set of mutually exclusive buttons, not
 * as tabs). It is deliberately not exposed as ARIA tabs: a tab is defined by owning an
 * associated tabpanel it names via `aria-controls`, and this component never sees or
 * owns the content its value switches — that stays entirely with the caller.
 */
export function SegmentedControl<T extends string>({ value, options, onValueChange, ariaLabel, disabled = false, className }: SegmentedControlProps<T>) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const isEnabled = (index: number) => !disabled && !options[index].disabled;
  const enabledIndices = options.map((_, index) => index).filter(isEnabled);

  const selectAndFocus = (index: number) => {
    const option = options[index];
    if (option.value !== value) onValueChange(option.value);
    buttonRefs.current[index]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (enabledIndices.length === 0) return;
    const position = enabledIndices.indexOf(index);
    let nextPosition: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextPosition = (position + 1) % enabledIndices.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextPosition = (position - 1 + enabledIndices.length) % enabledIndices.length;
    else if (event.key === 'Home') nextPosition = 0;
    else if (event.key === 'End') nextPosition = enabledIndices.length - 1;
    if (nextPosition === null) return;
    event.preventDefault();
    selectAndFocus(enabledIndices[nextPosition]);
  };

  return (
    <div className={[styles.control, className].filter(Boolean).join(' ')} role="radiogroup" aria-label={ariaLabel}>
      {options.map((option, index) => {
        const selected = option.value === value;
        const optionDisabled = disabled || Boolean(option.disabled);
        return (
          <button
            key={option.value}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={optionDisabled}
            tabIndex={selected ? 0 : -1}
            data-selected={selected || undefined}
            className={styles.option}
            onClick={() => {
              if (!optionDisabled && !selected) onValueChange(option.value);
            }}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {/* Selected = action-sm (600), unselected = label (500): same 14/20 metrics,
                so the weight change never reflows the equal-width segments. */}
            <Text as="span" variant={selected ? 'action-sm' : 'label'} color="inherit" className={styles.label} wrap>
              {option.label}
            </Text>
          </button>
        );
      })}
    </div>
  );
}
