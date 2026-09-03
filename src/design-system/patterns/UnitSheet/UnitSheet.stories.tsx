import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { expectNoHorizontalOverflow, withRootFontSize } from '../../storybook/decorators';
import { UnitSheet } from './UnitSheet';

const meta = {
  title: 'Patterns/UnitSheet',
  component: UnitSheet,
  args: {
    open: true,
    value: 'g',
    options: [
      { id: 'g', label: 'g' },
      { id: 'serving', label: 'serving', description: '1 serving = 300 g' },
    ],
    onConfirm: fn(),
    onCancel: fn(),
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'O04 — supported-unit chooser as a modal draft. Only units the food data supports are listed. Confirm is disabled until the choice differs from the applied unit; Cancel, Close, backdrop and Escape keep the previous unit.',
      },
    },
  },
} satisfies Meta<typeof UnitSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConfirmRequired: Story = {
  name: 'Confirm is required',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const confirm = canvas.getByRole('button', { name: 'Confirm' });
    await expect(confirm).toBeDisabled();
    await userEvent.click(canvas.getByRole('radio', { name: /serving/ }));
    await expect(confirm).toBeEnabled();
    await userEvent.click(confirm);
    await expect(args.onConfirm).toHaveBeenCalledWith('serving');
  },
};

export const CancelKeepsUnit: Story = {
  name: 'Cancel keeps the previous unit',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('radio', { name: /serving/ }));
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await expect(args.onCancel).toHaveBeenCalledTimes(1);
    await expect(args.onConfirm).not.toHaveBeenCalled();
  },
};

export const SingleUnit: Story = {
  name: 'Only one supported unit',
  args: { options: [{ id: 'ml', label: 'ml' }], value: 'ml' },
};

export const Narrow320: Story = {
  name: 'Narrow — 320',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('dialog')).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 320 at 200 %',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Confirm' })).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};
