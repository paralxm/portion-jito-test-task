import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Button } from '../Button/Button';
import { Surface } from '../Surface/Surface';
import { Text } from '../Text/Text';
import { expectNoHorizontalOverflow, withRootFontSize } from '../../storybook/decorators';
import { Inline } from './Inline';
import { Stack, type SpaceStep } from './Stack';

const meta = {
  title: 'Primitives/Layout',
  component: Stack,
  parameters: {
    docs: {
      description: {
        component: `
Stack (vertical) and Inline (horizontal) place siblings with a token \`gap\` instead of
margins — **the parent layout owns spacing between its children; a reusable component
only ever owns its own internal padding/gaps**, never a margin that reaches out to a
sibling it doesn't control. \`gap\`'s type is the approved spacing scale itself,
\`0 | 4 | 8 | 12 | 16 | 24 | 32\`, matching \`reference.space\` exactly — every semantic
spacing role this system defines (page inset 16, card padding 16, card gap 12, form
group 16, section 24, and every smaller label/helper/paragraph role) already resolves
to one of these seven steps, verified against real usage, not just declared. A handful
of components have their own fixed internal dimensions in this numeric neighbourhood —
a control's minimum height, a decorative handle's width — but those are plain literals
in the component's own CSS, not \`reference.space\` tokens and not reachable through
\`gap\`: a fixed dimension is never a valid spacing value between siblings.

Inline additionally takes \`distribute\`: \`hug\` (default) sizes each child to its own
content, like a chip row; \`fill\` makes every direct child share the row's available
width equally via \`flex: 1 1 0%\` — the mechanism for two or more peer actions that
should divide a row evenly, such as a dialog's Cancel/Confirm pair (see
Patterns/ConfirmDialog, Patterns/UnitSheet). Pair it with \`align="stretch"\` to also
equalise height when one label might wrap and the other doesn't. A single full-width
action uses \`Button\`'s own \`block\` prop instead — \`Button\` always hugs its own
content by default, and it's the surrounding layout, not the button, that decides
whether it should expand.

There is no separate \`Container\` primitive: on this mobile-only prototype (320–430 CSS
px, no desktop layout in scope) the page-inset responsibility a "container" would carry
is already owned by \`RootScreenLayout\`/\`FocusedFlowLayout\`'s own content padding, so a
generic centring/max-width wrapper has no real consumer to serve yet.
        `,
      },
    },
  },
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

const STEPS: readonly SpaceStep[] = [0, 4, 8, 12, 16, 24, 32];

export const StackGaps: Story = {
  name: 'Stack — every step',
  render: () => (
    <Stack gap={16}>
      {STEPS.map((step) => (
        <div key={step}>
          <Text as="p" variant="caption" color="secondary">
            gap {step}
          </Text>
          <Stack gap={step} data-step={step}>
            <Surface padding={0} tone="sunken" border="none" radius="structure">
              <div style={{ height: 8 }} />
            </Surface>
            <Surface padding={0} tone="sunken" border="none" radius="structure">
              <div style={{ height: 8 }} />
            </Surface>
          </Stack>
        </div>
      ))}
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    for (const step of STEPS) {
      const stack = canvasElement.querySelector<HTMLElement>(`[data-step="${step}"]`);
      await expect(stack).not.toBeNull();
      if (stack) await expect(parseFloat(getComputedStyle(stack).rowGap)).toBe(step);
    }
  },
};

export const InlineWrap: Story = {
  name: 'Inline — wrapping chips row (hug)',
  render: () => (
    <Inline gap={8} wrap block>
      {['300–500 kcal', '10 g protein or more', 'Under 30 min', 'Vegan', 'Gluten-free', 'Dairy-free'].map((label) => (
        <Surface key={label} padding={12} radius="control" border="control">
          <Text variant="label">{label}</Text>
        </Surface>
      ))}
    </Inline>
  ),
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    const row = canvasElement.firstElementChild as HTMLElement;
    await expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth + 1);
  },
};

export const InlineFillEqualWidth: Story = {
  name: 'Inline — two fill buttons share width equally',
  render: () => (
    <Inline gap={8} distribute="fill" align="stretch" block>
      <Button variant="secondary">Cancel</Button>
      <Button variant="primary">Confirm and calculate</Button>
    </Inline>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cancel = canvas.getByRole('button', { name: 'Cancel' });
    const confirm = canvas.getByRole('button', { name: 'Confirm and calculate' });
    // Equal width despite very different label lengths.
    await expect(Math.abs(cancel.getBoundingClientRect().width - confirm.getBoundingClientRect().width)).toBeLessThanOrEqual(1);
    // align="stretch" equalises height too, and the 48 px floor still holds.
    await expect(Math.abs(cancel.getBoundingClientRect().height - confirm.getBoundingClientRect().height)).toBeLessThanOrEqual(1);
    await expect(cancel.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
  },
};

export const InlineFillNarrow320: Story = {
  name: 'Inline — fill buttons at 320, long labels wrap and stay equal-height',
  render: () => (
    <Inline gap={8} distribute="fill" align="stretch" block>
      <Button variant="secondary">Keep editing</Button>
      <Button variant="destructive">Discard everything I typed</Button>
    </Inline>
  ),
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const keep = canvas.getByRole('button', { name: 'Keep editing' });
    const discard = canvas.getByRole('button', { name: 'Discard everything I typed' });
    await expect(Math.abs(keep.getBoundingClientRect().width - discard.getBoundingClientRect().width)).toBeLessThanOrEqual(1);
    await expect(Math.abs(keep.getBoundingClientRect().height - discard.getBoundingClientRect().height)).toBeLessThanOrEqual(1);
    await expectNoHorizontalOverflow();
  },
};

export const InlineFillEnlargedText: Story = {
  name: 'Inline — fill buttons at 320, 200 % text',
  render: () => (
    <Inline gap={8} distribute="fill" align="stretch" block>
      <Button variant="secondary">Keep editing</Button>
      <Button variant="destructive">Discard everything I typed</Button>
    </Inline>
  ),
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const keep = canvas.getByRole('button', { name: 'Keep editing' });
    const discard = canvas.getByRole('button', { name: 'Discard everything I typed' });
    await expect(Math.abs(keep.getBoundingClientRect().width - discard.getBoundingClientRect().width)).toBeLessThanOrEqual(1);
    await expect(keep.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
    await expectNoHorizontalOverflow();
  },
};
