import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Button } from '../../primitives/Button/Button';
import { Stack } from '../../primitives/layout/Stack';
import { expectNoHorizontalOverflow } from '../../storybook/decorators';
import { InlineMessage } from './InlineMessage';

const meta = {
  title: 'Components/InlineMessage',
  component: InlineMessage,
  args: { tone: 'info', children: 'Suggested from your photo. Check the food and set the amount you will eat — the photo does not measure it.' },
  parameters: {
    docs: {
      description: {
        component:
          'Persistent message next to the thing it describes. Tone describes a system condition — never food quality. Colour carries tone; the glyph, wording and placement carry meaning. Errors interrupt (`alert`), others update politely (`status`), and initial page content uses `none`.',
      },
    },
  },
} satisfies Meta<typeof InlineMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('status')).toBeInTheDocument();
  },
};

export const Tones: Story = {
  render: () => (
    <Stack gap={12}>
      <InlineMessage tone="info" announce="none">
        Matched from the barcode. If this is not the right product, change it before confirming.
      </InlineMessage>
      <InlineMessage tone="warning" title="This replaces your current calculation" announce="none">
        Confirming replaces “Vegetable rice bowl” with this food. Foods are not added together.
      </InlineMessage>
      <InlineMessage
        tone="error"
        title="Lookup failed"
        announce="none"
        actions={
          <>
            <Button variant="primary" size="compact">
              Retry lookup
            </Button>
            <Button variant="secondary" size="compact">
              Enter manually
            </Button>
          </>
        }
      >
        The product service did not respond for code 5012345678900. The code is kept so you can retry.
      </InlineMessage>
      <InlineMessage tone="success" announce="none">
        Filters applied.
      </InlineMessage>
    </Stack>
  ),
};

export const ErrorAlert: Story = {
  name: 'Error (alert)',
  args: { tone: 'error', title: 'Analysis failed', children: 'The recognition service did not respond. Your photo is kept, so you can try again without retaking it.' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('alert')).toHaveTextContent('Analysis failed');
  },
};

export const LongContent: Story = {
  name: 'Long, wrapping content at 320',
  args: {
    tone: 'error',
    title: 'Lookup failed',
    children:
      'The product lookup service for code 5012345678900 did not respond in time, and the connection could not be re-established after several retries — the code you scanned is kept so you can try again without rescanning it.',
  },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('alert')).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};
