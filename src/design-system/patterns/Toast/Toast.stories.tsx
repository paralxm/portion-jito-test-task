import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '../../primitives/Button/Button';
import { Toast } from './Toast';

const meta = {
  title: 'Patterns/Toast',
  component: Toast,
  args: { open: true, message: '250 ml added. 1.5 litres today.', actionLabel: 'Undo', onAction: fn(), onDismiss: fn(), durationMs: 6000 },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A short confirmation anchored above the fixed bottom navigation (it reads the bar’s measured inset, or the bottom safe area when no bar is shown). A polite `status` region: announced once, no focus stolen, nothing blocked. At most one action (Undo) plus a close; auto-dismisses after 6 s without delaying anything. Enter motion uses the toast token and collapses under reduced motion.',
      },
    },
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithUndo: Story = {
  name: 'Confirmation with Undo',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const status = canvas.getByRole('status');
    await expect(status).toHaveTextContent('250 ml added. 1.5 litres today.');
    await userEvent.click(canvas.getByRole('button', { name: 'Undo' }));
    await expect(args.onAction).toHaveBeenCalledTimes(1);
    await expect(args.onDismiss).toHaveBeenCalledTimes(1);
  },
};

export const MessageOnly: Story = {
  name: 'Message only',
  args: { actionLabel: undefined, onAction: undefined, message: 'Added to lunch.' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('button', { name: 'Undo' })).toBeNull();
    await waitFor(async () => expect(canvas.getByRole('button', { name: 'Close' })).toBeVisible());
  },
};

function Harness() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  return (
    <div style={{ padding: 'var(--portion-ref-space-16)' }}>
      <Button
        variant="secondary"
        onClick={() => {
          setCount((c) => c + 1);
          setOpen(true);
        }}
      >
        Add 250 ml
      </Button>
      <Toast open={open} message={`${count * 250} ml added today.`} actionLabel="Undo" onAction={() => setCount((c) => c - 1)} onDismiss={() => setOpen(false)} durationMs={800} />
    </div>
  );
}

export const AutoDismiss: Story = {
  name: 'Auto-dismiss and repeated triggers',
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Add 250 ml' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Add 250 ml' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('500 ml added today.');
    await new Promise((r) => setTimeout(r, 1000));
    await expect(canvas.getByRole('status')).toHaveTextContent('');
  },
};

export const ReducedMotion: Story = {
  name: 'Reduced motion — appears instantly',
  decorators: [
    (Story) => (
      <div data-portion-motion="reduced">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const toast = canvasElement.querySelector('[class*="toast"]') as HTMLElement;
    await expect(getComputedStyle(toast).animationDuration).toBe('0s');
  },
};
