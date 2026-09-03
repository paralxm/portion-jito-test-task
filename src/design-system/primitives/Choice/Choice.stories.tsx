import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { Stack } from '../layout/Stack';
import { Checkbox } from './Checkbox';
import { Radio } from './Radio';

const meta = {
  title: 'Primitives/Choice',
  component: Checkbox,
  args: { label: 'Option' },
  parameters: {
    docs: {
      description: {
        component:
          'Native checkbox and radio inputs with a drawn control. The whole row is the hit area, the label never changes size or weight on selection, and state is exposed through the native input.',
      },
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CheckboxStory: Story = {
  name: 'Checkbox',
  render: () => {
    const [checked, setChecked] = useState(false);
    return <Checkbox id="simulate-failure" label="Simulate an analysis failure" description="Prototype control — the request will fail on purpose" checked={checked} onChange={(e) => setChecked(e.target.checked)} />;
  },
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole('checkbox', { name: /Simulate an analysis failure/ });
    await expect(box).not.toBeChecked();
    await userEvent.click(within(canvasElement).getByText('Simulate an analysis failure'));
    await expect(box).toBeChecked();
  },
};

export const RadioGroup: Story = {
  name: 'Radio group',
  render: () => {
    const [unit, setUnit] = useState('g');
    return (
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend>Unit</legend>
        <Stack gap={0}>
          <Radio id="unit-g" name="unit" value="g" label="g" checked={unit === 'g'} onChange={() => setUnit('g')} />
          <Radio id="unit-serving" name="unit" value="serving" label="serving" description="1 serving = 300 g" checked={unit === 'serving'} onChange={() => setUnit('serving')} />
          <Radio id="unit-ml" name="unit" value="ml" label="ml" disabled />
        </Stack>
      </fieldset>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('radio', { name: /serving/ }));
    await expect(canvas.getByRole('radio', { name: /serving/ })).toBeChecked();
    await expect(canvas.getByRole('radio', { name: 'g' })).not.toBeChecked();
    await expect(canvas.getByRole('radio', { name: 'ml' })).toBeDisabled();
  },
};
