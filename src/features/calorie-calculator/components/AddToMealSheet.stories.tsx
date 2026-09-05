import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { withIPhone16PortraitSafeAreas, withRootFontSize, expectNoHorizontalOverflow } from '../../../design-system/storybook/decorators';
import { fixtureR } from '../../recipe-discovery/domain/fixtures';
import { recipeToCandidate } from '../../recipe-discovery/domain/recipe-entry';
import { fixtureC, foodCatalogue } from '../domain/fixtures';
import { AddToMealSheet } from './AddToMealSheet';

const meta = {
  title: 'Product compositions/Add to meal (O05)',
  component: AddToMealSheet,
  args: {
    open: true,
    candidate: fixtureC,
    initialPortion: { quantity: 300, unitId: 'g' },
    initialMeal: 'lunch',
    mealHint: 'Suggested for this time of day. Change it if you like.',
    onConfirm: fn(),
    onCancel: fn(),
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'O05 — one Add-to-meal sheet for foods and recipes (ledger D-23): thumbnail when the item has one, name and basis, the `MealPicker`, the amount or servings in the review’s unit, a recalculated calorie and macro preview, and the single final action *Add to {meal}*. Unavailable while the amount is invalid or no meal is chosen; a second activation before the sheet closes is ignored; Cancel, close and Escape change nothing. No exact time is asked.',
      },
    },
  },
} satisfies Meta<typeof AddToMealSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FromFood: Story = {
  name: 'From food review — fixture C at 300 g, lunch suggested',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const dialog = canvas.getByRole('dialog', { name: 'Add to meal' });
    await expect(within(dialog).getByRole('radio', { name: 'Lunch' })).toHaveAttribute('aria-checked', 'true');
    await expect(within(dialog).getByText('540')).toBeVisible();
    const add = within(dialog).getByRole('button', { name: 'Add to lunch' });
    await userEvent.click(add);
    await userEvent.click(add);
    await expect(args.onConfirm).toHaveBeenCalledTimes(1);
    await expect(args.onConfirm).toHaveBeenCalledWith('lunch', { quantity: 300, unitId: 'g' });
  },
};

export const FromRecipe: Story = {
  name: 'From a recipe — servings, thumbnail, preview recalculates',
  args: { candidate: recipeToCandidate(fixtureR), initialPortion: { quantity: 1, unitId: 'serving' }, initialMeal: 'dinner' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const dialog = canvas.getByRole('dialog', { name: 'Add to meal' });
    await expect(within(dialog).getByText(/1 serving = 300 g/)).toBeVisible();
    const servings = within(dialog).getByLabelText('Servings');
    await userEvent.clear(servings);
    await userEvent.type(servings, '1.5');
    await expect(within(dialog).getByText('675')).toBeVisible();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add to dinner' }));
    await expect(args.onConfirm).toHaveBeenCalledWith('dinner', { quantity: 1.5, unitId: 'serving' });
  },
};

export const ChangeMeal: Story = {
  name: 'Changing the meal updates the final action',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('radio', { name: 'Snacks' }));
    await expect(canvas.getByRole('button', { name: 'Add to snacks' })).toBeEnabled();
  },
};

export const NoMealChosen: Story = {
  name: 'No meal preselected — the commit waits for a choice',
  args: { initialMeal: null, mealHint: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Add to meal' })).toBeDisabled();
    await userEvent.click(canvas.getByRole('radio', { name: 'Breakfast' }));
    await expect(canvas.getByRole('button', { name: 'Add to breakfast' })).toBeEnabled();
  },
};

export const InvalidAmount: Story = {
  name: 'Invalid amount disables the commit and keeps guidance beside the field',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const amount = canvas.getByLabelText('Amount');
    await userEvent.clear(amount);
    await userEvent.type(amount, '0');
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Add to lunch' })).toBeDisabled();
    await expect(amount).toHaveAccessibleDescription('Enter an amount greater than zero');
    await expect(args.onConfirm).not.toHaveBeenCalled();
  },
};

export const PartialNutrition: Story = {
  name: 'Partial nutrition — unknown macros stay unknown in the preview',
  args: { candidate: foodCatalogue[5], initialPortion: { quantity: 100, unitId: 'g' } },
  play: async ({ canvasElement }) => {
    const visible = within(canvasElement)
      .getAllByText('Not available')
      .filter((el) => !el.classList.contains('portion-visually-hidden'));
    await expect(visible).toHaveLength(2);
  },
};

export const CancelAndEscape: Story = {
  name: 'Cancel and Escape change nothing',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await userEvent.keyboard('{Escape}');
    await expect(args.onCancel).toHaveBeenCalledTimes(2);
    await expect(args.onConfirm).not.toHaveBeenCalled();
  },
};

export const KeyboardFocus: Story = {
  name: 'Keyboard — focus stays inside the sheet',
  play: async ({ canvasElement }) => {
    const dialog = within(canvasElement).getByRole('dialog', { name: 'Add to meal' });
    // Tab through every control the dialog offers; the native modal keeps the page inert
    // and focus never lands on anything behind the sheet.
    const focusable = dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), [tabindex="0"]').length;
    for (let i = 0; i < focusable - 1; i += 1) {
      await userEvent.tab();
      await expect(dialog.contains(document.activeElement)).toBe(true);
    }
  },
};

export const Narrow320: Story = {
  name: 'Narrow — 320',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async () => {
    await expectNoHorizontalOverflow();
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 320 at 200 %',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Add to lunch' })).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};

export const SafeArea: Story = {
  name: 'iPhone 16 fixture — the footer owns the bottom inset',
  globals: { viewport: { value: 'iPhone16Portrait', isRotated: false } },
  decorators: [withIPhone16PortraitSafeAreas],
  play: async ({ canvasElement }) => {
    const footer = within(canvasElement).getByRole('button', { name: 'Add to lunch' }).closest('footer') as HTMLElement;
    await expect(parseFloat(getComputedStyle(footer).paddingBlockEnd)).toBeGreaterThanOrEqual(34);
  },
};

export const ReducedMotion: Story = {
  name: 'Reduced motion — the sheet appears without the rise animation',
  decorators: [
    (Story) => (
      <div data-portion-motion="reduced">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const sheet = within(canvasElement).getByRole('dialog').firstElementChild as HTMLElement;
    await expect(getComputedStyle(sheet).animationDuration).toBe('0s');
  },
};
