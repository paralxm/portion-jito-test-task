import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Inline } from '../../primitives/layout/Inline';
import { Stack } from '../../primitives/layout/Stack';
import { NutritionValue } from './NutritionValue';

const meta = {
  title: 'Components/NutritionValue',
  component: NutritionValue,
  args: { value: 540, unit: 'kcal', size: 'main', label: 'Calories', basis: 'For 300 g' },
  parameters: {
    docs: {
      description: {
        component:
          'A value with its unit, category and basis kept together. `main` is the single 40/48 calorie result, `secondary` the 24/32 macro metric, `inline` the 16/24 row value. Numbers stay neutral; category markers carry labelled colour. Unknown is named, never zero; `stale` means the draft amount is invalid and no result belongs to it.',
      },
    },
  },
} satisfies Meta<typeof NutritionValue>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MainResult: Story = {
  play: async ({ canvasElement }) => {
    const number = within(canvasElement).getByText('540');
    await expect(getComputedStyle(number).fontVariantNumeric).toContain('tabular-nums');
    await expect(parseFloat(getComputedStyle(number).fontSize)).toBe(40);
  },
};

export const Sizes: Story = {
  render: () => (
    <Stack gap={24}>
      <NutritionValue size="main" value={450} unit="kcal" label="Calories" basis="Per serving (300 g)" />
      <Inline gap={24} align="start" wrap>
        <NutritionValue size="secondary" value={24} unit="g" label="Protein" category="protein" />
        <NutritionValue size="secondary" value={48} unit="g" label="Carbohydrates" category="carbohydrates" />
        <NutritionValue size="secondary" value={18} unit="g" label="Fat" category="fat" />
      </Inline>
      <NutritionValue size="inline" value={152.4} unit="kcal" />
    </Stack>
  ),
};

export const UnavailableAndStale: Story = {
  name: 'Unavailable and stale',
  render: () => (
    <Stack gap={24}>
      <NutritionValue size="secondary" value={null} unit="g" label="Carbohydrates" category="carbohydrates" status="unavailable" />
      <NutritionValue size="main" value={540} unit="kcal" label="Calories" basis="" status="stale" />
      <NutritionValue size="secondary" value={0} unit="g" label="Fat" category="fat" />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText('Not available').length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getByText('Enter a valid amount to see the result')).toBeInTheDocument();
    await expect(canvas.queryByText('540')).toBeNull();
    // A known zero is a legitimate value and is shown as 0, not as "Not available".
    await expect(canvas.getByText('0')).toBeInTheDocument();
  },
};

export const GrowsWithDigits: Story = {
  name: 'Grows with digits (162000 kcal)',
  args: { value: 162000, basis: 'For 300 servings (90000 g)' },
};
