import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { expectNoHorizontalOverflow, withRootFontSize } from '../../storybook/decorators';
import { SegmentedControl, type SegmentedControlOption } from './SegmentedControl';

const meta = {
  title: 'Components/SegmentedControl',
  component: SegmentedControl,
  args: {
    value: 'food',
    onValueChange: fn(),
    ariaLabel: 'Search in',
    options: [
      { value: 'food', label: 'Food' },
      { value: 'recipes', label: 'Recipes' },
    ] satisfies SegmentedControlOption<string>[],
  },
  parameters: {
    docs: {
      description: {
        component: `
**Purpose.** Mutually exclusive selection among a small, fixed set of peer modes within one task — choosing an option immediately changes what the surrounding screen shows. Portion's production use is the shared Search screen's scope switch, Food | Recipes: the user stays in Search and only the result context changes.

**When to use.** 2–4 peer options that describe equivalent "modes" or "scopes" of the same task, where exactly one is always active and switching is immediate (no separate confirm step).

**When not to use.**
- An arbitrary-length or independently-toggleable set of values → **FilterChip** (\`selectionRole="toggle"\` for independent filters, \`selectionRole="radio"\` for a longer mutually-exclusive set that may wrap onto more than one line, e.g. recipe filters' dietary preference).
- A criterion the user has committed and can remove → **AppliedCriterionChip**.
- A destination in the app's root navigation → **NavigationBar**.
- A choice that opens a sheet for a separate confirm/cancel step rather than switching content immediately → **UnitControl** + **UnitSheet**.

**Anatomy.** One sunken track (\`role="radiogroup"\`, control radius, 4 px padding) containing one segment (\`role="radio"\`) per option; segments share the width equally. The group's accessible name comes from \`ariaLabel\`; a visible caption, if a screen needs one, is the caller's own heading above the control.

**State model.** Availability (enabled / disabled) and selection (unselected / selected) are independent axes; a disabled option keeps whichever selection it has.
- *Enabled, unselected* ("inactive"): secondary text at the label weight on the sunken track — legible and visibly a choice, not a gap. Hover (pointer only) lifts it to the surface tint with primary text.
- *Selected*: a contained indicator — canvas fill, the control boundary (3.3:1 on the track) and primary text at the action-sm weight. Never a colour swap alone, never a capsule, never an outlined-button look. Same 14/20 metrics in both weights, so switching never reflows the equal-width segments.
- *Disabled*: the disabled text step plus reduced opacity, no hover, not-allowed cursor; cannot be selected by click or keyboard and is skipped by arrow traversal. A disabled *selected* option still reads as selected.
- *Focus-visible*: the 3 px ring around the focused segment, on top of whichever state it has.

**Pattern and keyboard.** Exposed as a radio group with roving tabindex (WAI-ARIA APG radio group): only the selected option is a tab stop; Arrow Left/Up and Right/Down move focus *and* selection to the previous/next enabled option (wrapping); Home/End jump to the first/last enabled option. Because focus and selection move together, an enabled *unselected* segment never holds keyboard focus — the "unselected + focus" intersection cannot occur in this pattern, and no story fakes it. Not exposed as tabs: the component never owns the content its value switches.

**Targets.** The drawn segment is 40 px tall; its hit area extends to the full 48 px track height.

**Token usage.** \`radius-control\` (track), \`radius-control-compact\` (segments), \`background-sunken\` / \`background-surface\` / \`background-canvas\`, \`border-control\`, \`text-secondary\` / \`text-primary\` / \`state-disabled-text\`, \`label\` and \`action-sm\` type roles, \`motion-transition-selection\`.
        `,
      },
    },
  },
} satisfies Meta<typeof SegmentedControl<string>>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A controlled harness: the story renders the real production component and owns `value`, exactly as SearchScreen does. */
function Harness(props: Parameters<typeof SegmentedControl<string>>[0]) {
  const [value, setValue] = useState(props.value);
  return (
    <SegmentedControl
      {...props}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        props.onValueChange(next);
      }}
    />
  );
}

export const Default: Story = {
  name: 'Default — Food | Recipes',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('radiogroup', { name: 'Search in' });
    await expect(group).toBeInTheDocument();
    const food = canvas.getByRole('radio', { name: 'Food' });
    const recipes = canvas.getByRole('radio', { name: 'Recipes' });
    await expect(food).toHaveAttribute('aria-checked', 'true');
    await expect(recipes).toHaveAttribute('aria-checked', 'false');
    // Roving tabindex: only the selected option is a tab stop.
    await expect(food).toHaveAttribute('tabindex', '0');
    await expect(recipes).toHaveAttribute('tabindex', '-1');
    // Selected = canvas fill + boundary + 600 weight; unselected = 500 weight, no fill.
    // The weight lives on the label span (the type role), not on the button element.
    await expect(Number(getComputedStyle(food.querySelector('span') as Element).fontWeight)).toBe(600);
    await expect(Number(getComputedStyle(recipes.querySelector('span') as Element).fontWeight)).toBe(500);
    await expect(getComputedStyle(food).backgroundColor).not.toBe(getComputedStyle(recipes).backgroundColor);
    // Equal segments; the track is the 48 px target and each drawn segment is 40 px.
    await expect(Math.abs(food.getBoundingClientRect().width - recipes.getBoundingClientRect().width)).toBeLessThan(1);
    await expect(Math.round(group.getBoundingClientRect().height)).toBe(48);
    await expect(parseFloat(getComputedStyle(food, '::before').top)).toBe(-4);
  },
};

export const RecipesSelected: Story = {
  name: 'Recipes selected',
  args: { value: 'recipes' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radio', { name: 'Recipes' })).toHaveAttribute('aria-checked', 'true');
    await expect(canvas.getByRole('radio', { name: 'Food' })).toHaveAttribute('aria-checked', 'false');
  },
};

export const ClickChangesValue: Story = {
  name: 'Click changes the value; re-selecting fires no duplicate callback',
  render: (args) => <Harness {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const before = canvas.getByRole('radio', { name: 'Recipes' }).getBoundingClientRect().width;
    await userEvent.click(canvas.getByRole('radio', { name: 'Recipes' }));
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(args.onValueChange).toHaveBeenLastCalledWith('recipes');
    await expect(canvas.getByRole('radio', { name: 'Recipes' })).toHaveAttribute('aria-checked', 'true');
    // No layout shift on selection: the segment keeps its width when its weight changes.
    await expect(Math.abs(canvas.getByRole('radio', { name: 'Recipes' }).getBoundingClientRect().width - before)).toBeLessThan(1);
    // Clicking the already-selected option again must not re-fire the callback.
    await userEvent.click(canvas.getByRole('radio', { name: 'Recipes' }));
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
  },
};

export const KeyboardInteraction: Story = {
  name: 'Keyboard: arrow keys move focus and selection together',
  render: (args) => <Harness {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const food = canvas.getByRole('radio', { name: 'Food' });
    food.focus();
    await expect(document.activeElement).toBe(food);
    await userEvent.keyboard('{ArrowRight}');
    const recipes = canvas.getByRole('radio', { name: 'Recipes' });
    await expect(document.activeElement).toBe(recipes);
    await expect(recipes).toHaveAttribute('aria-checked', 'true');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('recipes');
    // The focused segment is always the selected one: "unselected + focus" cannot occur.
    await expect((document.activeElement as HTMLElement).getAttribute('aria-checked')).toBe('true');
    // Wraps: ArrowRight again from the last option returns to the first.
    await userEvent.keyboard('{ArrowRight}');
    await expect(document.activeElement).toBe(food);
    await expect(food).toHaveAttribute('aria-checked', 'true');
    // ArrowLeft moves the other way.
    await userEvent.keyboard('{ArrowLeft}');
    await expect(document.activeElement).toBe(recipes);
  },
};

export const SelectedAndFocusVisible: Story = {
  name: 'Selected + focus-visible',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const food = canvas.getByRole('radio', { name: 'Food' });
    await userEvent.tab();
    // The first tab stop on the page is the (only) tab-stop option: the selected one.
    await expect(document.activeElement).toBe(food);
    const style = getComputedStyle(food);
    await expect(style.outlineStyle).toBe('solid');
    await expect(parseFloat(style.outlineWidth)).toBe(3);
    await expect(food).toHaveAttribute('aria-checked', 'true');
  },
};

export const DisabledOption: Story = {
  name: 'Disabled option (enabled-unselected stays actionable)',
  args: {
    options: [
      { value: 'food', label: 'Food' },
      { value: 'recipes', label: 'Recipes', disabled: true },
    ],
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const recipes = canvas.getByRole('radio', { name: 'Recipes' });
    await expect(recipes).toBeDisabled();
    await userEvent.click(recipes);
    await expect(args.onValueChange).not.toHaveBeenCalled();
    // Arrow traversal skips the disabled option — with only 2 options, ArrowRight from
    // Food (the only enabled one) is a no-op rather than landing on Recipes.
    canvas.getByRole('radio', { name: 'Food' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('radio', { name: 'Food' })).toHaveAttribute('aria-checked', 'true');
    await expect(args.onValueChange).not.toHaveBeenCalled();
    // Disabled is visibly different from an enabled-unselected segment, not just its colour.
    await expect(parseFloat(getComputedStyle(recipes).opacity)).toBeLessThan(1);
  },
};

export const SelectedAndDisabled: Story = {
  name: 'Selected + disabled — selection is preserved',
  args: { value: 'recipes', disabled: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const recipes = canvas.getByRole('radio', { name: 'Recipes' });
    await expect(recipes).toBeDisabled();
    await expect(recipes).toHaveAttribute('aria-checked', 'true');
    await expect(Number(getComputedStyle(recipes.querySelector('span') as Element).fontWeight)).toBe(600);
    await userEvent.click(canvas.getByRole('radio', { name: 'Food' }));
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};

export const LongLabels: Story = {
  name: 'Long, realistic labels wrap instead of truncating',
  args: {
    ariaLabel: 'View',
    value: 'nutrition',
    options: [
      { value: 'nutrition', label: 'Nutrition and ingredients' },
      { value: 'method', label: 'Preparation method' },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const option = canvas.getByRole('radio', { name: 'Nutrition and ingredients' });
    await expect(option.scrollWidth).toBeLessThanOrEqual(option.clientWidth + 1);
    await expectNoHorizontalOverflow();
  },
};

export const Narrow320: Story = {
  name: 'Narrow — 320',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('radiogroup')).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 320 at 200 %, long labels',
  args: {
    ariaLabel: 'View',
    value: 'nutrition',
    options: [
      { value: 'nutrition', label: 'Nutrition and ingredients' },
      { value: 'method', label: 'Preparation method' },
    ],
  },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const option = canvas.getByRole('radio', { name: 'Preparation method' });
    await expect(option.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
    await expectNoHorizontalOverflow();
  },
};

export const IllustrativeGeneralShape: Story = {
  name: 'Illustrative general shape (not a shipped Portion feature)',
  args: {
    ariaLabel: 'Units',
    value: 'metric',
    options: [
      { value: 'metric', label: 'Metric' },
      { value: 'imperial', label: 'Imperial' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates the general reusable shape — 2–4 mutually exclusive peer modes, one always active — with a generic, widely-understood example (a unit-system switch). This is documentation only: Portion does not have a unit-system feature, and this story is not wired to any real screen. The only real production consumer today is Search's Food | Recipes scope switch, shown in the stories above.",
      },
    },
  },
};
