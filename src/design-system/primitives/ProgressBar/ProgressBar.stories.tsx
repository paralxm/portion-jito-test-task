import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Stack } from '../layout/Stack';
import { Text } from '../Text/Text';
import { ProgressBar, barRatio } from './ProgressBar';

const meta = {
  title: 'Primitives/ProgressBar',
  component: ProgressBar,
  args: { value: 400, max: 2000, label: 'Calories logged against your goal', valueText: '400 of 2,000 kcal, 20 %', marker: true },
  parameters: {
    docs: {
      description: {
        component: `
A determinate quantity against a known bound: track, bounded fill and an optional goal marker at the end of the track. Exposed as a \`meter\` with \`aria-valuetext\`; with no value or no bound it is an unavailable presentation (track alone, \`role="img"\`, never 0 %). Over the bound the fill stops at the marker and \`data-over\` is set — the words beside the bar state the excess; the fill keeps its colour. Tones: default (progress indicator, action blue as information), water, protein, carbohydrates, fat. The fill's width transition uses the value-change token and collapses under reduced motion. \`ProgressRing\` is deprecated in favour of this primitive.
        `,
      },
    },
  },
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Partial: Story = {
  name: 'Partial — 400 of 2,000 with the goal marker',
  play: async ({ canvasElement }) => {
    const meter = within(canvasElement).getByRole('meter', { name: 'Calories logged against your goal' });
    await expect(meter).toHaveAttribute('aria-valuenow', '400');
    await expect(meter).toHaveAttribute('aria-valuetext', '400 of 2,000 kcal, 20 %');
    const fill = meter.querySelector('[class*="fill"]') as HTMLElement;
    await expect(Math.round((fill.getBoundingClientRect().width / (fill.parentElement as HTMLElement).getBoundingClientRect().width) * 100)).toBe(20);
  },
};

export const AllStates: Story = {
  name: 'All states',
  render: () => (
    <Stack gap={16}>
      {[
        ['Empty — 0 of 2,000', 0, 2000, false],
        ['Partial — 400 of 2,000', 400, 2000, false],
        ['Reached — 2,000 of 2,000', 2000, 2000, false],
        ['Over — 2,150 of 2,000 (fill stops at the marker)', 2150, 2000, true],
      ].map(([title, value, max, over]) => (
        <Stack key={title as string} gap={4}>
          <Text as="p" variant="supporting" color="secondary">
            {title}
          </Text>
          <ProgressBar value={value as number} max={max as number} label={title as string} marker />
          {over ? (
            <Text as="p" variant="caption" color="secondary">
              150 kcal over goal — stated in words, not by colour.
            </Text>
          ) : null}
        </Stack>
      ))}
      <Stack gap={4}>
        <Text as="p" variant="supporting" color="secondary">
          Unavailable — no bound (track alone, not 0 %)
        </Text>
        <ProgressBar value={400} max={null} label="Calories logged against your goal" marker />
      </Stack>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('meter')).toHaveLength(4);
    const over = canvasElement.querySelector('[data-over]');
    await expect(over).not.toBeNull();
    await expect(canvas.getByRole('img', { name: /not available/ })).toBeInTheDocument();
    await expect(barRatio(2150, 0, 2000)).toEqual({ ratio: 1, over: true });
    await expect(barRatio(400, 0, null)).toEqual({ ratio: null, over: false });
  },
};

export const Tones: Story = {
  name: 'Tones — water and the three macros (compact)',
  render: () => (
    <Stack gap={12}>
      <ProgressBar value={1250} max={2000} label="Water" valueText="1.25 of 2 litres" tone="water" />
      <ProgressBar value={24} max={120} label="Protein" valueText="24 of 120 g" tone="protein" size="compact" />
      <ProgressBar value={48} max={220} label="Carbohydrates" valueText="48 of 220 g" tone="carbohydrates" size="compact" />
      <ProgressBar value={14} max={65} label="Fat" valueText="14 of 65 g" tone="fat" size="compact" />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('meter', { name: 'Water' })).toHaveAttribute('aria-valuetext', '1.25 of 2 litres');
  },
};

export const ReducedMotion: Story = {
  name: 'Reduced motion — no width transition',
  decorators: [
    (Story) => (
      <div data-portion-motion="reduced">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const fill = canvasElement.querySelector('[class*="fill"]') as HTMLElement;
    await expect(getComputedStyle(fill).transitionDuration).toBe('0s');
  },
};
