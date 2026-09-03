import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { X } from '@phosphor-icons/react';

import { IconButton } from '../../primitives/IconButton/IconButton';
import { AppHeader } from './AppHeader';

const meta = {
  title: 'Patterns/AppHeader',
  component: AppHeader,
  args: { title: 'Calculate' },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A root heading (28/36, optionally under the lowercase wordmark) or a compact focused bar (18/24 title with the real Back destination). A screen shows one of them, never both. Titles wrap; nothing is truncated.',
      },
    },
  },
} satisfies Meta<typeof AppHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Root: Story = {
  args: { showWordmark: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Calculate' })).toBeInTheDocument();
    await expect(canvas.getByText('portion')).toHaveAttribute('aria-label', 'Portion');
  },
};

export const Focused: Story = {
  args: { variant: 'focused', title: 'Review food', onBack: fn() },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Back' }));
    await expect(args.onBack).toHaveBeenCalledTimes(1);
  },
};

export const FocusedWithTrailing: Story = {
  name: 'Focused with trailing close',
  args: { variant: 'focused', title: 'Scan barcode', onBack: fn(), trailing: <IconButton icon={X} label="Cancel scan" /> },
};

export const LongTitle320: Story = {
  name: 'Long title wraps at 320',
  args: { variant: 'focused', title: 'Review the wholegrain pasta with roasted vegetables and tahini dressing', onBack: fn() },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { level: 1 });
    await expect(heading.getBoundingClientRect().height).toBeGreaterThan(24);
    await expect(heading.scrollWidth).toBeLessThanOrEqual(heading.clientWidth + 1);
  },
};
