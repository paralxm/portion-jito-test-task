import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Text } from '../Text/Text';
import { VisuallyHidden } from './VisuallyHidden';

const meta = {
  title: 'Primitives/VisuallyHidden',
  component: VisuallyHidden,
  args: { children: 'Protein not available' },
  parameters: {
    docs: {
      description: {
        component: 'Text for assistive technology that is not drawn on screen — accessible names and live-region wording the visual design carries by layout.',
      },
    },
  },
} satisfies Meta<typeof VisuallyHidden>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Text as="p" variant="metric-inline" numeric>
      <span aria-hidden="true">—</span>
      <VisuallyHidden>Protein not available</VisuallyHidden>
    </Text>
  ),
  play: async ({ canvasElement }) => {
    const hidden = within(canvasElement).getByText('Protein not available');
    const box = hidden.getBoundingClientRect();
    await expect(box.width).toBeLessThanOrEqual(1);
    await expect(box.height).toBeLessThanOrEqual(1);
  },
};
