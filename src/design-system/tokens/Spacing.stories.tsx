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
        component: `
The approved \`reference.space\` scale is exactly 0/4/8/12/16/24/32 px — **spacing between
elements**, and nothing else. Every semantic spacing role this system defines (page
inset, card padding, card gap, form group, section, and every smaller
label/helper/paragraph role) resolves to one of these seven steps — checked below
against the live tokens, not just declared. **The parent layout owns spacing between its
children** (\`Stack\`/\`Inline\` \`gap\`, typed to this same seven-value union, or a
template's own \`gap\`/padding); a reusable component owns only its own internal padding
and internal gaps, never an external margin reaching for a sibling it doesn't control.

A handful of components have their own fixed dimension in this numeric neighbourhood —
\`Chip\`'s minimum height (40 px), \`ModalSheet\`'s drag handle width (40 px), and
\`FoodResultRow\`/\`MethodRow\`/\`AppHeader\`'s minimum row height (56 px) — but these are
plain pixel literals written directly in the component's own CSS, not \`reference.space\`
tokens. A fixed dimension is a different concept from spacing between siblings, so it is
never exposed through \`gap\` or any spacing token.

Product and component styles consume semantic roles or the \`Stack\`/\`Inline\` primitives,
never a raw \`reference.space\` value, outside of token definitions and this catalogue.
\`full = 9999px\` is a radius token, not a spacing step. Safe-area insets are added on top
of page spacing by the bar and focused footers.
        `,
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const STEPS = [0, 4, 8, 12, 16, 24, 32] as const;
/** The subset every semantic "spacing between elements" role is verified to stay within. */
const APPROVED_LAYOUT_STEPS = ['0px', '4px', '8px', '12px', '16px', '24px', '32px'] as const;

const ROLES = [
  'page-inset',
  'section',
  'related',
  'card-padding',
  'card-gap',
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

/** Components with their own fixed pixel dimension near this scale — plain literals, not tokens. */
const FIXED_DIMENSION_USES = [
  { step: 40, owner: 'Chip', use: 'minimum height' },
  { step: 40, owner: 'ModalSheet', use: 'drag handle width' },
  { step: 56, owner: 'FoodResultRow / MethodRow', use: 'minimum row height' },
  { step: 56, owner: 'AppHeader', use: 'minimum height (plus safe-area-top)' },
] as const;

export const Scale: Story = {
  render: () => (
    <Stack gap={8}>
      {STEPS.map((step) => (
        <div key={step} style={{ display: 'grid', gridTemplateColumns: '64px minmax(0, 1fr)', alignItems: 'center', gap: 12 }}>
          <Text variant="supporting" numeric>
            {step} px
          </Text>
          <div
            style={{
              blockSize: 16,
              inlineSize: `var(--portion-ref-space-${step})`,
              background: 'var(--portion-color-action-primary)',
              borderRadius: 2,
              minInlineSize: step === 0 ? 1 : undefined,
            }}
          />
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
  name: 'Semantic roles (spacing between elements)',
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
    // Establishes the contract as an executable check, not just prose: every semantic
    // "spacing between elements" role must stay within the approved 0/4/8/12/16/24/32
    // subset. This fails if a future role is ever added at 36+.
    for (const role of ROLES) {
      const value = resolveVar(`--portion-spacing-${role}`);
      await expect(APPROVED_LAYOUT_STEPS).toContain(value);
    }
  },
};

export const FixedDimensionsAboveTheLayoutScale: Story = {
  name: 'Fixed dimensions above 32 — plain literals, not spacing tokens',
  render: () => (
    <table style={{ borderCollapse: 'collapse' }}>
      <tbody>
        {FIXED_DIMENSION_USES.map(({ step, owner, use }, i) => (
          <tr key={i}>
            <td style={{ padding: '4px 12px 4px 0' }}>
              <Text variant="supporting" numeric>
                {step} px
              </Text>
            </td>
            <td style={{ padding: '4px 12px 4px 0' }}>
              <Text variant="supporting">{owner}</Text>
            </td>
            <td>
              <Text variant="supporting" color="secondary">
                {use}
              </Text>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
