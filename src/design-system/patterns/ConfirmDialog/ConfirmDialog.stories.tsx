import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { ConfirmDialog } from './ConfirmDialog';

const meta = {
  title: 'Patterns/ConfirmDialog',
  component: ConfirmDialog,
  args: {
    open: true,
    title: 'Discard this entry?',
    children: 'The values you typed will be lost. Your current calculation is not affected.',
    confirmLabel: 'Discard',
    cancelLabel: 'Keep editing',
    destructive: true,
    onConfirm: fn(),
    onCancel: fn(),
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Centred confirmation shown only when something meaningful would be lost. The safe choice receives initial focus, Escape cancels, and the destructive action takes the destructive treatment. Untouched entry never shows it.',
      },
    },
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Discard: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const dialog = canvas.getByRole('alertdialog', { name: 'Discard this entry?' });
    await expect(dialog).toBeVisible();
    await expect(document.activeElement).toBe(canvas.getByRole('button', { name: 'Keep editing' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Discard' }));
    await expect(args.onConfirm).toHaveBeenCalledTimes(1);
  },
};

export const EscapeCancels: Story = {
  name: 'Escape cancels',
  play: async ({ args }) => {
    await userEvent.keyboard('{Escape}');
    await expect(args.onCancel).toHaveBeenCalledTimes(1);
    await expect(args.onConfirm).not.toHaveBeenCalled();
  },
};

export const NonDestructive: Story = {
  name: 'Non-destructive confirmation',
  args: { title: 'Replace the current calculation?', children: 'Vegetable rice bowl will be replaced by Oat drink. Foods are not added together.', confirmLabel: 'Replace', cancelLabel: 'Cancel', destructive: false },
};
