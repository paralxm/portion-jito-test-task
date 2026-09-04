import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Text } from '../../primitives/Text/Text';
import { expectNoHorizontalOverflow, withRootFontSize } from '../../storybook/decorators';
import { SegmentedControl, segmentedOptionId, type SegmentedControlOption } from './SegmentedControl';

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
**Purpose.** Mutually exclusive selection among a small, fixed set of peer modes within one task — choosing an option immediately changes what the surrounding screen shows. Portion's production use is the shared Search screen's scope switch, Food | Recipes, which switches the results panel.

**When to use.** 2–4 peer options that describe equivalent "modes" or "scopes" of the same task, where exactly one is always active and switching is immediate (no separate confirm step).

**When not to use.** An arbitrary-length or independently-toggleable set → **FilterChip**; a committed, removable criterion → **AppliedCriterionChip**; a root destination → **NavigationBar**; a choice that opens a sheet for confirm/cancel → **UnitControl** + **UnitSheet**.

**Anatomy.** One sunken track (control radius, 4 px padding) containing one equal-width segment per option (compact-control radius). The group's accessible name comes from \`ariaLabel\`; a visible caption, if a screen needs one, is the caller's heading above the control.

**Patterns.** \`pattern="radio"\` (default) exposes a radio group (\`radiogroup\` / \`radio\` / \`aria-checked\`) for a mode that changes what a screen asks. \`pattern="tabs"\` exposes a tablist (\`tablist\` / \`tab\` / \`aria-selected\` / \`aria-controls\`) for a content switcher: the consumer gives its panel \`role="tabpanel"\` and \`aria-labelledby={segmentedOptionId(id, value)}\` — Search does exactly this. Both use automatic activation per the WAI-ARIA APG: only the selected option is a tab stop, Arrow Left/Up and Right/Down move focus **and** selection (wrapping), Home/End jump to the ends, and a disabled option is skipped. Because focus and selection travel together, an enabled *unselected* segment never holds keyboard focus; no story fakes that state.

**State model.** Availability (enabled / disabled) and selection are independent.
- *Enabled, unselected*: primary text at the \`segmented-label\` weight (500) on the sunken track — legible and visibly a choice; hover lifts it to the surface tint.
- *Selected*: a contained indicator in the action colour with on-action text at the \`segmented-label-selected\` weight (600) — surface, boundary and weight together. Pressed deepens to the pressed action colour.
- *Disabled*: the disabled text token, no hover or press, not-allowed cursor; a disabled *selected* segment keeps a contained neutral surface (disabled surface + disabled text) so it reads as both selected and unavailable.
- *Focus-visible*: the 3 px ring drawn outside the segment, on top of whichever state it has.

**Geometry.** Segments share the width equally; both label roles have identical 14/20 metrics, so selecting never shifts the track. The drawn segment is 40 px; its hit area is the full 48 px track. Long labels wrap; nothing truncates.

**Token usage.** \`radius-control\` / \`radius-control-compact\`, \`background-sunken\` / \`background-surface\` / \`background-canvas\`, \`action-primary\` / \`action-pressed\` / \`text-on-action\`, \`text-primary\`, \`state-disabled-surface\` / \`state-disabled-text\`, \`focus-ring\`, \`segmented-label\` / \`segmented-label-selected\`, \`motion-transition-selection\`.
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

export const FoodSelected: Story = {
  name: 'Food selected (radio pattern)',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('radiogroup', { name: 'Search in' });
    const food = canvas.getByRole('radio', { name: 'Food' });
    const recipes = canvas.getByRole('radio', { name: 'Recipes' });
    await expect(food).toHaveAttribute('aria-checked', 'true');
    await expect(recipes).toHaveAttribute('aria-checked', 'false');
    // Roving tabindex: only the selected option is a tab stop.
    await expect(food).toHaveAttribute('tabindex', '0');
    await expect(recipes).toHaveAttribute('tabindex', '-1');
    // Selected = action fill + on-action text at 600; unselected = 500 on the track.
    await expect(Number(getComputedStyle(food.querySelector('span') as Element).fontWeight)).toBe(600);
    await expect(Number(getComputedStyle(recipes.querySelector('span') as Element).fontWeight)).toBe(500);
    await expect(getComputedStyle(food).backgroundColor).toBe('rgb(40, 85, 217)');
    await expect(getComputedStyle(food).color).toBe('rgb(255, 255, 255)');
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

export const TabsPattern: Story = {
  name: 'Tabs pattern with a real tabpanel (as Search uses it)',
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return (
      <div>
        <SegmentedControl {...args} id="demo-scope" pattern="tabs" controls="demo-panel" value={value} onValueChange={setValue} />
        <div role="tabpanel" id="demo-panel" aria-labelledby={segmentedOptionId('demo-scope', value)} style={{ paddingBlockStart: 16 }}>
          <Text as="p" variant="body" color="secondary">
            {value === 'food' ? 'Food results would show here.' : 'Recipe results would show here.'}
          </Text>
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('tablist', { name: 'Search in' })).toBeInTheDocument();
    const food = canvas.getByRole('tab', { name: 'Food' });
    await expect(food).toHaveAttribute('aria-selected', 'true');
    await expect(food).toHaveAttribute('aria-controls', 'demo-panel');
    await expect(canvas.getByRole('tabpanel', { name: 'Food' })).toBeVisible();
    await userEvent.click(canvas.getByRole('tab', { name: 'Recipes' }));
    await expect(canvas.getByRole('tabpanel', { name: 'Recipes' })).toHaveTextContent('Recipe results');
  },
};

export const ClickChangesValue: Story = {
  name: 'Click changes the value; re-selecting fires no duplicate callback; no layout shift',
  render: (args) => <Harness {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const before = canvas.getByRole('radio', { name: 'Recipes' }).getBoundingClientRect().width;
    await userEvent.click(canvas.getByRole('radio', { name: 'Recipes' }));
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(args.onValueChange).toHaveBeenLastCalledWith('recipes');
    await expect(canvas.getByRole('radio', { name: 'Recipes' })).toHaveAttribute('aria-checked', 'true');
    await expect(Math.abs(canvas.getByRole('radio', { name: 'Recipes' }).getBoundingClientRect().width - before)).toBeLessThan(1);
    await userEvent.click(canvas.getByRole('radio', { name: 'Recipes' }));
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
  },
};

export const Pressed: Story = {
  name: 'Pressed — selection commits on release; the pressed rule is authored',
  render: (args) => <Harness {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'Pressing an unselected segment lifts it to the canvas fill (`:active`); pressing the selected one deepens it to the pressed action colour. The test runner cannot hold a real :active state, so this story asserts the authored rule and the commit-on-release behaviour; the pressed appearance is inspected by hand in a browser.',
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const recipes = canvas.getByRole('radio', { name: 'Recipes' });
    // Press and release on the same segment commit on release (a click); the value never changes on pointer down alone.
    await userEvent.pointer([{ keys: '[MouseLeft>]', target: recipes }, { keys: '[/MouseLeft]', target: recipes }]);
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(recipes).toHaveAttribute('aria-checked', 'true');
    const rules = Array.from(document.styleSheets).flatMap((sheet) => {
      try {
        return Array.from(sheet.cssRules);
      } catch {
        return [];
      }
    }) as CSSStyleRule[];
    const pressedUnselected = rules.find((r) => r.selectorText?.includes(':not([data-selected]):active'));
    const pressedSelected = rules.find((r) => r.selectorText?.includes('[data-selected]:not(:disabled):active'));
    await expect(pressedUnselected?.style.background).toBe('var(--portion-color-background-canvas)');
    await expect(pressedSelected?.style.background).toBe('var(--portion-color-action-pressed)');
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
    await userEvent.keyboard('{ArrowRight}');
    await expect(document.activeElement).toBe(food);
    await userEvent.keyboard('{End}');
    await expect(document.activeElement).toBe(recipes);
  },
};

export const SelectedAndFocusVisible: Story = {
  name: 'Selected + focus-visible',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const food = canvas.getByRole('radio', { name: 'Food' });
    await userEvent.tab();
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
    canvas.getByRole('radio', { name: 'Food' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('radio', { name: 'Food' })).toHaveAttribute('aria-checked', 'true');
    await expect(args.onValueChange).not.toHaveBeenCalled();
    // Disabled uses the disabled text token, distinct from the enabled-unselected primary text.
    await expect(getComputedStyle(recipes).color).toBe('rgb(119, 129, 139)');
  },
};

export const SelectedAndDisabled: Story = {
  name: 'Selected + disabled — both meanings preserved',
  args: { value: 'recipes', disabled: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const recipes = canvas.getByRole('radio', { name: 'Recipes' });
    await expect(recipes).toBeDisabled();
    await expect(recipes).toHaveAttribute('aria-checked', 'true');
    await expect(Number(getComputedStyle(recipes.querySelector('span') as Element).fontWeight)).toBe(600);
    // A contained neutral surface: still visibly the selected segment, visibly unavailable.
    await expect(getComputedStyle(recipes).backgroundColor).toBe('rgb(229, 231, 235)');
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
    const option = within(canvasElement).getByRole('radio', { name: 'Nutrition and ingredients' });
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
    const option = within(canvasElement).getByRole('radio', { name: 'Preparation method' });
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
          "Demonstrates the general reusable shape — 2–4 mutually exclusive peer modes, one always active — with a generic, widely-understood example (a unit-system switch). Documentation only: Portion has no unit-system feature. The only production consumer is Search's Food | Recipes switch.",
      },
    },
  },
};
