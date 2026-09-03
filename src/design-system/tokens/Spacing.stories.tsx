import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { Stack } from '../primitives/layout/Stack';
import { Text } from '../primitives/Text/Text';
import { resolveVar } from '../storybook/contrast';

const meta = {
  title: 'Foundations/Spacing and layout',
  parameters: {
    docs: {
      description: {
        component:
          'The spacing scale is exactly 0/4/8/12/16/24/32/36/40/44/48/52/56/60/64 px (`reference.space`). Product styles consume semantic roles (page inset, section, related, card padding, form group…) and the Stack/Inline primitives; `full = 9999px` is a radius token, not a spacing step. Safe-area insets are added on top of page spacing by the bar and focused footers.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const STEPS = [0, 4, 8, 12, 16, 24, 32, 36, 40, 44, 48, 52, 56, 60, 64] as const;

const ROLES = [
  'page-inset',
  'section',
  'related',
  'card-padding',
  'form-group',
  'heading-to-description',
  'section-title-to-content',
  'title-to-secondary',
  'label-to-control',
  'control-to-helper',
  'paragraph',
  'instruction-item',
  'icon-to-label',
  'nav-icon-to-label',
] as const;

export const Scale: Story = {
  render: () => (
    <Stack gap={8}>
      {STEPS.map((step) => (
        <div key={step} style={{ display: 'grid', gridTemplateColumns: '64px minmax(0, 1fr)', alignItems: 'center', gap: 12 }}>
          <Text variant="supporting" numeric>
            {step} px
          </Text>
          <div style={{ blockSize: 16, inlineSize: `var(--portion-ref-space-${step})`, background: 'var(--portion-color-action-primary)', borderRadius: 2, minInlineSize: step === 0 ? 1 : undefined }} />
        </div>
      ))}
    </Stack>
  ),
  play: async () => {
    for (const step of STEPS) {
      await expect(resolveVar(`--portion-ref-space-${step}`)).toBe(`${step}px`);
    }
  },
};

export const SemanticRoles: Story = {
  name: 'Semantic roles',
  render: () => (
    <table style={{ borderCollapse: 'collapse' }}>
      <tbody>
        {ROLES.map((role) => (
          <tr key={role}>
            <td style={{ padding: '4px 12px 4px 0' }}>
              <Text variant="supporting">spacing.{role}</Text>
            </td>
            <td style={{ padding: '4px 12px 4px 0' }}>
              <Text variant="supporting" numeric>
                {resolveVar(`--portion-spacing-${role}`)}
              </Text>
            </td>
            <td>
              <div style={{ blockSize: 12, inlineSize: `var(--portion-spacing-${role})`, background: 'var(--portion-color-nutrition-protein-accent)', borderRadius: 2 }} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
  play: async () => {
    for (const role of ROLES) {
      const value = resolveVar(`--portion-spacing-${role}`);
      await expect(STEPS.map((s) => `${s}px`)).toContain(value);
    }
  },
};
