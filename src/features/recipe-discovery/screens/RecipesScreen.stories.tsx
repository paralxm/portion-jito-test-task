import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { NavigationBar } from '../../../design-system/patterns/NavigationBar/NavigationBar';
import { expectNoHorizontalOverflow, withRootFontSize } from '../../../design-system/storybook/decorators';
import { toggleTime } from '../domain/discovery';
import { recipeCatalogue } from '../domain/fixtures';
import { toggleDietary, type RecipeCriteria } from '../domain/matching';
import { RecipesScreen, type RecipesStatus } from './RecipesScreen';

const navigation = <NavigationBar selected="recipes" onSelect={fn()} onLogFood={fn()} />;

function Harness({ status, initialCriteria, onOpenRecipe, onOpenSearch, onRetry }: { status: RecipesStatus; initialCriteria: RecipeCriteria; onOpenRecipe: (id: string) => void; onOpenSearch: (snapshot: RecipeCriteria) => void; onRetry: () => void }) {
  const [criteria, setCriteria] = useState(initialCriteria);
  return (
    <RecipesScreen
      recipes={recipeCatalogue}
      criteria={criteria}
      status={status}
      onClearCriteria={() => setCriteria({})}
      onToggleDietary={(id) => setCriteria((c) => toggleDietary(c, id))}
      onToggleTime={(minutes) => setCriteria((c) => toggleTime(c, minutes))}
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
  args: { recipes: recipeCatalogue, criteria: {}, status: 'ready', onClearCriteria: fn(), onToggleDietary: fn(), onToggleTime: fn(), onRetry: fn(), onOpenRecipe: fn(), onOpenSearch: fn(), navigation },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'S03 — discovery without a search field (ledger §13, after H-REF 2): one featured recipe with prominent photography, quick preferences (dietary toggles combined with AND, one exclusive time bound, the active count and Reset), thematic collections derived from each recipe’s own record — Ready in under 30 minutes, 30 g protein or more — as photographic rails whose "View all" hands Search a criteria snapshot, and Browse all recipes. Empty collections are omitted; no match is one state with Reset; service failure keeps the preferences.',
      },
    },
  },
} satisfies Meta<typeof RecipesScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Discovery: Story = {
  name: 'Discovery — featured recipe, quick preferences, two collections, browse all',
  render: (args) => <Harness status="ready" initialCriteria={{}} onOpenRecipe={args.onOpenRecipe} onOpenSearch={args.onOpenSearch} onRetry={args.onRetry} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('searchbox')).toBeNull();
    await expect(canvas.getByRole('article', { name: /^Featured recipe: Lentil soup/ })).toBeInTheDocument();
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('10 recipes');
    await expect(canvas.getByRole('heading', { name: 'Ready in under 30 minutes' })).toBeInTheDocument();
    await expect(canvas.getByRole('heading', { name: '30 g protein or more' })).toBeInTheDocument();
    await expect(canvas.queryByRole('heading', { name: 'Featured' })).toBeNull();
    await expect(canvas.queryByText('No photo')).toBeNull();
    await userEvent.click(within(canvas.getByRole('article', { name: /^Featured recipe/ })).getByRole('button', { name: 'Lentil soup' }));
    await expect(args.onOpenRecipe).toHaveBeenLastCalledWith('recipe-lentil-soup');
    await userEvent.click(canvas.getByRole('button', { name: /^View all \d+ in Ready in under 30 minutes/ }));
    await expect(args.onOpenSearch).toHaveBeenLastCalledWith({ preparationMax: 30 });
    await userEvent.click(canvas.getByRole('button', { name: /^View all \d+ in 30 g protein or more/ }));
    await expect(args.onOpenSearch).toHaveBeenLastCalledWith({ proteinMin: 30 });
    await userEvent.click(canvas.getByRole('button', { name: 'Browse all 10 recipes' }));
    await expect(args.onOpenSearch).toHaveBeenLastCalledWith({});
  },
};

export const QuickPreferences: Story = {
  name: 'Quick preferences — dietary AND, one time bound, count and Reset',
  render: (args) => <Harness status="ready" initialCriteria={{}} onOpenRecipe={args.onOpenRecipe} onOpenSearch={args.onOpenSearch} onRetry={args.onRetry} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const summary = () => canvas.getByRole('status', { name: 'Results summary' });
    const dietary = () => within(canvas.getByRole('group', { name: 'Dietary' }));
    const time = () => within(canvas.getByRole('group', { name: /Preparation time/ }));
    await expect(canvas.getByText('None active')).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'Reset' })).toBeNull();
    await userEvent.click(dietary().getByRole('button', { name: 'Vegetarian' }));
    await expect(dietary().getByRole('button', { name: 'Vegetarian' })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByText('1 active')).toBeVisible();
    await userEvent.click(time().getByRole('button', { name: 'Under 30 min' }));
    await expect(time().getByRole('button', { name: 'Under 30 min' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(time().getByRole('button', { name: 'Under 15 min' }));
    await expect(time().getByRole('button', { name: 'Under 15 min' })).toHaveAttribute('aria-pressed', 'true');
    await expect(time().getByRole('button', { name: 'Under 30 min' })).toHaveAttribute('aria-pressed', 'false');
    await expect(canvas.getByText('2 active')).toBeVisible();
    await expect(summary()).toHaveTextContent(/match your preferences/);
    // The featured recipe and the collections follow the preferences.
    await expect(canvas.queryByRole('article', { name: /^Featured recipe: Lentil soup/ })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: /^View all/ }));
    await expect(args.onOpenSearch).toHaveBeenLastCalledWith({ dietary: ['vegetarian'], preparationMax: 15 });
    await userEvent.click(canvas.getByRole('button', { name: 'Reset' }));
    await expect(summary()).toHaveTextContent('10 recipes');
    await expect(canvas.getByText('None active')).toBeVisible();
  },
};

export const NoMatch: Story = {
  name: 'No matches — one empty state with Reset',
  render: (args) => <Harness status="ready" initialCriteria={{ dietary: ['vegan', 'dairy-free'], preparationMax: 15 }} onOpenRecipe={args.onOpenRecipe} onOpenSearch={args.onOpenSearch} onRetry={args.onRetry} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText('No recipes match your preferences').length).toBeGreaterThanOrEqual(1);
    await expect(canvas.queryAllByRole('heading', { name: /Ready in under|protein or more/ })).toHaveLength(0);
    await userEvent.click(canvas.getByRole('button', { name: 'Reset preferences' }));
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
  name: 'Service failure — retry keeps the preferences',
  args: { status: 'failure', criteria: { dietary: ['vegan'] } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('alert')).toHaveTextContent('Recipes could not be loaded');
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};

export const Narrow320: Story = {
  name: 'Narrow — 320: rails scroll, the page never does',
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
