import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ArrowLeft, Plus, X } from '@phosphor-icons/react';

import { Inline } from '../layout/Inline';
import { IconButton } from './IconButton';

const meta = {
  title: 'Primitives/IconButton',
  component: IconButton,
  args: { icon: X, label: 'Close', onClick: fn() },
  parameters: {
    docs: {
      description: {
        component: 'Icon-only control with a required accessible name and a 48 × 48 CSS px target (56 × 56 for the Log food action). The glyph stays 24 px in both sizes.',
      },
    },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Close' });
    const box = button.getBoundingClientRect();
    await expect(box.width).toBeGreaterThanOrEqual(48);
    await expect(box.height).toBeGreaterThanOrEqual(48);
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const SizesAndVariants: Story = {
  render: (args) => (
    <Inline gap={12} wrap>
      <IconButton {...args} icon={ArrowLeft} label="Back" />
      <IconButton {...args} icon={X} label="Close" variant="outlined" />
      <IconButton {...args} icon={Plus} label="Log food" size="large" variant="outlined" />
      <IconButton {...args} icon={X} label="Clear search" disabled />
      <IconButton {...args} icon={X} label="Working" loading />
    </Inline>
  ),
  play: async ({ canvasElement }) => {
    const large = within(canvasElement).getByRole('button', { name: 'Log food' });
    await expect(large.getBoundingClientRect().width).toBeGreaterThanOrEqual(56);
  },
};
