import { useId, type ReactNode } from 'react';

import { SegmentedControl, type SegmentedControlOption } from '../../../design-system/components/SegmentedControl/SegmentedControl';
import { Input } from '../../../design-system/primitives/Input/Input';
import { Text } from '../../../design-system/primitives/Text/Text';
import styles from './UnitField.module.css';

export interface UnitFieldInput {
  /** The visible sub-label for a pair (`ft`, `in`); a single input uses the field label. */
  label?: string;
  value: string;
  onChange: (value: string) => void;
  /** The read-only unit shown inside the input (`cm`, `kg`). */
  suffix?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export interface UnitFieldProps<U extends string> {
  /** The measurement's name (`Height`, `Weight`); the label row's start. */
  label: string;
  /** The compact unit selector at the end of the label row, named `${label} units`. */
  unit: U;
  units: readonly SegmentedControlOption<U>[];
  onUnitChange: (unit: U) => void;
  /** One input, or an equal-width pair (feet and inches) directly beneath the label row. */
  inputs: readonly UnitFieldInput[];
  helper?: ReactNode;
  error?: ReactNode;
  className?: string;
}

/**
 * A measurement with its unit choice in the label row (ledger §14): the label at the
 * start, the compact segmented unit control at the end, and the input — or the ft + in
 * pair — full width beneath, so the unit reads as part of the field and never floats.
 * The error and helper belong to the whole group; a pair keeps both inputs associated
 * with the measurement through the group's name.
 */
export function UnitField<U extends string>({ label, unit, units, onUnitChange, inputs, helper, error, className }: UnitFieldProps<U>) {
  const id = useId();
  const messageId = error ? `${id}-error` : helper ? `${id}-helper` : undefined;
  return (
    <fieldset className={[styles.field, className].filter(Boolean).join(' ')} aria-describedby={messageId}>
      <div className={styles.labelRow}>
        <Text as="legend" variant="label" color="primary" className={styles.legend}>
          {label}
        </Text>
        <SegmentedControl ariaLabel={`${label} units`} value={unit} options={units} onValueChange={onUnitChange} className={styles.units} />
      </div>
      <div className={styles.inputs} data-count={inputs.length}>
        {inputs.map((input, index) => {
          const inputId = `${id}-${index}`;
          return (
            <div key={inputId} className={styles.input}>
              {input.label ? (
                <label htmlFor={inputId} className={styles.subLabel}>
                  <Text as="span" variant="supporting" color="secondary">
                    {input.label}
                  </Text>
                </label>
              ) : null}
              <Input
                id={inputId}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                numeric
                aria-label={input.label ? `${label} ${input.label}` : label}
                aria-describedby={messageId}
                aria-invalid={error ? true : undefined}
                invalid={Boolean(error)}
                value={input.value}
                placeholder={input.placeholder}
                autoFocus={input.autoFocus}
                suffix={input.suffix}
                onChange={(event) => input.onChange(event.target.value)}
              />
            </div>
          );
        })}
      </div>
      {error ? (
        <Text as="p" id={`${id}-error`} variant="supporting" color="error" role="alert" wrap>
          {error}
        </Text>
      ) : helper ? (
        <Text as="p" id={`${id}-helper`} variant="supporting" color="secondary" wrap>
          {helper}
        </Text>
      ) : null}
    </fieldset>
  );
}
