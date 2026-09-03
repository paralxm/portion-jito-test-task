import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { Inline } from '../primitives/layout/Inline';
import { Stack } from '../primitives/layout/Stack';
import { Text } from '../primitives/Text/Text';
import { resolveVar } from '../storybook/contrast';

const meta = {
  title: 'Foundations/Radius',
  parameters: {
    docs: {
      description: {
        component:
          'The radius catalogue is 0/4/8/12/16/20/24/28/32/36/40/44/48/52/56/60/64 plus `full` (9999px). Semantic roles: `structure` for large regions, `control` for fields and buttons, `card`, `sheet` for the top edge of overlays, and `round` (full) for actual circles only — pill-shaped chips and buttons are not part of this system.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const CATALOGUE = ['0', '4', '8', '12', '16', '20', '24', '28', '32', '36', '40', '44', '48', '52', '56', '60', '64', 'full'] as const;
const ROLES = ['structure', 'control', 'card', 'sheet', 'round'] as const;

export const Catalogue: Story = {
  render: () => (
    <Inline gap={16} wrap align="end">
      {CATALOGUE.map((step) => (
        <Stack key={step} gap={4} align="center" block={false}>
          <div style={{ inlineSize: 72, blockSize: 72, border: '2px solid var(--portion-color-border-control)', borderRadius: `var(--portion-ref-radius-${step})` }} />
          <Text variant="caption" numeric>
            {step === 'full' ? 'full' : `${step} px`}
          </Text>
        </Stack>
      ))}
    </Inline>
  ),
  play: async () => {
    await expect(CATALOGUE.length).toBe(18);
    await expect(resolveVar('--portion-ref-radius-full')).toBe('9999px');
    await expect(resolveVar('--portion-ref-radius-12')).toBe('12px');
  },
};

export const SemanticRoles: Story = {
  name: 'Semantic roles',
  render: () => (
    <Inline gap={16} wrap align="end">
      {ROLES.map((role) => (
        <Stack key={role} gap={4} align="center" block={false}>
          <div style={{ inlineSize: 72, blockSize: 72, background: 'var(--portion-color-background-surface)', border: '1px solid var(--portion-color-border-control)', borderRadius: `var(--portion-radius-${role})` }} />
          <Text variant="caption">
            {role} · {resolveVar(`--portion-radius-${role}`)}
          </Text>
        </Stack>
      ))}
    </Inline>
  ),
};
