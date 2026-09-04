import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Inline } from '../layout/Inline';
import { Stack } from '../layout/Stack';
import { Text } from '../Text/Text';
import { withRootFontSize } from '../../storybook/decorators';
import { contrastBetweenVars } from '../../storybook/contrast';
import { ProgressRing, progressRatio } from './ProgressRing';

const meta = {
  title: 'Primitives/ProgressRing',
  component: ProgressRing,
  args: { value: 61, min: 0, max: 100, size: 'large', label: '61 of 100, 61 %' },
  parameters: {
    docs: {
      description: {
        component: `
**Purpose.** A determinate quantity relative to a bound — a track and a bounded arc. It is the geometry under Home's calorie ring and knows nothing about calories, goals or entries: the consumer supplies \`value\`/\`min\`/\`max\`, an accessible \`label\` with units and state, and optional centre content.

**Not for.** Loading or pending work (use \`Spinner\`), a score, a health verdict, or any metric that has no bound.

**Contract.** \`value\` is clamped into \`[min, max]\`; a value past \`max\` still draws the full ring and reports \`data-state="over"\` so the words can say by how much. \`value: null\`, a non-finite number, or \`max <= min\` is *unavailable*: the track alone is drawn — never 0 % and never 100 %. 0 % draws no arc (no stray round cap). Geometry never changes between states.

**Sizes.** \`large\` (10 rem, 12 px stroke) holds centre content; \`medium\` (6 rem, 8 px stroke) sits beside its text. Both are rem-based so the ring grows with the user's text size; the SVG view box equals the 100 % size so strokes stay true.

**Accessibility.** The SVG is \`role="img"\` named by \`label\`; centre content is ordinary readable text. Nothing inside is focusable and no frame of the arc transition is announced. Reduced motion removes the arc's length transition.

**Colour.** \`progress-track\` (neutral-200, a non-essential guide) and \`progress-indicator\` (the energy category accent, neutral ink — not an action blue, never a success/error colour). The pair is 12.6:1.
        `,
      },
    },
  },
} satisfies Meta<typeof ProgressRing>;

export default meta;
type Story = StoryObj<typeof meta>;

const arcLength = (canvas: HTMLElement) => {
  const arc = canvas.querySelectorAll('circle')[1];
  if (!arc) return 0;
  const dasharray = parseFloat(arc.getAttribute('stroke-dasharray') ?? '0');
  const offset = parseFloat(arc.getAttribute('stroke-dashoffset') ?? '0');
  return dasharray - offset;
};

export const Partial: Story = {
  name: 'Partial — 61 %',
  play: async ({ canvasElement }) => {
    const img = within(canvasElement).getByRole('img', { name: '61 of 100, 61 %' });
    await expect(img).toBeInTheDocument();
    const ring = img.parentElement as HTMLElement;
    await expect(ring.dataset.state).toBe('partial');
    await expect(ring.getBoundingClientRect().width).toBeCloseTo(160, 0);
    await expect(arcLength(canvasElement)).toBeGreaterThan(0);
    // Indicator against track: meaningful graphical object, needs 3:1.
    await expect(contrastBetweenVars('--portion-color-progress-indicator', '--portion-color-progress-track')).toBeGreaterThanOrEqual(3);
  },
};

export const Zero: Story = {
  name: 'Zero — track only, no arc cap',
  args: { value: 0, label: '0 of 100, 0 %' },
  play: async ({ canvasElement }) => {
    const ring = within(canvasElement).getByRole('img').parentElement as HTMLElement;
    await expect(ring.dataset.state).toBe('zero');
    await expect(canvasElement.querySelectorAll('circle')).toHaveLength(1);
  },
};

export const Complete: Story = {
  name: 'Complete — 100 %',
  args: { value: 100, label: '100 of 100, 100 %' },
  play: async ({ canvasElement }) => {
    const ring = within(canvasElement).getByRole('img').parentElement as HTMLElement;
    await expect(ring.dataset.state).toBe('complete');
    await expect(parseFloat(canvasElement.querySelectorAll('circle')[1].getAttribute('stroke-dashoffset') ?? '1')).toBe(0);
  },
};

export const OverLimit: Story = {
  name: 'Over the limit — full ring, same geometry',
  args: { value: 140, label: '140 of 100, capped at 100 %' },
  play: async ({ canvasElement }) => {
    const ring = within(canvasElement).getByRole('img').parentElement as HTMLElement;
    await expect(ring.dataset.state).toBe('over');
    await expect(parseFloat(canvasElement.querySelectorAll('circle')[1].getAttribute('stroke-dashoffset') ?? '1')).toBe(0);
    await expect(progressRatio(140, 0, 100)).toEqual({ ratio: 1, over: true });
  },
};

export const Unavailable: Story = {
  name: 'Unavailable — null value draws the track only',
  args: { value: null, label: 'Progress not available' },
  play: async ({ canvasElement }) => {
    const ring = within(canvasElement).getByRole('img', { name: 'Progress not available' }).parentElement as HTMLElement;
    await expect(ring.dataset.state).toBe('unavailable');
    await expect(canvasElement.querySelectorAll('circle')).toHaveLength(1);
  },
};

export const InvalidInput: Story = {
  name: 'Invalid input is unavailable, not 0 % or 100 %',
  render: () => (
    <Inline gap={16} wrap align="start">
      <ProgressRing value={Number.NaN} label="NaN value" size="medium" />
      <ProgressRing value={50} min={100} max={100} label="Empty range" size="medium" />
      <ProgressRing value={-20} label="Below minimum" size="medium" />
    </Inline>
  ),
  play: async ({ canvasElement }) => {
    const rings = within(canvasElement).getAllByRole('img');
    await expect((rings[0].parentElement as HTMLElement).dataset.state).toBe('unavailable');
    await expect((rings[1].parentElement as HTMLElement).dataset.state).toBe('unavailable');
    await expect((rings[2].parentElement as HTMLElement).dataset.state).toBe('zero');
    await expect(progressRatio(Number.NaN, 0, 100).ratio).toBeNull();
    await expect(progressRatio(50, 100, 100).ratio).toBeNull();
    await expect(progressRatio(-20, 0, 100)).toEqual({ ratio: 0, over: false });
  },
};

export const WithCentreContent: Story = {
  name: 'Large with centre content',
  args: { value: 1350, max: 2200, label: '1,350 of 2,200 kcal logged today, 61 %' },
  render: (args) => (
    <ProgressRing {...args}>
      <Text as="p" variant="main-result" numeric color="primary">
        850
      </Text>
      <Text as="p" variant="label" color="secondary">
        kcal remaining
      </Text>
    </ProgressRing>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('850')).toBeVisible();
    const number = canvas.getByText('850');
    const ring = canvas.getByRole('img').parentElement as HTMLElement;
    const inner = ring.getBoundingClientRect();
    const box = number.getBoundingClientRect();
    await expect(box.left).toBeGreaterThanOrEqual(inner.left + 12);
    await expect(box.right).toBeLessThanOrEqual(inner.right - 12);
  },
};

export const Medium: Story = {
  name: 'Medium size beside text',
  args: { size: 'medium', value: 1350, max: 2200, label: '1,350 of 2,200 kcal logged today, 61 %' },
  render: (args) => (
    <Inline gap={16} align="center">
      <ProgressRing {...args} />
      <Stack gap={0}>
        <Text as="p" variant="metric-secondary" numeric color="primary">
          850 kcal
        </Text>
        <Text as="p" variant="supporting" color="secondary">
          remaining of 2,200
        </Text>
      </Stack>
    </Inline>
  ),
  play: async ({ canvasElement }) => {
    const ring = within(canvasElement).getByRole('img').parentElement as HTMLElement;
    await expect(ring.getBoundingClientRect().width).toBeCloseTo(96, 0);
  },
};

export const AllStates: Story = {
  name: 'All states',
  render: () => (
    <Inline gap={16} wrap align="start">
      {[
        { value: 0, label: 'Zero' },
        { value: 25, label: 'Small' },
        { value: 61, label: 'Mid' },
        { value: 95, label: 'Near complete' },
        { value: 100, label: 'Complete' },
        { value: 130, label: 'Over' },
        { value: null, label: 'Unavailable' },
      ].map((item) => (
        <Stack key={item.label} gap={4} align="center" block={false}>
          <ProgressRing value={item.value} label={`${item.label}: ${item.value ?? 'not available'} of 100`} size="medium" />
          <Text variant="caption" color="secondary">
            {item.label}
          </Text>
        </Stack>
      ))}
    </Inline>
  ),
};

export const ReducedMotion: Story = {
  name: 'Reduced motion — no arc transition',
  render: (args) => (
    <div data-portion-motion="reduced">
      <ProgressRing {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const arc = canvasElement.querySelectorAll('circle')[1];
    await expect(parseFloat(getComputedStyle(arc).transitionDuration)).toBe(0);
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 200 % scales the ring with its numbers',
  decorators: [withRootFontSize(200)],
  render: (args) => (
    <ProgressRing {...args}>
      <Text as="p" variant="main-result" numeric color="primary">
        850
      </Text>
      <Text as="p" variant="label" color="secondary">
        kcal remaining
      </Text>
    </ProgressRing>
  ),
  play: async ({ canvasElement }) => {
    const ring = within(canvasElement).getByRole('img').parentElement as HTMLElement;
    await expect(ring.getBoundingClientRect().width).toBeCloseTo(320, 0);
  },
};
