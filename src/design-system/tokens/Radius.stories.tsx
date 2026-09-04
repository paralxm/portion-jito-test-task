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
        component: `
The radius catalogue is 0/4/8/12/16/20/24/28/32/36/40/44/48/52/56/60/64 plus \`full\` (9999px). Components never read the catalogue directly; they consume one of seven semantic roles, so corner treatment follows what a surface *is*:

| Role | Value | Consumers |
| --- | --- | --- |
| \`structure\` | 0 | Full-bleed regions only — viewfinder, media breakouts, bars. Never the visible corner of an independent component surface. |
| \`control-compact\` | 4 | Elements nested inside another control, or non-interactive tags: segmented-control segments (track 8 − 4 padding), badges, checkbox boxes. |
| \`control\` | 8 | Buttons, inputs, search field, chips, the segmented-control track, inline messages, recipe-card thumbnails. |
| \`card\` | 12 | Independent content cards and tiles: recipe card, entry-method tile. |
| \`grouped\` | 16 | A surface that holds a whole section: Home's daily overview group, prototype-control groups. |
| \`sheet\` | 16 | Top corners of bottom sheets and every corner of a centred dialog. |
| \`navigation-group\` | 16 | The bottom navigation's compact destination group — chosen after rendering 12 and 16 (12 read as a card, 16 as a container). |
| \`navigation-item\` | 12 | The active destination's contained surface inside that group (16 − 4 px padding, concentric). |
| \`round\` | full | True circles only: the Log food action, radio marks, step-number discs, the progress ring's caps. |

Nested corners stay concentric (outer − padding = inner), and pill-shaped chips, fields, cards and buttons are not part of this system.
        `,
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const CATALOGUE = ['0', '4', '8', '12', '16', '20', '24', '28', '32', '36', '40', '44', '48', '52', '56', '60', '64', 'full'] as const;
const ROLES = [
  { role: 'structure', expected: '0px' },
  { role: 'control-compact', expected: '4px' },
  { role: 'control', expected: '8px' },
  { role: 'card', expected: '12px' },
  { role: 'grouped', expected: '16px' },
  { role: 'navigation-group', expected: '16px' },
  { role: 'navigation-item', expected: '12px' },
  { role: 'sheet', expected: '16px' },
  { role: 'round', expected: '9999px' },
] as const;

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
      {ROLES.map(({ role }) => (
        <Stack key={role} gap={4} align="center" block={false}>
          <div style={{ inlineSize: 72, blockSize: 72, background: 'var(--portion-color-background-surface)', border: '1px solid var(--portion-color-border-control)', borderRadius: `var(--portion-radius-${role})` }} />
          <Text variant="caption" numeric>
            {role} · {resolveVar(`--portion-radius-${role}`)}
          </Text>
        </Stack>
      ))}
    </Inline>
  ),
  play: async () => {
    // Distinct restrained roles — never "everything 4 px" and never "everything rounded":
    // 0 / 4 / 8 / 12 / 16 / full, with grouped and sheet sharing the 16 px step.
    for (const { role, expected } of ROLES) await expect(resolveVar(`--portion-radius-${role}`)).toBe(expected);
    await expect(new Set(ROLES.map(({ role }) => resolveVar(`--portion-radius-${role}`))).size).toBe(6);
  },
};
