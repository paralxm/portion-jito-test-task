import type { ChangeEvent } from 'react';

import { FormField, type FormFieldProps } from '../FormField/FormField';
import { Input } from '../../primitives/Input/Input';
import { UnitControl } from '../UnitControl/UnitControl';

export interface AmountFieldProps extends Omit<FormFieldProps, 'children' | 'className'> {
  /** The raw draft string. Parsing and validation belong to the feature; the field never rewrites it. */
  value: string;
  onChange: (value: string) => void;
  /** Unit shown beside the value. Read-only when `onRequestUnitChange` is absent. */
  unit: string;
  /** When provided the unit becomes a clickable selector that opens the unit chooser. */
  onRequestUnitChange?: () => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  name?: string;
  className?: string;
  onBlur?: () => void;
}

/**
 * Numeric entry for portions, reference amounts and nutrient values. The decimal
 * keyboard is requested with `inputMode="decimal"`; the value stays a string so a user
 * can clear it or type a separator without the field reinterpreting the draft.
 */
export function AmountField({
  value,
  onChange,
  unit,
  onRequestUnitChange,
  disabled,
  placeholder,
  autoFocus,
  name,
  className,
  onBlur,
  ...fieldProps
}: AmountFieldProps) {
  return (
    <FormField {...fieldProps} className={className}>
      {(field) => (
        <Input
          id={field.id}
          name={name}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          numeric
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          invalid={field.invalid}
          aria-describedby={field.describedBy}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
          onBlur={onBlur}
          suffix={onRequestUnitChange ? undefined : unit}
          trailing={onRequestUnitChange ? <UnitControl unit={unit} onClick={onRequestUnitChange} disabled={disabled} /> : undefined}
        />
      )}
    </FormField>
  );
}
