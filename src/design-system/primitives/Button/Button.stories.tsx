import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { PencilSimple } from '@phosphor-icons/react';

import { Stack } from '../layout/Stack';
import { Inline } from '../layout/Inline';
import { Button } from './Button';

const meta = {
  title: 'Primitives/Button',
  component: Button,
  args: { children: 'Confirm and calculate', onClick: fn() },
  parameters: {
    docs: {
      description: {
        component:
          'The single action primitive. Variants change treatment, not hierarchy. Labels use the action style (16/24) or compact-action (14/20), wrap instead of truncating, and the hit area never drops below 48 px. `loading` is for asynchronous requests only — synchronous arithmetic never shows it.',
      },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Confirm and calculate' });
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const Variants: Story = {
  render: (args) => (
    <Stack gap={16} align="start">
      <Inline gap={8} wrap>
        <Button {...args} variant="primary">
          Primary
        </Button>
        <Button {...args} variant="secondary">
          Secondary
        </Button>
        <Button {...args} variant="text">
          Text
        </Button>
        <Button {...args} variant="destructive">
          Discard
        </Button>
      </Inline>
      <Inline gap={8} wrap>
        <Button {...args} variant="secondary" size="compact">
          Reset all
        </Button>
        <Button {...args} variant="text" size="compact">
          Clear
        </Button>
        <Button {...args} variant="secondary" icon={PencilSimple}>
          Change food
        </Button>
      </Inline>
    </Stack>
  ),
};

export const Loading: Story = {
  args: { loading: true, children: 'Looking up product' },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: /Looking up product/ });
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button');
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const BlockAndWrapping: Story = {
  name: 'Block, long label at 320',
  args: { block: true, children: 'Replace the current calculation with this reviewed food' },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button');
    // The label wraps; the control grows in height rather than clipping the text.
    await expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
    await expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth);
  },
};
