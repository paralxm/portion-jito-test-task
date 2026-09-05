import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { mealPhrase, suggestMeal } from '../features/calorie-calculator/domain/meal';
import App from './App';

const meta = {
  title: 'Product compositions/App (runtime)',
  component: App,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The evaluator-facing runtime composed from the same components: three roots, the Log food chooser, focused steps that stay mounted for Back, simulated services, fixture data, the Add-to-meal sheet, the confirmation toast, and the session-only daily record (meal entries, the optional goal, today’s water). This story renders the real `App`; the runtime walkthrough script covers the full journeys with screenshots.',
      },
    },
  },
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Launch: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    await expect(canvas.getByText('Nothing logged')).toBeVisible();
    await expect(canvas.getAllByRole('button', { name: 'Set goal' }).length).toBeGreaterThanOrEqual(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Log food' }));
    await expect(canvas.getByRole('dialog', { name: 'Log food' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /Enter manually/ }));
    await expect(canvas.getByRole('heading', { level: 1, name: 'Enter manually' })).toBeInTheDocument();
    await expect(canvas.queryByRole('navigation')).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    await expect(canvas.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
  },
};

export const AddToMealJourney: Story = {
  name: 'Search → review → Add to today → Add to meal → Home meal populated → edit entry',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // A Home meal row starts the task with its meal preselected.
    await userEvent.click(canvas.getByRole('button', { name: 'Add lunch' }));
    await userEvent.click(await canvas.findByRole('button', { name: /Search food/ }));
    await userEvent.type(canvas.getByRole('searchbox'), 'rice');
    await userEvent.click(await canvas.findByRole('button', { name: /Vegetable rice bowl/ }, { timeout: 3000 }));
    const amount = await canvas.findByLabelText('Amount to calculate');
    await userEvent.clear(amount);
    await userEvent.type(amount, '300');
    await expect(canvas.getByText('540')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Add to today' }));
    const sheet = await canvas.findByRole('dialog', { name: 'Add to meal' });
    await expect(within(sheet).getByRole('radio', { name: 'Lunch' })).toBeChecked();
    await expect(within(sheet).getByText(/Preselected from the meal/)).toBeVisible();
    await userEvent.click(within(sheet).getByRole('button', { name: 'Add to lunch' }));
    // Home is populated (S01-2): the entry sits under Lunch, the toast confirms once.
    await expect(await canvas.findByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
    await expect(canvas.getByText('540 kcal logged')).toBeVisible();
    await expect(canvas.getByRole('status')).toHaveTextContent('Added to lunch.');
    const row = canvas.getByRole('button', { name: /Vegetable rice bowl/ });
    await expect(row.closest('section')).toHaveAccessibleName('Lunch');
    await userEvent.click(row);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Edit entry' })).toBeInTheDocument();
    await expect(canvas.getByRole('radio', { name: 'Lunch' })).toBeChecked();
    const edit = canvas.getByLabelText('Amount to calculate');
    await userEvent.clear(edit);
    await userEvent.type(edit, '150');
    await userEvent.click(canvas.getByRole('radio', { name: 'Dinner' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Update entry' }));
    await expect(canvas.getByText('270 kcal logged')).toBeVisible();
    await expect(canvas.getByRole('button', { name: /Vegetable rice bowl/ }).closest('section')).toHaveAccessibleName('Dinner');
  },
};

export const SuggestedMealFromTheBar: Story = {
  name: 'From the bar’s Log food the meal is suggested by the time of day and stays editable',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Log food' }));
    await userEvent.click(await canvas.findByRole('button', { name: /Enter manually/ }));
    await userEvent.type(canvas.getByLabelText('Food or dish name'), 'Lentil soup');
    await userEvent.type(canvas.getByLabelText('Calories'), '150');
    await userEvent.click(canvas.getByRole('button', { name: 'Continue to review' }));
    await userEvent.click(await canvas.findByRole('button', { name: 'Add to today' }));
    const sheet = await canvas.findByRole('dialog', { name: 'Add to meal' });
    const suggested = suggestMeal();
    await expect(within(sheet).getByRole('radio', { name: new RegExp(`^${mealPhrase(suggested)}$`, 'i') })).toBeChecked();
    await expect(within(sheet).getByText(/Suggested for this time of day/)).toBeVisible();
    await userEvent.click(within(sheet).getByRole('radio', { name: 'Snacks' }));
    await expect(within(sheet).getByRole('button', { name: 'Add to snacks' })).toBeEnabled();
    await userEvent.click(within(sheet).getByRole('button', { name: 'Cancel' }));
    // Cancel changes nothing: still on review, Add to today still available.
    await expect(canvas.getByRole('heading', { level: 1, name: 'Review food' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Add to today' })).toBeEnabled();
  },
};

export const WaterQuickAddAndUndo: Story = {
  name: 'Water quick add, repeated taps, Undo',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const add = canvas.getByRole('button', { name: 'Add 250 millilitres of water' });
    await userEvent.click(add);
    await userEvent.click(add);
    await expect(canvas.getByRole('button', { name: 'Edit water, 500 millilitres of 2 litres' })).toBeInTheDocument();
    await expect(canvas.getByRole('status')).toHaveTextContent('250 ml added. 500 millilitres today.');
    await userEvent.click(canvas.getByRole('button', { name: 'Undo' }));
    await expect(canvas.getByRole('button', { name: 'Edit water, 250 millilitres of 2 litres' })).toBeInTheDocument();
  },
};
