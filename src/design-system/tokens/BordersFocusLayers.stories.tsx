import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { Button } from '../primitives/Button/Button';
import { Input } from '../primitives/Input/Input';
import { Stack } from '../primitives/layout/Stack';
import { Surface } from '../primitives/Surface/Surface';
import { Text } from '../primitives/Text/Text';
import { resolveVar } from '../storybook/contrast';

const meta = {
  title: 'Foundations/Borders, focus and layers',
  parameters: {
    docs: {
      description: {
        component:
          'Borders: a 1 px default width, a decorative colour for grouping (1.23:1 on canvas, never a control’s only boundary) and a control colour for essential boundaries. Focus: a 3 px ring with a 2 px canvas gap, drawn outside the control and never clipped. Layers: content 0, sticky 10, navigation 20, scrim 30, modal 40. Elevation (shadow) belongs to sheets only.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Borders: Story = {
  render: () => (
    <Stack gap={12}>
      <Surface border="decorative">
        <Text variant="body">decorative border · {resolveVar('--portion-color-border-decorative')} · width {resolveVar('--portion-border-width-default')}</Text>
      </Surface>
      <Surface border="control" radius="control" padding={12}>
        <Text variant="body">control border · {resolveVar('--portion-color-border-control')}</Text>
      </Surface>
      <div style={{ blockSize: 'var(--portion-border-width-navigation-indicator)', background: 'var(--portion-color-action-primary)', inlineSize: 96 }} />
      <Text variant="caption" color="secondary">
        navigation indicator · {resolveVar('--portion-border-width-navigation-indicator')}
      </Text>
    </Stack>
  ),
  play: async () => {
    await expect(resolveVar('--portion-border-width-default')).toBe('1px');
    await expect(resolveVar('--portion-border-width-navigation-indicator')).toBe('2px');
  },
};

export const FocusRing: Story = {
  name: 'Focus ring (3 px + 2 px gap)',
  render: () => (
    <Stack gap={16} align="start">
      <Text as="p" variant="supporting" color="secondary">
        Press Tab to move focus. The ring is drawn outside the control with a canvas gap; ancestors never clip it.
      </Text>
      <Button variant="primary">Confirm and calculate</Button>
      <Input aria-label="Amount" defaultValue="250" suffix="g" />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button');
    await userEvent.tab();
    await expect(document.activeElement).toBe(button);
    const style = getComputedStyle(button);
    await expect(style.outlineStyle).toBe('solid');
    await expect(parseFloat(style.outlineWidth)).toBe(3);
    await expect(parseFloat(style.outlineOffset)).toBe(2);
    await expect(resolveVar('--portion-focus-ring-width')).toBe('3px');
    await expect(resolveVar('--portion-focus-ring-offset')).toBe('2px');
  },
};

export const Layers: Story = {
  render: () => (
    <table style={{ borderCollapse: 'collapse' }}>
      <tbody>
        {(['content', 'sticky', 'navigation', 'scrim', 'modal'] as const).map((layer) => (
          <tr key={layer}>
            <td style={{ padding: '4px 12px 4px 0' }}>
              <Text variant="supporting">layer.{layer}</Text>
            </td>
            <td>
              <Text variant="supporting" numeric>
                {resolveVar(`--portion-layer-${layer}`)}
              </Text>
            </td>
          </tr>
        ))}
        <tr>
          <td style={{ padding: '4px 12px 4px 0' }}>
            <Text variant="supporting">shadow.sheet</Text>
          </td>
          <td>
            <Text variant="supporting" numeric>
              {resolveVar('--portion-shadow-sheet')}
            </Text>
          </td>
        </tr>
      </tbody>
    </table>
  ),
  play: async () => {
    await expect(Number(resolveVar('--portion-layer-modal'))).toBeGreaterThan(Number(resolveVar('--portion-layer-scrim')));
    await expect(Number(resolveVar('--portion-layer-scrim'))).toBeGreaterThan(Number(resolveVar('--portion-layer-navigation')));
  },
};
