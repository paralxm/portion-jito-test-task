import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Button } from '../../primitives/Button/Button';
import { Stack } from '../../primitives/layout/Stack';
import { Text } from '../../primitives/Text/Text';
import { ModalSheet } from './ModalSheet';

const meta = {
  title: 'Patterns/ModalSheet',
  component: ModalSheet,
  args: { open: false, title: 'Filters', description: 'Recipes must match every filter you set.', onRequestClose: fn(), children: null },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Bottom sheet on the native `<dialog>`: one foreground modal, inert page beneath, focus contained inside and returned to the opener. Close, backdrop and Escape all route through `onRequestClose`, so a dirty draft can intercept every dismissal. The header and footer stay anchored while the body scrolls; the bottom safe area is included.',
      },
    },
  },
} satisfies Meta<typeof ModalSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

function Harness({ tall = false, onRequestClose }: { tall?: boolean; onRequestClose: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ padding: 16 }}>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open filters
      </Button>
      <ModalSheet
        open={open}
        title="Filters"
        description="Recipes must match every filter you set."
        onRequestClose={() => {
          onRequestClose();
          setOpen(false);
        }}
        footer={
          <Button variant="primary" block onClick={() => setOpen(false)}>
            Apply filters
          </Button>
        }
      >
        <Stack gap={12}>
          {Array.from({ length: tall ? 24 : 3 }, (_, i) => (
            <Text key={i} as="p" variant="body">
              Sheet content line {i + 1}. Long content scrolls inside the body while the title and Apply stay in place.
            </Text>
          ))}
        </Stack>
      </ModalSheet>
    </div>
  );
}

export const OpenAndClose: Story = {
  name: 'Open, contain focus, Escape, restore focus',
  render: (args) => <Harness onRequestClose={args.onRequestClose} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const opener = canvas.getByRole('button', { name: 'Open filters' });
    await userEvent.click(opener);
    const dialog = canvas.getByRole('dialog', { name: 'Filters' });
    await expect(dialog).toBeVisible();
    await expect(dialog.contains(document.activeElement)).toBe(true);
    await userEvent.tab();
    await expect(dialog.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard('{Escape}');
    await expect(args.onRequestClose).toHaveBeenCalledTimes(1);
    await expect(canvas.queryByRole('dialog')).toBeNull();
    await expect(document.activeElement).toBe(opener);
  },
};

export const CloseControl: Story = {
  name: 'Close control and backdrop',
  render: (args) => <Harness onRequestClose={args.onRequestClose} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Open filters' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Close' }));
    await expect(args.onRequestClose).toHaveBeenCalledTimes(1);
    await expect(canvas.queryByRole('dialog')).toBeNull();
  },
};

export const LongContent: Story = {
  name: 'Long content scrolls under anchored header and footer',
  render: (args) => <Harness tall onRequestClose={args.onRequestClose} />,
  globals: { viewport: { value: 'shortHeight', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Open filters' }));
    const dialog = canvas.getByRole('dialog');
    await expect(dialog.getBoundingClientRect().height).toBeLessThanOrEqual(window.innerHeight);
    await expect(canvas.getByRole('button', { name: 'Apply filters' })).toBeVisible();
  },
};
