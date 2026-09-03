import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { expectNoHorizontalOverflow, withRootFontSize } from '../../../design-system/storybook/decorators';
import { RecipeFiltersSheet } from './RecipeFiltersSheet';

const meta = {
  title: 'Product compositions/Recipe filters (O02)',
  component: RecipeFiltersSheet,
  args: { open: true, applied: {}, onApply: fn(), onCancel: fn() },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'O02 — filters as a modal draft: dietary preference, calories-per-serving minimum and maximum, protein minimum and preparation maximum. Blank means unrestricted; the minimum cannot exceed the maximum. Reset all clears the draft only; Apply validates and commits; Cancel discards unapplied edits.',
      },
    },
  },
} satisfies Meta<typeof RecipeFiltersSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radio', { name: 'No preference' })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(canvas.getByRole('button', { name: 'Apply filters' }));
    await expect(args.onApply).toHaveBeenCalledWith({ caloriesMin: null, caloriesMax: null, proteinMin: null, preparationMax: null, dietary: null });
  },
};

export const InvalidRange: Story = {
  name: 'Minimum above maximum is refused',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText(/^Minimum/), '600');
    await userEvent.type(canvas.getByLabelText(/^Maximum/), '500');
    await userEvent.click(canvas.getByRole('button', { name: 'Apply filters' }));
    await expect(args.onApply).not.toHaveBeenCalled();
    await expect(canvas.getByLabelText(/^Maximum/)).toHaveAccessibleDescription('The maximum must be at least the minimum');
  },
};

export const ResetThenApply: Story = {
  name: 'Reset all clears the draft; Apply commits it',
  args: { applied: { caloriesMax: 500, dietary: 'vegan' } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText(/^Maximum/)).toHaveValue('500');
    await userEvent.click(canvas.getByRole('button', { name: 'Reset all' }));
    await expect(canvas.getByLabelText(/^Maximum/)).toHaveValue('');
    await expect(args.onApply).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole('button', { name: 'Apply filters' }));
    await expect(args.onApply).toHaveBeenCalledWith({ caloriesMin: null, caloriesMax: null, proteinMin: null, preparationMax: null, dietary: null });
  },
};

export const CancelDiscardsDraft: Story = {
  name: 'Cancel discards unapplied edits',
  args: { applied: { proteinMin: 20 } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText(/^Maximum/), '400');
    await userEvent.keyboard('{Escape}');
    await expect(args.onCancel).toHaveBeenCalledTimes(1);
    await expect(args.onApply).not.toHaveBeenCalled();
  },
};

export const Narrow320: Story = {
  name: 'Narrow — 320',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('dialog', { name: 'Filters' })).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 320 at 200 %',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Apply filters' })).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};
