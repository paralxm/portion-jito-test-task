import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { Stack } from '../../primitives/layout/Stack';
import { TextField } from './TextField';

const meta = {
  title: 'Components/TextField',
  component: TextField,
  args: { label: 'Food or dish name', placeholder: 'For example, Lentil soup' },
  parameters: {
    docs: {
      description: {
        component: 'A labelled text input: FormField wiring (persistent label, optional marker, helper, error) plus the Input primitive. Used for names and other free-text entry; AmountField is the numeric counterpart.',
      },
    },
  },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox', { name: 'Food or dish name' });
    await userEvent.type(input, 'Lentil soup');
    await expect(input).toHaveValue('Lentil soup');
  },
};

export const States: Story = {
  render: (args) => (
    <Stack gap={16}>
      <TextField {...args} />
      <TextField {...args} label="Brand" optional helper="Shown with the result so you can tell similar foods apart." />
      <TextField {...args} error="Enter a name for the food or dish" />
      <TextField {...args} label="Source" defaultValue="Scanned product" disabled />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const invalid = canvas.getAllByRole('textbox', { name: 'Food or dish name' })[1];
    await expect(invalid).toHaveAttribute('aria-invalid', 'true');
    await expect(invalid).toHaveAccessibleDescription('Enter a name for the food or dish');
  },
};
