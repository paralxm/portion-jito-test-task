import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { expectNoHorizontalOverflow, withRootFontSize } from '../../../design-system/storybook/decorators';
import { GoalSheet } from './GoalSheet';

const meta = {
  title: 'Product compositions/Home (S01)/Goal editor',
  component: GoalSheet,
  args: { open: true, goal: null, onApply: fn(), onClear: fn(), onCancel: fn() },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "Home's contextual goal editor as a modal draft (ui-contract §3.2, ledger D-18): `Set goal` without a goal, `Edit goal` with one. Apply validates and commits a positive calorie number plus optional protein / carbohydrate / fat targets in grams — user-entered, never calculated; an invalid draft stays editable with its error and never replaces the committed goal; Cancel, close, backdrop and Escape keep the previous goal; Clear goal (only when a goal exists) removes it explicitly. Composed from ModalSheet, AmountField and Button. 2,000 kcal and the 120 / 220 / 65 g targets are demonstration values, not recommendations.",
      },
    },
  },
} satisfies Meta<typeof GoalSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SetGoal: Story = {
  name: 'Set goal — apply a valid value',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('dialog', { name: 'Set goal' })).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'Clear goal' })).toBeNull();
    await userEvent.type(canvas.getByLabelText('Daily goal'), '2000');
    await userEvent.click(canvas.getByRole('button', { name: 'Apply' }));
    await expect(args.onApply).toHaveBeenCalledWith({ kcal: 2000, proteinG: null, carbohydratesG: null, fatG: null });
  },
};

export const WithTargets: Story = {
  name: 'Set goal with macro targets',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Daily goal'), '2000');
    await userEvent.type(canvas.getByLabelText(/^Protein/), '120');
    await userEvent.type(canvas.getByLabelText(/^Carbohydrates/), '220');
    await userEvent.type(canvas.getByLabelText(/^Fat/), '65');
    await userEvent.click(canvas.getByRole('button', { name: 'Apply' }));
    await expect(args.onApply).toHaveBeenCalledWith({ kcal: 2000, proteinG: 120, carbohydratesG: 220, fatG: 65 });
  },
};

export const InvalidDraft: Story = {
  name: 'Invalid draft stays editable and does not apply',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByLabelText('Daily goal');
    await userEvent.click(canvas.getByRole('button', { name: 'Apply' }));
    await expect(args.onApply).not.toHaveBeenCalled();
    await expect(field).toHaveAccessibleDescription('Enter a goal in calories, or cancel to keep things as they are');
    await userEvent.type(field, '0');
    await userEvent.type(canvas.getByLabelText(/^Protein/), 'abc');
    await userEvent.click(canvas.getByRole('button', { name: 'Apply' }));
    await expect(field).toHaveAccessibleDescription('Enter a goal greater than zero');
    await expect(canvas.getByLabelText(/^Protein/)).toHaveAccessibleDescription('Enter a number of grams, or leave it blank');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(args.onApply).not.toHaveBeenCalled();
  },
};

export const EditGoal: Story = {
  name: 'Edit goal — clear is offered',
  args: { goal: { kcal: 2000, proteinG: 120, carbohydratesG: 220, fatG: 65 } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('dialog', { name: 'Edit goal' })).toBeVisible();
    await expect(canvas.getByLabelText('Daily goal')).toHaveValue('2000');
    await expect(canvas.getByLabelText(/^Protein/)).toHaveValue('120');
    await userEvent.click(canvas.getByRole('button', { name: 'Clear goal' }));
    await expect(args.onClear).toHaveBeenCalledTimes(1);
  },
};

export const CancelKeepsPrevious: Story = {
  name: 'Cancel and Escape keep the previous goal',
  args: { goal: { kcal: 2200 } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByLabelText('Daily goal');
    await userEvent.clear(field);
    await userEvent.type(field, '1800');
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await userEvent.keyboard('{Escape}');
    await expect(args.onCancel).toHaveBeenCalledTimes(2);
    await expect(args.onApply).not.toHaveBeenCalled();
  },
};

export const Narrow320: Story = {
  name: 'Narrow — 320',
  args: { goal: { kcal: 2200 } },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('dialog')).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 320 at 200 %',
  args: { goal: { kcal: 2200 } },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Apply' })).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};
