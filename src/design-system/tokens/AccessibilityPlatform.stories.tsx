import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Plus, X } from '@phosphor-icons/react';

import { IconButton } from '../primitives/IconButton/IconButton';
import { Inline } from '../primitives/layout/Inline';
import { Stack } from '../primitives/layout/Stack';
import { Text } from '../primitives/Text/Text';
import { resolveVar } from '../storybook/contrast';

const meta = {
  title: 'Foundations/Accessibility and platform',
  parameters: {
    docs: {
      description: {
        component:
          'Portion is an iOS-oriented web prototype. Every measurement in code and stories is in CSS px; the iOS column is a platform mapping for a future native implementation and never relabels a CSS value as points. The 48 px target baseline is this product’s rule (stricter than WCAG 2.2 AA’s 24 px minimum); Add food is 56 px. Text scales from the browser preference through rem tokens; the navigation bar measures its labels and rearranges 2 × 2 when a word cannot fit.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const LEDGER: Array<[string, string, string, string]> = [
  ['Root text size', '16 CSS px (html 100 %)', 'Dynamic Type, Body 17 pt', 'Platform mapping — not equivalent values'],
  ['Minimum target', '48 × 48 CSS px', 'HIG 44 × 44 pt', 'Product baseline is stricter; keep 48'],
  ['Add food target', '56 × 56 CSS px', 'Custom, 56 pt', 'Action in the bottom row, never a tab'],
  ['Bottom bar', 'Custom: 3 destinations + 1 action', 'UITabBar has no trailing action', 'Native would need a custom bar'],
  ['Modal sheet', 'Native <dialog>, focus contained', 'UISheetPresentationController', 'Detents are not promised'],
  ['Safe areas', 'env(safe-area-inset-*) added to page spacing', 'safeAreaInsets', 'viewport-fit=cover in index.html'],
  ['Keyboard', 'visualViewport shrink + text focus hides the bar', 'Keyboard frame notifications', 'Desktop focus alone never hides it'],
  ['Focus ring', '3 px ring, 2 px gap, outline outside', 'Full Keyboard Access ring', 'Never clipped by overflow'],
  ['Reduced motion', 'prefers-reduced-motion → 0 ms', 'UIAccessibility.isReduceMotionEnabled', 'Information never depends on motion'],
  ['Typeface', 'Inter Variable (wght + opsz)', 'SF Pro is the system default', 'Inter is the approved brand face'],
];

export const TargetSizes: Story = {
  name: 'Target sizes',
  render: () => (
    <Stack gap={16}>
      <Text as="p" variant="supporting" color="secondary">
        Minimum target {resolveVar('--portion-size-target-minimum')} · Add food {resolveVar('--portion-size-target-add-food')} · glyph {resolveVar('--portion-size-icon-default')}
      </Text>
      <Inline gap={16} align="end">
        <IconButton icon={X} label="Close" variant="outlined" />
        <IconButton icon={Plus} label="Add food" variant="outlined" size="large" />
      </Inline>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    await expect(resolveVar('--portion-size-target-minimum')).toBe('48px');
    await expect(resolveVar('--portion-size-target-add-food')).toBe('56px');
    const close = within(canvasElement).getByRole('button', { name: 'Close' }).getBoundingClientRect();
    const add = within(canvasElement).getByRole('button', { name: 'Add food' }).getBoundingClientRect();
    await expect(Math.min(close.width, close.height)).toBeGreaterThanOrEqual(48);
    await expect(Math.min(add.width, add.height)).toBeGreaterThanOrEqual(56);
  },
};

export const PlatformLedger: Story = {
  name: 'iOS platform ledger',
  render: () => (
    <div style={{ overflowX: 'auto' }} role="region" aria-label="Platform ledger" tabIndex={0}>
      <table style={{ borderCollapse: 'collapse', inlineSize: '100%' }}>
        <thead>
          <tr>
            {['Concern', 'This prototype (CSS px)', 'iOS counterpart', 'Note'].map((h) => (
              <th key={h} style={{ textAlign: 'start', padding: '4px 8px', borderBlockEnd: '1px solid var(--portion-color-border-control)' }}>
                <Text variant="label">{h}</Text>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {LEDGER.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, i) => (
                <td key={i} style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                  <Text variant="supporting" wrap color={i === 3 ? 'secondary' : 'primary'}>
                    {cell}
                  </Text>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
};

export const SafeAreas: Story = {
  name: 'Safe-area insets',
  render: () => (
    <Stack gap={8}>
      <Text as="p" variant="body" wrap>
        The bar and focused footers add <code>env(safe-area-inset-bottom)</code> to their own padding; page spacing is not reduced to make room. In this desktop preview the inset resolves to 0.
      </Text>
      <Text as="p" variant="supporting" color="secondary" numeric>
        --portion-safe-area-bottom → {resolveVar('--portion-safe-area-bottom') || '0px'}
      </Text>
    </Stack>
  ),
};
