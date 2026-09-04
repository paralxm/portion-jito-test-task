import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Stack } from '../primitives/layout/Stack';
import { Text } from '../primitives/Text/Text';
import { contrastBetweenVars, formatRatio, resolveVar } from '../storybook/contrast';

const meta = {
  title: 'Foundations/Colors',
  parameters: {
    docs: {
      description: {
        component:
          'Semantic colour roles resolved from the generated tokens, with WCAG contrast recomputed in the browser for the actual pairs the product uses. Nutrition category colours are labelled markers only — numbers stay neutral, and categories are never aliased to success/error. The decorative border is 1.23:1 on canvas and must never be a control’s only boundary.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const GROUPS: Record<string, string[]> = {
  Background: ['--portion-color-background-canvas', '--portion-color-background-surface', '--portion-color-background-sunken'],
  Text: ['--portion-color-text-primary', '--portion-color-text-secondary', '--portion-color-text-on-action', '--portion-color-text-disabled'],
  Action: ['--portion-color-action-primary', '--portion-color-action-hover', '--portion-color-action-pressed', '--portion-color-action-selected-surface', '--portion-color-action-secondary-surface'],
  Progress: ['--portion-color-progress-track', '--portion-color-progress-indicator'],
  Border: ['--portion-color-border-control', '--portion-color-border-decorative', '--portion-color-focus-ring'],
  Feedback: [
    '--portion-color-feedback-error-foreground',
    '--portion-color-feedback-error-surface',
    '--portion-color-feedback-warning-foreground',
    '--portion-color-feedback-warning-surface',
    '--portion-color-feedback-success-foreground',
    '--portion-color-feedback-success-surface',
    '--portion-color-feedback-info-foreground',
    '--portion-color-feedback-info-surface',
  ],
  Nutrition: [
    '--portion-color-nutrition-energy-accent',
    '--portion-color-nutrition-protein-accent',
    '--portion-color-nutrition-carbohydrates-accent',
    '--portion-color-nutrition-fat-accent',
    '--portion-color-nutrition-fibre-accent',
    '--portion-color-nutrition-vitamins-accent',
    '--portion-color-nutrition-minerals-accent',
  ],
  State: ['--portion-color-state-disabled-surface', '--portion-color-state-disabled-text', '--portion-color-overlay-scrim'],
};

interface Pair {
  label: string;
  fg: string;
  bg: string;
  /** Required ratio: 4.5 text, 3 large text or non-text boundary. */
  minimum: number;
}

const PAIRS: Pair[] = [
  { label: 'Primary text on canvas', fg: '--portion-color-text-primary', bg: '--portion-color-background-canvas', minimum: 4.5 },
  { label: 'Secondary text on canvas', fg: '--portion-color-text-secondary', bg: '--portion-color-background-canvas', minimum: 4.5 },
  { label: 'Secondary text on surface', fg: '--portion-color-text-secondary', bg: '--portion-color-background-surface', minimum: 4.5 },
  { label: 'Text on action (primary button)', fg: '--portion-color-text-on-action', bg: '--portion-color-action-primary', minimum: 4.5 },
  { label: 'Inactive navigation glyph on the group surface', fg: '--portion-color-navigation-content', bg: '--portion-color-navigation-surface', minimum: 3 },
  { label: 'Active navigation label on the selected surface', fg: '--portion-color-navigation-selected-content', bg: '--portion-color-navigation-selected-surface', minimum: 4.5 },
  { label: 'Log food glyph on the action', fg: '--portion-color-navigation-action-content', bg: '--portion-color-navigation-action-surface', minimum: 3 },
  { label: 'Unselected segment label on the sunken track', fg: '--portion-color-text-primary', bg: '--portion-color-background-sunken', minimum: 4.5 },
  { label: 'Action text on canvas (text button, selected tab)', fg: '--portion-color-action-primary', bg: '--portion-color-background-canvas', minimum: 4.5 },
  { label: 'Error foreground on error surface', fg: '--portion-color-feedback-error-foreground', bg: '--portion-color-feedback-error-surface', minimum: 4.5 },
  { label: 'Warning foreground on warning surface', fg: '--portion-color-feedback-warning-foreground', bg: '--portion-color-feedback-warning-surface', minimum: 4.5 },
  { label: 'Success foreground on success surface', fg: '--portion-color-feedback-success-foreground', bg: '--portion-color-feedback-success-surface', minimum: 4.5 },
  { label: 'Info foreground on info surface', fg: '--portion-color-feedback-info-foreground', bg: '--portion-color-feedback-info-surface', minimum: 4.5 },
  { label: 'Error text on canvas (field message)', fg: '--portion-color-feedback-error-foreground', bg: '--portion-color-background-canvas', minimum: 4.5 },
  { label: 'Control border on canvas (non-text boundary)', fg: '--portion-color-border-control', bg: '--portion-color-background-canvas', minimum: 3 },
  { label: 'Focus ring on canvas (non-text)', fg: '--portion-color-focus-ring', bg: '--portion-color-background-canvas', minimum: 3 },
  { label: 'Action primary on canvas (indicator, non-text)', fg: '--portion-color-action-primary', bg: '--portion-color-background-canvas', minimum: 3 },
  { label: 'Primary text on surface (Home daily group, method tiles)', fg: '--portion-color-text-primary', bg: '--portion-color-background-surface', minimum: 4.5 },
  { label: 'Primary text on sunken (segmented track, thumbnails)', fg: '--portion-color-text-primary', bg: '--portion-color-background-sunken', minimum: 4.5 },
  { label: 'Secondary text on sunken (unselected segment, no-photo fallback, tags)', fg: '--portion-color-text-secondary', bg: '--portion-color-background-sunken', minimum: 4.5 },
  { label: 'Secondary button: action text on secondary surface', fg: '--portion-color-action-primary', bg: '--portion-color-action-secondary-surface', minimum: 4.5 },
  { label: 'Secondary button pressed: action pressed on secondary surface', fg: '--portion-color-action-pressed', bg: '--portion-color-action-secondary-surface', minimum: 4.5 },
  { label: 'Selected chip / count badge: action pressed on selected surface', fg: '--portion-color-action-pressed', bg: '--portion-color-action-selected-surface', minimum: 4.5 },
  { label: 'Selected segment boundary: control border on sunken track (non-text)', fg: '--portion-color-border-control', bg: '--portion-color-background-sunken', minimum: 3 },
  { label: 'Control border on surface (tile hover boundary, non-text)', fg: '--portion-color-border-control', bg: '--portion-color-background-surface', minimum: 3 },
  { label: 'Progress indicator on progress track (graphical object)', fg: '--portion-color-progress-indicator', bg: '--portion-color-progress-track', minimum: 3 },
  { label: 'Progress indicator on surface (ring on the Home group)', fg: '--portion-color-progress-indicator', bg: '--portion-color-background-surface', minimum: 3 },
  { label: 'Focus ring on surface (non-text)', fg: '--portion-color-focus-ring', bg: '--portion-color-background-surface', minimum: 3 },
  { label: 'Focus ring on action primary (ring adjacent to a primary button, non-text)', fg: '--portion-color-focus-ring', bg: '--portion-color-action-primary', minimum: 0 },
  { label: 'Disabled text on disabled surface (inactive component — exempt; must stay legible)', fg: '--portion-color-state-disabled-text', bg: '--portion-color-state-disabled-surface', minimum: 0 },
  { label: 'Disabled text on canvas (disabled segment/chip — exempt)', fg: '--portion-color-state-disabled-text', bg: '--portion-color-background-canvas', minimum: 0 },
  { label: 'Progress track on canvas (non-essential guide — not required)', fg: '--portion-color-progress-track', bg: '--portion-color-background-canvas', minimum: 0 },
  { label: 'Decorative border on canvas (decorative only — not required)', fg: '--portion-color-border-decorative', bg: '--portion-color-background-canvas', minimum: 0 },
];

function Swatch({ name }: { name: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '48px minmax(0, 1fr)', gap: 12, alignItems: 'center' }}>
      <div style={{ inlineSize: 48, blockSize: 48, borderRadius: 8, background: `var(${name})`, border: '1px solid var(--portion-color-border-decorative)' }} />
      <div>
        <Text as="p" variant="supporting">
          {name.replace('--portion-color-', '')}
        </Text>
        <Text as="p" variant="caption" color="secondary" numeric>
          {resolveVar(name)}
        </Text>
      </div>
    </div>
  );
}

export const SemanticRoles: Story = {
  name: 'Semantic roles',
  render: () => (
    <Stack gap={24}>
      {Object.entries(GROUPS).map(([group, names]) => (
        <section key={group}>
          <Text as="h2" variant="section-title">
            {group}
          </Text>
          <Stack gap={8}>
            {names.map((name) => (
              <Swatch key={name} name={name} />
            ))}
          </Stack>
        </section>
      ))}
    </Stack>
  ),
};

export const ContrastPairs: Story = {
  name: 'Contrast pairs (recomputed)',
  render: () => (
    <table style={{ borderCollapse: 'collapse', inlineSize: '100%' }}>
      <thead>
        <tr>
          {['Pair', 'Ratio', 'Required'].map((h) => (
            <th key={h} style={{ textAlign: 'start', padding: '4px 8px', borderBlockEnd: '1px solid var(--portion-color-border-control)' }}>
              <Text variant="label">{h}</Text>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {PAIRS.map((pair) => {
          const ratio = contrastBetweenVars(pair.fg, pair.bg);
          const ok = pair.minimum === 0 || (ratio !== null && ratio >= pair.minimum);
          return (
            <tr key={pair.label} data-pair={pair.label} data-ok={ok}>
              <td style={{ padding: '8px' }}>
                <span
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', inlineSize: 40, blockSize: 24, borderRadius: 4, background: `var(${pair.bg})`, border: '1px solid var(--portion-color-border-decorative)', marginInlineEnd: 8, verticalAlign: 'middle' }}
                  aria-hidden="true"
                >
                  <span style={{ display: 'block', inlineSize: 20, blockSize: 8, borderRadius: 2, background: `var(${pair.fg})` }} />
                </span>
                <Text variant="supporting">{pair.label}</Text>
              </td>
              <td style={{ padding: '8px' }}>
                <Text variant="supporting" numeric>
                  {formatRatio(ratio)}
                </Text>
              </td>
              <td style={{ padding: '8px' }}>
                <Text variant="supporting" color="secondary">
                  {pair.minimum === 0 ? 'none (exempt or decorative)' : `${pair.minimum}:1 ${ok ? '— met' : '— NOT met'}`}
                </Text>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  ),
  play: async ({ canvasElement }) => {
    const rows = within(canvasElement).getAllByRole('row').slice(1);
    for (const row of rows) {
      await expect(row.getAttribute('data-ok')).toBe('true');
    }
  },
};
