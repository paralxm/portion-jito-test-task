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
**Purpose.** O01 — the shared Log food chooser opened from every root and from recipe details (after R6). Exactly four methods, in this order and hierarchy: one prominent full-width **Search food** row; a restrained caption over the two camera methods as equal cards side by side (**Scan barcode** left, **Take a photo** right); a separator; a quieter full-width **Enter manually** row. Choosing one starts identification only; nothing is committed, and dismissal (close control, backdrop, Escape) restores the invoking surface untouched.

**Composition.** A \`ModalSheet\` (native \`dialog\`, focus contained, scrim, top-corner sheet radius, bottom safe area) whose body is a named \`method-sheet\` container holding three \`MethodOption\` presentations: row, the card pair, and the quiet row.

**Stacking condition.** Under 17 rem of body width the card pair becomes one column, keeping the order Search → Barcode → Photo → Manual. Every supported viewport at 100 % text keeps the pair (320 px leaves 288 px of body); 200 % text on every supported width stacks it. No PRIMARY badge, no drawn home indicator, no decorative frame.
        `,
      },
    },
  },
} satisfies Meta<typeof MethodSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

const pairColumns = (dialog: HTMLElement) => {
  const card = within(dialog).getByRole('button', { name: /Scan barcode/ });
  return getComputedStyle(card.parentElement as HTMLElement).gridTemplateColumns.split(' ').length;
};

export const Structure: Story = {
  name: 'Default — row, card pair, separator, quiet row at 390',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const dialog = canvas.getByRole('dialog', { name: 'Log food' });
    const options = within(dialog)
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-label') !== 'Close');
    await expect(options.map((t) => t.textContent?.trim())).toEqual([
      expect.stringContaining('Search food'),
      expect.stringContaining('Scan barcode'),
      expect.stringContaining('Take a photo'),
      expect.stringContaining('Enter manually'),
    ]);
    await expect(options[0].getAttribute('data-presentation')).toBe('row');
    await expect(options[1].getAttribute('data-presentation')).toBe('card');
    await expect(options[2].getAttribute('data-presentation')).toBe('card');
    await expect(options[3].getAttribute('data-tone')).toBe('quiet');
    await expect(pairColumns(dialog)).toBe(2);
    // The search row spans the full body; the cards share the row's height.
    await expect(options[0].getBoundingClientRect().width).toBeGreaterThan(options[1].getBoundingClientRect().width * 1.8);
    await expect(Math.abs(options[1].getBoundingClientRect().height - options[2].getBoundingClientRect().height)).toBeLessThan(1);
    await expect(within(dialog).getByText('With the camera')).toBeVisible();
    await expect(within(dialog).queryByText(/PRIMARY/)).toBeNull();
    for (const option of options) await expect(option.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
    await userEvent.click(canvas.getByRole('button', { name: /Scan barcode/ }));
    await expect(args.onChoose).toHaveBeenCalledWith('barcode');
  },
};

export const Wide430: Story = {
  name: 'Card pair at 430',
  globals: { viewport: { value: 'mobile430', isRotated: false } },
  play: async ({ canvasElement }) => {
    await expect(pairColumns(within(canvasElement).getByRole('dialog'))).toBe(2);
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
  name: 'Keyboard: focus enters the sheet, Tab reaches every method in order',
  play: async ({ canvasElement }) => {
    const dialog = within(canvasElement).getByRole('dialog');
    await expect(dialog.contains(document.activeElement)).toBe(true);
    const names = ['Search food', 'Scan barcode', 'Take a photo', 'Enter manually'];
    // Focus starts on the close control; each Tab lands on the next method in reading order.
    for (const name of names) {
      await userEvent.tab();
      await expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: new RegExp(name) }));
      await expect(getComputedStyle(document.activeElement as Element).outlineStyle).toBe('solid');
    }
  },
};

export const Narrow320: Story = {
  name: 'Narrow — 320 keeps the card pair',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    const dialog = within(canvasElement).getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(pairColumns(dialog)).toBe(2);
    const options = within(dialog).getAllByRole('button').filter((b) => b.getAttribute('aria-label') !== 'Close');
    for (const option of options) {
      await expect(option.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
      await expect(option.scrollWidth).toBeLessThanOrEqual(option.clientWidth + 1);
    }
    await expectNoHorizontalOverflow();
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 390 at 200 %: the card pair stacks, order kept',
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    const dialog = within(canvasElement).getByRole('dialog');
    await expect(within(dialog).getByRole('button', { name: /Enter manually/ })).toBeVisible();
    await expect(pairColumns(dialog)).toBe(1);
    const options = within(dialog).getAllByRole('button').filter((b) => b.getAttribute('aria-label') !== 'Close');
    const tops = options.map((o) => o.getBoundingClientRect().top);
    await expect(tops).toEqual([...tops].sort((a, b) => a - b));
    await expectNoHorizontalOverflow();
  },
};
