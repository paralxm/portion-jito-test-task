import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { NavigationBar } from '../../design-system';
import { expectNoHorizontalOverflow, withRootFontSize } from '../../design-system/storybook/decorators';
import type { FoodCandidate } from '../../features/calorie-calculator/domain/calculation';
import { searchFoods } from '../../features/calorie-calculator/domain/fixtures';
import { recipeCatalogue } from '../../features/recipe-discovery/domain/fixtures';
import { filterRecipes, removeCriterion, searchRecipes, type RecipeCriteria } from '../../features/recipe-discovery/domain/matching';
import { SearchScreen, type SearchScope } from './SearchScreen';

const navigation = <NavigationBar selected="search" onSelect={fn()} onLogFood={fn()} />;
const idle = { status: 'idle', results: [] } as const;

function Harness({
  initialScope = 'food',
  initialQuery = '',
  initialCriteria = {},
  onOpenFood,
  onOpenRecipe,
  onScanBarcode = fn(),
}: {
  initialScope?: SearchScope;
  initialQuery?: string;
  initialCriteria?: RecipeCriteria;
  onOpenFood: (candidate: FoodCandidate) => void;
  onOpenRecipe: (id: string) => void;
  onScanBarcode?: () => void;
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
      onScanBarcode={onScanBarcode}
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
    onScanBarcode: fn(),
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
    await expect(canvas.getByRole('tab', { name: 'Food' })).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByText('Search for a food or dish')).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: /^Filters/ })).toBeNull();
    // Food scope carries the barcode shortcut at the end of the field.
    await expect(canvas.getByRole('button', { name: 'Scan barcode' })).toBeVisible();
  },
};

export const BarcodeShortcut: Story = {
  name: 'Food scope — the barcode action opens the scanner in one tap',
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Scan barcode' }));
    await expect(args.onScanBarcode).toHaveBeenCalledTimes(1);
  },
};

export const Interactive: Story = {
  name: 'Type, switch scope, keep the query',
  render: (args) => <Harness onOpenFood={args.onOpenFood} onOpenRecipe={args.onOpenRecipe} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('searchbox'), 'lentil');
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('1 food found');
    await userEvent.click(canvas.getByRole('tab', { name: 'Recipes' }));
    await expect(canvas.getByRole('searchbox')).toHaveValue('lentil');
    await expect(canvas.getByRole('button', { name: 'Filters' })).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Scan barcode' })).toBeNull();
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('1 recipe found');
    await userEvent.click(canvas.getByRole('button', { name: 'Lentil soup' }));
    await expect(args.onOpenRecipe).toHaveBeenCalledWith('recipe-lentil-soup');
    await userEvent.click(canvas.getByRole('tab', { name: 'Food' }));
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

export const Narrow320: Story = {
  name: 'Narrow — 320',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('searchbox')).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 320 at 200 %',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('searchbox')).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};

export const RecipesScopeWithCriteria: Story = {
  name: 'Recipes scope with a criteria snapshot',
  render: (args) => <Harness initialScope="recipes" initialQuery="a" initialCriteria={{ caloriesMax: 460 }} onOpenFood={args.onOpenFood} onOpenRecipe={args.onOpenRecipe} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Remove filter: Under 460 kcal' })).toBeInTheDocument();
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('match your filters');
    await userEvent.click(canvas.getByRole('tab', { name: 'Food' }));
    await expect(canvas.queryByRole('button', { name: /Remove filter/ })).toBeNull();
  },
};
