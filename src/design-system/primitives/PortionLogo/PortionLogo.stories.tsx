import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Inline } from '../layout/Inline';
import { Stack } from '../layout/Stack';
import { Text } from '../Text/Text';
import { PortionLogo } from './PortionLogo';

const meta = {
  title: 'Primitives/PortionLogo',
  component: PortionLogo,
  parameters: {
    docs: {
      description: {
        component: `
**Brand lockup.** The lowercase \`portion\` wordmark (Inter Semi Bold, −3 % tracking — the only negative tracking in the product) followed by the portion dot on the baseline. Two sizes (default 24/32 for root headers, compact 18/24 for tight rows) and three tones (default: neutral wordmark + blue dot; monochrome: both neutral; inverse: both white on a dark or action surface).

**Rules.** Minimum height 18 px (the compact size); clear space equal to the dot on every side is built into the component; never stretched, recoloured outside the tones, or paired with a second mark. Because the wordmark is lowercase, it keeps the same rhythm as the surrounding UI text rather than shouting.

**Accessibility.** The lockup is one \`role="img"\` named \`Portion\`; the visible text and the dot are hidden from assistive technology so nothing is announced twice.
        `,
      },
    },
  },
} satisfies Meta<typeof PortionLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const logo = canvas.getByRole('img', { name: 'Portion' });
    await expect(logo).toBeVisible();
    // One accessible name, no duplicate output from the visible text or the dot.
    await expect(logo.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
    const wordmark = logo.querySelector('span') as HTMLElement;
    await expect(getComputedStyle(wordmark).letterSpacing).not.toBe('0px');
    await expect(getComputedStyle(wordmark).textTransform).toBe('lowercase');
  },
};

export const Compact: Story = {
  args: { size: 'compact' },
  play: async ({ canvasElement }) => {
    const logo = within(canvasElement).getByRole('img', { name: 'Portion' });
    await expect(logo.getBoundingClientRect().height).toBeGreaterThanOrEqual(18);
  },
};

export const Tones: Story = {
  name: 'Tones — default, monochrome, inverse',
  render: () => (
    <Stack gap={16} align="start">
      <Inline gap={24}>
        <PortionLogo />
        <PortionLogo tone="monochrome" />
      </Inline>
      <div style={{ padding: 'var(--portion-ref-space-16)', background: 'var(--portion-color-action-primary)', borderRadius: 'var(--portion-radius-card)' }}>
        <PortionLogo tone="inverse" />
      </div>
      <div style={{ padding: 'var(--portion-ref-space-16)', background: 'var(--portion-color-camera-stage)', borderRadius: 'var(--portion-radius-card)' }}>
        <PortionLogo tone="inverse" size="compact" />
      </div>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('img', { name: 'Portion' })).toHaveLength(4);
  },
};

export const ClearSpace: Story = {
  name: 'Minimum size and clear space',
  render: () => (
    <Stack gap={12} align="start">
      <Text as="p" variant="supporting" color="secondary">
        Clear space equal to the dot is part of the component; the outline shows the lockup's own box.
      </Text>
      <span style={{ outline: '1px dashed var(--portion-color-border-control)', display: 'inline-block' }}>
        <PortionLogo />
      </span>
      <span style={{ outline: '1px dashed var(--portion-color-border-control)', display: 'inline-block' }}>
        <PortionLogo size="compact" />
      </span>
    </Stack>
  ),
};
