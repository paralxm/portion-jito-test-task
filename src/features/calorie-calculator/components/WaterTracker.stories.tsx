import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { Toast } from '../../../design-system/patterns/Toast/Toast';
import { withIPhone16PortraitSafeAreas, withRootFontSize, expectNoHorizontalOverflow } from '../../../design-system/storybook/decorators';
import { announceWaterAdded } from '../domain/water';
import { WaterTracker } from './WaterTracker';

const meta = {
  title: 'Product compositions/Home (S01)/WaterTracker',
  component: WaterTracker,
  args: { totalMl: 1250, goalMl: 2000, onQuickAdd: fn(), onOpen: fn() },
  parameters: {
    docs: {
      description: {
        component:
          "Home's water tracker (ledger D-22): one surface with two sibling controls — `Edit water, 1.25 litres of 2 litres` (label, figure) opens the sheet and `Add 250 millilitres of water` adds at once. No clickable container wraps a button. The figure and the water-toned fill move from the previous to the new total on the value-change token (350 ms) and update instantly under reduced motion; amount and reference are always stated in text, so the water colour is never the only meaning. The app announces the result once and offers Undo through the shared Toast.",
      },
    },
  },
} satisfies Meta<typeof WaterTracker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Zero: Story = {
  args: { totalMl: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Edit water, 0 millilitres of 2 litres' })).toBeVisible();
    await expect(canvas.getByRole('meter', { name: 'Water against the daily reference' })).toHaveAttribute('aria-valuenow', '0');
  },
};

export const Partial: Story = {
  name: 'Partial — 1.25 / 2 L',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('1.25')).toBeVisible();
    await expect(canvas.getByText('L / 2 L')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Add 250 millilitres of water' }));
    await expect(args.onQuickAdd).toHaveBeenCalledWith(250);
    await userEvent.click(canvas.getByRole('button', { name: 'Edit water, 1.25 litres of 2 litres' }));
    await expect(args.onOpen).toHaveBeenCalledTimes(1);
    // Two sibling controls, no nested button.
    const quick = canvas.getByRole('button', { name: 'Add 250 millilitres of water' });
    await expect(quick.closest('button:not([aria-label^="Add"])')).toBeNull();
  },
};

export const Reached: Story = {
  name: 'Reference reached — 2 / 2 L',
  args: { totalMl: 2000 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Daily reference reached.')).toBeVisible();
  },
};

export const Exceeded: Story = {
  name: 'Over the reference — 2.5 / 2 L, excess stated',
  args: { totalMl: 2500 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('500 ml over the daily reference.')).toBeVisible();
    await expect(within(canvasElement).getByRole('meter')).toHaveAttribute('data-over', 'true');
  },
};

function Harness({ reduced = false }: { reduced?: boolean }) {
  const [total, setTotal] = useState(1250);
  const [toast, setToast] = useState<{ message: string; undo: () => void } | null>(null);
  return (
    <div data-portion-motion={reduced ? 'reduced' : undefined}>
      <WaterTracker
        totalMl={total}
        onQuickAdd={(ml) => {
          setTotal((t) => t + ml);
          setToast({ message: announceWaterAdded(ml, total + ml), undo: () => setTotal((t) => Math.max(0, t - ml)) });
        }}
        onOpen={fn()}
      />
      <Toast open={toast !== null} message={toast?.message ?? ''} actionLabel="Undo" onAction={toast?.undo} onDismiss={() => setToast(null)} />
    </div>
  );
}

export const QuickAddAndUndo: Story = {
  name: 'Quick add — repeated taps accumulate, the figure animates, Undo restores',
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const add = canvas.getByRole('button', { name: 'Add 250 millilitres of water' });
    await userEvent.click(add);
    await userEvent.click(add);
    await expect(canvas.getByRole('button', { name: 'Edit water, 1.75 litres of 2 litres' })).toBeInTheDocument();
    // The visible figure catches up with the total once the value-change animation ends.
    await waitFor(async () => expect(canvas.getByText('1.75')).toBeVisible(), { timeout: 1500 });
    await expect(canvas.getByRole('status')).toHaveTextContent('250 ml added. 1.75 litres today.');
    await userEvent.click(canvas.getByRole('button', { name: 'Undo' }));
    await expect(canvas.getByRole('button', { name: 'Edit water, 1.5 litres of 2 litres' })).toBeInTheDocument();
  },
};

export const ReducedMotion: Story = {
  name: 'Reduced motion — the figure updates instantly',
  render: () => <Harness reduced />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Add 250 millilitres of water' }));
    await expect(canvas.getByText('1.5')).toBeVisible();
    const fill = canvasElement.querySelector('[class*="fill"]') as HTMLElement;
    await expect(getComputedStyle(fill).transitionDuration).toBe('0s');
  },
};

export const Narrow320: Story = {
  name: 'Narrow — 320',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async () => {
    await expectNoHorizontalOverflow();
  },
};

export const Wide430: Story = {
  name: 'Wide — 430',
  globals: { viewport: { value: 'mobile430', isRotated: false } },
  play: async () => {
    await expectNoHorizontalOverflow();
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 320 at 200 %',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Add 250 millilitres of water' })).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};

export const SafeArea: Story = {
  name: 'Toast above the bottom safe area when no bar is shown (iPhone 16 fixture)',
  globals: { viewport: { value: 'iPhone16Portrait', isRotated: false } },
  decorators: [withIPhone16PortraitSafeAreas],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Add 250 millilitres of water' }));
    const region = canvas.getByRole('status');
    await expect(parseFloat(getComputedStyle(region).bottom)).toBeGreaterThanOrEqual(34 + 12);
  },
};
