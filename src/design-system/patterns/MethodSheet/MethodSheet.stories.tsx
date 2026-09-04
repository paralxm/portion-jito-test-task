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
        component: `
**Purpose.** O01 — the shared Log food chooser opened from every root and from recipe details. Exactly four methods, in the contract order: Search food, Scan barcode, Take a photo, Enter manually. Choosing one starts identification only; nothing is committed, and dismissal (close control, backdrop, Escape) restores the invoking surface untouched.

**Composition.** A \`ModalSheet\` (native \`dialog\`, focus contained, scrim, top-corner sheet radius, bottom safe area) whose body is a named \`method-grid\` container holding a 2 × 2 grid of \`MethodOption\` tiles with the card gap between them.

**One-column condition.** The grid and the tiles both read the same container query: under 17 rem of available width the grid becomes one column and each tile becomes a row. Every supported viewport at 100 % text — 320, 390, 393 and 430 px — keeps the 2 × 2 grid (320 px leaves 288 px of sheet body); 200 % text on every supported width falls to rows. Nothing collapses by accident: the threshold is authored once, in rem, and demonstrated below.

**Availability.** Every method is always available in this product, so no disabled tile exists or is drawn.
        `,
      },
    },
  },
} satisfies Meta<typeof MethodSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

const columns = (dialog: HTMLElement) => {
  const tile = within(dialog).getByRole('button', { name: /Search food/ });
  return getComputedStyle(tile.parentElement as HTMLElement).gridTemplateColumns.split(' ').length;
};

export const TwoByTwo: Story = {
  name: 'Default — 2 × 2 at 390',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const dialog = canvas.getByRole('dialog', { name: 'Log food' });
    const tiles = within(dialog)
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-label') !== 'Close');
    await expect(tiles.map((t) => t.textContent?.trim())).toEqual([
      expect.stringContaining('Search food'),
      expect.stringContaining('Scan barcode'),
      expect.stringContaining('Take a photo'),
      expect.stringContaining('Enter manually'),
    ]);
    await expect(columns(dialog)).toBe(2);
    for (const tile of tiles) await expect(tile.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
    await userEvent.click(canvas.getByRole('button', { name: /Scan barcode/ }));
    await expect(args.onChoose).toHaveBeenCalledWith('barcode');
  },
};

export const Wide430: Story = {
  name: '2 × 2 at 430',
  globals: { viewport: { value: 'mobile430', isRotated: false } },
  play: async ({ canvasElement }) => {
    await expect(columns(within(canvasElement).getByRole('dialog'))).toBe(2);
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

export const KeyboardFocus: Story = {
  name: 'Keyboard: focus enters the sheet, Tab reaches every tile',
  play: async ({ canvasElement }) => {
    const dialog = within(canvasElement).getByRole('dialog');
    await expect(dialog.contains(document.activeElement)).toBe(true);
    const tiles = ['Search food', 'Scan barcode', 'Take a photo', 'Enter manually'];
    // Focus starts on the close control; each Tab lands on the next tile in reading order.
    for (const name of tiles) {
      await userEvent.tab();
      await expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: new RegExp(name) }));
      await expect(getComputedStyle(document.activeElement as Element).outlineStyle).toBe('solid');
    }
  },
};

export const Narrow320: Story = {
  name: 'Narrow — 320 keeps the 2 × 2 grid',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    const dialog = within(canvasElement).getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(columns(dialog)).toBe(2);
    const tiles = within(dialog).getAllByRole('button').filter((b) => b.getAttribute('aria-label') !== 'Close');
    for (const tile of tiles) {
      await expect(getComputedStyle(tile).flexDirection).toBe('column');
      await expect(tile.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
      await expect(tile.scrollWidth).toBeLessThanOrEqual(tile.clientWidth + 1);
    }
    await expectNoHorizontalOverflow();
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 390 at 200 %: one column of rows',
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    const dialog = within(canvasElement).getByRole('dialog');
    await expect(within(dialog).getByRole('button', { name: /Enter manually/ })).toBeVisible();
    await expect(columns(dialog)).toBe(1);
    await expectNoHorizontalOverflow();
  },
};
