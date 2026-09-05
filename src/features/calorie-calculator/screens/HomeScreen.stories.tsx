import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { NavigationBar } from '../../../design-system/patterns/NavigationBar/NavigationBar';
import { expectNoHorizontalOverflow, withRootFontSize } from '../../../design-system/storybook/decorators';
import { fixtureR } from '../../recipe-discovery/domain/fixtures';
import { matchEvidence } from '../../recipe-discovery/domain/matching';
import { createEntry, type FoodEntry } from '../domain/daily-log';
import { foodCatalogue } from '../domain/fixtures';
import { budgetFixtureEntries, budgetFixtureGoal, homeEntries } from '../domain/home-fixtures';
import { HomeScreen } from './HomeScreen';

const navigation = <NavigationBar selected="home" onSelect={fn()} onLogFood={fn()} />;
const now = new Date('2026-09-04T12:00:00Z');

/** Demonstration data only: the ui-contract §1 Home fixtures (1,350 of 2,200 kcal) and the brief's 400 of 2,000 budget fixture. */
const populated = homeEntries(now.getTime());
const budget = budgetFixtureEntries(now.getTime());
const recommended = { recipe: fixtureR, evidence: [] };

const meta = {
  title: 'Product compositions/Home (S01)',
  component: HomeScreen,
  args: {
    entries: [],
    goal: null,
    onGoalChange: fn(),
    onOpenEntry: fn(),
    onAddToMeal: fn(),
    recommended,
    onOpenRecipe: fn(),
    onFindRecipes: fn(),
    waterMl: 0,
    onAddWater: fn(),
    onSetWaterTotal: fn(),
    now,
    navigation,
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
S01 — Home, the daily overview (ledger D-31). Region order in both states: root header (lockup, \`Today · Sep 4\`, **Set goal** / **Edit goal**) → the calorie budget (remaining figure, consumed · %, goal, the bar with its marker, compact macros with optional targets) → one **Recommended recipe** (or *Matches your filters* with active browse criteria) → **Today's meals** with Breakfast, Lunch, Dinner and Snacks always present → **Water** with the quick add → the fixed bar with Home current.

**S01-1** is "no committed entries today", **S01-2** "one or more" — decided by entry count, never by the energy sum, so a valid zero-kcal entry still populates its meal. No goal is set by default; 2,000 / 2,200 kcal are demonstration values. Home has no inline calculator and no large Log food button: the bar's plus and each meal's add action start the food task.
        `,
      },
    },
  },
} satisfies Meta<typeof HomeScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyNoGoal: Story = {
  name: 'S01-1 — no entries, no goal (launch state)',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
    await expect(canvas.getByText('Today · Sep 4')).toBeVisible();
    await expect(canvas.getAllByRole('button', { name: 'Set goal' }).length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getByText('kcal logged')).toBeVisible();
    // No goal: no meaningless empty bar is drawn.
    await expect(canvas.queryByRole('meter', { name: 'Calories logged against your goal' })).toBeNull();
    for (const meal of ['Breakfast', 'Lunch', 'Dinner', 'Snacks']) await expect(canvas.getByRole('heading', { level: 3, name: meal })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Add dinner' }));
    await expect(args.onAddToMeal).toHaveBeenCalledWith('dinner');
    await expect(canvas.queryByRole('button', { name: /Log (first )?food/ })).not.toBeNull(); // the bar's plus only
    await expect(canvas.getAllByRole('button', { name: /Log (first )?food/ })).toHaveLength(1);
    await expect(canvas.getByRole('heading', { name: 'Recommended recipe' })).toBeInTheDocument();
  },
};

export const BudgetFixture: Story = {
  name: 'Partial — 1,600 remaining, 400 consumed · 20 %, macro targets',
  args: { entries: budget, goal: budgetFixtureGoal, waterMl: 1250 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('1,600')).toBeVisible();
    await expect(canvas.getByText('kcal remaining')).toBeVisible();
    await expect(canvas.getByText(/20 %/)).toBeVisible();
    await expect(canvas.getByRole('meter', { name: 'Calories logged against your goal' })).toHaveAttribute('aria-valuetext', '400 of 2,000 kcal, 20 %');
    await expect(canvas.getByRole('meter', { name: 'Protein against your target' })).toHaveAttribute('aria-valuetext', '24 of 120 g');
    await expect(canvas.getByRole('button', { name: 'Edit goal' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Edit water, 1.25 litres of 2 litres' })).toBeVisible();
  },
};

export const Populated: Story = {
  name: 'S01-2 — two entries, goal 2,200 (850 remaining)',
  args: { entries: populated, goal: { kcal: 2200 } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('850')).toBeVisible();
    await expect(canvas.getByText('1,350 kcal logged')).toBeVisible();
    await expect(canvas.getByText('Carbs')).toBeVisible();
    const row = canvas.getByRole('button', { name: /Oatmeal with mixed berries/ });
    await expect(row).toHaveTextContent('300 g');
    await expect(row).toHaveTextContent('550 kcal');
    await userEvent.click(row);
    await expect(args.onOpenEntry).toHaveBeenCalledWith('demo-oatmeal');
    // Populated meals offer "Add to …", empty ones "Add …".
    await expect(canvas.getByRole('button', { name: 'Add to breakfast' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Add dinner' })).toBeVisible();
  },
};

export const PopulatedNoGoal: Story = {
  name: 'S01-2 — two entries, no goal',
  args: { entries: populated },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('1,350')).toBeVisible();
    await expect(canvas.getByText('kcal logged')).toBeVisible();
    await expect(canvas.getByText(/Set a goal to see what remains/)).toBeVisible();
  },
};

export const GoalReached: Story = {
  name: 'Goal reached — 0 remaining',
  args: { entries: populated, goal: { kcal: 1350 } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Daily goal reached.')).toBeVisible();
  },
};

export const GoalExceeded: Story = {
  name: 'Goal exceeded — 150 over, stated in words',
  args: { entries: populated, goal: { kcal: 1200 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('150 kcal over your set goal.')).toBeVisible();
    await expect(canvas.getByText('kcal over goal')).toBeVisible();
    await expect(canvasElement.querySelector('[data-over]')).not.toBeNull();
  },
};

export const ZeroKcalEntry: Story = {
  name: 'A valid zero-kcal entry populates its meal',
  args: { entries: [createEntry(foodCatalogue[6], { quantity: 330, unitId: 'ml' }, 'snack', { id: 'water', now: now.getTime() }) as FoodEntry], goal: { kcal: 2000 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: /Sparkling water/ })).toBeVisible();
    await expect(canvas.getByText('0 kcal logged')).toBeVisible();
  },
};

export const PartialMacros: Story = {
  name: 'Partial macros — unknown carbohydrates and fat in one entry',
  args: { entries: [...populated, createEntry(foodCatalogue[5], { quantity: 100, unitId: 'g' }, 'snack', { id: 'leaves', now: now.getTime() }) as FoodEntry], goal: { kcal: 2200 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText('Partial total').length).toBeGreaterThanOrEqual(2);
    await expect(canvas.getByText('1,367 kcal logged')).toBeVisible();
  },
};

export const UnassignedEntry: Story = {
  name: 'Unassigned guard — a record without a meal offers Choose a meal',
  args: { entries: [{ ...populated[0], id: 'legacy', meal: null }], goal: { kcal: 2200 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 3, name: 'Unassigned' })).toBeInTheDocument();
    await expect(canvas.getByText('Choose a meal')).toBeVisible();
  },
};

export const RecipeCriteriaApplied: Story = {
  name: 'Recipes browse has applied filters — the recommendation states its evidence',
  args: { entries: populated, goal: { kcal: 2200 }, recommended: { recipe: fixtureR, evidence: matchEvidence(fixtureR, { caloriesMax: 460 }) } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'Matches your filters' })).toBeInTheDocument();
    await expect(canvas.getByText('Matches all 1 filter')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Lentil soup' }));
    await expect(args.onOpenRecipe).toHaveBeenCalledWith('recipe-lentil-soup');
    await userEvent.click(canvas.getByRole('button', { name: 'All recipes' }));
    await expect(args.onFindRecipes).toHaveBeenCalledTimes(1);
  },
};

export const GoalEditor: Story = {
  name: 'Goal editor — set, edit, clear, cancel',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getAllByRole('button', { name: 'Set goal' })[0]);
    const dialog = await canvas.findByRole('dialog', { name: 'Set goal' });
    await userEvent.type(within(dialog).getByLabelText('Daily goal'), '2200');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Apply' }));
    await expect(args.onGoalChange).toHaveBeenLastCalledWith({ kcal: 2200, proteinG: null, carbohydratesG: null, fatG: null });
  },
};

export const WaterQuickAdd: Story = {
  name: 'Water — quick add calls the app once per tap',
  args: { waterMl: 1250 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const add = canvas.getByRole('button', { name: 'Add 250 millilitres of water' });
    await userEvent.click(add);
    await userEvent.click(add);
    await expect(args.onAddWater).toHaveBeenCalledTimes(2);
    await expect(args.onAddWater).toHaveBeenLastCalledWith(250, 'quick');
    await userEvent.click(canvas.getByRole('button', { name: 'Edit water, 1.25 litres of 2 litres' }));
    await expect(await canvas.findByRole('dialog', { name: 'Add water' })).toBeVisible();
  },
};

export const Narrow320: Story = {
  name: 'S01-2 at 320',
  args: { entries: budget, goal: budgetFixtureGoal, waterMl: 1250 },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async () => {
    await expectNoHorizontalOverflow();
  },
};

export const EnlargedText: Story = {
  name: 'S01-2 at 320 and 200 % text',
  args: { entries: budget, goal: budgetFixtureGoal, waterMl: 1250 },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('1,600')).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};
