import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { NavigationBar } from '../../../design-system/patterns/NavigationBar/NavigationBar';
import { commitCandidate, updatePortion, type CurrentCalculation } from '../domain/calculation';
import { fixtureC, foodCatalogue } from '../domain/fixtures';
import { HomeScreen } from './HomeScreen';

const navigation = <NavigationBar selected="home" onSelect={fn()} onAddFood={fn()} />;

function Harness({ initial, onChangeFood, onAddFood, onFindRecipes }: { initial: CurrentCalculation | null; onChangeFood: () => void; onAddFood: () => void; onFindRecipes: () => void }) {
  const [current, setCurrent] = useState(initial);
  return (
    <HomeScreen
      current={current}
      onPortionChange={(portion) => setCurrent((c) => (c ? updatePortion(c, portion) : c))}
      onChangeFood={onChangeFood}
      onAddFood={onAddFood}
      onFindRecipes={onFindRecipes}
      navigation={navigation}
    />
  );
}

const meta = {
  title: 'Product compositions/Home (S01)',
  component: HomeScreen,
  args: { current: null, onPortionChange: fn(), onChangeFood: fn(), onAddFood: fn(), onFindRecipes: fn(), navigation },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'S01 — the initial and working destination, and a dashboard for both user stories. Empty on launch: a food-calorie module explains adding a product or dish (Add food opens O01), and a recipe-discovery module explains criteria-based browsing (Find recipes opens S03-1 Browse) — always present, never a fabricated 0 kcal or empty ring. After a reviewed food is confirmed, the food-calorie module becomes the current-calculation module: identity, editable amount and result, with the recipe module retained below it. Valid amounts recalculate locally without a Save step; an invalid draft shows a stale result instead of presenting the old number as current.',
      },
    },
  },
} satisfies Meta<typeof HomeScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  name: 'Empty — no current calculation (S01-1)',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
    await expect(canvas.getByRole('heading', { level: 2, name: 'Calculate calories' })).toBeInTheDocument();
    await expect(canvas.getByRole('heading', { level: 2, name: 'Find a recipe' })).toBeInTheDocument();
    // Exactly one primary body CTA — it and the trailing plus share the label "Add food"
    // because they are two access points to the same action, never two competing
    // choosers; the body CTA is first in DOM order, ahead of the nav's trailing action.
    const addFoodButtons = canvas.getAllByRole('button', { name: 'Add food' });
    await expect(addFoodButtons).toHaveLength(2);
    await userEvent.click(addFoodButtons[0]);
    await expect(args.onAddFood).toHaveBeenCalledTimes(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Find recipes' }));
    await expect(args.onFindRecipes).toHaveBeenCalledTimes(1);
  },
};

export const ResultFixtureC: Story = {
  name: 'Current calculation — fixture C at 300 g (S01-2)',
  render: (args) => <Harness initial={commitCandidate(fixtureC, { quantity: 300, unitId: 'g' }, 1)} onChangeFood={args.onChangeFood} onAddFood={args.onAddFood} onFindRecipes={args.onFindRecipes} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('540')).toBeInTheDocument();
    const amount = canvas.getByLabelText('Amount', { exact: true });
    await userEvent.clear(amount);
    await userEvent.type(amount, '250');
    await expect(canvas.getByText('450')).toBeInTheDocument();
    await expect(canvas.getByText('For 250 g')).toBeInTheDocument();
    // The recipe-discovery module is retained below the current-calculation module.
    await expect(canvas.getByRole('heading', { level: 2, name: 'Find a recipe' })).toBeInTheDocument();
  },
};

export const InvalidAmountStale: Story = {
  name: 'Invalid amount — stale result',
  render: (args) => <Harness initial={commitCandidate(fixtureC, { quantity: 300, unitId: 'g' }, 1)} onChangeFood={args.onChangeFood} onAddFood={args.onAddFood} onFindRecipes={args.onFindRecipes} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const amount = canvas.getByLabelText('Amount', { exact: true });
    await userEvent.clear(amount);
    await userEvent.type(amount, 'abc');
    await userEvent.tab();
    await expect(canvas.queryByText('540')).toBeNull();
    await expect(canvas.getAllByText('Enter a valid amount to see the result').length).toBeGreaterThanOrEqual(1);
    await expect(amount).toHaveAttribute('aria-invalid', 'true');
  },
};

export const UnitChangeKeepsPortion: Story = {
  name: 'Unit change keeps the portion',
  render: (args) => <Harness initial={commitCandidate(fixtureC, { quantity: 300, unitId: 'g' }, 1)} onChangeFood={args.onChangeFood} onAddFood={args.onAddFood} onFindRecipes={args.onFindRecipes} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Change unit, currently g' }));
    await userEvent.click(canvas.getByRole('radio', { name: /serving/ }));
    await userEvent.click(canvas.getByRole('button', { name: 'Confirm' }));
    await expect(canvas.getByLabelText('Amount', { exact: true })).toHaveValue('1');
    await expect(canvas.getByText('540')).toBeInTheDocument();
    await expect(canvas.getByText('For 1 serving (300 g)')).toBeInTheDocument();
  },
};

export const PartialData: Story = {
  name: 'Partial data (unknown macros)',
  render: (args) => <Harness initial={commitCandidate(foodCatalogue[5], { quantity: 80, unitId: 'g' }, 1)} onChangeFood={args.onChangeFood} onAddFood={args.onAddFood} onFindRecipes={args.onFindRecipes} />,
  play: async ({ canvasElement }) => {
    const visible = within(canvasElement)
      .getAllByText('Not available')
      .filter((el) => !el.classList.contains('portion-visually-hidden'));
    await expect(visible).toHaveLength(2);
  },
};

export const KnownZero: Story = {
  name: 'Known zero (sparkling water)',
  render: (args) => <Harness initial={commitCandidate(foodCatalogue[6], { quantity: 330, unitId: 'ml' }, 1)} onChangeFood={args.onChangeFood} onAddFood={args.onAddFood} onFindRecipes={args.onFindRecipes} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText('Not available')).toBeNull();
    await expect(canvas.getAllByText('0').length).toBeGreaterThanOrEqual(4);
  },
};

export const ChangeFood: Story = {
  name: 'Change food opens the method chooser',
  render: (args) => <Harness initial={commitCandidate(fixtureC, { quantity: 300, unitId: 'g' }, 1)} onChangeFood={args.onChangeFood} onAddFood={args.onAddFood} onFindRecipes={args.onFindRecipes} />,
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Change food' }));
    await expect(args.onChangeFood).toHaveBeenCalledTimes(1);
  },
};
