import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { NavigationBar } from '../../../design-system/patterns/NavigationBar/NavigationBar';
import { expectNoHorizontalOverflow, withRootFontSize } from '../../../design-system/storybook/decorators';
import { createEntry, type FoodEntry } from '../domain/daily-log';
import { foodCatalogue } from '../domain/fixtures';
import { homeEntries } from '../domain/home-fixtures';
import { HomeScreen } from './HomeScreen';

const navigation = <NavigationBar selected="home" onSelect={fn()} onLogFood={fn()} />;

/** Demonstration data only: the ui-contract §1 Home fixtures (1,350 of 2,200 kcal). */
const populated = homeEntries();

function Harness(props: Omit<Parameters<typeof HomeScreen>[0], 'onGoalChange'> & { onGoalChange: (goal: number | null) => void }) {
  const [goal, setGoal] = useState(props.goalKcal);
  return (
    <HomeScreen
      {...props}
      goalKcal={goal}
      onGoalChange={(next) => {
        setGoal(next);
        props.onGoalChange(next);
      }}
    />
  );
}

const meta = {
  title: 'Product compositions/Home (S01)',
  component: HomeScreen,
  args: { entries: [], goalKcal: null, onGoalChange: fn(), onOpenEntry: fn(), onLogFood: fn(), onFindRecipes: fn(), recipeCriteria: [], navigation },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
S01 — Home, the daily overview. Region order in both states: header → **Today** (the grouped focal surface: calorie ring with remaining/logged figure, Logged and Goal, the contextual Set/Edit daily goal action, and the compact Protein / Carbs / Fat aggregate) → **Today's food** (empty guidance + Add first food, or the logged rows + Log food) → **Find a recipe** (Find recipes, or the applied Recipes-browse filters with See matching recipes) → the bottom bar with Home current.

**S01-1** is "no committed entries today", **S01-2** "one or more" — decided by entry count, never by the energy sum, so a valid zero-kcal entry still populates the list. No goal is set by default; 2,200 kcal is a demonstration value. Home has no inline calculator: identify, correct and calculate a portion in S07, and add it to today from there.
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
    await expect(canvas.getByRole('heading', { level: 2, name: 'Today' })).toBeInTheDocument();
    await expect(canvas.getByText('kcal logged')).toBeVisible();
    await expect(canvas.getByText('Not set')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Set a daily goal' })).toBeVisible();
    await expect(canvas.getByText(/Nothing logged today/)).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Log first food' }));
    await expect(args.onLogFood).toHaveBeenCalledTimes(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Find recipes' }));
    await expect(args.onFindRecipes).toHaveBeenCalledTimes(1);
    // Exactly one body Log food CTA plus the bar's Log food action.
    await expect(canvas.getAllByRole('button', { name: /Log (first )?food/ })).toHaveLength(2);
  },
};

export const EmptyWithGoal: Story = {
  name: 'S01-1 — no entries, goal 2,200 (2,200 remaining, 0 %)',
  args: { goalKcal: 2200 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('2,200')).toBeVisible();
    await expect(canvas.getByText('kcal remaining')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Edit daily goal' })).toBeVisible();
  },
};

export const Populated: Story = {
  name: 'S01-2 — two entries, goal 2,200 (850 remaining)',
  args: { entries: populated, goalKcal: 2200 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('850')).toBeVisible();
    await expect(canvas.getByText('1,350 kcal')).toBeVisible();
    await expect(canvas.getByText('2 entries · 1,350 kcal')).toBeVisible();
    await expect(canvas.getByText('Carbs')).toBeVisible();
    await expect(canvas.getByText('135')).toBeVisible();
    const row = canvas.getByRole('button', { name: /Oatmeal with mixed berries/ });
    await expect(row).toHaveTextContent('300 g');
    await expect(row).toHaveTextContent('550 kcal');
    await userEvent.click(row);
    await expect(args.onOpenEntry).toHaveBeenCalledWith('demo-oatmeal');
    // The body CTA and the bar's action share the "Log food" name: one O01.
    await expect(canvas.getAllByRole('button', { name: 'Log food' })).toHaveLength(2);
  },
};

export const PopulatedNoGoal: Story = {
  name: 'S01-2 — two entries, no goal',
  args: { entries: populated },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('1,350')).toBeVisible();
    await expect(canvas.getByText('kcal logged')).toBeVisible();
    await expect(canvas.getByText(/No daily goal set/)).toBeVisible();
  },
};

export const GoalReached: Story = {
  name: 'Goal reached — 0 remaining',
  args: { entries: populated, goalKcal: 1350 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Daily goal reached.')).toBeVisible();
  },
};

export const GoalExceeded: Story = {
  name: 'Goal exceeded — 150 over',
  args: { entries: populated, goalKcal: 1200 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('150 kcal over your set goal.')).toBeVisible();
  },
};

export const ZeroKcalEntry: Story = {
  name: 'A valid zero-kcal entry populates the list',
  args: { entries: [createEntry(foodCatalogue[6], { quantity: 330, unitId: 'ml' }, { id: 'water' }) as FoodEntry], goalKcal: 2000 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: /Sparkling water/ })).toBeVisible();
    await expect(canvas.getByText('1 entry · 0 kcal')).toBeVisible();
    await expect(canvas.queryByText(/Nothing logged today/)).toBeNull();
  },
};

export const PartialMacros: Story = {
  name: 'Partial macros — unknown carbohydrates and fat in one entry',
  args: { entries: [...populated, createEntry(foodCatalogue[5], { quantity: 100, unitId: 'g' }, { id: 'leaves' }) as FoodEntry], goalKcal: 2200 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText('Partial total').length).toBeGreaterThanOrEqual(2);
    await expect(canvas.getByText('3 entries · 1,367 kcal')).toBeVisible();
  },
};

export const RecipeCriteriaApplied: Story = {
  name: 'Recipes browse has applied filters — See matching recipes',
  args: { entries: populated, goalKcal: 2200, recipeCriteria: ['Under 460 kcal', 'Vegan'] },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Your applied filters: Under 460 kcal, Vegan.')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'See matching recipes' }));
    await expect(args.onFindRecipes).toHaveBeenCalledTimes(1);
  },
};

export const GoalEditor: Story = {
  name: 'Goal editor — set, edit, clear, cancel',
  render: (args) => <Harness {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Set a daily goal' }));
    const dialog = await canvas.findByRole('dialog', { name: 'Set a daily goal' });
    await userEvent.type(within(dialog).getByLabelText('Daily goal'), '2200');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Apply' }));
    await expect(args.onGoalChange).toHaveBeenLastCalledWith(2200);
    await expect(canvas.getByText('2,200 kcal')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Edit daily goal' })).toBeVisible();
    // Cancel keeps the previous goal.
    await userEvent.click(canvas.getByRole('button', { name: 'Edit daily goal' }));
    const edit = await canvas.findByRole('dialog', { name: 'Edit daily goal' });
    await userEvent.clear(within(edit).getByLabelText('Daily goal'));
    await userEvent.type(within(edit).getByLabelText('Daily goal'), '1800');
    await userEvent.click(within(edit).getByRole('button', { name: 'Cancel' }));
    await expect(canvas.getByText('2,200 kcal')).toBeVisible();
    // Clear returns to no goal.
    await userEvent.click(canvas.getByRole('button', { name: 'Edit daily goal' }));
    await userEvent.click(within(await canvas.findByRole('dialog')).getByRole('button', { name: 'Clear goal' }));
    await expect(args.onGoalChange).toHaveBeenLastCalledWith(null);
    await expect(canvas.getByText('Not set')).toBeVisible();
  },
};

export const Narrow320: Story = {
  name: 'S01-2 at 320',
  args: { entries: populated, goalKcal: 2200 },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async () => {
    await expectNoHorizontalOverflow();
  },
};

export const EnlargedText: Story = {
  name: 'S01-2 at 320 and 200 % text',
  args: { entries: populated, goalKcal: 2200 },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('850')).toBeVisible();
    // The ring re-measures after the root font-size lands; the figure ends up under it.
    await waitFor(async () => {
      await expect(canvasElement.querySelector('[data-layout]')?.getAttribute('data-layout')).toBe('stacked');
    });
    await expectNoHorizontalOverflow();
  },
};
