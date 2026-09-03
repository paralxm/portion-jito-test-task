import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { SearchField } from './SearchField';

const meta = {
  title: 'Components/SearchField',
  component: SearchField,
  args: { label: 'Search foods', value: '', placeholder: 'Food or dish name', onChange: fn(), onSubmit: fn(), onClear: fn() },
  parameters: {
    docs: {
      description: {
        component:
          'Search input with a leading glyph and a 48 × 48 clear action that appears once a query exists. The query is owned by the feature and never reset by the field; Enter calls `onSubmit`.',
      },
    },
  },
} satisfies Meta<typeof SearchField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return (
      <SearchField
        {...args}
        value={value}
        onChange={(v) => {
          setValue(v);
          args.onChange(v);
        }}
        onClear={() => {
          setValue('');
          args.onClear?.();
        }}
      />
    );
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('searchbox', { name: 'Search foods' });
    await expect(canvas.queryByRole('button', { name: 'Clear search' })).toBeNull();
    await userEvent.type(input, 'lentil{Enter}');
    await expect(args.onSubmit).toHaveBeenCalledWith('lentil');
    const clear = canvas.getByRole('button', { name: 'Clear search' });
    await expect(clear.getBoundingClientRect().width).toBeGreaterThanOrEqual(48);
    await userEvent.click(clear);
    await expect(args.onClear).toHaveBeenCalled();
    await expect(input).toHaveValue('');
  },
};

export const WithQuery: Story = {
  args: { value: 'Wholegrain pasta with roasted vegetables' },
};
