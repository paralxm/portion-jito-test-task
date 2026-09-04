import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { NavigationBar } from '../../../design-system/patterns/NavigationBar/NavigationBar';
import { expectNoHorizontalOverflow, withRootFontSize } from '../../../design-system/storybook/decorators';
import { recipeCatalogue } from '../domain/fixtures';
import { filterRecipes, removeCriterion, type RecipeCriteria } from '../domain/matching';
import { RecipesScreen, type RecipesStatus } from './RecipesScreen';

const navigation = <NavigationBar selected="recipes" onSelect={fn()} onLogFood={fn()} />;

function Harness({ status, initialCriteria, onOpenRecipe, onOpenSearch, onRetry }: { status: RecipesStatus; initialCriteria: RecipeCriteria; onOpenRecipe: (id: string) => void; onOpenSearch: () => void; onRetry: () => void }) {
  const [criteria, setCriteria] = useState(initialCriteria);
  return (
    <RecipesScreen
      results={filterRecipes(recipeCatalogue, criteria)}
      criteria={criteria}
      status={status}
      onApplyCriteria={setCriteria}
      onRemoveCriterion={(key) => setCriteria((c) => removeCriterion(c, key))}
      onClearCriteria={() => setCriteria({})}
      onRetry={onRetry}
      onOpenRecipe={onOpenRecipe}
      onOpenSearch={onOpenSearch}
      navigation={navigation}
    />
  );
}

const meta = {
  title: 'Product compositions/Recipes (S03)',
  component: RecipesScreen,
  args: { results: recipeCatalogue, criteria: {}, status: 'ready', onApplyCriteria: fn(), onRemoveCriterion: fn(), onClearCriteria: fn(), onRetry: fn(), onOpenRecipe: fn(), onOpenSearch: fn(), navigation },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'S03 — query-free browsing with the same filter sheet as Search. Criteria combine with AND; unknown values never match; removing an applied chip commits immediately. No matches and service failure are separate states with their own recovery.',
      },
    },
  },
} satisfies Meta<typeof RecipesScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Browse: Story = {
  render: (args) => <Harness status="ready" initialCriteria={{}} onOpenRecipe={args.onOpenRecipe} onOpenSearch={args.onOpenSearch} onRetry={args.onRetry} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('5 recipes');
    await expect(canvas.queryByText(/Matches/)).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Lentil soup' }));
    await expect(args.onOpenRecipe).toHaveBeenCalledWith('recipe-lentil-soup');
    await userEvent.click(canvas.getByRole('button', { name: 'Search recipes' }));
    await expect(args.onOpenSearch).toHaveBeenCalledTimes(1);
  },
};

export const ApplyFilters: Story = {
  name: 'Apply, remove and clear filters',
  render: (args) => <Harness status="ready" initialCriteria={{}} onOpenRecipe={args.onOpenRecipe} onOpenSearch={args.onOpenSearch} onRetry={args.onRetry} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /^Filters/ }));
    const dialog = canvas.getByRole('dialog', { name: 'Filters' });
    await userEvent.type(within(dialog).getByLabelText(/Protein per serving/), '20');
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Vegetarian' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Apply filters' }));
    await expect(canvas.queryByRole('dialog')).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Remove filter: 20 g protein or more' })).toBeInTheDocument();
    const summary = () => canvas.getByRole('status', { name: 'Results summary' });
    await expect(summary()).toHaveTextContent('No recipes match your filters');
    await userEvent.click(canvas.getByRole('button', { name: 'Remove filter: Vegetarian' }));
    await expect(summary()).toHaveTextContent('2 recipes match your filters');
    await expect(canvas.getAllByText('Matches all 1 filter')).toHaveLength(2);
    await userEvent.click(canvas.getByRole('button', { name: 'Remove filter: 20 g protein or more' }));
    await expect(summary()).toHaveTextContent('5 recipes');
  },
};

export const Filtered: Story = {
  render: (args) => <Harness status="ready" initialCriteria={{ caloriesMin: 300, caloriesMax: 500, proteinMin: 10, dietary: 'vegan' }} onOpenRecipe={args.onOpenRecipe} onOpenSearch={args.onOpenSearch} onRetry={args.onRetry} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('1 recipe matches your filters');
    await expect(canvas.getByText('Matches all 3 filters')).toBeInTheDocument();
  },
};

export const NoMatch: Story = {
  name: 'No matches — change or clear filters',
  render: (args) => <Harness status="ready" initialCriteria={{ preparationMax: 5 }} onOpenRecipe={args.onOpenRecipe} onOpenSearch={args.onOpenSearch} onRetry={args.onRetry} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('No recipes match your filters');
    await userEvent.click(canvas.getByRole('button', { name: 'Clear all filters' }));
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('5 recipes');
  },
};

export const Loading: Story = {
  args: { status: 'loading', results: [] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByText('Loading recipes').length).toBeGreaterThanOrEqual(1);
  },
};

export const Failure: Story = {
  name: 'Service failure — retry keeps filters',
  args: { status: 'failure', results: [], criteria: { caloriesMax: 500 } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('alert')).toHaveTextContent('Recipes could not be loaded');
    await expect(canvas.getByRole('button', { name: 'Remove filter: Under 500 kcal' })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};

export const Narrow320: Story = {
  name: 'Narrow — 320',
  render: (args) => <Harness status="ready" initialCriteria={{}} onOpenRecipe={args.onOpenRecipe} onOpenSearch={args.onOpenSearch} onRetry={args.onRetry} />,
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('heading', { level: 1, name: 'Recipes' })).toBeInTheDocument();
    await expectNoHorizontalOverflow();
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 320 at 200 %',
  render: (args) => <Harness status="ready" initialCriteria={{}} onOpenRecipe={args.onOpenRecipe} onOpenSearch={args.onOpenSearch} onRetry={args.onRetry} />,
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('heading', { level: 1, name: 'Recipes' })).toBeInTheDocument();
    await expectNoHorizontalOverflow();
  },
};
