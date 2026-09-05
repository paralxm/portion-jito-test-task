import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { MethodSheet, NavigationBar, type Destination, type ViewMode } from '../../design-system';
import { withIPhone16PortraitSafeAreas, withRootFontSize, expectNoHorizontalOverflow } from '../../design-system/storybook/decorators';
import { oatmealWithBerries } from '../../features/calorie-calculator/domain/home-fixtures';
import { FoodReviewScreen } from '../../features/calorie-calculator/screens/FoodReviewScreen';
import { HomeScreen } from '../../features/calorie-calculator/screens/HomeScreen';
import { fixtureR } from '../../features/recipe-discovery/domain/fixtures';
import { SearchScreen, type SearchResults } from '../screens/SearchScreen';
import type { FoodCandidate } from '../../features/calorie-calculator/domain/calculation';
import { foodCatalogue } from '../../features/calorie-calculator/domain/fixtures';
import { NO_FOOD_FILTERS } from '../../features/calorie-calculator/domain/food-search';
import { WithFoodSearch } from './harnesses';
import { WithAddToMeal } from './harnesses';
import { FIXED_DATE, fixtureCandidate, goal2200, recentFoods, reviewPortion } from './stateFixtures';

const nav = (selected: Destination) => <NavigationBar selected={selected} onSelect={fn()} onLogFood={fn()} />;
const idle = { status: 'idle', results: [] } as const;

const meta = {
  title: 'Product states/Lane B — Home through search and review',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Low-fi lane B (176:2): the Log food chooser over Home, the Food-scope loading / no-match / failure states, the shared review step from search including the invalid-portion state and the existing-entry mode that replaces the superseded “Replaces current calculation” frame (docs/design/hifi-decisions.md D-1), and the Add-to-meal sheet added by the 2026-09-05 redesign (O05, D-23). Fixtures are deterministic; every state is also reachable in the runtime.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const emptyHome = () => (
  <HomeScreen
    entries={[]}
    goal={goal2200}
    onGoalChange={fn()}
    onOpenEntry={fn()}
    onAddToMeal={fn()}
    recommended={{ recipe: fixtureR, evidence: [] }}
    onOpenRecipe={fn()}
    onFindRecipes={fn()}
    waterMl={0}
    onAddWater={fn()}
    onSetWaterTotal={fn()}
    now={FIXED_DATE}
    navigation={nav('home')}
  />
);

const foodSearch = (query: string, food: SearchResults<FoodCandidate>, { recents = [] as readonly FoodCandidate[], filters = NO_FOOD_FILTERS, view = 'list' as ViewMode } = {}) => (
  <SearchScreen
    scope="food"
    onScopeChange={fn()}
    query={query}
    onQueryChange={fn()}
    onSubmit={fn()}
    onClear={fn()}
    food={food}
    catalogue={foodCatalogue}
    recents={recents}
    foodFilters={filters}
    onApplyFoodFilters={fn()}
    foodView={view}
    onFoodViewChange={fn()}
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
);

export const O01: Story = {
  name: 'O01 · 176:20 — Log food / Choose a method (overlay)',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: choose one of four identification methods. Entry: the bar’s Log food, or a Home meal’s add action (which records the meal for O05), from Home, Search, Recipes or Recipe Details. Fixture: the sheet open over S01-1. Primary action: any tile starts that method; nothing is committed. Next: S02 / S04-1 / S05-1 / S06-1; close, backdrop or Escape → the exact origin. Limitation: the story composes HomeScreen + MethodSheet the way App does; the sheet is opened directly rather than through the plus.',
      },
    },
  },
  render: () => (
    <>
      {emptyHome()}
      <MethodSheet open onRequestClose={fn()} onChoose={fn()} />
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = canvas.getByRole('dialog', { name: 'Log food' });
    await expect(dialog).toBeVisible();
    for (const label of ['Search food', 'Scan barcode', 'Take a photo', 'Enter manually']) {
      await expect(within(dialog).getByRole('button', { name: new RegExp(label) })).toBeVisible();
    }
    await expect(within(dialog).getByRole('button', { name: 'Close' })).toBeVisible();
  },
};

export const S02_2: Story = {
  name: 'S02-2 · 176:43 — Search / Food · loading',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: a request in flight with the query and scope still visible. Entry: a Food query was typed. Fixture: query “rice”, request pending. Primary action: none while loading; clear or retype starts a new request and drops late responses. Next: S02-1, S02-3 or S02-4. Limitation: the pending state is frozen here; the runtime resolves it after a short delay.',
      },
    },
  },
  render: () => foodSearch('rice', { status: 'loading', results: [] }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('status').some((el) => el.textContent?.includes('Searching foods'))).toBe(true);
    await expect(canvas.getByRole('searchbox')).toHaveValue('rice');
  },
};

export const S02_3: Story = {
  name: 'S02-3 · 176:77 — Search / Food · no matches',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: nothing matched, with the query preserved and recovery by query change or manual entry — not a retry. Entry: a Food query returned zero results. Fixture: query “rice cake”. Primary action: Enter manually → S06-1. Next: S06-1 or a new query. Limitation: none.',
      },
    },
  },
  render: () => foodSearch('rice cake', { status: 'ready', results: [] }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText('No foods match “rice cake”').length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getByRole('button', { name: 'Enter manually' })).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'Try again' })).toBeNull();
  },
};

export const S02_4: Story = {
  name: 'S02-4 · 176:118 — Search / Food · request failure',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: the service did not respond; the input is never cleared and retry is offered with a manual fallback. Entry: a Food request failed (the prototype simulates it for queries containing “offline”). Fixture: query “rice”, request failed. Primary action: Try again → S02-2 for the same query. Next: S02-1/S02-3 or S06-1. Limitation: none.',
      },
    },
  },
  render: () => foodSearch('rice', { status: 'failure', results: [] }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('alert')).toHaveTextContent('Search is not available right now');
    await expect(canvas.getByRole('button', { name: 'Try again' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Enter manually' })).toBeVisible();
    await expect(canvas.getByRole('searchbox')).toHaveValue('rice');
  },
};

const review = (extra: Partial<Parameters<typeof FoodReviewScreen>[0]> = {}) => (
  <FoodReviewScreen candidate={fixtureCandidate} mode="new" initialPortion={reviewPortion} onBack={fn()} onChangeMatch={fn()} onAddToToday={fn()} onDone={fn()} {...extra} />
);

export const S07_1: Story = {
  name: 'S07-1 · 176:157 — Food review / From search',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: identity, correction, desired portion and result in one focused step with no bottom bar. Entry: a result row in S02-1. Fixture: fixture C at 300 g → 540 kcal, 18 / 63 / 24 g. Primary action: Add to today → O05 (the sheet’s Add to {meal} commits). Secondary: Done → the invoking surface without logging; Back → the results with the query intact. Limitation: none.',
      },
    },
  },
  render: () => review(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Review food' })).toBeInTheDocument();
    await expect(canvas.getByText('540')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Add to today' })).toBeEnabled();
    await expect(canvas.getByRole('button', { name: 'Done' })).toBeVisible();
    await expect(canvas.queryByRole('navigation')).toBeNull();
  },
};

export const S07_2: Story = {
  name: 'S07-2 · 176:201 — Food review / Invalid portion',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: a non-positive amount keeps guidance beside the field, marks the previous result unavailable and disables Add to today. Entry: the amount was edited to “0”. Fixture: fixture C. Primary action: correct the amount → S07-1. Limitation: the play function types the invalid value; the capture shows the resulting state.',
      },
    },
  },
  render: () => review(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const amount = canvas.getByLabelText('Amount to calculate');
    await userEvent.clear(amount);
    await userEvent.type(amount, '0');
    await userEvent.tab();
    await expect(amount).toHaveAccessibleDescription('Enter an amount greater than zero');
    await expect(canvas.getByRole('button', { name: 'Add to today' })).toBeDisabled();
    await expect(canvas.queryByText('540')).toBeNull();
  },
};

export const S07_3: Story = {
  name: 'S07-3 · 176:247 — Food review / Edit logged entry (repurposed)',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: review and correct one committed entry, including its meal (the frame’s former “replaces current calculation” meaning is superseded; ledger D-1). Entry: an entry row on S01-2. Fixture: Oatmeal with mixed berries, logged at 300 g at breakfast, draft 150 g. Primary action: Update entry → the same entry ID, Home. Secondary: Remove entry → confirmation; Back with a changed draft → Keep editing / Discard. Limitation: none.',
      },
    },
  },
  render: () => <FoodReviewScreen candidate={oatmealWithBerries} mode="existing" initialPortion={{ quantity: 300, unitId: 'g' }} initialMeal="breakfast" onBack={fn()} onUpdateEntry={fn()} onRemoveEntry={fn()} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Edit entry' })).toBeInTheDocument();
    await expect(canvas.getByRole('radio', { name: 'Breakfast' })).toBeChecked();
    const amount = canvas.getByLabelText('Amount to calculate');
    await userEvent.clear(amount);
    await userEvent.type(amount, '150');
    await expect(canvas.getByText('275')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Update entry' })).toBeEnabled();
    await expect(canvas.getByRole('button', { name: 'Remove entry' })).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'Change food' })).toBeNull();
  },
};

// ---- Row added by the 2026-09-05 redesign (ledger §10.3) ------------------------------

export const O05: Story = {
  name: 'O05 — Add to meal / From food review',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: choose the meal and confirm the amount before one entry is created. Entry: Add to today on S07-1 (or S07-4/5/6) with a valid portion. Fixture: fixture C at 300 g; lunch is preselected by the 12:00 baseline (time-of-day rule D-17) and the hint says so. Primary action: Add to lunch → one entry, Home S01-2. Secondary: Cancel / close / Escape → S07 unchanged. Limitation: the story composes the review screen and the sheet the way App does.',
      },
    },
  },
  render: () => (
    <WithAddToMeal candidate={fixtureCandidate} portion={reviewPortion} meal="lunch" hint="Suggested for this time of day. Change it if you like." onConfirm={fn()}>
      {review()}
    </WithAddToMeal>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = canvas.getByRole('dialog', { name: 'Add to meal' });
    await expect(within(dialog).getByRole('radio', { name: 'Lunch' })).toBeChecked();
    await expect(within(dialog).getByLabelText('Amount')).toHaveValue('300');
    await expect(within(dialog).getByText('540')).toBeVisible();
    await expect(within(dialog).getByRole('button', { name: 'Add to lunch' })).toBeEnabled();
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Dinner' }));
    await expect(within(dialog).getByRole('button', { name: 'Add to dinner' })).toBeEnabled();
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Lunch' }));
  },
};

// ---- Representative and risk-bearing variants of this lane ----------------------------

export const O01_Narrow320: Story = {
  name: 'O01 at 320 keeps the 2 × 2 grid',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  render: () => (
    <>
      {emptyHome()}
      <MethodSheet open onRequestClose={fn()} onChoose={fn()} />
    </>
  ),
  play: async ({ canvasElement }) => {
    const dialog = within(canvasElement).getByRole('dialog', { name: 'Log food' });
    const tile = within(dialog).getByRole('button', { name: /Search food/ });
    await expect(getComputedStyle(tile.parentElement as Element).gridTemplateColumns.split(' ').length).toBe(2);
    await expectNoHorizontalOverflow();
  },
};

export const O05_InvalidAndEnlarged: Story = {
  name: 'O05 at 200 % text — invalid amount disables the commit',
  decorators: [withRootFontSize(200)],
  render: () => (
    <WithAddToMeal candidate={fixtureCandidate} portion={reviewPortion} meal="lunch" onConfirm={fn()}>
      {review()}
    </WithAddToMeal>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = canvas.getByRole('dialog', { name: 'Add to meal' });
    const amount = within(dialog).getByLabelText('Amount');
    await userEvent.clear(amount);
    await userEvent.tab();
    await expect(within(dialog).getByRole('button', { name: 'Add to lunch' })).toBeDisabled();
    await expect(amount).toHaveAccessibleDescription('Enter the amount to add');
    await expectNoHorizontalOverflow();
  },
};

export const S07_1_Narrow320: Story = {
  name: 'S07-1 at 320',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  render: () => review(),
  play: async () => {
    await expectNoHorizontalOverflow();
  },
};

export const S07_1_EnlargedText: Story = {
  name: 'S07-1 at 200 % text — footer still reachable',
  decorators: [withRootFontSize(200)],
  render: () => review(),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Add to today' })).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};

export const S07_1_SafeAreas: Story = {
  name: 'S07-1 with the iPhone 16 safe-area fixture — footer owns the bottom inset',
  globals: { viewport: { value: 'iPhone16Portrait', isRotated: false } },
  decorators: [withIPhone16PortraitSafeAreas],
  render: () => review(),
  play: async ({ canvasElement }) => {
    const footer = within(canvasElement).getByRole('button', { name: 'Add to today' }).closest('[class*="footer"]') as HTMLElement | null;
    await expect(footer).not.toBeNull();
    if (footer) await expect(parseFloat(getComputedStyle(footer).paddingBlockEnd)).toBeGreaterThanOrEqual(34);
  },
};

// --- Stage B (2026-09-05): the populated Food tab, ledger §11 -------------------------------

export const S02_7: Story = {
  name: 'S02-7 — Search / Food · first use: the catalogue at once',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: the Food tab is useful before anything is typed — the 15-item catalogue (12 foods or dishes, 3 drinks) shows at once with a photo, name, calories and basis each. Entry: Search root, Food scope, empty query, no confirmed entries yet. Fixture: the catalogue. Primary action: any item → S07-1; List / Grid toggle; Food filters → O07; Scan barcode → S04-1. Limitation: none.',
      },
    },
  },
  render: () => foodSearch('', idle),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('15 items');
    await expect(canvas.getAllByRole('listitem')).toHaveLength(15);
    await expect(canvas.queryByText('Recently added')).toBeNull();
    await expect(canvas.getByRole('radio', { name: 'List' })).toHaveAttribute('aria-checked', 'true');
  },
};

export const S02_8: Story = {
  name: 'S02-8 — Search / Food · Recently added above Explore foods',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: what was confirmed into a meal comes back first. Entry: Search root, Food scope, empty query, confirmed entries exist. Fixture: three entries (banana yesterday, yoghurt this morning, oatmeal just now) → recents newest first, deduplicated by identity, never seeded and never from viewed items. Primary action: a recent item → S07-1. Limitation: none.',
      },
    },
  },
  render: () => foodSearch('', idle, { recents: recentFoods }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const recents = within(canvas.getByRole('list', { name: 'Recently added' }));
    await expect(recents.getAllByRole('listitem')).toHaveLength(3);
    await expect(recents.getAllByRole('button')[0]).toHaveTextContent('Oatmeal');
    await expect(within(canvas.getByRole('list', { name: 'Explore foods' })).getAllByRole('listitem')).toHaveLength(12);
  },
};

export const S02_9: Story = {
  name: 'S02-9 — Search / Food · grid view',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: the same collection as cards in two columns. Entry: the Grid option of the toolbar toggle (the choice persists on the device). Fixture: recents + catalogue. Behaviour: items, order, query, filters and opening are identical to the list; one column under 20 rem (320 px, or 200 % text). Limitation: none.',
      },
    },
  },
  render: () => foodSearch('', idle, { recents: recentFoods, view: 'grid' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radio', { name: 'Grid' })).toHaveAttribute('aria-checked', 'true');
    await expect(getComputedStyle(canvas.getByRole('list', { name: 'Explore foods' })).gridTemplateColumns.split(' ')).toHaveLength(2);
    await expectNoHorizontalOverflow();
  },
};

export const O07: Story = {
  name: 'O07 — Food filters (overlay)',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: narrow the Food tab to foods or drinks from each item’s own record. Entry: the Food filters action at the end of the toolbar. Regions: Show — All / Foods / Drinks; Clear all; Apply filters. Outcomes: Apply → S02-10 with the chip; Close / backdrop / Escape → previous filters kept. Limitation: none.',
      },
    },
  },
  render: () => <WithFoodSearch />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Food filters' }));
    const sheet = canvas.getByRole('dialog', { name: 'Filters' });
    await expect(within(sheet).getByRole('radio', { name: 'All' })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(within(sheet).getByRole('radio', { name: 'Drinks' }));
  },
};

export const S02_10: Story = {
  name: 'S02-10 — Search / Food · Drinks only applied',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: the applied filter is visible as a chip and in the action’s name and count. Entry: Apply filters with Drinks in O07. Fixture: the three catalogue drinks. Outcomes: the chip’s remove action or Clear all → S02-7; a query combines with the filter. Limitation: none.',
      },
    },
  },
  render: () => foodSearch('', idle, { filters: { category: 'drink' } }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Food filters, 1 active' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Remove filter: Drinks only' })).toBeVisible();
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('3 drinks');
    // The applied chip is its own one-item list; the results list holds exactly the three catalogue drinks.
    await expect(within(canvas.getByRole('list', { name: 'Applied filters' })).getAllByRole('listitem')).toHaveLength(1);
    const results = within(canvas.getByRole('list', { name: 'All foods' })).getAllByRole('listitem').map((li) => li.textContent ?? '');
    await expect(results).toHaveLength(3);
    await expect(results[0]).toContain('Sparkling water');
    await expect(results[1]).toContain('Orange juice');
    await expect(results[2]).toContain('Oat drink');
  },
};

export const S02_9_Narrow320: Story = {
  name: 'S02-9 at 320 — one column',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  render: () => foodSearch('', idle, { recents: recentFoods, view: 'grid' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(getComputedStyle(canvas.getByRole('list', { name: 'Explore foods' })).gridTemplateColumns.split(' ')).toHaveLength(1);
    await expectNoHorizontalOverflow();
  },
};

export const S02_8_EnlargedText: Story = {
  name: 'S02-8 at 200 % text',
  decorators: [withRootFontSize(200)],
  render: () => foodSearch('', idle, { recents: recentFoods }),
  play: async () => expectNoHorizontalOverflow(),
};
