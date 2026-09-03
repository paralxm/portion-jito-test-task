import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Inline } from '../layout/Inline';
import { Spinner } from './Spinner';

const meta = {
  title: 'Primitives/Spinner',
  component: Spinner,
  args: { label: 'Searching foods' },
  parameters: {
    docs: {
      description: {
        component:
          'Indeterminate progress with readable text. Under `prefers-reduced-motion` (or `data-portion-motion="reduced"` on an ancestor) the ring stops rotating but stays visible, so the information is never removed.',
      },
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const status = within(canvasElement).getByRole('status');
    await expect(status).toHaveTextContent('Searching foods');
  },
};

export const Sizes: Story = {
  render: () => (
    <Inline gap={16}>
      <Spinner size="small-action" label="Working" announce={false} />
      <Spinner size="default" label="Loading" announce={false} />
      <Spinner size="emphasis" label="Loading recipe" announce={false} />
    </Inline>
  ),
};

export const ReducedMotion: Story = {
  render: () => (
    <div data-portion-motion="reduced">
      <Spinner size="emphasis" label="Loading recipe" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector('svg');
    await expect(svg).not.toBeNull();
    const arc = svg?.querySelector('circle:last-of-type') as SVGElement | null;
    await expect(arc).not.toBeNull();
    if (arc) await expect(getComputedStyle(arc).animationDuration).toBe('0s');
  },
};
