import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { withRootFontSize } from '../../../design-system/storybook/decorators';
import { TargetsEntrySheet } from './TargetsEntrySheet';

const meta = {
  title: 'Product compositions/Targets/Entry sheet',
  component: TargetsEntrySheet,
  args: { open: true, onChoose: fn(), onRequestClose: fn() },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The one sheet left in the targets flow (ledger §14): the choice of route. **Help me estimate** (prominent) and **I know my goal** are the two `MethodOption` rows; the note beneath is reassurance on the information surface, not a warning. Close at the top right; no Cancel footer. Choosing a route moves into the focused full-screen flow; opening or dismissing the sheet changes nothing.',
      },
    },
  },
} satisfies Meta<typeof TargetsEntrySheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Entry: Story = {
  name: 'Set daily goal — two routes, the reassurance note',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement.ownerDocument.body);
    const dialog = await canvas.findByRole('dialog', { name: 'Set daily goal' });
    await expect(within(dialog).getByText('Choose how to set your target.')).toBeVisible();
    await expect(within(dialog).getByText('You can change your targets anytime from Home.')).toBeVisible();
    await expect(within(dialog).queryByRole('button', { name: 'Cancel' })).toBeNull();
    await userEvent.click(within(dialog).getByRole('button', { name: /Help me estimate/ }));
    await expect(args.onChoose).toHaveBeenLastCalledWith('estimate');
    await userEvent.click(within(dialog).getByRole('button', { name: /I know my goal/ }));
    await expect(args.onChoose).toHaveBeenLastCalledWith('manual');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await expect(args.onRequestClose).toHaveBeenCalledTimes(1);
  },
};

export const Enlarged: Story = {
  name: 'Enlarged text — 320 at 200 %, the rows and the note wrap',
  decorators: [withRootFontSize(200)],
};
