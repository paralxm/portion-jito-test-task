import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Inline } from '../layout/Inline';
import { Badge } from './Badge';

const meta = {
  title: 'Primitives/Badge',
  component: Badge,
  args: { children: 'Vegan' },
  parameters: {
    docs: {
      description: {
        component: 'Static, non-interactive marker. `label` is a short descriptor such as a dietary tag; `count` is a tabular number. It must never look tappable.',
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Label: Story = {};

export const Kinds: Story = {
  render: () => (
    <Inline gap={8} wrap>
      <Badge kind="label">Vegan</Badge>
      <Badge kind="label">Gluten-free</Badge>
      <Badge kind="count">3</Badge>
      <Badge kind="count">12</Badge>
    </Inline>
  ),
  play: async ({ canvasElement }) => {
    const count = within(canvasElement).getByText('12');
    await expect(getComputedStyle(count).fontVariantNumeric).toContain('tabular-nums');
    await expect(count.tagName).toBe('SPAN');
  },
};
