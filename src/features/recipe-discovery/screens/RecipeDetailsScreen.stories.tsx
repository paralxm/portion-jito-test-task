import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { NavigationBar } from '../../../design-system/patterns/NavigationBar/NavigationBar';
import { fixtureR, recipeCatalogue } from '../domain/fixtures';
import { RecipeDetailsScreen } from './RecipeDetailsScreen';

const navigation = <NavigationBar selected="recipes" onSelect={fn()} onLogFood={fn()} />;

const meta = {
  title: 'Product compositions/Recipe details (S08)',
  component: RecipeDetailsScreen,
  args: { state: { status: 'loaded', recipe: fixtureR }, criteria: { caloriesMax: 500, proteinMin: 20 }, onBack: fn(), onRetry: fn(), onAdd: fn(), navigation },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'S08 — Loading → Loaded or Unavailable, with the bottom bar retained and the originating destination still selected. Details compare each active criterion with its known value, show the per-serving nutrition through the shared summary, and list ingredients and method. No photo is ordinary loaded content. Finding and evaluating a recipe completes the task.',
      },
    },
  },
} satisfies Meta<typeof RecipeDetailsScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  name: 'Loaded — fixture R with active criteria',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 2, name: 'Lentil soup' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Recipes' })).toHaveAttribute('aria-current', 'page');
    await expect(canvas.getAllByRole('img', { name: 'Met' })).toHaveLength(2);
    await expect(canvas.getByText('450')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Show all nutrition' }));
    await expect(canvas.getByText('of which fibre')).toBeVisible();
    await expect(canvas.getByText('Vitamin D')).toBeVisible();
    await expect(canvas.getByText('Not available')).toBeInTheDocument();
    await expect(canvas.getAllByRole('listitem').length).toBeGreaterThanOrEqual(fixtureR.ingredients.length + fixtureR.instructions.length);
    await expect(canvas.getByText('7 items')).toBeVisible();
    await expect(canvas.getByText('3 steps')).toBeVisible();
  },
};

export const AddOpensTheSheet: Story = {
  name: 'Add beside the title hands the recipe to the Add-to-meal sheet',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const add = canvas.getByRole('button', { name: 'Add Lentil soup to a meal' });
    await expect(add).toHaveTextContent('Add');
    await userEvent.click(add);
    await expect(args.onAdd).toHaveBeenCalledWith(fixtureR);
    // No sticky action footer competes with the fixed bar.
    await expect(canvas.queryByRole('contentinfo')).toBeNull();
  },
};

export const LoadedNoCriteria: Story = {
  name: 'Loaded — no active criteria, no match claim',
  args: { criteria: {} },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByText('Your filters')).toBeNull();
  },
};

export const NoPhotoLongTitle: Story = {
  name: 'Loaded — no photo, long title (S08-4)',
  args: { state: { status: 'loaded', recipe: { ...recipeCatalogue[2], imageUrl: undefined } }, criteria: {} },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('No photo')).toBeVisible();
    await expect(canvas.getByRole('heading', { level: 2 })).toHaveTextContent('Wholegrain pasta with roasted vegetables and tahini dressing');
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth + 1);
  },
};

export const UnknownProtein: Story = {
  name: 'Loaded — unknown protein cannot satisfy a protein filter',
  args: { state: { status: 'loaded', recipe: recipeCatalogue[4] }, criteria: { proteinMin: 10 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('img', { name: 'Not met' })).toBeInTheDocument();
    await expect(canvas.getByText(/Protein per serving not available/)).toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: { state: { status: 'loading' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText('Loading recipe').length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getByRole('button', { name: 'Recipes' })).toHaveAttribute('aria-current', 'page');
  },
};

export const Unavailable: Story = {
  name: 'Unavailable — retry the same recipe',
  args: { state: { status: 'unavailable' } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('alert')).toHaveTextContent('This recipe could not be loaded');
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
    // Both the header Back and the recovery action lead to the same place.
    const [headerBack, recoveryBack] = canvas.getAllByRole('button', { name: 'Back to results' });
    await userEvent.click(recoveryBack);
    await userEvent.click(headerBack);
    await expect(args.onBack).toHaveBeenCalledTimes(2);
  },
};

export const FromSearch: Story = {
  name: 'Opened from Search — Search stays selected',
  args: { navigation: <NavigationBar selected="search" onSelect={fn()} onLogFood={fn()} /> },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Search' })).toHaveAttribute('aria-current', 'page');
  },
};
