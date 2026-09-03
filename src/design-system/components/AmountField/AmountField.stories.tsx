import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Stack } from '../../primitives/layout/Stack';
import { expectNoHorizontalOverflow } from '../../storybook/decorators';
import { AmountField } from './AmountField';

const meta = {
  title: 'Components/AmountField',
  component: AmountField,
  args: { label: 'Amount', value: '250', unit: 'g', onChange: fn() },
  parameters: {
    docs: {
      description: {
        component:
          'Numeric entry for portions, reference amounts and nutrient values. The value is a string draft the feature parses (digits with one decimal separator); the field never rewrites it. The unit is a read-only suffix, or a clickable selector when `onRequestUnitChange` is provided.',
      },
    },
  },
} satisfies Meta<typeof AmountField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadOnlyUnit: Story = {
  name: 'Read-only unit suffix',
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <AmountField {...args} value={value} onChange={(v) => { setValue(v); args.onChange(v); }} />;
  },
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByRole('textbox', { name: 'Amount' });
    await expect(input).toHaveAttribute('inputmode', 'decimal');
    await userEvent.clear(input);
    await userEvent.type(input, '0,5');
    await expect(args.onChange).toHaveBeenLastCalledWith('0,5');
    await expect(within(canvasElement).queryByRole('button')).toBeNull();
  },
};

export const SelectableUnit: Story = {
  name: 'Selectable unit',
  args: { onRequestUnitChange: fn() },
  play: async ({ canvasElement, args }) => {
    const control = within(canvasElement).getByRole('button', { name: 'Change unit, currently g' });
    await expect(control).toHaveAttribute('aria-haspopup', 'dialog');
    await userEvent.click(control);
    await expect(args.onRequestUnitChange).toHaveBeenCalledTimes(1);
  },
};

export const States: Story = {
  render: (args) => (
    <Stack gap={16}>
      <AmountField {...args} label="Amount to calculate" helper="The result updates as you type a valid amount." onRequestUnitChange={() => {}} />
      <AmountField {...args} label="Amount" value="abc" error="Enter a number, for example 250 or 0.5" />
      <AmountField {...args} label="Protein" optional value="" placeholder="Any" unit="g" />
      <AmountField {...args} label="Amount" value="100" unit="ml" disabled />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const invalid = within(canvasElement).getByDisplayValue('abc');
    await expect(invalid).toHaveAttribute('aria-invalid', 'true');
    await expect(invalid).toHaveAccessibleDescription(/Enter a number/);
  },
};

export const Narrow320: Story = {
  name: 'Narrow — 320',
  args: { onRequestUnitChange: fn() },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('textbox')).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};
