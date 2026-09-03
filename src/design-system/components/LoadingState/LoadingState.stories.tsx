import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { LoadingState } from './LoadingState';

const meta = {
  title: 'Components/LoadingState',
  component: LoadingState,
  args: { label: 'Searching foods' },
  parameters: {
    docs: {
      description: {
        component: 'Region-level pending state: an actual indicator with readable text and no fake content. Placeholder bars are never used as loading feedback. Offers Cancel when the request can be abandoned.',
      },
    },
  },
} satisfies Meta<typeof LoadingState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('Searching foods');
  },
};

export const Cancellable: Story = {
  args: { label: 'Analysing photo', children: 'Looking for foods in the image. This does not measure the amount.', onCancel: fn() },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Cancel' }));
    await expect(args.onCancel).toHaveBeenCalledTimes(1);
  },
};
