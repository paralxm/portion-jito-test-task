import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import App from './App';

const meta = {
  title: 'Product compositions/App (runtime)',
  component: App,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The evaluator-facing runtime composed from the same components: three roots, the Log food chooser, focused steps that stay mounted for Back, simulated services, fixture data, and the session-only daily record (entries and the optional goal). This story renders the real `App`; the runtime walkthrough script covers the full journeys with screenshots.',
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
    await expect(canvas.getByText(/Nothing logged today/)).toBeVisible();
    // Home's body CTA and the bar's Log food action share one O01 instance. Click the
    // bar's, matching the original journey.
    const addFoodButtons = canvas.getAllByRole('button', { name: /Log (first )?food/ });
    await userEvent.click(addFoodButtons[addFoodButtons.length - 1]);
    await expect(canvas.getByRole('dialog', { name: 'Log food' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /Enter manually/ }));
    await expect(canvas.getByRole('heading', { level: 1, name: 'Enter manually' })).toBeInTheDocument();
    await expect(canvas.queryByRole('navigation')).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    await expect(canvas.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
  },
};

export const AddToTodayJourney: Story = {
  name: 'Search → review → Add to today → Home populated → edit entry',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Log first food' }));
    await userEvent.click(await canvas.findByRole('button', { name: /Search food/ }));
    await userEvent.type(canvas.getByRole('searchbox'), 'rice');
    await userEvent.click(await canvas.findByRole('button', { name: /Vegetable rice bowl/ }, { timeout: 3000 }));
    const amount = await canvas.findByLabelText('Amount to calculate');
    await userEvent.clear(amount);
    await userEvent.type(amount, '300');
    await expect(canvas.getByText('540')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Add to today' }));
    // Home is populated (S01-2): one entry, its energy, and the row opens edit mode.
    await expect(canvas.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
    await expect(canvas.getByText('1 entry · 540 kcal')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /Vegetable rice bowl/ }));
    await expect(canvas.getByRole('heading', { level: 1, name: 'Edit entry' })).toBeInTheDocument();
    const edit = canvas.getByLabelText('Amount to calculate');
    await userEvent.clear(edit);
    await userEvent.type(edit, '150');
    await userEvent.click(canvas.getByRole('button', { name: 'Update entry' }));
    await expect(canvas.getByText('1 entry · 270 kcal')).toBeVisible();
  },
};
