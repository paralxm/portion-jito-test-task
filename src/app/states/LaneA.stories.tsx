import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { NavigationBar, type Destination } from '../../design-system';
import { withIPhone16PortraitSafeAreas, withRootFontSize, expectNoHorizontalOverflow } from '../../design-system/storybook/decorators';
import { searchFoods } from '../../features/calorie-calculator/domain/fixtures';
import { HomeScreen } from '../../features/calorie-calculator/screens/HomeScreen';
import { recipeCatalogue } from '../../features/recipe-discovery/domain/fixtures';
import { RecipesScreen } from '../../features/recipe-discovery/screens/RecipesScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { GOAL_KCAL, populatedEntries } from './stateFixtures';

const nav = (selected: Destination) => <NavigationBar selected={selected} onSelect={fn()} onLogFood={fn()} />;
const idle = { status: 'idle', results: [] } as const;

const meta = {
  title: 'Product states/Lane A — Core navigation',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The four root frames of low-fi lane A (Figma section 175:2): the two Home states, Food-scope search results and query-free Recipes browse. Each story renders the production screen with the deterministic fixtures from docs/design/hifi-decisions.md §1 (baseline 2026-09-04T12:00:00Z) and is captured at 393 × 852. Verification mode for all four: runtime and story.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const home = (entries: typeof populatedEntries, goalKcal: number | null, recipeCriteria: string[] = []) => (
  <HomeScreen entries={entries} goalKcal={goalKcal} onGoalChange={fn()} onOpenEntry={fn()} onLogFood={fn()} onFindRecipes={fn()} recipeCriteria={recipeCriteria} navigation={nav('home')} />
);

export const S01_1: Story = {
  name: 'S01-1 · 175:10 — Home / Today — No food logged',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: the daily overview before anything is logged. Entry: app launch, or Home with zero entries for today. Fixture: no entries, goal 2,200 kcal (the low-fi specimen; the launch state has no goal and is the first Home composition story). Primary action: Log first food → O01. Next: S01-2 after Add to today. Limitation: none.',
      },
    },
  },
  render: () => home([], GOAL_KCAL),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
    await expect(canvas.getByText('2,200')).toBeVisible();
    await expect(canvas.getByText('kcal remaining')).toBeVisible();
    await expect(canvas.getByText(/Nothing logged today/)).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Log first food' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
  },
};

export const S01_2: Story = {
  name: 'S01-2 · 175:38 — Home / Today — Food logged',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: the daily overview with committed entries. Entry: after Add to today. Fixture: Oatmeal with mixed berries 300 g / 550 kcal and Grilled chicken Caesar salad 350 g / 800 kcal, goal 2,200 → 850 remaining, 90 / 135 / 50 g. Primary action: Log food → O01; an entry row → S07-3. Next: S07-3, O01, S03. Limitation: none.',
      },
    },
  },
  render: () => home(populatedEntries, GOAL_KCAL),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('850')).toBeVisible();
    await expect(canvas.getByText('2 entries · 1,350 kcal')).toBeVisible();
    await expect(canvas.getByRole('button', { name: /Oatmeal with mixed berries/ })).toHaveTextContent('550 kcal');
    // Home's body action and the bar's action share the name: one O01.
    await expect(canvas.getAllByRole('button', { name: 'Log food' })).toHaveLength(2);
  },
};

export const S02_1: Story = {
  name: 'S02-1 · 175:93 — Search / Food scope · results',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: pick a food from search results. Entry: Search root, Food scope, query “rice” returned one result. Fixture: fixture C (Vegetable rice bowl, 180 kcal per 100 g). Primary action: the result row → S07-1. Next: S07-1; the Recipes tab → S02-5/S02-6. Limitation: none.',
      },
    },
  },
  render: () => (
    <SearchScreen
      scope="food"
      onScopeChange={fn()}
      query="rice"
      onQueryChange={fn()}
      onSubmit={fn()}
      onClear={fn()}
      food={{ status: 'ready', results: searchFoods('rice') }}
      recipes={idle}
      criteria={{}}
      onApplyCriteria={fn()}
      onRemoveCriterion={fn()}
      onOpenFood={fn()}
      onOpenRecipe={fn()}
      onRetry={fn()}
      onEnterManually={fn()}
      navigation={nav('search')}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('tab', { name: 'Food' })).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getAllByText('1 food found').length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getByRole('button', { name: /Vegetable rice bowl/ })).toHaveTextContent('180 kcal');
    await expect(canvas.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-current', 'page');
  },
};

export const S03_1: Story = {
  name: 'S03-1 · 175:158 — Recipes / Browse',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: query-free browsing without criteria. Entry: Recipes root, browse loaded. Fixture: the five-recipe catalogue, including a long-title no-photo card and a card whose protein is not available. Primary action: a card → S08-2; Filters → O02. Next: S03-2 after Apply. Limitation: none.',
      },
    },
  },
  render: () => (
    <RecipesScreen results={recipeCatalogue} criteria={{}} status="ready" onApplyCriteria={fn()} onRemoveCriterion={fn()} onClearCriteria={fn()} onRetry={fn()} onOpenRecipe={fn()} onOpenSearch={fn()} navigation={nav('recipes')} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'All recipes' })).toBeInTheDocument();
    await expect(canvas.getAllByText('5 recipes').length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getAllByText('No photo').length).toBeGreaterThanOrEqual(1);
    await expect(canvas.queryByText(/Matches all/)).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Recipes' })).toHaveAttribute('aria-current', 'page');
  },
};

// ---- Representative and risk-bearing variants of this lane ----------------------------

export const S01_2_Narrow320: Story = {
  name: 'S01-2 at 320 (narrow witness, replaces the superseded 185:2 frame)',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  render: () => home(populatedEntries, GOAL_KCAL),
  play: async () => {
    await expectNoHorizontalOverflow();
  },
};

export const S01_2_Wide430: Story = {
  name: 'S01-2 at 430',
  globals: { viewport: { value: 'mobile430', isRotated: false } },
  render: () => home(populatedEntries, GOAL_KCAL),
  play: async () => {
    await expectNoHorizontalOverflow();
  },
};

export const S01_2_EnlargedText: Story = {
  name: 'S01-2 at 320 and 200 % text',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  render: () => home(populatedEntries, GOAL_KCAL),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('850')).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};

export const S01_2_SafeAreas: Story = {
  name: 'S01-2 with the iPhone 16 safe-area fixture (59 / 34)',
  globals: { viewport: { value: 'iPhone16Portrait', isRotated: false } },
  decorators: [withIPhone16PortraitSafeAreas],
  render: () => home(populatedEntries, GOAL_KCAL),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole('navigation', { name: 'Main' });
    // The bar owns the bottom inset once: its padding grows by the fixture value.
    await expect(parseFloat(getComputedStyle(nav).paddingBlockEnd)).toBeGreaterThanOrEqual(34);
    await userEvent.tab();
    await expectNoHorizontalOverflow();
  },
};
