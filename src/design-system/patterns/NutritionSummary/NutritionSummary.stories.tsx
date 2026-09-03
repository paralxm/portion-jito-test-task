import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { NutritionSummary } from './NutritionSummary';

const meta = {
  title: 'Patterns/NutritionSummary',
  component: NutritionSummary,
  args: {
    energy: 450,
    protein: 24,
    carbohydrates: 48,
    fat: 18,
    basis: 'Per serving (300 g)',
    additional: {
      fibre: 8,
      vitamins: [
        { id: 'vitamin-c', name: 'Vitamin C', value: 12, unit: 'mg' },
        { id: 'vitamin-d', name: 'Vitamin D', value: null, unit: 'mg' },
      ],
      minerals: [
        { id: 'calcium', name: 'Calcium', value: 120, unit: 'mg' },
        { id: 'iron', name: 'Iron', value: 3, unit: 'mg' },
      ],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The single nutrition presentation used by the calculator result and recipe details: one main calorie value bound to its basis, three secondary macronutrients, and an optional expanded list behind one disclosure. Fibre is shown as “of which fibre” (already inside carbohydrates). Unknown values are named, never zero.',
      },
    },
  },
} satisfies Meta<typeof NutritionSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FixtureR: Story = {
  name: 'Fixture R — expandable',
  render: (args) => {
    const [expanded, setExpanded] = useState(false);
    return <NutritionSummary {...args} expanded={expanded} onToggleExpanded={setExpanded} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('450')).toBeInTheDocument();
    const toggle = canvas.getByRole('button', { name: 'Show all nutrition' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    await expect(canvas.getByRole('button', { name: 'Show less nutrition' })).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByText('of which fibre')).toBeVisible();
    await expect(canvas.getByText('Not available')).toBeInTheDocument();
  },
};

export const FixtureC: Story = {
  name: 'Fixture C at 300 g',
  args: { energy: 540, protein: 18, carbohydrates: 63, fat: 24, basis: 'For 300 g', additional: { fibre: 9.6 } },
};

export const PartialData: Story = {
  name: 'Partial data (unknown macros)',
  args: { energy: 17, protein: 1.4, carbohydrates: null, fat: null, basis: 'For 100 g', additional: undefined },
  play: async ({ canvasElement }) => {
    // Two unknown macros: each names itself visibly and for assistive technology.
    const visible = within(canvasElement)
      .getAllByText('Not available')
      .filter((el) => !el.classList.contains('portion-visually-hidden'));
    await expect(visible).toHaveLength(2);
    await expect(within(canvasElement).queryByRole('button')).toBeNull();
  },
};

export const Stale: Story = {
  name: 'Stale (invalid amount)',
  args: { status: 'stale', basis: '' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText('450')).toBeNull();
    await expect(canvas.getAllByText('Enter a valid amount to see the result').length).toBeGreaterThanOrEqual(1);
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};

export const KnownZero: Story = {
  name: 'Known zero (sparkling water)',
  args: { energy: 0, protein: 0, carbohydrates: 0, fat: 0, basis: 'For 330 ml', additional: undefined },
};
