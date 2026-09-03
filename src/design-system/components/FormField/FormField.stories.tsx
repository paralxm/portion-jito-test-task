import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { Stack } from '../../primitives/layout/Stack';
import { TextField } from '../TextField/TextField';
import { FormField } from './FormField';
import { Input } from '../../primitives/Input/Input';

const meta = {
  title: 'Components/FormField and TextField',
  component: FormField,
  args: { label: 'Label', children: () => null },
  parameters: {
    docs: {
      description: {
        component:
          'FormField wires a persistent visible label, helper and error to any control through a render prop; TextField is FormField plus the Input primitive. The error replaces the helper, is linked through `aria-describedby` and is announced politely from a persistent live region. A placeholder is never the only label.',
      },
    },
  },
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextFieldStates: Story = {
  name: 'TextField — default, helper, optional, invalid, disabled',
  render: () => (
    <Stack gap={16}>
      <TextField label="Food or dish name" placeholder="For example, Lentil soup" />
      <TextField label="Brand" optional helper="Shown with the result so you can tell similar foods apart." />
      <TextField label="Food or dish name" defaultValue="" error="Enter a name for the food or dish" />
      <TextField label="Source" defaultValue="Scanned product" disabled />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const invalid = canvas.getAllByRole('textbox', { name: 'Food or dish name' })[1];
    await expect(invalid).toHaveAttribute('aria-invalid', 'true');
    await expect(invalid).toHaveAccessibleDescription('Enter a name for the food or dish');
    const withHelper = canvas.getByRole('textbox', { name: /Brand/ });
    await expect(withHelper).toHaveAccessibleDescription(/tell similar foods apart/);
  },
};

export const ErrorAppearsOnValidation: Story = {
  name: 'Error replaces helper after validation',
  render: () => {
    const [value, setValue] = useState('');
    const [error, setError] = useState<string | undefined>();
    return (
      <FormField label="Calories" helper="For the reference amount above." error={error}>
        {(field) => (
          <Input
            id={field.id}
            inputMode="decimal"
            numeric
            suffix="kcal"
            value={value}
            invalid={field.invalid}
            aria-describedby={field.describedBy}
            onChange={(e) => {
              setValue(e.target.value);
              setError(undefined);
            }}
            onBlur={() => setError(value.trim() === '' ? 'Enter the calories for this amount' : undefined)}
          />
        )}
      </FormField>
    );
  },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox', { name: 'Calories' });
    await expect(input).toHaveAccessibleDescription('For the reference amount above.');
    await userEvent.click(input);
    await userEvent.tab();
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription('Enter the calories for this amount');
    await userEvent.type(input, '180');
    await expect(input).not.toHaveAttribute('aria-invalid');
  },
};
