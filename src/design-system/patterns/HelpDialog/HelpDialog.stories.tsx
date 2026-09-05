import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { Button } from '../../primitives/Button/Button';
import { Text } from '../../primitives/Text/Text';
import { HelpDialog } from './HelpDialog';

function Demo({ initialOpen = true }: { initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <div style={{ padding: 'var(--portion-ref-space-16)' }}>
      <Button variant="secondary" size="small" onClick={() => setOpen(true)} aria-haspopup="dialog">
        Help
      </Button>
      <HelpDialog
        open={open}
        title="Why these details?"
        onClose={() => setOpen(false)}
        details={
          <Text as="p" variant="supporting" color="secondary" wrap>
            The estimate uses the adult Estimated Energy Requirement equations of the 2023 Dietary Reference Intakes for Energy.
          </Text>
        }
      >
        <Text as="p" variant="body" color="secondary" wrap>
          The estimate uses your age, sex, height and weight to work out a typical daily energy need for people like you.
        </Text>
      </HelpDialog>
    </div>
  );
}

const meta = {
  title: 'Patterns/HelpDialog',
  component: Demo,
  parameters: {
    docs: {
      description: {
        component:
          'A short contextual explanation over a focused step (ledger §14): a heading, one to three sentences, an optional *Calculation details* disclosure for the longer methodology, and Close. Native `<dialog>` — focus is contained, Escape and Close return focus to the control that opened it, and nothing in the underlying draft changes.',
      },
    },
  },
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  name: 'Open — short body with the details disclosure closed',
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const dialog = await body.findByRole('dialog', { name: 'Why these details?' });
    await expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus();
    await expect(within(dialog).queryByText(/Dietary Reference Intakes/)).not.toBeVisible();
    await userEvent.click(within(dialog).getByText('Calculation details'));
    await expect(within(dialog).getByText(/Dietary Reference Intakes/)).toBeVisible();
  },
};

export const EscapeReturnsFocus: Story = {
  name: 'Escape closes and returns focus to Help',
  args: { initialOpen: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Help' }));
    await body.findByRole('dialog', { name: 'Why these details?' });
    await userEvent.keyboard('{Escape}');
    await expect(body.queryByRole('dialog', { name: 'Why these details?' })).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Help' })).toHaveFocus();
  },
};
