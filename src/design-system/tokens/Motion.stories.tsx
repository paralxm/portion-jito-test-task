import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { Button } from '../primitives/Button/Button';
import { Stack } from '../primitives/layout/Stack';
import { Text } from '../primitives/Text/Text';
import { resolveVar } from '../storybook/contrast';

const meta = {
  title: 'Foundations/Motion',
  parameters: {
    docs: {
      description: {
        component:
          'Motion answers a person’s action: press, selection and validation use the feedback duration; disclosure and asynchronous results use the disclosure duration; sheets and navigation use the overlay duration, all with one standard easing. Under `prefers-reduced-motion: reduce` (or `data-portion-motion="reduced"`) every transition token collapses to 0 ms, so nothing depends on animation to be understood.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const TRANSITIONS = ['press', 'selection', 'validation', 'disclosure', 'async-result', 'sheet', 'navigation'] as const;

function Disclosure() {
  const [open, setOpen] = useState(false);
  return (
    <Stack gap={8} align="start">
      <Button variant="secondary" size="compact" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? 'Show less' : 'Show more'}
      </Button>
      <div
        data-panel
        style={{
          overflow: 'hidden',
          maxBlockSize: open ? 120 : 0,
          opacity: open ? 1 : 0,
          transition: 'max-block-size var(--portion-motion-transition-disclosure) var(--portion-motion-easing-standard), opacity var(--portion-motion-transition-disclosure) var(--portion-motion-easing-standard)',
        }}
      >
        <Text as="p" variant="body">
          Fibre 8 g, Vitamin C 12 mg, Calcium 120 mg.
        </Text>
      </div>
    </Stack>
  );
}

export const Tokens: Story = {
  render: () => (
    <table style={{ borderCollapse: 'collapse' }}>
      <tbody>
        {(['instant', 'feedback', 'disclosure', 'overlay'] as const).map((d) => (
          <tr key={d}>
            <td style={{ padding: '4px 12px 4px 0' }}>
              <Text variant="supporting">duration.{d}</Text>
            </td>
            <td>
              <Text variant="supporting" numeric>
                {resolveVar(`--portion-motion-duration-${d}`)}
              </Text>
            </td>
          </tr>
        ))}
        {TRANSITIONS.map((t) => (
          <tr key={t}>
            <td style={{ padding: '4px 12px 4px 0' }}>
              <Text variant="supporting">transition.{t}</Text>
            </td>
            <td>
              <Text variant="supporting" numeric>
                {resolveVar(`--portion-motion-transition-${t}`)}
              </Text>
            </td>
          </tr>
        ))}
        <tr>
          <td style={{ padding: '4px 12px 4px 0' }}>
            <Text variant="supporting">easing.standard</Text>
          </td>
          <td>
            <Text variant="supporting" numeric>
              {resolveVar('--portion-motion-easing-standard')}
            </Text>
          </td>
        </tr>
      </tbody>
    </table>
  ),
  play: async () => {
    await expect(resolveVar('--portion-motion-easing-standard')).toContain('cubic-bezier');
    for (const t of TRANSITIONS) await expect(resolveVar(`--portion-motion-transition-${t}`)).toMatch(/ms$/);
  },
};

export const DisclosureDemo: Story = {
  name: 'Disclosure (user-triggered)',
  render: () => <Disclosure />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Show more' }));
    await expect(canvas.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');
  },
};

export const ReducedMotion: Story = {
  name: 'Reduced motion collapses transitions',
  render: () => (
    <div data-portion-motion="reduced">
      <Disclosure />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const panel = canvasElement.querySelector<HTMLElement>('[data-panel]')!;
    await expect(resolveVar('--portion-motion-transition-disclosure', panel)).toBe('0ms');
    await expect(getComputedStyle(panel).transitionDuration.split(',').every((d) => parseFloat(d) === 0)).toBe(true);
  },
};
