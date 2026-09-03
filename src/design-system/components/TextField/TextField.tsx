import { FormField, type FormFieldProps } from '../FormField/FormField';
import { Input, type InputProps } from '../../primitives/Input/Input';

export interface TextFieldProps extends Omit<InputProps, 'id' | 'invalid' | 'aria-describedby'>, Omit<FormFieldProps, 'children' | 'className'> {
  className?: string;
}

/** Labelled text input: FormField wiring plus the Input primitive. */
export function TextField({ label, optional, helper, error, id, className, ...inputProps }: TextFieldProps) {
  return (
    <FormField label={label} optional={optional} helper={helper} error={error} id={id} className={className}>
      {(field) => <Input id={field.id} aria-describedby={field.describedBy} invalid={field.invalid} {...inputProps} />}
    </FormField>
  );
}
