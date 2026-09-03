import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Button } from '../../primitives/Button/Button';
import { expectNoHorizontalOverflow, withRootFontSize } from '../../storybook/decorators';
import { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';

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
          'Centred confirmation shown only when something meaningful would be lost. The safe choice receives initial focus, Escape cancels, and the destructive action takes the destructive treatment. Untouched entry never shows it. Unlike ModalSheet, ConfirmDialog has no backdrop-dismiss route — a confirmation decision is never lost to a stray tap outside it.',
      },
    },
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An actual opener so focus-restore-on-close can be proven, not assumed. */
function Harness(props: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ padding: 16 }}>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Discard entry
      </Button>
      <ConfirmDialog
        {...props}
        open={open}
        onConfirm={() => {
          props.onConfirm();
          setOpen(false);
        }}
        onCancel={() => {
          props.onCancel();
          setOpen(false);
        }}
      />
    </div>
  );
}

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

export const FocusReturnsToOpener: Story = {
  name: 'Focus returns to the opener on close',
  render: (args) => <Harness {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const opener = canvas.getByRole('button', { name: 'Discard entry' });
    await userEvent.click(opener);
    await expect(canvas.getByRole('alertdialog')).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await expect(args.onCancel).toHaveBeenCalledTimes(1);
    await expect(canvas.queryByRole('alertdialog')).toBeNull();
    await expect(document.activeElement).toBe(opener);
  },
};

export const ClickInsideDoesNotClose: Story = {
  name: 'Clicking the dialog itself never dismisses it',
  render: (args) => <Harness {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Discard entry' }));
    const dialog = canvas.getByRole('alertdialog');
    await userEvent.click(within(dialog).getByText('The values you typed will be lost. Your current calculation is not affected.'));
    await expect(dialog).toBeVisible();
    await expect(args.onCancel).not.toHaveBeenCalled();
  },
};

export const Narrow320: Story = {
  name: 'Narrow — 320',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('alertdialog')).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 320 at 200 %',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Discard' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Keep editing' })).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};
