import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { expectNoHorizontalOverflow, withRootFontSize } from '../../../design-system/storybook/decorators';
import { oatmealPhoto } from '../../../assets/images';
import type { FoodCandidate } from '../domain/calculation';
import { ManualPortionScreen } from './ManualPortionScreen';

const lentilSoup: FoodCandidate = {
  id: 'manual-story',
  name: 'Lentil soup',
  detail: 'Entered manually',
  source: 'manual',
  reference: { quantity: 100, unitId: 'g' },
  nutrition: { energyKcal: 130, proteinG: 5.2, carbohydratesG: 18, fatG: 3.1 },
  units: [{ id: 'g', label: 'g', toReference: 1 }],
};

const meta = {
  title: 'Product compositions/Manual entry (S06)/Step 2 — Portion and meal',
  component: ManualPortionScreen,
  args: { candidate: lentilSoup, initialPortion: { quantity: 100, unitId: 'g' }, initialMeal: 'lunch', mealHint: 'Suggested for this time of day. Change it if you like.', onDraftChange: fn(), onEditDetails: fn(), onAdd: fn(), onCancel: fn() },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'S06-5 — Step 2 of 2 (ledger §12 D2, after R4): the identity summary with Edit food details, the amount to calculate as a direct input with − / + steps (25 g or ml, ¼ serving) and presets only from what the item defines, the live result for that amount, the meal choice, the target day when it is not today, and one final Add to {meal}. Back and Edit keep the draft without a confirmation; Cancel applies the shared exit policy (the task holds data, so it always asks).',
      },
    },
  },
} satisfies Meta<typeof ManualPortionScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'S06-5 — 100 g lunch, steps, presets, one final action',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Step 2 of 2')).toBeVisible();
    await expect(canvas.getByText('130')).toBeVisible();
    await expect(canvas.getByRole('radio', { name: 'Lunch' })).toBeChecked();
    await userEvent.click(canvas.getByRole('button', { name: 'Increase by 25 g' }));
    await expect(canvas.getByLabelText('Amount to calculate')).toHaveValue('125');
    await userEvent.click(canvas.getByRole('button', { name: '200 g' }));
    await expect(canvas.getByLabelText('Amount to calculate')).toHaveValue('200');
    await expect(canvas.getByText('260')).toBeVisible();
    // No invented serving: the item defines grams only.
    await expect(canvas.queryByRole('button', { name: /bowl|serving/ })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Add to lunch' }));
    await expect(args.onAdd).toHaveBeenCalledWith({ quantity: 200, unitId: 'g' }, 'lunch');
    await expect(args.onAdd).toHaveBeenCalledTimes(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Add to lunch' }));
    await expect(args.onAdd).toHaveBeenCalledTimes(1);
  },
};

export const EditKeepsTheDraft: Story = {
  name: 'Edit food details and Back return without a confirmation',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Edit food details' }));
    await expect(args.onEditDetails).toHaveBeenCalledTimes(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    await expect(args.onEditDetails).toHaveBeenCalledTimes(2);
    await expect(canvas.queryByRole('alertdialog')).toBeNull();
  },
};

export const CancelAsks: Story = {
  name: 'O08 — Cancel opens Discard changes?; Keep editing keeps the portion',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const amount = canvas.getByLabelText('Amount to calculate');
    await userEvent.clear(amount);
    await userEvent.type(amount, '250');
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    const dialog = canvas.getByRole('alertdialog', { name: 'Discard changes?' });
    await expect(within(dialog).getByRole('button', { name: 'Keep editing' })).toHaveFocus();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Keep editing' }));
    await expect(args.onCancel).not.toHaveBeenCalled();
    await expect(amount).toHaveValue('250');
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Discard changes' }));
    await expect(args.onCancel).toHaveBeenCalledTimes(1);
  },
};

export const WithPhotoAndPastDay: Story = {
  name: 'With the user photo, a serving basis and a past target day',
  args: {
    candidate: { ...lentilSoup, reference: { quantity: 1, unitId: 'serving' }, nutrition: { energyKcal: 450, proteinG: 24, carbohydratesG: null, fatG: 18 }, units: [{ id: 'serving', label: 'serving', toReference: 1 }] },
    photoUrl: oatmealPhoto,
    initialPortion: { quantity: 1, unitId: 'serving' },
    initialMeal: 'dinner',
    mealHint: undefined,
    dayPhrase: 'on Thu, Sep 3',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/adds to your record on Thu, Sep 3/)).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Increase by a quarter serving' }));
    await expect(canvas.getByLabelText('Amount to calculate')).toHaveValue('1.25');
    await expect(canvas.getByRole('button', { name: '2 servings' })).toBeVisible();
    await expect(canvas.getAllByText('Not available').length).toBeGreaterThanOrEqual(1);
  },
};

export const InvalidAmount: Story = {
  name: 'Invalid amount — stale result, commit unavailable',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const amount = canvas.getByLabelText('Amount to calculate');
    await userEvent.clear(amount);
    await userEvent.tab();
    await expect(amount).toHaveAccessibleDescription('Enter the amount you want to calculate');
    await expect(canvas.getByRole('button', { name: 'Add to lunch' })).toBeDisabled();
    await expect(canvas.queryByText('130')).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Add to lunch' }));
    await expect(args.onAdd).not.toHaveBeenCalled();
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
  name: '390 at 200 % text',
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Add to lunch' })).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};
