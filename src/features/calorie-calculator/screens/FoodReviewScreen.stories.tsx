import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { expectNoHorizontalOverflow, withRootFontSize } from '../../../design-system/storybook/decorators';
import type { FoodCandidate } from '../domain/calculation';
import { barcodeCatalogue, fixtureC, foodCatalogue, photoSuggestions } from '../domain/fixtures';
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
  args: { candidate: fixtureC, replaces: null, onConfirm: fn(), onBack: fn(), onChangeMatch: fn() },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'S07 — one review screen for every entry method; only the source explanation differs. The amount to calculate is separate from the nutrition basis, the result previews as you type, and Confirm commits once. Back and Change keep the candidate a draft; the previous calculation is untouched until confirmation.',
      },
    },
  },
} satisfies Meta<typeof FoodReviewScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FromSearch: Story = {
  name: 'From search — fixture C',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('180')).toBeInTheDocument();
    const amount = canvas.getByLabelText('Amount to calculate');
    await userEvent.clear(amount);
    await userEvent.type(amount, '300');
    await expect(canvas.getByText('540')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Confirm and calculate' }));
    await expect(args.onConfirm).toHaveBeenCalledWith({ quantity: 300, unitId: 'g' });
  },
};

export const FromBarcodeReplacing: Story = {
  name: 'From barcode — replaces the current calculation',
  args: { candidate: barcodeCatalogue['5012345678900'], replaces: 'Vegetable rice bowl' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Matched from the barcode/)).toBeInTheDocument();
    await expect(canvas.getByText('This replaces your current calculation')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Replace and calculate' })).toBeEnabled();
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
  name: 'Invalid amount blocks confirmation',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const amount = canvas.getByLabelText('Amount to calculate');
    await userEvent.clear(amount);
    await userEvent.click(canvas.getByRole('button', { name: 'Confirm and calculate' }));
    await expect(args.onConfirm).not.toHaveBeenCalled();
    await expect(amount).toHaveAccessibleDescription('Enter the amount you want to calculate');
  },
};

export const NoEnergy: Story = {
  name: 'Calories not available — cannot confirm',
  args: { candidate: noEnergy },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Confirm and calculate' })).toBeDisabled();
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

export const LongName320: Story = {
  name: 'Long name at 320',
  args: { candidate: foodCatalogue[2] },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth + 1);
    await expect(within(canvasElement).getByRole('heading', { level: 2 })).toHaveTextContent('Wholegrain pasta with roasted vegetables and tahini dressing');
  },
};

export const CancelAndBack: Story = {
  name: 'Cancel and Back leave without committing',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    await expect(args.onBack).toHaveBeenCalledTimes(2);
    await expect(args.onConfirm).not.toHaveBeenCalled();
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 200 %',
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Confirm and calculate' })).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};
