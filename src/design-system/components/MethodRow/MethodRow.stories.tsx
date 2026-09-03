import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Barcode, Camera, MagnifyingGlass, PencilSimple } from '@phosphor-icons/react';

import { Stack } from '../../primitives/layout/Stack';
import { MethodRow } from './MethodRow';

const meta = {
  title: 'Components/MethodRow',
  component: MethodRow,
  args: { icon: MagnifyingGlass, title: 'Search food', description: 'Type a name and pick from the results', onClick: fn() },
  parameters: {
    docs: {
      description: {
        component: 'A full-row entry-method choice inside the Add food sheet. Selecting it starts identification only; it never commits food data. The whole row is the hit area.',
      },
    },
  },
} satisfies Meta<typeof MethodRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const row = within(canvasElement).getByRole('button', { name: /Search food/ });
    await expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
    await userEvent.click(row);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const AllMethods: Story = {
  render: () => (
    <Stack gap={8}>
      <MethodRow icon={MagnifyingGlass} title="Search food" description="Type a name and pick from the results" />
      <MethodRow icon={Barcode} title="Scan barcode" description="Point the camera at a product code" />
      <MethodRow icon={Camera} title="Take a photo" description="Get a suggestion you can correct" />
      <MethodRow icon={PencilSimple} title="Enter manually" description="Type the nutrition you already know" />
    </Stack>
  ),
};
