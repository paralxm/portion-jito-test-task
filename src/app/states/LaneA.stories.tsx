import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { NavigationBar, type Destination } from '../../design-system';
import { withIPhone16PortraitSafeAreas, withRootFontSize, expectNoHorizontalOverflow } from '../../design-system/storybook/decorators';
import { searchFoods } from '../../features/calorie-calculator/domain/fixtures';
import type { DailyGoal, FoodEntry } from '../../features/calorie-calculator/domain/daily-log';
import { fixtureR, recipeCatalogue } from '../../features/recipe-discovery/domain/fixtures';
import { RecipesScreen } from '../../features/recipe-discovery/screens/RecipesScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { HomeWithWater } from './harnesses';
import { budgetEntries, budgetGoal, FIXED_DATE, goal2200, populatedEntries, WATER_PARTIAL_ML } from './stateFixtures';

const nav = (selected: Destination) => <NavigationBar selected={selected} onSelect={fn()} onLogFood={fn()} />;
const idle = { status: 'idle', results: [] } as const;
const recommended = { recipe: fixtureR, evidence: [] };

const meta = {
  title: 'Product states/Lane A — Core navigation',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The four root frames of low-fi lane A (Figma section 175:2) — the two Home states, Food-scope search results and query-free Recipes browse — plus the three Home water rows added by the 2026-09-05 redesign (S01-4, O06, O06-2; ledger §10.3). Each story renders the production screen with the deterministic fixtures from docs/design/hifi-decisions.md (baseline 2026-09-04T12:00:00Z) and is captured at 393 × 852.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const home = (entries: readonly FoodEntry[], goal: DailyGoal | null, waterMl = 0, extra: Partial<Parameters<typeof HomeWithWater>[0]> = {}) => (
  <HomeWithWater
    entries={entries}
    goal={goal}
    initialWaterMl={waterMl}
    onOpenEntry={fn()}
    onAddToMeal={fn()}
    recommended={recommended}
    onOpenRecipe={fn()}
    onFindRecipes={fn()}
    now={FIXED_DATE}
    navigation={nav('home')}
    {...extra}
  />
);

export const S01_1: Story = {
  name: 'S01-1 · 175:10 — Home / Today — No food logged',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: the daily overview before anything is logged, all four meals present and empty. Entry: app launch, or Home with zero entries for today. Fixture: no entries, goal 2,200 kcal (the low-fi specimen; the launch state has no goal and is the first Home composition story), water 0. Primary action: a meal’s Add action or the bar’s Log food → O01. Next: S01-2 after Add to {meal}. Limitation: none.',
      },
    },
  },
  render: () => home([], goal2200),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
    await expect(canvas.getAllByText('2,200').length).toBeGreaterThanOrEqual(2); // the figure and the goal
    await expect(canvas.getByText('kcal remaining')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Edit goal' })).toBeVisible();
    for (const meal of ['Breakfast', 'Lunch', 'Dinner', 'Snacks']) await expect(canvas.getByRole('heading', { level: 3, name: meal })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Add breakfast' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
  },
};

export const S01_2: Story = {
  name: 'S01-2 · 175:38 — Home / Today — Food logged',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: the daily overview with committed entries under their meals. Entry: after Add to {meal}. Fixture: Oatmeal with mixed berries 300 g / 550 kcal at breakfast and Grilled chicken Caesar salad 350 g / 800 kcal at lunch, goal 2,200 → 850 remaining, 90 / 135 / 50 g, water 1.25 L. Primary action: an entry row → S07-3; a meal’s add action → O01. Next: S07-3, O01, S08-2 (recommended recipe). Limitation: none.',
      },
    },
  },
  render: () => home(populatedEntries, goal2200, WATER_PARTIAL_ML),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('850')).toBeVisible();
    await expect(canvas.getByText('1,350 kcal logged')).toBeVisible();
    await expect(canvas.getByRole('button', { name: /Oatmeal with mixed berries/ })).toHaveTextContent('550 kcal');
    await expect(canvas.getByRole('button', { name: /Oatmeal with mixed berries/ }).closest('section')).toHaveAccessibleName('Breakfast');
    await expect(canvas.getByRole('button', { name: 'Edit water, 1.25 litres of 2 litres' })).toBeVisible();
    // The bar's plus is the only Log food control; meals carry their own add actions.
    await expect(canvas.getAllByRole('button', { name: 'Log food' })).toHaveLength(1);
  },
};

export const S02_1: Story = {
  name: 'S02-1 · 175:93 — Search / Food scope · results',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: pick a food from search results; the field carries the barcode shortcut. Entry: Search root, Food scope, query “rice” returned one result. Fixture: fixture C (Vegetable rice bowl, 180 kcal per 100 g). Primary action: the result row → S07-1; Scan barcode → S04-1. Next: S07-1; the Recipes tab → S02-5/S02-6. Limitation: none.',
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
      onScanBarcode={fn()}
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
    await expect(canvas.getByRole('button', { name: 'Scan barcode' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-current', 'page');
  },
};

export const S03_1: Story = {
  name: 'S03-1 · 175:158 — Recipes / Browse',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: query-free browsing without criteria; every catalogue recipe shows its licensed photo (ledger D-28) and the filter action sits at the end of the search entry. Entry: Recipes root, browse loaded. Fixture: the five-recipe catalogue, including a long-title card and a card whose protein is not available. Primary action: a card → S08-2; Filters → O02. Next: S03-2 after Apply. Limitation: none.',
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
    await expect(canvas.queryByText('No photo')).toBeNull();
    await expect(canvas.queryByText(/Matches all/)).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Filters' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Recipes' })).toHaveAttribute('aria-current', 'page');
  },
};

// ---- Rows added by the 2026-09-05 redesign (ledger §10.3) -----------------------------

export const S01_4: Story = {
  name: 'S01-4 — Home / Water quick-add confirmation (Undo available)',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: the outcome of +250 ml — the figure and fill move to the new total and a confirmation with Undo appears above the bar. Entry: Add 250 millilitres of water on Home. Fixture: the brief’s 400 of 2,000 kcal budget with 1.25 L of water; the play function taps +250 ml once → 1.5 L. Primary action: Undo → 1.25 L. Next: the toast closes on its own. Limitation: the animation is captured at its end state.',
      },
    },
  },
  render: () => home(budgetEntries, budgetGoal, WATER_PARTIAL_ML),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Add 250 millilitres of water' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('250 ml added. 1.5 litres today.');
    await expect(await canvas.findByRole('button', { name: 'Edit water, 1.5 litres of 2 litres' })).toBeInTheDocument();
    await waitFor(async () => expect(canvas.getByRole('button', { name: 'Undo' })).toBeVisible());
  },
};

export const O06: Story = {
  name: 'O06 — Water sheet / Add (preset selected)',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: add a chosen amount to today’s water: four presets, a labelled custom amount, one primary Add water. Entry: Edit water on Home. Fixture: 1.25 L of 2 L; the play function marks the 250 ml preset. Primary action: Add water → 1.5 L, sheet closes. Secondary: Edit today’s total → O06-2; Cancel. Limitation: none.',
      },
    },
  },
  render: () => home(budgetEntries, budgetGoal, WATER_PARTIAL_ML, { waterSheetOpen: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = await canvas.findByRole('dialog', { name: 'Add water' });
    await expect(within(dialog).getByRole('button', { name: 'Add water' })).toBeDisabled();
    await userEvent.click(within(dialog).getByRole('radio', { name: '250 ml' }));
    await expect(within(dialog).getByRole('button', { name: 'Add water' })).toBeEnabled();
    await expect(within(dialog).getByLabelText('Custom amount')).toBeVisible();
  },
};

export const O06_2: Story = {
  name: 'O06-2 — Water sheet / Edit today’s total',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: replace today’s total directly. Entry: Edit today’s total inside O06. Fixture: 1.25 L; the play function types 1000. Primary action: Save total → 1 L. Secondary: Back to adding → O06. Limitation: none.',
      },
    },
  },
  render: () => home(budgetEntries, budgetGoal, WATER_PARTIAL_ML, { waterSheetOpen: true, waterSheetMode: 'edit-total' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = await canvas.findByRole('dialog', { name: "Edit today's total" });
    const field = within(dialog).getByLabelText("Today's total");
    await expect(field).toHaveValue('1250');
    await userEvent.clear(field);
    await userEvent.type(field, '1000');
    await expect(within(dialog).getByRole('button', { name: 'Save total' })).toBeEnabled();
  },
};

// ---- Representative and risk-bearing variants of this lane ----------------------------

export const S01_2_Narrow320: Story = {
  name: 'S01-2 at 320 (narrow witness, replaces the superseded 185:2 frame)',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  render: () => home(populatedEntries, goal2200, WATER_PARTIAL_ML),
  play: async () => {
    await expectNoHorizontalOverflow();
  },
};

export const S01_2_Wide430: Story = {
  name: 'S01-2 at 430',
  globals: { viewport: { value: 'mobile430', isRotated: false } },
  render: () => home(populatedEntries, goal2200, WATER_PARTIAL_ML),
  play: async () => {
    await expectNoHorizontalOverflow();
  },
};

export const S01_2_EnlargedText: Story = {
  name: 'S01-2 at 320 and 200 % text',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  render: () => home(populatedEntries, goal2200, WATER_PARTIAL_ML),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('850')).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};

export const S01_2_SafeAreas: Story = {
  name: 'S01-2 with the iPhone 16 safe-area fixture (59 / 34)',
  globals: { viewport: { value: 'iPhone16Portrait', isRotated: false } },
  decorators: [withIPhone16PortraitSafeAreas],
  render: () => home(populatedEntries, goal2200, WATER_PARTIAL_ML),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole('navigation', { name: 'Main' });
    // The bar owns the bottom inset once: its padding grows by the fixture value, and the
    // content reserves the bar's full height so nothing ends underneath it.
    await expect(parseFloat(getComputedStyle(nav).paddingBlockEnd)).toBeGreaterThanOrEqual(34);
    await expect(parseFloat(getComputedStyle(canvas.getByRole('main')).paddingBlockEnd)).toBeGreaterThanOrEqual(nav.getBoundingClientRect().height);
    await userEvent.tab();
    await expectNoHorizontalOverflow();
  },
};

export const S01_BudgetReducedMotion: Story = {
  name: 'Home budget and water under reduced motion — values update instantly',
  decorators: [
    (Story) => (
      <div data-portion-motion="reduced">
        <Story />
      </div>
    ),
  ],
  render: () => home(budgetEntries, budgetGoal, WATER_PARTIAL_ML),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Add 250 millilitres of water' }));
    await expect(canvas.getByRole('button', { name: 'Edit water, 1.5 litres of 2 litres' })).toBeInTheDocument();
    await expect(canvas.getByText('1.5')).toBeVisible();
  },
};
