import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { withRootFontSize } from '../../storybook/decorators';
import { ViewToggle, type ViewMode } from './ViewToggle';

const meta = {
  title: 'Components/ViewToggle',
  component: ViewToggle,
  args: { value: 'list', onChange: fn(), label: 'View' },
  parameters: {
    docs: {
      description: {
        component:
          'A two-way presentation switch exposed as a radio group: List or Grid of the same items. Choosing a view changes only the layout, never the items, their order, the query or the filters. Each option is a 48 px target with a glyph and a visible label; selection is carried by surface, boundary and weight. Arrow keys move selection like any radio group.',
      },
    },
  },
} satisfies Meta<typeof ViewToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

function Controlled({ initial = 'list' }: { initial?: ViewMode }) {
  const [value, setValue] = useState<ViewMode>(initial);
  return <ViewToggle value={value} onChange={setValue} />;
}

export const ListSelected: Story = {
  name: 'List selected (default)',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radiogroup', { name: 'View' })).toBeVisible();
    await expect(canvas.getByRole('radio', { name: 'List' })).toHaveAttribute('aria-checked', 'true');
    await expect(canvas.getByRole('radio', { name: 'Grid' })).toHaveAttribute('aria-checked', 'false');
  },
};

export const Interactive: Story = {
  name: 'Pointer and arrow keys change the selection',
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('radio', { name: 'Grid' }));
    await expect(canvas.getByRole('radio', { name: 'Grid' })).toHaveAttribute('aria-checked', 'true');
    canvas.getByRole('radio', { name: 'Grid' }).focus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(canvas.getByRole('radio', { name: 'List' })).toHaveAttribute('aria-checked', 'true');
    await expect(canvas.getByRole('radio', { name: 'List' })).toHaveFocus();
  },
};

export const Targets: Story = {
  name: 'Each option is at least 48 px tall',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const option of canvas.getAllByRole('radio')) {
      const rect = option.getBoundingClientRect();
      const before = getComputedStyle(option, '::before');
      const hit = rect.height + 2 * Math.abs(parseFloat(before.insetBlockStart || '0') || 0);
      await expect(hit).toBeGreaterThanOrEqual(48);
    }
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 200 %',
  decorators: [withRootFontSize(200)],
  render: () => <Controlled initial="grid" />,
};
