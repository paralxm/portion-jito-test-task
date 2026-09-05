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
    await expect(canvas.getByRole('button', { name: 'Set targets' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Log food' }));
    await expect(canvas.getByRole('dialog', { name: 'Log food' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /Enter manually/ }));
    await expect(canvas.getByRole('heading', { level: 1, name: 'Food details' })).toBeInTheDocument();
    await expect(canvas.queryByRole('navigation')).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    await expect(canvas.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
  },
};

export const AddToMealJourney: Story = {
  name: 'Search → review → Add to lunch → Home meal populated → edit entry',
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
    await expect(canvas.getByRole('radio', { name: 'Lunch' })).toBeChecked();
    await expect(canvas.getByText(/Preselected from the meal/)).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Add to lunch' }));
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

export const ManualTwoStepJourney: Story = {
  name: 'Manual entry in two steps: the draft survives Back and Edit, the meal is suggested and stays editable',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Log food' }));
    await userEvent.click(await canvas.findByRole('button', { name: /Enter manually/ }));
    await userEvent.type(canvas.getByLabelText('Food or dish name'), 'Lentil soup');
    await userEvent.type(canvas.getByLabelText('Calories'), '150');
    await userEvent.click(canvas.getByRole('button', { name: 'Continue to portion' }));
    await expect(await canvas.findByRole('heading', { level: 1, name: 'Portion and meal' })).toBeInTheDocument();
    const suggested = suggestMeal();
    await expect(canvas.getByRole('radio', { name: new RegExp(`^${mealPhrase(suggested)}$`, 'i') })).toBeChecked();
    await expect(canvas.getByText(/Suggested for this time of day/)).toBeVisible();
    // The actual portion is changed, then Back to the details and Continue again: it is kept.
    const amount = canvas.getByLabelText('Amount to calculate');
    await userEvent.clear(amount);
    await userEvent.type(amount, '250');
    await expect(canvas.getByText('375')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Edit food details' }));
    await expect(await canvas.findByRole('heading', { level: 1, name: 'Food details' })).toBeInTheDocument();
    await expect(canvas.getByLabelText('Food or dish name')).toHaveValue('Lentil soup');
    await userEvent.click(canvas.getByRole('button', { name: 'Continue to portion' }));
    await expect(await canvas.findByLabelText('Amount to calculate')).toHaveValue('250');
    await userEvent.click(canvas.getByRole('radio', { name: 'Snacks' }));
    await expect(canvas.getByRole('button', { name: 'Add to snacks' })).toBeEnabled();
    // Cancel asks; Keep editing changes nothing.
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(within(await canvas.findByRole('alertdialog', { name: 'Discard changes?' })).getByRole('button', { name: 'Keep editing' }));
    await expect(canvas.getByRole('heading', { level: 1, name: 'Portion and meal' })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Add to snacks' }));
    await expect(await canvas.findByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
    const snacks = canvas.getByRole('region', { name: 'Snacks' });
    await expect(within(snacks).getByRole('button', { name: /Lentil soup/ })).toBeVisible();
    await expect(canvas.getByText('375 kcal logged')).toBeVisible();
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
