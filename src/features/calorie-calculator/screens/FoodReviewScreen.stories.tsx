import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { expectNoHorizontalOverflow, withRootFontSize } from '../../../design-system/storybook/decorators';
import type { FoodCandidate } from '../domain/calculation';
import { barcodeCatalogue, fixtureC, foodCatalogue, photoSuggestions, samplePhotoImage } from '../domain/fixtures';
import { oatmealWithBerries } from '../domain/home-fixtures';
import { FoodReviewScreen } from './FoodReviewScreen';

const noEnergy: FoodCandidate = {
  id: 'no-energy',
  name: 'House salad dressing',
  detail: 'Restaurant · nutrition not published',
  source: 'search',
  reference: { quantity: 100, unitId: 'g' },
  nutrition: { energyKcal: null, proteinG: null, carbohydratesG: null, fatG: null },
  units: [{ id: 'g', label: 'g', toReference: 1 }],
};

const meta = {
  title: 'Product compositions/Food review (S07)',
  component: FoodReviewScreen,
  args: { candidate: fixtureC, mode: 'new', initialMeal: 'lunch', mealHint: 'Suggested for this time of day. Change it if you like.', onBack: fn(), onCancel: fn(), onChangeMatch: fn(), onRetake: fn(), onEditValues: fn(), onAdd: fn(), onUpdateEntry: fn(), onRemoveEntry: fn() },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'S07 — one review for every source (ledger §12 E1–E3, after R5): identity (image, name, brand and barcode when the record supplies them, basis, the source stated plainly, the correction actions that source supports) → the shared portion form (amount with − / + and presets from the item’s own units, the live result) → meal and target day → one final **Add to {meal}**, which is the commit; **Cancel** leaves the task and asks first when something changed. A barcode result offers Change product and Edit label values; a photo result shows the captured (sample) frame with Change match, Retake photo and Edit nutrition values. Opened from a Home row the screen is in existing-entry mode: Update entry commits portion and meal to the same entry, Remove entry asks first.',
      },
    },
  },
} satisfies Meta<typeof FoodReviewScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FromSearch: Story = {
  name: 'From search — fixture C, Add to lunch commits once',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('From search')).toBeVisible();
    await expect(canvas.getByText('180')).toBeInTheDocument();
    const amount = canvas.getByLabelText('Amount to calculate');
    await userEvent.clear(amount);
    await userEvent.type(amount, '300');
    await expect(canvas.getByText('540')).toBeInTheDocument();
    await expect(canvas.getByRole('radio', { name: 'Lunch' })).toBeChecked();
    await userEvent.click(canvas.getByRole('radio', { name: 'Dinner' }));
    const add = canvas.getByRole('button', { name: 'Add to dinner' });
    await expect(add).not.toHaveAttribute('aria-haspopup');
    await userEvent.click(add);
    await expect(args.onAdd).toHaveBeenCalledWith({ quantity: 300, unitId: 'g' }, 'dinner');
    await userEvent.click(add);
    await expect(args.onAdd).toHaveBeenCalledTimes(1);
  },
};

export const CancelPolicy: Story = {
  name: 'Cancel — untouched leaves at once; a changed draft asks',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await expect(args.onCancel).toHaveBeenCalledTimes(1);
    await expect(args.onAdd).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole('button', { name: 'Increase by 25 g' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    const dialog = canvas.getByRole('alertdialog', { name: 'Discard changes?' });
    await expect(within(dialog).getByRole('button', { name: 'Keep editing' })).toHaveFocus();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Keep editing' }));
    await expect(args.onCancel).toHaveBeenCalledTimes(1);
    await expect(canvas.getByLabelText('Amount to calculate')).toHaveValue('125');
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    await userEvent.click(within(await canvas.findByRole('alertdialog')).getByRole('button', { name: 'Discard changes' }));
    await expect(args.onBack).toHaveBeenCalledTimes(1);
  },
};

export const FromBarcode: Story = {
  name: 'S07-4 — from barcode: product image, code, Change product, Edit label values',
  args: { candidate: barcodeCatalogue['5012345678900'] },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Barcode match')).toBeVisible();
    await expect(canvas.getByText(/Barcode 5012345678900/)).toBeVisible();
    await expect(canvas.getByText(/Matched from barcode 5012345678900/)).toBeVisible();
    await expect(canvas.queryByText(/verified/i)).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Change product' }));
    await expect(args.onChangeMatch).toHaveBeenCalledTimes(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Edit label values' }));
    await expect(args.onEditValues).toHaveBeenCalledTimes(1);
    await expect(canvas.queryByRole('button', { name: 'Retake photo' })).toBeNull();
    // Presets come from the record's units: millilitres and its 250 ml serving.
    await expect(canvas.getByRole('button', { name: '1 serving (250 ml)' })).toBeVisible();
    await expect(canvas.queryByRole('button', { name: /bowl/ })).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Add to lunch' })).toBeEnabled();
  },
};

export const FromPhoto: Story = {
  name: 'S07-5 — from photo: the sample frame, Change match, Retake, Edit nutrition values',
  args: { candidate: photoSuggestions[0], capturedImageUrl: samplePhotoImage },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Photo suggestion')).toBeVisible();
    await expect(canvas.getByRole('img', { name: /Sample photograph/ })).toBeVisible();
    await expect(canvas.getByText('Sample photo')).toBeVisible();
    await expect(canvas.getByText(/the photo does not measure the amount/)).toBeVisible();
    await expect(canvas.queryByText(/Barcode/)).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Change match' }));
    await expect(args.onChangeMatch).toHaveBeenCalledTimes(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Retake photo' }));
    await expect(args.onRetake).toHaveBeenCalledTimes(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Edit nutrition values' }));
    await expect(args.onEditValues).toHaveBeenCalledTimes(1);
  },
};

export const InvalidAmount: Story = {
  name: 'S07-2 — invalid amount blocks the commit',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const amount = canvas.getByLabelText('Amount to calculate');
    await userEvent.clear(amount);
    await userEvent.tab();
    const add = canvas.getByRole('button', { name: 'Add to lunch' });
    await expect(add).toBeDisabled();
    await userEvent.click(add);
    await expect(args.onAdd).not.toHaveBeenCalled();
    await expect(amount).toHaveAccessibleDescription('Enter the amount you want to calculate');
    await expect(canvas.queryByText('180')).toBeNull();
  },
};

export const NoEnergy: Story = {
  name: 'Calories not available — cannot add',
  args: { candidate: noEnergy },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const add = canvas.getByRole('button', { name: 'Add to lunch' });
    await expect(add).toBeDisabled();
    await userEvent.click(add);
    await expect(args.onAdd).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole('button', { name: 'Choose a different food' }));
    await expect(args.onChangeMatch).toHaveBeenCalledTimes(1);
  },
};

export const PartialData: Story = {
  name: 'Partial data — unknown macros stay unknown',
  args: { candidate: foodCatalogue[5] },
  play: async ({ canvasElement }) => {
    const visible = within(canvasElement)
      .getAllByText('Not available')
      .filter((el) => !el.classList.contains('portion-visually-hidden'));
    await expect(visible).toHaveLength(2);
  },
};

export const PastDay: Story = {
  name: 'Target day — the commit lands on the day the task started from',
  args: { dayPhrase: 'on Thu, Sep 3' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/adds to your record on Thu, Sep 3/)).toBeVisible();
  },
};

export const ExistingEntry: Story = {
  name: 'Existing entry — Update entry keeps the same entry',
  args: { candidate: oatmealWithBerries, mode: 'existing', initialPortion: { quantity: 300, unitId: 'g' }, initialMeal: 'breakfast' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Edit entry' })).toBeInTheDocument();
    await expect(canvas.getByRole('radio', { name: 'Breakfast' })).toBeChecked();
    await userEvent.click(canvas.getByRole('radio', { name: 'Lunch' }));
    await expect(canvas.queryByRole('button', { name: 'Change food' })).toBeNull();
    await expect(canvas.getByLabelText('Amount to calculate')).toHaveValue('300');
    const amount = canvas.getByLabelText('Amount to calculate');
    await userEvent.clear(amount);
    await userEvent.type(amount, '150');
    await expect(canvas.getByText('275')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Update entry' }));
    await expect(args.onUpdateEntry).toHaveBeenCalledWith({ quantity: 150, unitId: 'g' }, 'lunch');
  },
};

export const RemoveEntry: Story = {
  name: 'Existing entry — Remove asks first',
  args: { candidate: oatmealWithBerries, mode: 'existing', initialPortion: { quantity: 300, unitId: 'g' }, initialMeal: 'breakfast' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Remove entry' }));
    const dialog = await canvas.findByRole('alertdialog', { name: 'Remove Oatmeal with mixed berries from this day?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Keep entry' }));
    await expect(args.onRemoveEntry).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole('button', { name: 'Remove entry' }));
    await userEvent.click(within(await canvas.findByRole('alertdialog')).getByRole('button', { name: 'Remove' }));
    await expect(args.onRemoveEntry).toHaveBeenCalledTimes(1);
  },
};

export const ExistingEntryDirtyBack: Story = {
  name: 'Existing entry — Back with a changed amount asks to keep or discard',
  args: { candidate: oatmealWithBerries, mode: 'existing', initialPortion: { quantity: 300, unitId: 'g' }, initialMeal: 'breakfast' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    await expect(args.onBack).toHaveBeenCalledTimes(1);
    const amount = canvas.getByLabelText('Amount to calculate');
    await userEvent.clear(amount);
    await userEvent.type(amount, '200');
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    const dialog = await canvas.findByRole('alertdialog', { name: 'Discard the changed amount?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Keep editing' }));
    await expect(args.onBack).toHaveBeenCalledTimes(1);
    await expect(amount).toHaveValue('200');
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    await userEvent.click(within(await canvas.findByRole('alertdialog')).getByRole('button', { name: 'Discard' }));
    await expect(args.onBack).toHaveBeenCalledTimes(2);
  },
};

export const UnassignedEntry: Story = {
  name: 'Existing entry without a meal — Update entry waits for a choice',
  args: { candidate: oatmealWithBerries, mode: 'existing', initialPortion: { quantity: 300, unitId: 'g' }, initialMeal: null },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/This entry has no meal yet/)).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Update entry' })).toBeDisabled();
    await userEvent.click(canvas.getByRole('radio', { name: 'Snacks' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Update entry' }));
    await expect(args.onUpdateEntry).toHaveBeenCalledWith({ quantity: 300, unitId: 'g' }, 'snack');
  },
};

export const LongName320: Story = {
  name: 'Long name at 320',
  args: { candidate: foodCatalogue[2] },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    await expectNoHorizontalOverflow();
    await expect(within(canvasElement).getByRole('heading', { level: 2 })).toHaveTextContent('Wholegrain pasta with roasted vegetables and tahini dressing');
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 200 %',
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Add to lunch' })).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};
