import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { NavigationBar } from '../../design-system';
import type { FoodCandidate } from '../../features/calorie-calculator/domain/calculation';
import { searchFoods } from '../../features/calorie-calculator/domain/fixtures';
import { recipeCatalogue } from '../../features/recipe-discovery/domain/fixtures';
import { filterRecipes, removeCriterion, searchRecipes, type RecipeCriteria } from '../../features/recipe-discovery/domain/matching';
import { SearchScreen, type SearchScope } from './SearchScreen';

const navigation = <NavigationBar selected="search" onSelect={fn()} onAddFood={fn()} />;
const idle = { status: 'idle', results: [] } as const;

function Harness({
  initialScope = 'food',
  initialQuery = '',
  initialCriteria = {},
  onOpenFood,
  onOpenRecipe,
}: {
  initialScope?: SearchScope;
  initialQuery?: string;
  initialCriteria?: RecipeCriteria;
  onOpenFood: (candidate: FoodCandidate) => void;
  onOpenRecipe: (id: string) => void;
}) {
  const [scope, setScope] = useState<SearchScope>(initialScope);
  const [query, setQuery] = useState(initialQuery);
  const [criteria, setCriteria] = useState<RecipeCriteria>(initialCriteria);
  const trimmed = query.trim();
  const food = trimmed ? ({ status: 'ready', results: searchFoods(trimmed) } as const) : idle;
  const recipes = trimmed ? ({ status: 'ready', results: filterRecipes(searchRecipes(recipeCatalogue, trimmed), criteria) } as const) : idle;
  return (
    <SearchScreen
      scope={scope}
      onScopeChange={setScope}
      query={query}
      onQueryChange={setQuery}
      onSubmit={fn()}
      onClear={() => setQuery('')}
      food={food}
      recipes={recipes}
      criteria={criteria}
      onApplyCriteria={setCriteria}
      onRemoveCriterion={(key) => setCriteria((c) => removeCriterion(c, key))}
      onOpenFood={onOpenFood}
      onOpenRecipe={onOpenRecipe}
      onRetry={fn()}
      onEnterManually={fn()}
      navigation={navigation}
    />
  );
}

const meta = {
  title: 'Product compositions/Search (S02)',
  component: SearchScreen,
  args: {
    scope: 'food',
    onScopeChange: fn(),
    query: '',
    onQueryChange: fn(),
    onSubmit: fn(),
    onClear: fn(),
    food: idle,
    recipes: idle,
    criteria: {},
    onApplyCriteria: fn(),
    onRemoveCriterion: fn(),
    onOpenFood: fn(),
    onOpenRecipe: fn(),
    onRetry: fn(),
    onEnterManually: fn(),
    navigation,
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'S02 — shared Search with Food and Recipes scopes over one query. Food results are never filtered by recipe criteria; Recipes results combine the query with the applied criteria snapshot. Idle, loading, results, no matches and service failure are distinct states.',
      },
    },
  },
} satisfies Meta<typeof SearchScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  name: 'Idle — Food scope, no query',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radio', { name: 'Food' })).toHaveAttribute('aria-checked', 'true');
    await expect(canvas.getByText('Search for a food or dish')).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: /^Filters/ })).toBeNull();
  },
};

export const Interactive: Story = {
  name: 'Type, switch scope, keep the query',
  render: (args) => <Harness onOpenFood={args.onOpenFood} onOpenRecipe={args.onOpenRecipe} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('searchbox'), 'lentil');
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('1 food found');
    await userEvent.click(canvas.getByRole('radio', { name: 'Recipes' }));
    await expect(canvas.getByRole('searchbox')).toHaveValue('lentil');
    await expect(canvas.getByRole('button', { name: /^Filters/ })).toBeInTheDocument();
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('1 recipe found');
    await userEvent.click(canvas.getByRole('button', { name: 'Lentil soup' }));
    await expect(args.onOpenRecipe).toHaveBeenCalledWith('recipe-lentil-soup');
    await userEvent.click(canvas.getByRole('radio', { name: 'Food' }));
    await userEvent.click(canvas.getByRole('button', { name: /Lentil soup/ }));
    await expect(args.onOpenFood).toHaveBeenCalledTimes(1);
  },
};

export const Loading: Story = {
  args: { query: 'lentil', food: { status: 'loading', results: [] } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByText('Searching foods').length).toBeGreaterThanOrEqual(1);
  },
};

export const NoMatch: Story = {
  name: 'No matches — enter manually',
  args: { query: 'zzzz', food: { status: 'ready', results: [] } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('No foods match “zzzz”');
    await expect(canvas.getAllByText('No foods match “zzzz”').length).toBeGreaterThanOrEqual(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Enter manually' }));
    await expect(args.onEnterManually).toHaveBeenCalledTimes(1);
  },
};

export const Failure: Story = {
  name: 'Service failure — query kept',
  args: { query: 'offline', food: { status: 'failure', results: [] } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('alert')).toHaveTextContent('Search is not available right now');
    await expect(canvas.getByRole('searchbox')).toHaveValue('offline');
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};

export const RecipesScopeWithCriteria: Story = {
  name: 'Recipes scope with a criteria snapshot',
  render: (args) => <Harness initialScope="recipes" initialQuery="a" initialCriteria={{ caloriesMax: 460 }} onOpenFood={args.onOpenFood} onOpenRecipe={args.onOpenRecipe} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Remove filter: Under 460 kcal' })).toBeInTheDocument();
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('match your filters');
    await userEvent.click(canvas.getByRole('radio', { name: 'Food' }));
    await expect(canvas.queryByRole('button', { name: /Remove filter/ })).toBeNull();
  },
};
