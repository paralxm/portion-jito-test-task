import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Surface } from '../Surface/Surface';
import { Text } from '../Text/Text';
import { Inline } from './Inline';
import { Stack, type SpaceStep } from './Stack';

const meta = {
  title: 'Primitives/Layout',
  component: Stack,
  parameters: {
    docs: {
      description: {
        component:
          'Stack (vertical) and Inline (horizontal) place siblings with a gap from the spacing scale — 0/4/8/12/16/24/32/36/40/44/48/52/56/60/64 px — instead of margins. `full` is a radius token, not a spacing step.',
      },
    },
  },
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

const STEPS: readonly SpaceStep[] = [0, 4, 8, 12, 16, 24, 32, 36, 40, 44, 48, 52, 56, 60, 64];

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
  name: 'Inline — wrapping chips row',
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
