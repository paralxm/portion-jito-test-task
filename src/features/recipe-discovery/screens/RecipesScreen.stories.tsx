import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { NavigationBar } from '../../../design-system/patterns/NavigationBar/NavigationBar';
import { expectNoHorizontalOverflow, withRootFontSize } from '../../../design-system/storybook/decorators';
import { recipeCatalogue } from '../domain/fixtures';
import { removeCriterion, toggleDietary, type RecipeCriteria } from '../domain/matching';
import { RecipesScreen, type RecipesStatus } from './RecipesScreen';

const navigation = <NavigationBar selected="recipes" onSelect={fn()} onLogFood={fn()} />;

function Harness({ status, initialCriteria, onOpenRecipe, onOpenSearch, onRetry }: { status: RecipesStatus; initialCriteria: RecipeCriteria; onOpenRecipe: (id: string) => void; onOpenSearch: (snapshot: RecipeCriteria) => void; onRetry: () => void }) {
  const [criteria, setCriteria] = useState(initialCriteria);
  return (
    <RecipesScreen
      recipes={recipeCatalogue}
      criteria={criteria}
      status={status}
      onApplyCriteria={setCriteria}
      onRemoveCriterion={(key) => setCriteria((c) => removeCriterion(c, key))}
      onClearCriteria={() => setCriteria({})}
      onToggleDietary={(id) => setCriteria((c) => toggleDietary(c, id))}
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
  args: { recipes: recipeCatalogue, criteria: {}, status: 'ready', onApplyCriteria: fn(), onRemoveCriterion: fn(), onClearCriteria: fn(), onToggleDietary: fn(), onRetry: fn(), onOpenRecipe: fn(), onOpenSearch: fn(), navigation },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'S03 — curated discovery (ledger §12 B1, after R2): the real count, a search entry into Search’s Recipes scope, the numeric filter sheet, quick dietary chips that toggle constraints at once (AND; vegan implies vegetarian), and groups derived from each recipe’s own record — Featured (editorial flag), Ready in under 30 minutes, 30 g protein or more — as photographic rails whose "View all" hands Search a criteria snapshot. No matches and service failure are separate states with their own recovery.',
      },
    },
  },
} satisfies Meta<typeof RecipesScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Discovery: Story = {
  name: 'Discovery — real count, three groups, quick chips',
  render: (args) => <Harness status="ready" initialCriteria={{}} onOpenRecipe={args.onOpenRecipe} onOpenSearch={args.onOpenSearch} onRetry={args.onRetry} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('10 recipes');
    await expect(canvas.getByRole('heading', { name: 'Featured' })).toBeInTheDocument();
    await expect(canvas.getByRole('heading', { name: 'Ready in under 30 minutes' })).toBeInTheDocument();
    await expect(canvas.getByRole('heading', { name: '30 g protein or more' })).toBeInTheDocument();
    await expect(canvas.queryByText(/Matches/)).toBeNull();
    await expect(canvas.queryByText(/Popular/)).toBeNull();
    await userEvent.click(canvas.getAllByRole('button', { name: 'Lentil soup' })[0]);
    await expect(args.onOpenRecipe).toHaveBeenCalledWith('recipe-lentil-soup');
    await userEvent.click(canvas.getByRole('button', { name: 'Search recipes' }));
    await expect(args.onOpenSearch).toHaveBeenLastCalledWith({});
    await userEvent.click(canvas.getByRole('button', { name: /^View all \d+ in Ready in under 30 minutes/ }));
    await expect(args.onOpenSearch).toHaveBeenLastCalledWith({ preparationMax: 30 });
    await userEvent.click(canvas.getByRole('button', { name: 'Browse all 10 recipes' }));
    await expect(args.onOpenSearch).toHaveBeenLastCalledWith({});
  },
};

export const QuickChips: Story = {
  name: 'Quick chips — multi-select, AND, All clears',
  render: (args) => <Harness status="ready" initialCriteria={{}} onOpenRecipe={args.onOpenRecipe} onOpenSearch={args.onOpenSearch} onRetry={args.onRetry} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const summary = () => canvas.getByRole('status', { name: 'Results summary' });
    const group = () => canvas.getByRole('group', { name: 'Dietary' });
    await expect(within(group()).getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(within(group()).getByRole('button', { name: 'Vegetarian' }));
    await expect(within(group()).getByRole('button', { name: 'Vegetarian' })).toHaveAttribute('aria-pressed', 'true');
    await expect(within(group()).getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false');
    // Vegan recipes count as vegetarian: traybake, tofu and the curry join the four declared vegetarian ones.
    await expect(summary()).toHaveTextContent('7 recipes match your filters');
    await userEvent.click(within(group()).getByRole('button', { name: 'Gluten-free' }));
    await expect(within(group()).getByRole('button', { name: 'Gluten-free' })).toHaveAttribute('aria-pressed', 'true');
    await expect(summary()).toHaveTextContent('3 recipes match your filters');
    await expect(canvas.getAllByText('Matches all 2 filters').length).toBeGreaterThanOrEqual(1);
    await userEvent.click(within(group()).getByRole('button', { name: 'All' }));
    await expect(within(group()).getByRole('button', { name: 'Vegetarian' })).toHaveAttribute('aria-pressed', 'false');
    await expect(summary()).toHaveTextContent('10 recipes');
  },
};

export const ApplyFilters: Story = {
  name: 'Apply, remove and clear numeric filters from the sheet',
  render: (args) => <Harness status="ready" initialCriteria={{}} onOpenRecipe={args.onOpenRecipe} onOpenSearch={args.onOpenSearch} onRetry={args.onRetry} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /^Filters/ }));
    const dialog = canvas.getByRole('dialog', { name: 'Filters' });
    await userEvent.type(within(dialog).getByLabelText(/Protein per serving/), '30');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Vegetarian' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Apply filters' }));
    await expect(canvas.queryByRole('dialog')).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Remove filter: 30 g protein or more' })).toBeInTheDocument();
    // The dietary constraint shows as the pressed quick chip, not a second chip.
    await expect(canvas.queryByRole('button', { name: 'Remove filter: Vegetarian' })).toBeNull();
    const group = () => canvas.getByRole('group', { name: 'Dietary' });
    await expect(within(group()).getByRole('button', { name: 'Vegetarian' })).toHaveAttribute('aria-pressed', 'true');
    const summary = () => canvas.getByRole('status', { name: 'Results summary' });
    await expect(summary()).toHaveTextContent('No recipes match your filters');
    await userEvent.click(within(group()).getByRole('button', { name: 'Vegetarian' }));
    await expect(summary()).toHaveTextContent('2 recipes match your filters');
    await userEvent.click(canvas.getByRole('button', { name: 'Remove filter: 30 g protein or more' }));
    await expect(summary()).toHaveTextContent('10 recipes');
  },
};

export const Filtered: Story = {
  render: (args) => <Harness status="ready" initialCriteria={{ caloriesMin: 300, caloriesMax: 500, proteinMin: 10, dietary: ['vegan'] }} onOpenRecipe={args.onOpenRecipe} onOpenSearch={args.onOpenSearch} onRetry={args.onRetry} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('2 recipes match your filters');
    await expect(canvas.getAllByText('Matches all 3 filters').length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getByRole('button', { name: 'Filters, 3 active' })).toBeVisible();
  },
};

export const NoMatch: Story = {
  name: 'No matches — change or clear filters',
  render: (args) => <Harness status="ready" initialCriteria={{ preparationMax: 5 }} onOpenRecipe={args.onOpenRecipe} onOpenSearch={args.onOpenSearch} onRetry={args.onRetry} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('No recipes match your filters');
    await userEvent.click(canvas.getByRole('button', { name: 'Clear all filters' }));
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('10 recipes');
  },
};

export const Loading: Story = {
  args: { status: 'loading' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByText('Loading recipes').length).toBeGreaterThanOrEqual(1);
  },
};

export const Failure: Story = {
  name: 'Service failure — retry keeps filters',
  args: { status: 'failure', criteria: { caloriesMax: 500 } },
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
