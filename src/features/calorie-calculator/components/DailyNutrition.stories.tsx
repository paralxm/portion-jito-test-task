import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, within } from 'storybook/test';

import { expectNoHorizontalOverflow, withRootFontSize } from '../../../design-system/storybook/decorators';
import { createEntry, summarizeDay, type FoodEntry } from '../domain/daily-log';
import { fixtureC, foodCatalogue } from '../domain/fixtures';
import { budgetFixtureEntries, budgetFixtureGoal, homeEntries } from '../domain/home-fixtures';
import { DailyNutrition } from './DailyNutrition';

/** Demonstration data only: the brief's 400 of 2,000 fixture and the ui-contract §1 Home fixtures. */
const budget = budgetFixtureEntries();
const populated = homeEntries();

const meta = {
  title: 'Product compositions/Home (S01)/Daily nutrition',
  component: DailyNutrition,
  args: { summary: summarizeDay(budget, budgetFixtureGoal.kcal), goal: budgetFixtureGoal, onSetTargets: fn(), heading: 'Today’s nutrition' },
  parameters: {
    docs: {
      description: {
        component: `
**Purpose.** Home's daily-nutrition section (ledger §13, after H-REF 1): one coordinated group — the dominant calorie card and, directly beneath it, three macro cards sharing its width — with no extra wrapper border. Built on \`ProgressBar\`; it formats and labels the \`DailySummary\` and \`DailyGoal\` it is given and owns no entries, arithmetic or persistence.

**Calorie card.** *Remaining* (target − consumed) while below the target; \`0 kcal remaining\` at it; the excess above it (\`150 kcal over target\`); without a target, or with a partial total, the logged amount itself (\`0 kcal logged\` at first). The one \`Set targets\` / \`Edit targets\` action sits at the top right. With a target the track carries a marker and \`consumed · %\` and \`Target\` are stated beneath it; without one no bar, percentage or remainder is invented, and nothing is inferred from the amount logged so far.

**Macro cards.** Each shows its name with the category marker and the logged grams; when the person entered a target for that nutrient it reads \`24 / 120 g\` with the card's own compact track (fill capped at 100 %, numbers always visible). A calorie target does not imply macro targets; a card without one stays complete and never looks disabled. Unknown is \`Not available\`, partial subtotals say so, never zero.

**Accessibility.** The track is a \`meter\` named "Calories logged against your target" with \`aria-valuetext\`; the figures are ordinary text; transitions collapse under reduced motion. All values are demonstration fixtures, not recommendations.
        `,
      },
    },
  },
} satisfies Meta<typeof DailyNutrition>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullTargets: Story = {
  name: 'Full targets — 1,600 remaining, 400 consumed · 20 %, macro cards with tracks',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('1,600')).toBeVisible();
    await expect(canvas.getByText('kcal remaining')).toBeVisible();
    await expect(canvas.getByText(/20 %/)).toBeVisible();
    await expect(canvas.getByRole('meter', { name: 'Calories logged against your target' })).toHaveAttribute('aria-valuetext', '400 of 2,000 kcal, 20 %');
    await expect(canvas.getByRole('meter', { name: 'Protein against your target' })).toHaveAttribute('aria-valuetext', '24 of 120 g');
    await expect(canvas.getByRole('meter', { name: 'Fat against your target' })).toHaveAttribute('aria-valuetext', '14 of 65 g');
    await expect(canvas.getByRole('button', { name: 'Edit targets' })).toBeVisible();
  },
};

export const NoTargets: Story = {
  name: 'No targets — logged amount, Set targets, no bar; macro cards complete without tracks',
  args: { summary: summarizeDay(budget, null), goal: null },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('400')).toBeVisible();
    await expect(canvas.getByText('kcal logged')).toBeVisible();
    await expect(canvas.queryByRole('meter')).toBeNull();
    canvas.getByRole('button', { name: 'Set targets' }).click();
    await expect(args.onSetTargets).toHaveBeenCalledTimes(1);
    await expect(canvas.queryByText(/\/ 120/)).toBeNull();
    await expect(canvas.getByText('24')).toBeVisible();
  },
};

export const FirstUse: Story = {
  name: 'First use — 0 kcal logged, no targets',
  args: { summary: summarizeDay([], null), goal: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText('0').length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getByText('kcal logged')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Set targets' })).toBeVisible();
    await expect(canvas.queryByText(/remaining/)).toBeNull();
    await expect(canvas.queryByText(/%/)).toBeNull();
  },
};

export const CalorieOnly: Story = {
  name: 'Calorie-only target — 2,000 remaining, 0 %; macro cards show grams alone',
  args: { summary: summarizeDay([], 2000), goal: { kcal: 2000 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText('2,000').length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getByRole('meter', { name: 'Calories logged against your target' })).toHaveAttribute('aria-valuetext', '0 of 2,000 kcal, 0 %');
    await expect(canvas.queryByRole('meter', { name: 'Protein against your target' })).toBeNull();
  },
};

export const PartialTargets: Story = {
  name: 'Partial configuration — only a protein target',
  args: { summary: summarizeDay(budget, 2000), goal: { kcal: 2000, proteinG: 120 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('meter', { name: 'Protein against your target' })).toBeInTheDocument();
    await expect(canvas.queryByRole('meter', { name: 'Carbohydrates against your target' })).toBeNull();
    await expect(canvas.getByText('48')).toBeVisible();
  },
};

export const Reached: Story = {
  name: 'Target reached — 0 remaining',
  args: { summary: summarizeDay(populated, 1350), goal: { kcal: 1350 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('0')).toBeVisible();
    await expect(canvas.getByText('Daily target reached.')).toBeVisible();
  },
};

export const Exceeded: Story = {
  name: 'Over target — 150 over, fill stops at the marker, words carry it',
  args: { summary: summarizeDay(populated, 1200), goal: { kcal: 1200, proteinG: 80 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('150')).toBeVisible();
    await expect(canvas.getByText('kcal over target')).toBeVisible();
    await expect(canvas.getByText('150 kcal over your target.')).toBeVisible();
    const meter = canvas.getByRole('meter', { name: 'Calories logged against your target' });
    await expect(meter).toHaveAttribute('data-over', 'true');
    await expect(meter).toHaveAttribute('aria-valuenow', '1200');
    // The protein track is capped at 100 % while the numbers stay visible.
    await expect(canvas.getByRole('meter', { name: 'Protein against your target' })).toHaveAttribute('aria-valuetext', '90 of 80 g');
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

export const PastDay: Story = {
  name: 'An earlier day without a target in force',
  args: { summary: summarizeDay(budget, null), goal: null, pastDay: true, heading: 'Nutrition on Thursday, September 3' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/No target was set for this day/)).toBeVisible();
  },
};

export const Narrow320: Story = {
  name: 'Narrow — 320: three cards stay side by side',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async () => {
    await expectNoHorizontalOverflow();
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 320 at 200 % (macro cards stack)',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('1,600')).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};
