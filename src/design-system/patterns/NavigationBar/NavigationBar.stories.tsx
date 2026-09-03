import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { withRootFontSize } from '../../storybook/decorators';
import { NavigationBar, type Destination } from './NavigationBar';

const meta = {
  title: 'Patterns/NavigationBar',
  component: NavigationBar,
  args: { selected: 'home', onSelect: fn(), onAddFood: fn() },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The one shared bottom bar for every root screen: **Home | Search | Recipes | + Add food**.

**Anatomy.** Three peer destinations (Home, Search, Recipes) sharing the row equally, plus one
trailing Add food action — one visual bar, not three tabs beside a disconnected floating
button. Built as a single CSS Grid (\`repeat(3, minmax(0, 1fr)) auto\`) rather than a nested
destination-group wrapper: the same visual/behavioural contract with less DOM.

**Destination vs. action.** Home, Search and Recipes are destinations: exactly one is always
selected, each exposes \`aria-current="page"\` when active, and re-tapping the current one is a
no-op. Add food is an action: it never receives \`aria-current\`, never takes the selected visual
treatment, and stays reachable from every root and from Recipe Details without forcing a detour
through Home first (Nielsen's flexibility and efficiency of use; Hick's Law — exactly three
destinations plus one explicit action, not a destination added because a competitor has one).

**Selected-state rationale.** Selection is never colour-only: bold Phosphor icon + action colour
+ a 2 px top indicator + heavier label weight, together, so it stays legible for reduced colour
discrimination or acuity. The indicator is exactly 2 px, causes no layout shift (both label
weights are laid out at all times in a stable grid cell — see \`labelSlot\`/\`labelGhost\`), and only
one destination ever owns it.

**Icon rules.** Official \`@phosphor-icons/react\` only: House (Home), MagnifyingGlass (Search),
CookingPot (Recipes), Plus (Add food). 24 px (\`Icon\` \`default\` size) everywhere in this bar,
including the Plus glyph inside Add food's 56 × 56 target. Regular weight by default; bold is
reserved for the persistent selected destination, never for hover, press or focus — hover/press
only shift the background tint.

**Typography.** Navigation labels use the \`caption\`/\`caption-strong\` semantic roles from
\`tokens.json\` → \`semantic.typography\` (12/16, weight 500 unselected → 600 selected) — never
hard-coded font CSS. Labels stay visible at every width and every zoom level tested here;
recognition over recall, so this never becomes icon-only navigation.

**Target sizing.** 48 × 48 CSS px minimum for Home/Search/Recipes (\`--portion-size-target-minimum\`),
56 × 56 for Add food (\`--portion-size-target-add-food\`) — Fitts's Law: large, reachable targets,
never a tiny glyph-only tap area.

**Responsive behaviour.** Intrinsic layout, not coordinates copied from a design file: the
destination trio is \`minmax(0, 1fr)\` × 3 (equal width, \`min-inline-size: 0\` so a long label can
still shrink/measure rather than force overflow) and Add food is a fixed-size grid column — at
320 px this yields real destination cells around 73 px without shrinking any interaction target.
Verified at 320, 390 (the default viewport here), 393 and 430 CSS px, and the bar never
overflows horizontally at any of them.

**Enlarged text / 200%.** A \`ResizeObserver\` measures each label's natural width against its
grid cell; if a label would not fit at 100% zoom's row layout, the same four controls reflow to
two rows of two in the same reading order (Home, Search / Recipes, Add food) — measured, not
guessed against a device name, and never by shrinking type, hiding a label, truncating text or
shrinking a target below its minimum.

**Safe-area ownership.** The bar itself reads \`env(safe-area-inset-bottom)\` and adds it on top of
its own block padding (\`max(space-4, safe-area-bottom)\`) — the safe area is additional space, not
a substitute for it, and it never distorts the equal-width destination alignment above it.

**When it's hidden.** The \`hidden\` prop removes the whole bar as one unit — used by the app shell
while a root text field has the software keyboard open — and restores it (with the same selected
destination and geometry) when the field blurs. It is never right for only the trailing plus to
move independently of the three destinations.

**State/origin preservation.** The bar itself owns no state: \`selected\`, \`onSelect\` and
\`onAddFood\` are the caller's. On Recipe Details it renders with whichever destination was already
selected — Search or Recipes, matching that recipe's actual origin — so opening a detail never
silently reassigns the selected tab. Opening or dismissing Add food (O01) never touches the
underlying destination, search state, filters, scroll position or draft.

**Accessibility.** \`<nav aria-label="Main">\`; each destination is a real \`<button>\` with
\`aria-current="page"\` only while selected; Add food is a plain labelled button with no
\`aria-current\`. Focus uses the design system's shared \`:focus-visible\` treatment (3 px ring, 2 px
offset, drawn outside the control) — visible on every control, selected or not, and never
suppressed by the selected state or by hover/press.

**Native-iOS limitation.** This is a custom, browser-rendered 3-destinations-plus-action bottom
bar, not \`UITabBar\`. It does not inherit iOS's native tab-bar behaviours (translucency/blur over
content, automatic large-title collapse interaction, system-driven badge placement, VoiceOver's
native tab-bar rotor semantics). Browser verification here — including of \`env(safe-area-inset-*)\`
— does not certify native iOS/UIKit behaviour; only a real device/simulator pass can.
        `,
      },
    },
  },
} satisfies Meta<typeof NavigationBar>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---- Selected destination, one at a time -----------------------------------

export const HomeSelected: Story = {
  name: 'Home selected',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const home = canvas.getByRole('button', { name: 'Home' });
    await expect(home).toHaveAttribute('aria-current', 'page');
    // Exactly one destination is selected; Add food never is.
    const current = canvas.getAllByRole('button').filter((b) => b.getAttribute('aria-current') === 'page');
    await expect(current).toHaveLength(1);
    await expect(canvas.getByRole('button', { name: 'Add food' })).not.toHaveAttribute('aria-current');
  },
};

export const SearchSelected: Story = {
  name: 'Search selected',
  args: { selected: 'search' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-current', 'page');
    await expect(canvas.getByRole('button', { name: 'Home' })).not.toHaveAttribute('aria-current');
    await expect(canvas.getByRole('button', { name: 'Recipes' })).not.toHaveAttribute('aria-current');
  },
};

export const RecipesSelected: Story = {
  name: 'Recipes selected',
  args: { selected: 'recipes' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Recipes' })).toHaveAttribute('aria-current', 'page');
    await expect(canvas.getByRole('button', { name: 'Search' })).not.toHaveAttribute('aria-current');
  },
};

// ---- Recipe Details keeps its actual origin --------------------------------

export const RecipeDetailsFromSearch: Story = {
  name: 'Recipe Details / Search origin',
  args: { selected: 'search' },
  parameters: {
    docs: {
      description: {
        story:
          'Recipe Details reuses this exact bar with whichever destination was already active. Opened from Search, Search stays selected — the detail screen never reassigns the selected tab to Recipes just because the content is a recipe.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Search' })).toHaveAttribute('aria-current', 'page');
  },
};

export const RecipeDetailsFromRecipes: Story = {
  name: 'Recipe Details / Recipes origin',
  args: { selected: 'recipes' },
  parameters: {
    docs: {
      description: {
        story: 'Opened from browse instead, Recipes stays selected — same bar, same rule, different origin.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Recipes' })).toHaveAttribute('aria-current', 'page');
  },
};

// ---- Interaction ------------------------------------------------------------

export const Default: Story = {
  name: 'Interaction — select, retap, Add food',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const home = canvas.getByRole('button', { name: 'Home' });
    await expect(home).toHaveAttribute('aria-current', 'page');
    // Retapping the current destination never fires onSelect.
    await userEvent.click(home);
    await expect(args.onSelect).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole('button', { name: 'Search' }));
    await expect(args.onSelect).toHaveBeenCalledWith('search');
    await expect(canvas.getByRole('navigation', { name: 'Main' }).getAttribute('data-layout')).toBe('row');
  },
};

export const AddFoodInteraction: Story = {
  name: 'Add food — action, not a destination',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const add = canvas.getByRole('button', { name: 'Add food' });
    await expect(add).not.toHaveAttribute('aria-current');
    const box = add.getBoundingClientRect();
    await expect(box.width).toBeGreaterThanOrEqual(56);
    await expect(box.height).toBeGreaterThanOrEqual(56);
    await userEvent.click(add);
    await expect(args.onAddFood).toHaveBeenCalledTimes(1);
    // Choosing Add food never changes which destination is selected.
    await expect(canvas.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
  },
};

export const Selection: Story = {
  name: 'Selection follows the destination',
  render: (args) => {
    const [selected, setSelected] = useState<Destination>('home');
    return <NavigationBar {...args} selected={selected} onSelect={setSelected} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Recipes' }));
    await expect(canvas.getByRole('button', { name: 'Recipes' })).toHaveAttribute('aria-current', 'page');
    await expect(canvas.getByRole('button', { name: 'Home' })).not.toHaveAttribute('aria-current');
  },
};

export const Hidden: Story = {
  name: 'Hidden while the software keyboard is open',
  args: { hidden: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('navigation')).toBeNull();
  },
};

// ---- Keyboard and focus -----------------------------------------------------

export const KeyboardFocusVisible: Story = {
  name: 'Keyboard — focus-visible ring',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    const focused = canvas.getByRole('button', { name: 'Home' });
    await expect(focused).toHaveFocus();
    const outline = getComputedStyle(focused);
    await expect(outline.outlineStyle).toBe('solid');
    await expect(outline.outlineWidth).toBe('3px');
    // Tabbing through reaches every control in Home, Search, Recipes, Add food order.
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Search' })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Recipes' })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Add food' })).toHaveFocus();
  },
};

export const SelectedAndFocusVisible: Story = {
  name: 'Selected + focus-visible together',
  parameters: {
    docs: {
      description: {
        story: 'The selected destination keeps its own bold-icon/indicator/label treatment and still shows the full focus ring when it receives keyboard focus — selection never suppresses focus visibility.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    const home = canvas.getByRole('button', { name: 'Home' });
    await expect(home).toHaveFocus();
    await expect(home).toHaveAttribute('aria-current', 'page');
    await expect(getComputedStyle(home).outlineStyle).toBe('solid');
  },
};

// ---- Responsive widths -------------------------------------------------------

export const Narrow320: Story = {
  name: 'Width — 320',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('navigation').getAttribute('data-layout')).toBe('row');
    const nav = canvas.getByRole('navigation');
    await expect(nav.scrollWidth).toBeLessThanOrEqual(nav.clientWidth + 1);
    const home = canvas.getByRole('button', { name: 'Home' });
    await expect(home.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
  },
};

export const Reference390: Story = {
  name: 'Width — 390 (default viewport)',
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('navigation').getAttribute('data-layout')).toBe('row');
  },
};

export const Check393: Story = {
  name: 'Width — 393',
  globals: { viewport: { value: 'mobile393', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('navigation').getAttribute('data-layout')).toBe('row');
    const nav = canvas.getByRole('navigation');
    await expect(nav.scrollWidth).toBeLessThanOrEqual(nav.clientWidth + 1);
  },
};

export const Wide430: Story = {
  name: 'Width — 430',
  globals: { viewport: { value: 'mobile430', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('navigation').getAttribute('data-layout')).toBe('row');
    const nav = canvas.getByRole('navigation');
    await expect(nav.scrollWidth).toBeLessThanOrEqual(nav.clientWidth + 1);
  },
};

// ---- Enlarged text / adaptive reflow ----------------------------------------

export const EnlargedText: Story = {
  name: 'Enlargement fallback — 320, 200 % text',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole('navigation');
    await new Promise((resolve) => setTimeout(resolve, 50));
    await expect(nav.getAttribute('data-layout')).toBe('stacked');
    for (const name of ['Home', 'Search', 'Recipes', 'Add food']) {
      const label = within(canvasElement).getByRole('button', { name }).querySelector<HTMLElement>('[data-nav-label]');
      await expect(label).not.toBeNull();
      if (label) await expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth + 1);
      // Reflow never shrinks a target below its minimum.
      const target = within(canvasElement).getByRole('button', { name });
      const minSize = name === 'Add food' ? 56 : 48;
      await expect(target.getBoundingClientRect().height).toBeGreaterThanOrEqual(minSize);
    }
    await expect(nav.scrollWidth).toBeLessThanOrEqual(nav.clientWidth + 1);
  },
};

export const EnlargedText430: Story = {
  name: 'Wide — 430, 150 % text stays one row',
  globals: { viewport: { value: 'mobile430', isRotated: false } },
  decorators: [withRootFontSize(150)],
  play: async ({ canvasElement }) => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    await expect(within(canvasElement).getByRole('navigation').getAttribute('data-layout')).toBe('row');
  },
};
