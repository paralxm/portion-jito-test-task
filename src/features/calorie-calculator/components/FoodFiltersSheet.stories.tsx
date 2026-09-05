import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { withRootFontSize } from '../../../design-system/storybook/decorators';
import { NO_FOOD_FILTERS } from '../domain/food-search';
import { FoodFiltersSheet } from './FoodFiltersSheet';

const meta = {
  title: 'Product compositions/Search (S02)/FoodFiltersSheet',
  component: FoodFiltersSheet,
  args: { open: true, applied: NO_FOOD_FILTERS, onApply: fn(), onCancel: fn() },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'O07 — the Food tab’s filters in the shared filter-sheet pattern: one radio group, All / Foods / Drinks, based on each item’s own record rather than its photo. Clear all resets the draft (it takes effect on Apply); Apply filters commits; closing, the backdrop or Escape keeps the previously applied filter.',
      },
    },
  },
} satisfies Meta<typeof FoodFiltersSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Nothing applied — All is checked',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('dialog', { name: 'Filters' })).toBeVisible();
    await expect(canvas.getByRole('radio', { name: 'All' })).toHaveAttribute('aria-checked', 'true');
  },
};

export const ApplyDrinks: Story = {
  name: 'Choosing Drinks and applying commits it',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('radio', { name: 'Drinks' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Apply filters' }));
    await expect(args.onApply).toHaveBeenCalledWith({ category: 'drink' });
  },
};

export const CancelKeepsApplied: Story = {
  name: 'Closing without Apply keeps the applied filter',
  args: { applied: { category: 'drink' } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radio', { name: 'Drinks' })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(canvas.getByRole('radio', { name: 'Foods' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Close' }));
    await expect(args.onCancel).toHaveBeenCalledTimes(1);
    await expect(args.onApply).not.toHaveBeenCalled();
  },
};

export const ClearAll: Story = {
  name: 'Clear all resets the draft; Apply commits All',
  args: { applied: { category: 'food' } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Clear all' }));
    await expect(canvas.getByRole('radio', { name: 'All' })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(canvas.getByRole('button', { name: 'Apply filters' }));
    await expect(args.onApply).toHaveBeenCalledWith({ category: 'all' });
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 200 %',
  decorators: [withRootFontSize(200)],
};
