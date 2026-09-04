import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';

import { Surface } from '../../../design-system/primitives/Surface/Surface';
import { expectNoHorizontalOverflow, withRootFontSize } from '../../../design-system/storybook/decorators';
import { createEntry, summarizeDay, type FoodEntry } from '../domain/daily-log';
import { fixtureC, foodCatalogue } from '../domain/fixtures';
import { CalorieProgressRing } from './CalorieProgressRing';
import { homeEntries } from '../domain/home-fixtures';

/** Demonstration data only (ui-contract §1 Home fixtures): 550 + 800 = 1,350 kcal against a 2,200 kcal goal. */
const populated = homeEntries();

const meta = {
  title: 'Product compositions/Home (S01)/CalorieProgressRing',
  component: CalorieProgressRing,
  args: { summary: summarizeDay(populated, 2200) },
  parameters: {
    docs: {
      description: {
        component: `
**Purpose.** Home's daily calorie state — the one focal point of S01. Built from the shared \`ProgressRing\` and typography tokens; it formats and labels the \`DailySummary\` it is given and owns no entries, goal, arithmetic or persistence (those live in \`daily-log.ts\` and the app).

**What the number means.** The arc is *logged ÷ goal*. The centre figure is **remaining** (goal − logged) while a goal exists and the total is complete — the quantity the low-fidelity contract names at the centre. Above the goal it becomes the excess ("kcal over goal"); without a goal or with a partial total it is the logged amount itself, so number and arc never contradict each other. Logged and Goal are always stated beneath.

**States.** below (partial ring), reached (full ring, 0 remaining, neutral wording), exceeded (full ring, "X kcal over your set goal", no success/error colour), no goal (track only, logged amount, "Not set"), incomplete energy (track only, partial total labelled as such). Unknown is never rendered as zero.

**Responsive.** Under 16 rem of container width (enlarged text on every supported viewport) or when the figure has more than five characters, the ring switches to its medium size and the figure sits under it, so the number keeps its role size instead of being squeezed inside the ring.

**Accessibility.** The arc is an image named with units and state ("1,350 of 2,200 kcal logged today, 61 %"); the figures are ordinary text; the Logged/Goal pair is a description list. Reduced motion removes the arc transition.

All values shown are demonstration fixtures, not recommendations.
        `,
      },
    },
  },
} satisfies Meta<typeof CalorieProgressRing>;

export default meta;
type Story = StoryObj<typeof meta>;

const onGroup = (Story: () => React.ReactElement) => (
  <Surface tone="surface" border="none" radius="grouped" padding={16}>
    <Story />
  </Surface>
);

export const Partial: Story = {
  name: 'Partial — 1,350 of 2,200 (850 remaining)',
  decorators: [onGroup],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('850')).toBeVisible();
    await expect(canvas.getByText('kcal remaining')).toBeVisible();
    await expect(canvas.getByRole('img', { name: '1,350 of 2,200 kcal logged today, 61 %' })).toBeInTheDocument();
    await expect(canvas.getByText('1,350 kcal')).toBeVisible();
    await expect(canvas.getByText('2,200 kcal')).toBeVisible();
    await expect(canvasElement.querySelector('[data-layout]')?.getAttribute('data-layout')).toBe('centre');
  },
};

export const Zero: Story = {
  name: 'No entries with a goal — 2,200 remaining, 0 %',
  args: { summary: summarizeDay([], 2200) },
  decorators: [onGroup],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('2,200')).toBeVisible();
    await expect(canvas.getByRole('img', { name: '0 of 2,200 kcal logged today, 0 %' })).toBeInTheDocument();
    await expect(canvas.getByText('0 kcal')).toBeVisible();
  },
};

export const Reached: Story = {
  name: 'Reached — 0 remaining, neutral wording',
  args: { summary: summarizeDay(populated, 1350) },
  decorators: [onGroup],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('0')).toBeVisible();
    await expect(canvas.getByText('Daily goal reached.')).toBeVisible();
    await expect(canvasElement.querySelector('[data-state]')?.getAttribute('data-state')).toBe('reached');
  },
};

export const Exceeded: Story = {
  name: 'Exceeded — 150 over, full ring, excess stated',
  args: { summary: summarizeDay(populated, 1200) },
  decorators: [onGroup],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('150')).toBeVisible();
    await expect(canvas.getByText('kcal over goal')).toBeVisible();
    await expect(canvas.getByText('150 kcal over your set goal.')).toBeVisible();
    await expect(canvas.queryByText(/remaining/)).toBeNull();
  },
};

export const NoGoal: Story = {
  name: 'No goal — logged amount, remaining unavailable',
  args: { summary: summarizeDay(populated, null) },
  decorators: [onGroup],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('1,350')).toBeVisible();
    await expect(canvas.getByText('kcal logged')).toBeVisible();
    await expect(canvas.getByText('Not set')).toBeVisible();
    await expect(canvas.getByRole('img', { name: '1,350 kcal logged today, no daily goal set' })).toBeInTheDocument();
    await expect(canvasElement.querySelectorAll('circle')).toHaveLength(1);
  },
};

export const IncompleteEnergy: Story = {
  name: 'Incomplete energy — partial total, no ratio',
  args: {
    summary: (() => {
      const base = createEntry(fixtureC, { quantity: 100, unitId: 'g' }, { id: 'a' }) as FoodEntry;
      const unknown: FoodEntry = { ...base, id: 'b', result: { ...base.result, energyKcal: null } };
      return summarizeDay([base, unknown], 2200);
    })(),
  },
  decorators: [onGroup],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('kcal logged so far')).toBeVisible();
    await expect(canvas.getByText('Partial total')).toBeVisible();
    await expect(canvas.getByText(/remaining amount is not available/)).toBeVisible();
    await expect(canvasElement.querySelectorAll('circle')).toHaveLength(1);
  },
};

export const ZeroKcalEntry: Story = {
  name: 'A valid zero-kcal entry still counts as an entry',
  args: { summary: summarizeDay([createEntry(foodCatalogue[6], { quantity: 330, unitId: 'ml' }, { id: 'water' }) as FoodEntry], 2000) },
  decorators: [onGroup],
  play: async ({ canvasElement, args }) => {
    await expect(args.summary.entryCount).toBe(1);
    await expect(within(canvasElement).getByText('0 kcal')).toBeVisible();
  },
};

export const LargeNumbers: Story = {
  name: 'Large numbers — six-character figure stacks under the ring',
  args: { summary: summarizeDay(populated, 12000) },
  decorators: [onGroup],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('10,650')).toBeVisible();
    await expect(canvasElement.querySelector('[data-layout]')?.getAttribute('data-layout')).toBe('stacked');
    await expectNoHorizontalOverflow();
  },
};

export const Narrow320: Story = {
  name: 'Narrow — 320 keeps the figure inside the ring',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [onGroup],
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-layout]')?.getAttribute('data-layout')).toBe('centre');
    await expectNoHorizontalOverflow();
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 320 at 200 % stacks the figure under a medium ring',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200), onGroup],
  play: async ({ canvasElement }) => {
    // The enlarged root font-size lands after mount; the ResizeObserver re-measures on
    // the next frame, so wait for the stacked layout rather than reading the first paint.
    await waitFor(async () => {
      await expect(canvasElement.querySelector('[data-layout]')?.getAttribute('data-layout')).toBe('stacked');
    });
    await expect(within(canvasElement).getByText('850')).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};
