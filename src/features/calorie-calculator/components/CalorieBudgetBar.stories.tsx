import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, within } from 'storybook/test';

import { Surface } from '../../../design-system/primitives/Surface/Surface';
import { expectNoHorizontalOverflow, withRootFontSize } from '../../../design-system/storybook/decorators';
import { createEntry, summarizeDay, type FoodEntry } from '../domain/daily-log';
import { fixtureC, foodCatalogue } from '../domain/fixtures';
import { budgetFixtureEntries, budgetFixtureGoal, homeEntries } from '../domain/home-fixtures';
import { CalorieBudgetBar } from './CalorieBudgetBar';

/** Demonstration data only: the brief's 400 of 2,000 fixture and the ui-contract §1 Home fixtures. */
const budget = budgetFixtureEntries();
const populated = homeEntries();

const meta = {
  title: 'Product compositions/Home (S01)/CalorieBudgetBar',
  component: CalorieBudgetBar,
  args: { summary: summarizeDay(budget, budgetFixtureGoal.kcal), goal: budgetFixtureGoal, onSetGoal: fn() },
  decorators: [
    (Story) => (
      <Surface tone="surface" border="none" radius="grouped" padding={16}>
        <Story />
      </Surface>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: `
**Purpose.** Home's calorie budget (ledger D-19, D-20) — the one focal point of S01, replacing the ring. Built on the \`ProgressBar\` primitive; it formats and labels the \`DailySummary\` and \`DailyGoal\` it is given and owns no entries, arithmetic or persistence.

**What the figure means.** *Remaining* (goal − consumed) while below the goal; \`0 kcal remaining\` at it; the excess above it (\`150 kcal over goal\`); without a goal, or with a partial total, the logged amount itself. \`consumed · %\` and \`Goal\` are stated beside the track, which carries a marker at the goal so 0 % and unknown never look alike.

**States.** No goal (logged amount, \`Set goal\`, no bar); goal set with nothing logged; partial; reached; over goal (the fill stops at the marker, the words carry the excess, the colour never changes); partial total (labelled, no percentage, track only). Macros show \`24 / 120 g\` with a compact track only when the user entered a target; otherwise the logged grams alone; unknown is \`Not available\`, never zero.

**Accessibility.** The track is a \`meter\` named "Calories logged against your goal" with \`aria-valuetext\` ("400 of 2,000 kcal, 20 %"); the figures are ordinary text; the fill transition collapses under reduced motion. All values are demonstration fixtures, not recommendations.
        `,
      },
    },
  },
} satisfies Meta<typeof CalorieBudgetBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Partial: Story = {
  name: 'Partial — 1,600 remaining, 400 consumed · 20 %, Goal 2,000, targets 120 / 220 / 65 g',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('1,600')).toBeVisible();
    await expect(canvas.getByText('kcal remaining')).toBeVisible();
    await expect(canvas.getByText(/20 %/)).toBeVisible();
    await expect(canvas.getByRole('meter', { name: 'Calories logged against your goal' })).toHaveAttribute('aria-valuetext', '400 of 2,000 kcal, 20 %');
    await expect(canvas.getByRole('meter', { name: 'Protein against your target' })).toHaveAttribute('aria-valuetext', '24 of 120 g');
    await expect(canvas.getByRole('meter', { name: 'Fat against your target' })).toHaveAttribute('aria-valuetext', '14 of 65 g');
  },
};

export const NoGoal: Story = {
  name: 'No goal — logged amount, Set goal, no bar',
  args: { summary: summarizeDay(budget, null), goal: null },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('400')).toBeVisible();
    await expect(canvas.getByText('kcal logged')).toBeVisible();
    await expect(canvas.queryByRole('meter')).toBeNull();
    const set = canvas.getByRole('button', { name: 'Set goal' });
    set.click();
    await expect(args.onSetGoal).toHaveBeenCalledTimes(1);
    // Without targets the macros show the logged grams alone.
    await expect(canvas.queryByText(/\/ 120/)).toBeNull();
  },
};

export const GoalNoCalories: Story = {
  name: 'Goal set, nothing logged — 2,000 remaining, 0 %',
  args: { summary: summarizeDay([], 2000), goal: { kcal: 2000 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText('2,000').length).toBeGreaterThanOrEqual(2);
    await expect(canvas.getByRole('meter', { name: 'Calories logged against your goal' })).toHaveAttribute('aria-valuetext', '0 of 2,000 kcal, 0 %');
  },
};

export const Reached: Story = {
  name: 'Goal reached — 0 remaining',
  args: { summary: summarizeDay(populated, 1350), goal: { kcal: 1350 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('0')).toBeVisible();
    await expect(canvas.getByText('Daily goal reached.')).toBeVisible();
  },
};

export const Exceeded: Story = {
  name: 'Over goal — 150 over, fill stops at the marker, words carry it',
  args: { summary: summarizeDay(populated, 1200), goal: { kcal: 1200 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('150')).toBeVisible();
    await expect(canvas.getByText('kcal over goal')).toBeVisible();
    await expect(canvas.getByText('150 kcal over your set goal.')).toBeVisible();
    const meter = canvas.getByRole('meter', { name: 'Calories logged against your goal' });
    await expect(meter).toHaveAttribute('data-over', 'true');
    await expect(meter).toHaveAttribute('aria-valuenow', '1200');
  },
};

export const Incomplete: Story = {
  name: 'Partial total — an entry without calorie data, unknown macro',
  args: (() => {
    const base = createEntry(fixtureC, { quantity: 100, unitId: 'g' }, 'lunch') as FoodEntry;
    const unknown: FoodEntry = { ...base, id: 'u', result: { ...base.result, energyKcal: null, carbohydratesG: null } };
    const leaves = createEntry(foodCatalogue[5], { quantity: 100, unitId: 'g' }, 'snack') as FoodEntry;
    return { summary: summarizeDay([base, unknown, leaves], 2000), goal: { kcal: 2000, proteinG: 120 } };
  })(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('kcal logged so far')).toBeVisible();
    await expect(canvas.getByText(/consumed \(partial\)/)).toBeVisible();
    await expect(canvas.getByRole('img', { name: /not available/ })).toBeInTheDocument();
    await expect(canvas.getAllByText('Partial total').length).toBeGreaterThanOrEqual(1);
  },
};

export const Narrow320: Story = {
  name: 'Narrow — 320',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async () => {
    await expectNoHorizontalOverflow();
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 320 at 200 % (macros stack)',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('1,600')).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};
