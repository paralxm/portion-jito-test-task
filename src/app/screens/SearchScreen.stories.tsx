import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { NavigationBar } from '../../design-system';
import { expectNoHorizontalOverflow, withRootFontSize } from '../../design-system/storybook/decorators';
import { foodCatalogue, searchFoods } from '../../features/calorie-calculator/domain/fixtures';
import { NO_FOOD_FILTERS } from '../../features/calorie-calculator/domain/food-search';
import { recipeCatalogue } from '../../features/recipe-discovery/domain/fixtures';
import { WithFoodSearch } from '../states/harnesses';
import { recentFoods } from '../states/stateFixtures';
import { SearchScreen } from './SearchScreen';

const navigation = <NavigationBar selected="search" onSelect={fn()} onLogFood={fn()} />;
const idle = { status: 'idle', results: [] } as const;

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
    catalogue: foodCatalogue,
    recents: [],
    foodFilters: NO_FOOD_FILTERS,
    onApplyFoodFilters: fn(),
    foodView: 'list',
    onFoodViewChange: fn(),
    recipes: idle,
    recipeCatalogue: recipeCatalogue,
    recipeCatalogueStatus: 'ready',
    criteria: {},
    onApplyCriteria: fn(),
    onRemoveCriterion: fn(),
    recipeView: 'list',
    onRecipeViewChange: fn(),
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
          'S02 — shared Search with Food and Recipes scopes over one structure (ledger §13): the query field (the icon-only scanner beside it in Food), the tabs, the results toolbar with List / Grid at the start and the scope’s one filter action at the end, applied chips, the count, the results. Food (ledger §11.1): the food filter action offers All / Foods / Drinks; with an empty query the tab shows the catalogue at once — "Recently added" (from confirmed entries only) above "Explore foods" when history exists — and a query yields one unified result set with a unique-item count. Food results are never filtered by recipe criteria; Recipes results combine the query with the applied criteria snapshot and switch between rows and a grid of tiles without changing the set. Idle, loading, results, no matches and service failure stay distinct.',
      },
    },
  },
} satisfies Meta<typeof SearchScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstUse: Story = {
  name: 'First use — the catalogue shows at once, list view, no history',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('tab', { name: 'Food' })).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('button', { name: 'Scan barcode' })).toBeVisible();
    await expect(canvas.getByRole('radio', { name: 'List' })).toHaveAttribute('aria-checked', 'true');
    await expect(canvas.getByRole('button', { name: 'Food filters' })).toBeVisible();
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('15 items');
    await expect(canvas.queryByText('Recently added')).toBeNull();
    await expect(canvas.getAllByRole('listitem')).toHaveLength(15);
    await userEvent.click(canvas.getByRole('button', { name: /Banana/ }));
    await expect(args.onOpenFood).toHaveBeenCalledWith(expect.objectContaining({ id: 'food-banana' }));
  },
};

export const WithRecents: Story = {
  name: 'Recently added above Explore foods — derived from confirmed entries, newest first',
  args: { recents: recentFoods },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const recents = within(canvas.getByRole('list', { name: 'Recently added' }));
    const names = recents.getAllByRole('button').map((b) => b.textContent ?? '');
    await expect(names[0]).toContain('Oatmeal');
    await expect(names[1]).toContain('Greek yoghurt');
    await expect(names[2]).toContain('Banana');
    const explore = within(canvas.getByRole('list', { name: 'Explore foods' }));
    await expect(explore.queryByRole('button', { name: /Banana/ })).toBeNull();
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('15 items');
  },
};

export const GridView: Story = {
  name: 'Grid view — two columns of the same items, one column when narrow',
  args: { foodView: 'grid', recents: recentFoods },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radio', { name: 'Grid' })).toHaveAttribute('aria-checked', 'true');
    const grid = canvas.getByRole('list', { name: 'Explore foods' });
    await expect(getComputedStyle(grid).gridTemplateColumns.split(' ')).toHaveLength(2);
    await expect(canvas.getAllByRole('listitem')).toHaveLength(15);
    await expectNoHorizontalOverflow();
  },
};

export const ToggleView: Story = {
  name: 'Toggling the view keeps the query, filters and order',
  render: () => <WithFoodSearch initialQuery="a" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const order = () => canvas.getAllByRole('listitem').map((li) => foodCatalogue.find((c) => li.textContent?.includes(c.name))?.id);
    const before = order();
    await expect(before.length).toBeGreaterThan(1);
    await userEvent.click(canvas.getByRole('radio', { name: 'Grid' }));
    await expect(canvas.getByRole('radio', { name: 'Grid' })).toHaveAttribute('aria-checked', 'true');
    await expect(canvas.getByRole('searchbox')).toHaveValue('a');
    await expect(order()).toEqual(before);
  },
};

export const FoodFilters: Story = {
  name: 'Food filters — Drinks only through the sheet; cancel keeps the previous filter',
  render: () => <WithFoodSearch />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Food filters' }));
    const sheet = canvas.getByRole('dialog', { name: 'Filters' });
    await userEvent.click(within(sheet).getByRole('radio', { name: 'Drinks' }));
    await userEvent.click(within(sheet).getByRole('button', { name: 'Apply filters' }));
    await expect(canvas.getByRole('button', { name: 'Food filters, 1 active' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Remove filter: Drinks only' })).toBeVisible();
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('3 drinks');
    await expect(within(canvas.getByRole('list', { name: 'All foods' })).getAllByRole('listitem')).toHaveLength(3);
    // Reopen, change the draft, dismiss without applying: the previous filter stays.
    await userEvent.click(canvas.getByRole('button', { name: 'Food filters, 1 active' }));
    const again = canvas.getByRole('dialog', { name: 'Filters' });
    await userEvent.click(within(again).getByRole('radio', { name: 'Foods' }));
    await userEvent.click(within(again).getByRole('button', { name: 'Close' }));
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('3 drinks');
    // Clear all inside the sheet takes effect on Apply.
    await userEvent.click(canvas.getByRole('button', { name: 'Food filters, 1 active' }));
    const third = canvas.getByRole('dialog', { name: 'Filters' });
    await userEvent.click(within(third).getByRole('button', { name: 'Clear all' }));
    await userEvent.click(within(third).getByRole('button', { name: 'Apply filters' }));
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('15 items');
  },
};

export const UnifiedResults: Story = {
  name: 'A query unifies recents and catalogue into one counted set',
  render: () => <WithFoodSearch recents={recentFoods} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('searchbox'), 'oat');
    // "oat" matches the recent oatmeal and the catalogue's oat drink: one set, two unique items, the recent one first.
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('2 items found');
    await expect(canvas.queryByText('Recently added')).toBeNull();
    const names = canvas.getAllByRole('listitem').map((li) => li.textContent ?? '');
    await expect(names).toHaveLength(2);
    await expect(names[0]).toContain('Oatmeal');
    await expect(names[1]).toContain('Oat drink');
    await userEvent.click(canvas.getByRole('button', { name: 'Clear search' }));
    await expect(canvas.getByText('Recently added')).toBeVisible();
  },
};

export const BarcodeShortcut: Story = {
  name: 'Food scope — the barcode action opens the scanner in one tap',
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Scan barcode' }));
    await expect(args.onScanBarcode).toHaveBeenCalledTimes(1);
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

export const NoMatchWithFilter: Story = {
  name: 'No matches with a filter — change filters is offered',
  args: { query: 'banana', food: { status: 'ready', results: [foodCatalogue[9]] }, foodFilters: { category: 'drink' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('No foods match “banana”');
    await expect(canvas.getByText('No drinks match “banana”')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Change filters' })).toBeVisible();
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
  name: 'Narrow — 320, grid falls to one column',
  args: { foodView: 'grid' },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('searchbox')).toBeVisible();
    await expect(getComputedStyle(canvas.getByRole('list', { name: 'All foods' })).gridTemplateColumns.split(' ')).toHaveLength(1);
    await expectNoHorizontalOverflow();
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 320 at 200 %',
  args: { recents: recentFoods },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('searchbox')).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};

export const RecipesScope: Story = {
  name: 'Recipes scope — the filter action stays in the toolbar, the query is kept',
  render: () => <WithFoodSearch initialQuery="lentil" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('1 item found');
    await userEvent.click(canvas.getByRole('tab', { name: 'Recipes' }));
    await expect(canvas.getByRole('searchbox')).toHaveValue('lentil');
    await expect(canvas.getByRole('button', { name: 'Recipe filters' })).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Scan barcode' })).toBeNull();
    await expect(canvas.getByRole('radio', { name: 'List' })).toBeInTheDocument();
  },
};

export const QueryResults: Story = {
  name: 'Unified results — “oat” across recents and catalogue, recent first',
  args: { query: 'oat', recents: recentFoods, food: { status: 'ready', results: searchFoods('oat') } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('2 items found');
    const names = canvas.getAllByRole('listitem').map((li) => li.textContent ?? '');
    await expect(names).toHaveLength(2);
    await expect(names[0]).toContain('Oatmeal');
    await expect(names[1]).toContain('Oat drink');
  },
};

export const RecipesCatalogueList: Story = {
  name: 'Recipes scope — the shared toolbar, the catalogue as rows, the filter action in the toolbar',
  args: { scope: 'recipes' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('tab', { name: 'Recipes' })).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.queryByRole('button', { name: 'Scan barcode' })).toBeNull();
    await expect(canvas.getByRole('radio', { name: 'List' })).toHaveAttribute('aria-checked', 'true');
    await expect(canvas.getByRole('button', { name: 'Recipe filters' })).toBeVisible();
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('10 recipes');
    await expect(canvas.getByRole('list', { name: 'All recipes' })).toHaveAttribute('data-view', 'list');
    await userEvent.click(canvas.getByRole('radio', { name: 'Grid' }));
    await expect(args.onRecipeViewChange).toHaveBeenCalledWith('grid');
    await userEvent.click(canvas.getByRole('button', { name: 'Recipe filters' }));
    const sheet = await canvas.findByRole('dialog', { name: 'Filters' });
    await expect(within(sheet).getByRole('button', { name: 'Vegan' })).toBeVisible();
    await expect(within(sheet).getByLabelText(/^Maximum/)).toBeVisible();
  },
};

export const RecipesGrid: Story = {
  name: 'Recipes scope — grid of tiles: the same recipes, order and count as the list',
  args: { scope: 'recipes', recipeView: 'grid', criteria: { caloriesMax: 460 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole('list', { name: 'Matching recipes' });
    await expect(list).toHaveAttribute('data-view', 'grid');
    await expect(within(list).getAllByRole('listitem')).toHaveLength(8);
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('8 recipes match your filters');
    await expect(canvas.getByRole('button', { name: 'Recipe filters, 1 active' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Remove filter: Under 460 kcal' })).toBeVisible();
    await expect(within(list).getAllByRole('listitem')[0]).toHaveTextContent('Lentil soup');
  },
};

export const ScannerIconOnly: Story = {
  name: 'Food scope — the scanner is an icon-only sibling named Scan barcode; the field keeps the room',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const scan = canvas.getByRole('button', { name: 'Scan barcode' });
    await expect(scan).toHaveAttribute('title', 'Scan barcode');
    await expect(scan).not.toHaveTextContent('Scan barcode');
    expect(scan.getBoundingClientRect().width).toBeLessThanOrEqual(56);
    await userEvent.click(scan);
    await expect(args.onScanBarcode).toHaveBeenCalledTimes(1);
  },
};
