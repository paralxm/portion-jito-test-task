import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Stack } from '../layout/Stack';
import { Text } from '../Text/Text';
import { Separator } from './Separator';

const meta = {
  title: 'Primitives/Separator',
  component: Separator,
  parameters: {
    docs: {
      description: {
        component: 'Decorative separators (default) are hidden from assistive technology; a semantic separator marks a real boundary and is exposed with the separator role.',
      },
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Decorative: Story = {
  render: () => (
    <Stack gap={12}>
      <Text as="p">Ingredients</Text>
      <Separator />
      <Text as="p">Method</Text>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('separator')).toBeNull();
  },
};

export const Semantic: Story = {
  render: () => (
    <Stack gap={12}>
      <Text as="p">Food results</Text>
      <Separator decorative={false} />
      <Text as="p">Recipes</Text>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('separator')).toBeInTheDocument();
  },
};
