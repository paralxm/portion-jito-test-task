import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { expectNoHorizontalOverflow, withRootFontSize } from '../../storybook/decorators';
import { MethodSheet } from './MethodSheet';

const meta = {
  title: 'Patterns/MethodSheet',
  component: MethodSheet,
  args: { open: true, onRequestClose: fn(), onChoose: fn() },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'O01 — the shared Add food chooser opened from every root and from recipe details. It offers exactly Search food, Scan barcode, Take a photo and Enter manually in that order. Choosing a method starts identification only; nothing is committed, and dismissal restores the invoking surface.',
      },
    },
  },
} satisfies Meta<typeof MethodSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const dialog = canvas.getByRole('dialog', { name: 'How would you like to add food?' });
    const rows = within(dialog).getAllByRole('button').filter((b) => b.getAttribute('aria-label') !== 'Close');
    await expect(rows.map((r) => r.textContent?.trim().split('\n')[0])).toEqual([
      expect.stringContaining('Search food'),
      expect.stringContaining('Scan barcode'),
      expect.stringContaining('Take a photo'),
      expect.stringContaining('Enter manually'),
    ]);
    await userEvent.click(canvas.getByRole('button', { name: /Scan barcode/ }));
    await expect(args.onChoose).toHaveBeenCalledWith('barcode');
  },
};

export const Dismiss: Story = {
  name: 'Dismiss with Escape',
  play: async ({ args }) => {
    await userEvent.keyboard('{Escape}');
    await expect(args.onRequestClose).toHaveBeenCalledTimes(1);
    await expect(args.onChoose).not.toHaveBeenCalled();
  },
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
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: /Enter manually/ })).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};
