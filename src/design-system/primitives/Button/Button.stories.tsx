import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { PencilSimple, SlidersHorizontal } from '@phosphor-icons/react';

import { Stack } from '../layout/Stack';
import { Inline } from '../layout/Inline';
import { Text } from '../Text/Text';
import { Button, type ButtonSize, type ButtonVariant } from './Button';

const meta = {
  title: 'Primitives/Button',
  component: Button,
  args: { children: 'Add to today', onClick: fn() },
  parameters: {
    docs: {
      description: {
        component: `
**Purpose.** The single action primitive. A treatment (\`variant\`) says how much an action leads; a size says how much room it takes. Neither changes the type hierarchy on its own.

**Treatments.** \`primary\` — the one filled action a screen leads with (Add to today, Continue to review, Apply filters). \`secondary\` — a tinted blue-50 fill with blue text for supporting actions: visibly a button, quieter than primary, never an outline that competes with fields. \`text\` — a bare label for tertiary actions (Done, Cancel, Reset all). \`destructive\` — the tinted red treatment for Discard and Remove.

**Sizes.** \`large\`: 56 px control, action-lg (16/24, the same type as medium) label, 24 px inline padding, 24 px glyph — the one dominant action of a screen: a sticky footer's Add to today / Update entry / Continue to review, Home's Log food. \`medium\` (default): 48 px control, action-md 16/24 label, 16 px inline padding — screen-level actions. \`small\`: 40 px drawn control, action-sm 14/20 label, 12 px inline padding — in-context actions such as Filters, Reset all, Show all nutrition, Change food. The small control's hit area still reaches 48 px through a 4 px pseudo-element above and below.

**States.** rest, hover (pointer only), pressed, focus-visible (3 px ring), disabled (disabled surface + disabled text; no activation from pointer or keyboard; native \`disabled\` so it leaves the tab order), loading (spinner in the icon slot, \`aria-busy\`, activation ignored — asynchronous requests only, never synchronous arithmetic). \`block\` fills the row for a screen's primary action.

**Content.** Labels wrap instead of truncating and are never capitalised or condensed to fit.
        `,
      },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'text', 'destructive'];
const SIZES: ButtonSize[] = ['large', 'medium', 'small'];

export const Primary: Story = {
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Add to today' });
    await expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const TreatmentsAndSizes: Story = {
  name: 'Treatments × sizes',
  render: (args) => (
    <Stack gap={16} align="start">
      {SIZES.map((size) => (
        <Stack key={size} gap={8} align="start">
          <Text variant="caption" color="secondary">
            {size}
          </Text>
          <Inline gap={8} wrap>
            {VARIANTS.map((variant) => (
              <Button key={variant} {...args} variant={variant} size={size}>
                {variant === 'destructive' ? 'Discard' : variant === 'text' ? 'Done' : variant === 'secondary' ? 'Find recipes' : 'Add to today'}
              </Button>
            ))}
          </Inline>
        </Stack>
      ))}
      <Inline gap={8} wrap>
        <Button {...args} variant="secondary" size="small" icon={PencilSimple}>
          Change food
        </Button>
        <Button {...args} variant="secondary" size="small" icon={SlidersHorizontal}>
          Filters
        </Button>
      </Inline>
    </Stack>
  ),
};

export const SmallHitArea: Story = {
  name: 'Small — 40 px drawn, 48 px hit area',
  args: { size: 'small', variant: 'secondary', children: 'Reset all' },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Reset all' });
    await expect(Math.round(button.getBoundingClientRect().height)).toBe(40);
    const before = getComputedStyle(button, '::before');
    await expect(before.position).toBe('absolute');
    await expect(parseFloat(before.top)).toBe(-4);
    await expect(parseFloat(before.bottom)).toBe(-4);
    // The action-sm role (14/20) is applied to the label span.
    await expect(parseFloat(getComputedStyle(button.querySelector('span') as Element).fontSize)).toBe(14);
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const Loading: Story = {
  args: { loading: true, children: 'Looking up product' },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: /Looking up product/ });
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const Disabled: Story = {
  name: 'Disabled — every treatment, no activation',
  render: (args) => (
    <Inline gap={8} wrap>
      {VARIANTS.map((variant) => (
        <Button key={variant} {...args} variant={variant} disabled>
          {variant}
        </Button>
      ))}
    </Inline>
  ),
  play: async ({ canvasElement, args }) => {
    const buttons = within(canvasElement).getAllByRole('button');
    for (const button of buttons) {
      await expect(button).toBeDisabled();
      await userEvent.click(button);
    }
    await expect(args.onClick).not.toHaveBeenCalled();
    // Disabled controls leave the tab order.
    await userEvent.tab();
    await expect(buttons).not.toContain(document.activeElement);
  },
};

export const FocusVisible: Story = {
  name: 'Keyboard focus-visible',
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    const button = within(canvasElement).getByRole('button', { name: 'Add to today' });
    await expect(document.activeElement).toBe(button);
    const style = getComputedStyle(button);
    await expect(style.outlineStyle).toBe('solid');
    await expect(parseFloat(style.outlineWidth)).toBe(3);
  },
};

export const BlockAndWrapping: Story = {
  name: 'Block, long label at 320',
  args: { block: true, children: 'Add this reviewed portion to today with its full nutrition snapshot' },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button');
    // The label wraps; the control grows in height rather than clipping the text.
    await expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
    await expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth);
  },
};
