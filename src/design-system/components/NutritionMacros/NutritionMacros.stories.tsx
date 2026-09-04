import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Stack } from '../../primitives/layout/Stack';
import { expectNoHorizontalOverflow, withRootFontSize } from '../../storybook/decorators';
import { NutritionMacros } from './NutritionMacros';

const meta = {
  title: 'Components/NutritionMacros',
  component: NutritionMacros,
  args: { protein: { value: 24 }, carbohydrates: { value: 48 }, fat: { value: 18 }, size: 'secondary' },
  parameters: {
    docs: {
      description: {
        component:
          'The three macronutrients in their fixed order, each with its labelled category marker. `secondary` (20/28 values, full names) is the row under a main calorie result in NutritionSummary; `compact` (16/24 values, short names Protein / Carbs / Fat) is the daily-overview row on Home, subordinate to the ring. Each value handles missing data independently: unknown is "Not available", a known subtotal says "Partial total", and neither is ever zero. Demonstration values only.',
      },
    },
  },
} satisfies Meta<typeof NutritionMacros>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Secondary: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('listitem')).toHaveLength(3);
    await expect(parseFloat(getComputedStyle(canvas.getByText('24')).fontSize)).toBe(20);
    await expect(canvas.getByText('Carbohydrates')).toBeInTheDocument();
  },
};

export const Compact: Story = {
  name: 'Compact (Home daily overview)',
  args: { size: 'compact', protein: { value: 90 }, carbohydrates: { value: 135 }, fat: { value: 50 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Carbs')).toBeInTheDocument();
    await expect(parseFloat(getComputedStyle(canvas.getByText('135')).fontSize)).toBe(16);
  },
};

export const PartialAndUnknown: Story = {
  name: 'Partial subtotal and unknown value',
  args: { size: 'compact', protein: { value: 90, partial: true }, carbohydrates: { value: null }, fat: { value: 50 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Partial total')).toBeVisible();
    const visible = canvas.getAllByText('Not available').filter((el) => !el.classList.contains('portion-visually-hidden'));
    await expect(visible).toHaveLength(1);
  },
};

export const KnownZero: Story = {
  name: 'Known zero is a value',
  args: { size: 'compact', protein: { value: 0 }, carbohydrates: { value: 0 }, fat: { value: 0 } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByText('0')).toHaveLength(3);
    await expect(within(canvasElement).queryByText('Not available')).toBeNull();
  },
};

export const Narrow320: Story = {
  name: 'Both sizes at 320',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  render: (args) => (
    <Stack gap={24}>
      <NutritionMacros {...args} size="secondary" />
      <NutritionMacros {...args} size="compact" />
    </Stack>
  ),
  play: async () => {
    await expectNoHorizontalOverflow();
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 320 at 200 %',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  render: (args) => (
    <Stack gap={24}>
      <NutritionMacros {...args} size="secondary" />
      <NutritionMacros {...args} size="compact" />
    </Stack>
  ),
  play: async () => {
    await expectNoHorizontalOverflow();
  },
};
