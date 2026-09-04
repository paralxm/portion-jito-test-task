import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { expectNoHorizontalOverflow, withRootFontSize } from '../../storybook/decorators';
import { NavigationBar, type Destination } from './NavigationBar';

const meta = {
  title: 'Patterns/NavigationBar',
  component: NavigationBar,
  args: { selected: 'home', onSelect: fn(), onLogFood: fn() },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The bottom navigation for every root screen: a compact group of the three destinations — **Home, Search, Recipes** — and, beside it, the separate circular **Log food** action. One row, one navigation area, two functions.

**Anatomy.** \`nav[aria-label="Main"]\` → a hugging group (navigation surface, hairline, \`navigation-group\` radius 16, 4 px padding) of three 48 px destination buttons, then a 56 px circular action button. The group never spans the width; the action sits to its right at the bar's inset.

**Active destination.** Bold Phosphor glyph + the visible label (\`nav-label-active\`, Inter 10/14, 700) + the contained selected surface (\`navigation-selected-surface\`, \`navigation-item\` radius 12) with \`navigation-selected-content\`, exposed as \`aria-current="page"\`. Selection is carried by surface, glyph weight and label together, never colour alone.

**Inactive destinations.** The regular glyph only (\`navigation-content\`, 6.1:1 on the group surface), no visible label, an accessible name via \`aria-label\`; hover and press tint the target. Re-tapping the current destination is a no-op.

**Log food.** A plain labelled button (\`aria-label="Log food"\`, no visible caption), the one filled element in the bar: \`navigation-action-surface\` (the action colour) with the bold Plus glyph at \`navigation-action-content\`, a true circle (\`round\`) at the 56 px action target. It opens the shared Log food chooser from every root and from Recipe Details, never takes \`aria-current\`, and never becomes selected. The selected destination stays visually subordinate to it.

**Type floor.** 10/14 is the product's only role below 12 px and is restricted to this active label; it is never used for content. Apple recommends at least 11 pt for native iOS text — CSS px in this browser prototype are not points, and the label's contrast is 5.4:1.

**Radius decision.** Rendered comparison of the group at 12 and 16 and the item at 8 and 12: 12 on the group read as a card, 16 as a container; 8 on the item fought the group's curve, 12 keeps the corners concentric (16 − 4 padding). Neither is a capsule; only Log food receives \`full\`.

**Reference pattern (not copied).** The compact group + separate primary action structure is a mature mobile pattern (the supplied reference image; Apple HIG tab bars separate destinations from actions). Its blur, transparency, gradient, shadow, red colour, icons, dimensions, spacing, typography and exact radii were not used; Portion's tokens and these rules take priority.

**Responsive.** The group hugs content, so nothing reflows at 320–430 px; at 200 % text the active label scales with rem and the row simply grows. The \`hidden\` prop removes the whole bar as one unit while a root text field has the software keyboard open.

**Accessibility.** Real buttons, logical Tab order (Home, Search, Recipes, Log food), the shared 3 px focus ring drawn outside each control, \`aria-current\` on exactly one destination, and the bottom safe area added to the bar's own padding.

**Native-iOS limitation.** A custom, browser-rendered bar, not \`UITabBar\`; browser verification does not certify native behaviour.
        `,
      },
    },
  },
} satisfies Meta<typeof NavigationBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const visibleLabel = (button: HTMLElement) => button.querySelector('span');

export const HomeSelected: Story = {
  name: 'Home selected',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const home = canvas.getByRole('button', { name: 'Home' });
    await expect(home).toHaveAttribute('aria-current', 'page');
    await expect(visibleLabel(home)).toHaveTextContent('Home');
    // Inactive destinations keep an accessible name but show no visible label.
    for (const name of ['Search', 'Recipes']) {
      const inactive = canvas.getByRole('button', { name });
      await expect(inactive).not.toHaveAttribute('aria-current');
      await expect(visibleLabel(inactive)).toBeNull();
    }
    const current = canvas.getAllByRole('button').filter((b) => b.getAttribute('aria-current') === 'page');
    await expect(current).toHaveLength(1);
    // Active label: 10/14, 700, in the selected content colour.
    const label = visibleLabel(home) as HTMLElement;
    const style = getComputedStyle(label);
    await expect(Math.round(parseFloat(style.fontSize))).toBe(10);
    await expect(Math.round(parseFloat(style.lineHeight))).toBe(14);
    await expect(Number(style.fontWeight)).toBe(700);
    await expect(style.fontFamily.includes('Inter Variable')).toBe(true);
  },
};

export const SearchSelected: Story = {
  name: 'Search selected',
  args: { selected: 'search' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-current', 'page');
    await expect(canvas.getByRole('button', { name: 'Home' })).not.toHaveAttribute('aria-current');
  },
};

export const RecipesSelected: Story = {
  name: 'Recipes selected',
  args: { selected: 'recipes' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Recipes' })).toHaveAttribute('aria-current', 'page');
  },
};

export const RecipeDetailsOrigins: Story = {
  name: 'Recipe Details keeps its origin (Search here)',
  args: { selected: 'search' },
  parameters: {
    docs: {
      description: {
        story: 'Recipe Details reuses this exact bar with whichever destination was already active. Opened from Search, Search stays selected; opened from browse, Recipes does — the detail screen never reassigns the selection.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Search' })).toHaveAttribute('aria-current', 'page');
  },
};

export const Interaction: Story = {
  name: 'Interaction — select, retap, Log food',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const home = canvas.getByRole('button', { name: 'Home' });
    await userEvent.click(home);
    await expect(args.onSelect).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole('button', { name: 'Search' }));
    await expect(args.onSelect).toHaveBeenCalledWith('search');
    await userEvent.click(canvas.getByRole('button', { name: 'Log food' }));
    await expect(args.onLogFood).toHaveBeenCalledTimes(1);
    // Log food never changes which destination is selected.
    await expect(home).toHaveAttribute('aria-current', 'page');
  },
};

export const LogFoodAction: Story = {
  name: 'Log food — a circular 56 px action, not a destination',
  play: async ({ canvasElement }) => {
    const action = within(canvasElement).getByRole('button', { name: 'Log food' });
    await expect(action).not.toHaveAttribute('aria-current');
    const box = action.getBoundingClientRect();
    await expect(Math.round(box.width)).toBe(56);
    await expect(Math.round(box.height)).toBe(56);
    const style = getComputedStyle(action);
    await expect(style.borderRadius).toBe('9999px');
    await expect(style.backgroundColor).toBe('rgb(40, 85, 217)');
    await expect(action.textContent?.trim()).toBe('');
  },
};

export const Selection: Story = {
  name: 'Selection follows the destination; the group stays compact',
  render: (args) => {
    const [selected, setSelected] = useState<Destination>('home');
    return <NavigationBar {...args} selected={selected} onSelect={setSelected} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Recipes' }));
    const recipes = canvas.getByRole('button', { name: 'Recipes' });
    await expect(recipes).toHaveAttribute('aria-current', 'page');
    await expect(visibleLabel(recipes)).toHaveTextContent('Recipes');
    await expect(visibleLabel(canvas.getByRole('button', { name: 'Home' }))).toBeNull();
    // The group hugs its content: it never spans the bar.
    const nav = canvas.getByRole('navigation');
    const group = recipes.parentElement as HTMLElement;
    await expect(group.getBoundingClientRect().width).toBeLessThan(nav.getBoundingClientRect().width * 0.75);
  },
};

export const Hidden: Story = {
  name: 'Hidden while the software keyboard is open',
  args: { hidden: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('navigation')).toBeNull();
  },
};

export const KeyboardFocusVisible: Story = {
  name: 'Keyboard — focus order and focus-visible ring',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    const home = canvas.getByRole('button', { name: 'Home' });
    await expect(home).toHaveFocus();
    await expect(home).toHaveAttribute('aria-current', 'page');
    await expect(getComputedStyle(home).outlineStyle).toBe('solid');
    await expect(getComputedStyle(home).outlineWidth).toBe('3px');
    for (const name of ['Search', 'Recipes', 'Log food']) {
      await userEvent.tab();
      await expect(canvas.getByRole('button', { name })).toHaveFocus();
      await expect(getComputedStyle(canvas.getByRole('button', { name })).outlineStyle).toBe('solid');
    }
  },
};

const widthCheck = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  const nav = canvas.getByRole('navigation');
  await expect(nav.scrollWidth).toBeLessThanOrEqual(nav.clientWidth + 1);
  for (const name of ['Home', 'Search', 'Recipes']) await expect(canvas.getByRole('button', { name }).getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
  await expect(canvas.getByRole('button', { name: 'Log food' }).getBoundingClientRect().width).toBeGreaterThanOrEqual(56);
  await expectNoHorizontalOverflow();
};

export const Narrow320: Story = { name: 'Width — 320', globals: { viewport: { value: 'mobile320', isRotated: false } }, play: ({ canvasElement }) => widthCheck(canvasElement) };
export const Reference390: Story = { name: 'Width — 390 (default viewport)', play: ({ canvasElement }) => widthCheck(canvasElement) };
export const Check393: Story = { name: 'Width — 393', globals: { viewport: { value: 'mobile393', isRotated: false } }, play: ({ canvasElement }) => widthCheck(canvasElement) };
export const Wide430: Story = { name: 'Width — 430', globals: { viewport: { value: 'mobile430', isRotated: false } }, play: ({ canvasElement }) => widthCheck(canvasElement) };

export const EnlargedText: Story = {
  name: 'Enlarged text — 320 at 200 %',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    await widthCheck(canvasElement);
    const label = visibleLabel(within(canvasElement).getByRole('button', { name: 'Home' })) as HTMLElement;
    await expect(Math.round(parseFloat(getComputedStyle(label).fontSize))).toBe(20);
  },
};
