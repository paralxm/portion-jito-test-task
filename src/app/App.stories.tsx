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
          'The evaluator-facing runtime composed from the same components: three roots, the Add food chooser, focused steps that stay mounted for Back, simulated services and fixture data. This story renders the real `App`; the runtime walkthrough script covers the full journeys with screenshots.',
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
    // Home's body CTA and the nav's trailing action share the "Add food" label — same
    // action, same O01 instance. Click the trailing one, matching the original journey.
    const addFoodButtons = canvas.getAllByRole('button', { name: 'Add food' });
    await userEvent.click(addFoodButtons[addFoodButtons.length - 1]);
    await expect(canvas.getByRole('dialog', { name: 'How would you like to add food?' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /Enter manually/ }));
    await expect(canvas.getByRole('heading', { level: 1, name: 'Enter manually' })).toBeInTheDocument();
    await expect(canvas.queryByRole('navigation')).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    await expect(canvas.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
  },
};
