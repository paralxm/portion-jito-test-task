import { useId, useRef, type KeyboardEvent } from 'react';

import { Text } from '../../primitives/Text/Text';
import styles from './SegmentedControl.module.css';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

/**
 * `radio` exposes the control as a radio group — the right pattern when choosing a
 * segment changes what a screen asks or shows without the control owning a panel.
 * `tabs` exposes it as a tablist whose selected tab controls the panel named by
 * `controls` — the right pattern for a content switcher such as Search's Food | Recipes
 * results. Both use automatic activation: arrow keys move focus and selection together.
 */
export type SegmentedControlPattern = 'radio' | 'tabs';

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
  pattern?: SegmentedControlPattern;
  /** With `pattern="tabs"`: the id of the panel the selected tab controls. */
  controls?: string;
  /** Base id for the option elements (each option is `${id}-${value}`); generated when omitted. */
  id?: string;
  className?: string;
}

/** The id of one option element, for a consumer's `aria-labelledby` on its tabpanel. */
export function segmentedOptionId(baseId: string, value: string): string {
  return `${baseId}-${value}`;
}

/**
 * Mutually exclusive selection among a small set of peer modes within one task, where
 * choosing an option immediately changes what the surrounding screen shows. One sunken
 * track holds equal-width segments; the selected segment is a contained action-coloured
 * surface with the segmented-label-selected role, so selection is carried by surface,
 * boundary and weight together — never colour alone. Availability and selection are
 * independent: a disabled segment keeps its selection but never activates.
 */
export function SegmentedControl<T extends string>({ value, options, onValueChange, ariaLabel, disabled = false, pattern = 'radio', controls, id: idProp, className }: SegmentedControlProps<T>) {
  const generated = useId();
  const baseId = idProp ?? `segmented-${generated}`;
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

  const tabs = pattern === 'tabs';

  return (
    <div className={[styles.control, className].filter(Boolean).join(' ')} role={tabs ? 'tablist' : 'radiogroup'} aria-label={ariaLabel} data-disabled={disabled || undefined}>
      {options.map((option, index) => {
        const selected = option.value === value;
        const optionDisabled = disabled || Boolean(option.disabled);
        const stateProps = tabs ? { role: 'tab' as const, 'aria-selected': selected, 'aria-controls': controls } : { role: 'radio' as const, 'aria-checked': selected };
        return (
          <button
            key={option.value}
            id={segmentedOptionId(baseId, option.value)}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            {...stateProps}
            disabled={optionDisabled}
            tabIndex={selected ? 0 : -1}
            data-selected={selected || undefined}
            className={styles.option}
            onClick={() => {
              if (!optionDisabled && !selected) onValueChange(option.value);
            }}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {/* Selected and unselected roles share 14/20 metrics, so the weight change never
                reflows the equal-width segments. */}
            <Text as="span" variant={selected ? 'segmented-label-selected' : 'segmented-label'} color="inherit" className={styles.label} wrap>
              {option.label}
            </Text>
          </button>
        );
      })}
    </div>
  );
}
