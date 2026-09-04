import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { expectNoHorizontalOverflow, withRootFontSize } from '../../../design-system/storybook/decorators';
import type { FoodCandidate } from '../domain/calculation';
import { barcodeCatalogue, fixtureC, foodCatalogue, photoSuggestions } from '../domain/fixtures';
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

const manual: FoodCandidate = {
  id: 'manual-1',
  name: 'Lentil soup',
  detail: 'Entered manually',
  source: 'manual',
  reference: { quantity: 1, unitId: 'serving' },
  nutrition: { energyKcal: 450, proteinG: 24, carbohydratesG: null, fatG: 18 },
  units: [{ id: 'serving', label: 'serving', toReference: 1 }],
};

const meta = {
  title: 'Product compositions/Food review (S07)',
  component: FoodReviewScreen,
  args: { candidate: fixtureC, mode: 'new', onBack: fn(), onChangeMatch: fn(), onAddToToday: fn(), onDone: fn(), onUpdateEntry: fn(), onRemoveEntry: fn() },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'S07 — one review screen for every entry method; only the source explanation differs. The amount to calculate is separate from the nutrition basis and the result previews as you type — reading it completes the calorie task. **Add to today** is the one optional, explicit commit (enabled only for a calculable result, never fired twice for one submission); **Done** closes the task without logging. Opened from a Home row the screen is in existing-entry mode: the draft starts from the logged portion, **Update entry** commits to the same entry, **Remove entry** asks first, and Back with a changed amount offers Keep editing / Discard.',
      },
    },
  },
} satisfies Meta<typeof FoodReviewScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FromSearch: Story = {
  name: 'From search — fixture C, Add to today',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('180')).toBeInTheDocument();
    const amount = canvas.getByLabelText('Amount to calculate');
    await userEvent.clear(amount);
    await userEvent.type(amount, '300');
    await expect(canvas.getByText('540')).toBeInTheDocument();
    const add = canvas.getByRole('button', { name: 'Add to today' });
    await userEvent.click(add);
    await userEvent.click(add);
    // One submission creates one entry, even when tapped twice.
    await expect(args.onAddToToday).toHaveBeenCalledTimes(1);
    await expect(args.onAddToToday).toHaveBeenCalledWith({ quantity: 300, unitId: 'g' });
  },
};

export const DoneWithoutLogging: Story = {
  name: 'Done closes the task without logging',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Done' }));
    await expect(args.onDone).toHaveBeenCalledTimes(1);
    await expect(args.onAddToToday).not.toHaveBeenCalled();
  },
};

export const FromBarcode: Story = {
  name: 'From barcode — a match to check',
  args: { candidate: barcodeCatalogue['5012345678900'] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Matched from the barcode/)).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Add to today' })).toBeEnabled();
    await expect(canvas.queryByRole('alertdialog')).toBeNull();
  },
};

export const FromPhoto: Story = {
  name: 'From photo — a suggestion to check',
  args: { candidate: photoSuggestions[0] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/the photo does not measure it/)).toBeInTheDocument();
  },
};

export const FromManual: Story = {
  name: 'From manual entry — serving basis, unknown carbohydrates',
  args: { candidate: manual },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Nutrition basis: per 1 serving')).toBeInTheDocument();
    await expect(canvas.getAllByText('Not available').length).toBeGreaterThanOrEqual(1);
    // Only one supported unit: no unit selector is offered.
    await expect(canvas.queryByRole('button', { name: /Change unit/ })).toBeNull();
  },
};

export const InvalidAmount: Story = {
  name: 'Invalid amount blocks Add to today',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const amount = canvas.getByLabelText('Amount to calculate');
    await userEvent.clear(amount);
    await userEvent.click(canvas.getByRole('button', { name: 'Add to today' }));
    await expect(args.onAddToToday).not.toHaveBeenCalled();
    await expect(amount).toHaveAccessibleDescription('Enter the amount you want to calculate');
  },
};

export const NoEnergy: Story = {
  name: 'Calories not available — cannot add',
  args: { candidate: noEnergy },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const add = canvas.getByRole('button', { name: 'Add to today' });
    await expect(add).toBeDisabled();
    await userEvent.click(add);
    await expect(args.onAddToToday).not.toHaveBeenCalled();
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

export const ExistingEntry: Story = {
  name: 'Existing entry — Update entry keeps the same entry',
  args: { candidate: oatmealWithBerries, mode: 'existing', initialPortion: { quantity: 300, unitId: 'g' } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Edit entry' })).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Change food' })).toBeNull();
    await expect(canvas.getByLabelText('Amount to calculate')).toHaveValue('300');
    const amount = canvas.getByLabelText('Amount to calculate');
    await userEvent.clear(amount);
    await userEvent.type(amount, '150');
    await expect(canvas.getByText('275')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Update entry' }));
    await expect(args.onUpdateEntry).toHaveBeenCalledWith({ quantity: 150, unitId: 'g' });
  },
};

export const RemoveEntry: Story = {
  name: 'Existing entry — Remove asks first',
  args: { candidate: oatmealWithBerries, mode: 'existing', initialPortion: { quantity: 300, unitId: 'g' } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Remove entry' }));
    const dialog = await canvas.findByRole('alertdialog', { name: 'Remove Oatmeal with mixed berries from today?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Keep entry' }));
    await expect(args.onRemoveEntry).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole('button', { name: 'Remove entry' }));
    await userEvent.click(within(await canvas.findByRole('alertdialog')).getByRole('button', { name: 'Remove' }));
    await expect(args.onRemoveEntry).toHaveBeenCalledTimes(1);
  },
};

export const ExistingEntryDirtyBack: Story = {
  name: 'Existing entry — Back with a changed amount asks to keep or discard',
  args: { candidate: oatmealWithBerries, mode: 'existing', initialPortion: { quantity: 300, unitId: 'g' } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // Unchanged: Back leaves directly.
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

export const LongName320: Story = {
  name: 'Long name at 320',
  args: { candidate: foodCatalogue[2] },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth + 1);
    await expect(within(canvasElement).getByRole('heading', { level: 2 })).toHaveTextContent('Wholegrain pasta with roasted vegetables and tahini dressing');
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 200 %',
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Add to today' })).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};
