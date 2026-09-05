import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { NavigationBar, type Destination } from '../../design-system';
import { withIPhone16PortraitSafeAreas, withRootFontSize, expectNoHorizontalOverflow } from '../../design-system/storybook/decorators';
import { fixtureR, recipeCatalogue } from '../../features/recipe-discovery/domain/fixtures';
import { filterRecipes, searchRecipes, type Recipe, type RecipeCriteria } from '../../features/recipe-discovery/domain/matching';
import { RecipeDetailsScreen, type RecipeDetailsState } from '../../features/recipe-discovery/screens/RecipeDetailsScreen';
import { RecipesScreen } from '../../features/recipe-discovery/screens/RecipesScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { WithAddToMeal } from './harnesses';
import { detailsCriteria, filteredCriteria, impossibleCriteria, longTitleNoPhotoPartial, recipeCandidate, servingPortion } from './stateFixtures';

const nav = (selected: Destination) => <NavigationBar selected={selected} onSelect={fn()} onLogFood={fn()} />;
const idle = { status: 'idle', results: [] } as const;

const meta = {
  title: 'Product states/Lane E — Recipe browse, criteria, details and return',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Low-fi lane E (181:2): suitability is explained only through the criteria the user selected, and finding a suitable recipe completes the task. Covers filtered results, the filter sheet (opened from the field’s trailing filter action, D-27) and its invalid-range state, Search’s Recipes scope with results and with no matches, the four recipe-details states with the title-side Add, and the Add-to-meal sheet for a recipe added by the 2026-09-05 redesign (O05-2).',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const browse = (criteria: RecipeCriteria, results: readonly Recipe[] = filterRecipes(recipeCatalogue, criteria)) => (
  <RecipesScreen results={results} criteria={criteria} status="ready" onApplyCriteria={fn()} onRemoveCriterion={fn()} onClearCriteria={fn()} onRetry={fn()} onOpenRecipe={fn()} onOpenSearch={fn()} navigation={nav('recipes')} />
);

const recipeSearch = (query: string, criteria: RecipeCriteria) => (
  <SearchScreen
    scope="recipes"
    onScopeChange={fn()}
    query={query}
    onQueryChange={fn()}
    onSubmit={fn()}
    onClear={fn()}
    food={idle}
    recipes={{ status: 'ready', results: filterRecipes(searchRecipes(recipeCatalogue, query), criteria) }}
    criteria={criteria}
    onApplyCriteria={fn()}
    onRemoveCriterion={fn()}
    onOpenFood={fn()}
    onOpenRecipe={fn()}
    onScanBarcode={fn()}
    onRetry={fn()}
    onEnterManually={fn()}
    navigation={nav('search')}
  />
);

const details = (state: RecipeDetailsState, criteria: RecipeCriteria = detailsCriteria, selected: Destination = 'recipes') => (
  <RecipeDetailsScreen state={state} criteria={criteria} onBack={fn()} onRetry={fn()} onAdd={fn()} navigation={nav(selected)} />
);

export const S03_2: Story = {
  name: 'S03-2 · 181:5 — Recipes / Filtered results',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: applied criteria as removable chips, with match evidence shown only because criteria are active; removing a chip updates results at once. Entry: Apply in O02 from browse. Fixture: Vegan, under 500 kcal, 10 g protein or more → one match. Primary action: a card → S08-2. Secondary: Filters → O02; chip remove. Limitation: none.',
      },
    },
  },
  render: () => browse(filteredCriteria),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'Matching recipes' })).toBeInTheDocument();
    await expect(canvas.getAllByText('1 recipe matches your filters').length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getByText('Matches all 3 filters')).toBeVisible();
    await expect(canvas.getAllByRole('button', { name: /Remove filter/ })).toHaveLength(3);
  },
};

export const O02: Story = {
  name: 'O02 · 181:72 — Recipe filters / Applied values',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: discrete options and numeric bounds as a draft; the footer never covers the last field; Cancel restores the applied criteria. Entry: Filters on browse or Search. Fixture: the sheet opened over S03-2 with its three applied values. Primary action: Apply filters → the owning list. Secondary: Reset all (still needs Apply); Cancel. Limitation: the play function opens the sheet through the real Filters control.',
      },
    },
  },
  render: () => browse(filteredCriteria),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /^Filters/ }));
    const dialog = await canvas.findByRole('dialog', { name: 'Filters' });
    await expect(within(dialog).getByLabelText(/^Maximum/)).toHaveValue('500');
    await expect(within(dialog).getByRole('button', { name: 'Apply filters' })).toBeVisible();
    await expect(within(dialog).getByRole('button', { name: 'Reset all' })).toBeVisible();
  },
};

export const O02_2: Story = {
  name: 'O02-2 · 181:117 — Recipe filters / Invalid range',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: minimum must not exceed maximum; Apply is unavailable while invalid and blank bounds mean no constraint. Entry: min > max typed in the sheet. Fixture: calories 600–300. Primary action: correct the range. Limitation: the play function types the invalid bounds and attempts Apply.',
      },
    },
  },
  render: () => browse({}),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /^Filters/ }));
    const dialog = await canvas.findByRole('dialog', { name: 'Filters' });
    await userEvent.type(within(dialog).getByLabelText(/^Minimum/), '600');
    await userEvent.type(within(dialog).getByLabelText(/^Maximum/), '300');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Apply filters' }));
    // The sheet stays open with the range error beside the field; nothing was applied.
    await expect(dialog).toBeVisible();
    await expect(within(dialog).getByLabelText(/^Maximum/)).toHaveAccessibleDescription(/at least the minimum/);
  },
};

export const S02_5: Story = {
  name: 'S02-5 · 181:133 — Search / Recipes scope · results',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: the query carried from Food scope with scope-specific criteria; Search stays selected below. Entry: the Recipes tab with a query (criteria snapshot from browse when arriving through Search recipes). Fixture: query “lentil”, under 460 kcal. Primary action: a card → S08-2 with the Search origin. Limitation: none.',
      },
    },
  },
  render: () => recipeSearch('lentil', { caloriesMax: 460 }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('tab', { name: 'Recipes' })).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getAllByText('1 recipe matches your filters').length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getByText(/Matches (all 1 filter|your filter)/)).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-current', 'page');
  },
};

export const S08_2: Story = {
  name: 'S08-2 · 181:289 — Recipe details / Loading',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: real progress while the record loads; Back stays available and the list behind is preserved. Entry: a card in S02-5 or S03. Fixture: loading state with the Recipes origin. Primary action: none; Back → the originating list (a late response is ignored). Next: S08-1 or S08-3. Limitation: frozen pending state.',
      },
    },
  },
  render: () => details({ status: 'loading' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading recipe');
    await expect(canvas.getByRole('button', { name: 'Back to results' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Recipes' })).toHaveAttribute('aria-current', 'page');
  },
};

export const S08_1: Story = {
  name: 'S08-1 · 181:237 — Recipe details / Loaded',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: serving basis, nutrition, ingredients and steps; the origin tab stays selected; evaluating the recipe completes the task. Entry: load succeeded. Fixture: fixture R (Lentil soup, 1 serving = 300 g, 450 kcal) with criteria under 500 kcal and 20 g protein or more, both met. Primary action: Add (beside the title) → O05-2. Secondary: Show all nutrition (disclosure); Back to results. Limitation: none.',
      },
    },
  },
  render: () => details({ status: 'loaded', recipe: fixtureR }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 2, name: 'Lentil soup' })).toBeInTheDocument();
    await expect(canvas.getByRole('heading', { name: 'Your filters' })).toBeInTheDocument();
    await expect(canvas.getAllByRole('img', { name: 'Met' })).toHaveLength(2);
    await expect(canvas.getByText('450')).toBeVisible();
    await expect(canvas.getByRole('heading', { name: 'Ingredients' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Add Lentil soup to a meal' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Recipes' })).toHaveAttribute('aria-current', 'page');
  },
};

// ---- Row added by the 2026-09-05 redesign (ledger §10.3) ------------------------------

export const O05_2: Story = {
  name: 'O05-2 — Add to meal / From recipe details',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: the same Add-to-meal sheet for a recipe: servings instead of grams, the thumbnail when the recipe has a photo, the per-serving basis. Entry: Add beside the title on S08-1. Fixture: fixture R (1 serving = 300 g, 450 kcal); dinner preselected (story fixture). Primary action: Add to dinner → one recipe entry, Home. Secondary: Cancel → S08-1 unchanged. Limitation: the story composes the details screen and the sheet the way App does.',
      },
    },
  },
  render: () => (
    <WithAddToMeal candidate={recipeCandidate} portion={servingPortion} meal="dinner" hint="Suggested for this time of day. Change it if you like." onConfirm={fn()}>
      {details({ status: 'loaded', recipe: fixtureR })}
    </WithAddToMeal>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = canvas.getByRole('dialog', { name: 'Add to meal' });
    await expect(within(dialog).getByRole('radio', { name: 'Dinner' })).toBeChecked();
    await expect(within(dialog).getByLabelText('Servings')).toHaveValue('1');
    await expect(within(dialog).getByText('450')).toBeVisible();
    await userEvent.clear(within(dialog).getByLabelText('Servings'));
    await userEvent.type(within(dialog).getByLabelText('Servings'), '2');
    await expect(within(dialog).getByText('900')).toBeVisible();
    await expect(within(dialog).getByRole('button', { name: 'Add to dinner' })).toBeEnabled();
  },
};

export const S08_3: Story = {
  name: 'S08-3 · 181:317 — Recipe details / Unavailable',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: a failed record offers Retry and Back to the exact result list — different from a recipe that merely has no photo. Entry: the load failed. Fixture: unavailable state. Primary action: Try again → S08-2 for the same recipe. Secondary: Back to results. Limitation: story-only — catalogue recipes always load in the runtime and a deliberately failing recipe would be an invented path (ledger D-5).',
      },
    },
  },
  render: () => details({ status: 'unavailable' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('alert')).toHaveTextContent('This recipe could not be loaded');
    await expect(canvas.getByRole('button', { name: 'Try again' })).toBeVisible();
    await expect(canvas.getAllByRole('button', { name: 'Back to results' }).length).toBeGreaterThanOrEqual(1);
  },
};

export const S08_4: Story = {
  name: 'S08-4 · 181:350 — Recipe details / No photo · long title · partial nutrition',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: a missing image does not block content, a long title wraps, and a missing nutrient is named as unknown rather than zero. Entry: a loaded recipe with those properties. Fixture: the long-title pasta recipe with its photo removed and protein not available, under a 10 g protein filter. Primary action: as S08-1. Limitation: story fixture — the runtime pasta recipe has a licensed photo (D-28) and known protein; the fallback frame appears in the runtime only for a failed image.',
      },
    },
  },
  render: () => details({ status: 'loaded', recipe: longTitleNoPhotoPartial }, { proteinMin: 10 }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('No photo')).toBeVisible();
    await expect(canvas.getByRole('heading', { level: 2 })).toHaveTextContent('Wholegrain pasta with roasted vegetables and tahini dressing');
    await expect(canvas.getByRole('img', { name: 'Not met' })).toBeInTheDocument();
    await expect(canvas.getAllByText('Not available').length).toBeGreaterThanOrEqual(1);
    await expectNoHorizontalOverflow();
  },
};

export const S02_6: Story = {
  name: 'S02-6 · 181:193 — Search / Recipes · no matches',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: the query and criteria are retained so the cause stays actionable; recovery is criteria adjustment, not a network retry. Entry: a Recipes query with zero matches. Fixture: query “lentil”, under 200 kcal. Primary action: Change filters → O02. Limitation: none.',
      },
    },
  },
  render: () => recipeSearch('lentil', impossibleCriteria),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText('No recipes match “lentil” and your filters').length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getByRole('button', { name: 'Change filters' })).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'Try again' })).toBeNull();
    await expect(canvas.getByRole('searchbox')).toHaveValue('lentil');
  },
};

// ---- Representative and risk-bearing variants of this lane ----------------------------

export const S03_2_Narrow320: Story = {
  name: 'S03-2 at 320',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  render: () => browse(filteredCriteria),
  play: async () => {
    await expectNoHorizontalOverflow();
  },
};

export const S08_1_Wide430: Story = {
  name: 'S08-1 at 430',
  globals: { viewport: { value: 'mobile430', isRotated: false } },
  render: () => details({ status: 'loaded', recipe: fixtureR }),
  play: async () => {
    await expectNoHorizontalOverflow();
  },
};

export const S03_2_EnlargedText: Story = {
  name: 'S03-2 at 320 and 200 % text',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  render: () => browse(filteredCriteria),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Matches all 3 filters')).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};

export const O02_SafeAreas: Story = {
  name: 'O02 with the iPhone 16 safe-area fixture — sheet footer owns the bottom inset',
  globals: { viewport: { value: 'iPhone16Portrait', isRotated: false } },
  decorators: [withIPhone16PortraitSafeAreas],
  render: () => browse(filteredCriteria),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /^Filters/ }));
    const dialog = await canvas.findByRole('dialog', { name: 'Filters' });
    await expect(within(dialog).getByRole('button', { name: 'Apply filters' })).toBeVisible();
  },
};
