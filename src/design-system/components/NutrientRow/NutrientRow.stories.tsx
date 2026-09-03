import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { NutrientRow } from './NutrientRow';

const meta = {
  title: 'Components/NutrientRow',
  component: NutrientRow,
  args: { name: 'Protein', value: 24, unit: 'g', category: 'protein' },
  parameters: {
    docs: {
      description: {
        component:
          'A static nutrition row for the expanded list. Values are right-aligned by layout, keep their unit and precision (small mg/µg values do not become zero), and unknown values are named. Rows are never interactive.',
      },
    },
  },
} satisfies Meta<typeof NutrientRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div role="list">
      <NutrientRow {...args} />
    </div>
  ),
};

export const ExpandedList: Story = {
  render: () => (
    <div role="list" aria-label="Additional nutrition">
      <NutrientRow name="of which fibre" value={8} unit="g" category="fibre" nested />
      <NutrientRow name="Vitamins" value={null} unit="mg" category="vitamins" heading />
      <NutrientRow name="Vitamin C" value={12} unit="mg" nested />
      <NutrientRow name="Vitamin D" value={null} unit="mg" nested />
      <NutrientRow name="Vitamin B12" value={0.0024} unit="mg" nested />
      <NutrientRow name="Minerals" value={null} unit="mg" category="minerals" heading />
      <NutrientRow name="Calcium" value={120} unit="mg" nested />
      <NutrientRow name="Iron" value={3} unit="mg" nested />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Not available')).toBeInTheDocument();
    // A small known value keeps enough precision to remain visible (0.0024 → 0.002, never 0).
    await expect(canvas.getByText(/0\.002 mg/)).toBeInTheDocument();
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};
