import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { MagnifyingGlass } from '@phosphor-icons/react';

import { Icon } from '../../icons/Icon';
import { Stack } from '../layout/Stack';
import { Input } from './Input';

const meta = {
  title: 'Primitives/Input',
  component: Input,
  args: { 'aria-label': 'Amount', defaultValue: '250' },
  parameters: {
    docs: {
      description: {
        component:
          'The base text control: boundary, focus ring, invalid treatment and leading/suffix/trailing slots. Labels, helper and error wiring belong to FormField. Minimum height 48 px; the field grows with enlarged text.',
      },
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox', { name: 'Amount' });
    await userEvent.clear(input);
    await userEvent.type(input, '300');
    await expect(input).toHaveValue('300');
    await expect(input.closest('div')?.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
  },
};

export const Slots: Story = {
  render: () => {
    const [value, setValue] = useState('lentil');
    return (
      <Stack gap={12}>
        <Input aria-label="Amount" inputMode="decimal" numeric defaultValue="250" suffix="g" />
        <Input aria-label="Search" type="search" value={value} onChange={(e) => setValue(e.target.value)} leading={<Icon icon={MagnifyingGlass} size="small-action" />} />
        <Input aria-label="Calories" inputMode="decimal" numeric defaultValue="" placeholder="Any" suffix="kcal" />
      </Stack>
    );
  },
};

export const Invalid: Story = {
  args: { invalid: true, defaultValue: 'abc', 'aria-describedby': undefined },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('textbox')).toBeDisabled();
  },
};
