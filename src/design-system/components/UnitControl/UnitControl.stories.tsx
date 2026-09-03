import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Inline } from '../../primitives/layout/Inline';
import { UnitControl } from './UnitControl';

const meta = {
  title: 'Components/UnitControl',
  component: UnitControl,
  args: { unit: 'g', onClick: fn() },
  parameters: {
    docs: {
      description: {
        component: 'The clickable unit selector inside AmountField. It announces what it changes and the current unit, opens the unit chooser sheet, and is visually distinct from a read-only unit suffix.',
      },
    },
  },
} satisfies Meta<typeof UnitControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const control = within(canvasElement).getByRole('button', { name: 'Change unit, currently g' });
    await userEvent.click(control);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const Units: Story = {
  render: (args) => (
    <Inline gap={12} wrap>
      <UnitControl {...args} unit="g" />
      <UnitControl {...args} unit="ml" />
      <UnitControl {...args} unit="serving" />
      <UnitControl {...args} unit="g" disabled />
    </Inline>
  ),
};
