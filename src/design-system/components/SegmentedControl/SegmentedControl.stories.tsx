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
- A single independent on/off setting → there is no Switch in this system yet; do not repurpose SegmentedControl for a two-state toggle that isn't a pair of named peer modes.

**Anatomy.** One \`role="radiogroup"\` track containing one \`role="radio"\` button per option. There is no separate label/caption slot — the group's accessible name comes from \`ariaLabel\`; a visible caption, if a screen needs one, is the caller's own heading placed above the control (as Search's screen heading already is).

**API.** \`value\`, \`options\` (\`{ value, label, disabled? }[]\`), \`onValueChange\`, \`ariaLabel\` (required), \`disabled\` (optional, disables every option). Fully controlled — the parent always owns \`value\`; the component never manages its own selection and never re-fires \`onValueChange\` for the option that is already selected, from either a click or a keyboard move.

**Variants.** One: a text-only, horizontal control. No color/size/radius override props and no icon-only or vertical variant exist — this is the whole currently-supported shape, not a partial list.

**States.** default, hover (background tint, desktop pointers only), selected (background lifts to canvas, a 1 px \`action-primary\` boundary and \`action-primary\` text — never a text-colour change alone), selected + focus-visible (the same selected treatment plus the standard 3 px focus ring), disabled (a per-option \`disabled\` flag, or the whole-control \`disabled\` prop; a disabled option cannot be selected by click or keyboard and is skipped by arrow-key traversal).

**Accessibility.** The group exposes its accessible name via \`aria-label\`; each option's checked state is \`aria-checked\`, native \`disabled\` marks unavailable options. Roving tabindex: only the selected option is a tab stop; Arrow Left/Up and Right/Down move focus to and select the previous/next enabled option (wrapping), Home/End jump to the first/last enabled option — the same interaction model as a native radio group. Every option's hit area is at least 48 CSS px tall.

**Content guidance.** Labels are short, plain words (not sentences). A label may still wrap onto a second line under a long realistic label or 200% text — the segment grows taller, never truncates and never clips.

**Token usage.** \`portion-radius-control\` for the track and each segment (never \`full\` — this is not a pill), \`portion-color-action-primary\` for the selected boundary and text, \`portion-color-background-{surface,canvas,sunken}\` for the track/selected/hover fills, \`portion-motion-transition-selection\` for the state change, the \`label\` (14/20) type style, and \`portion-size-target-minimum\` (48 px) for the segment height floor.

**Responsive.** Verified at 320 CSS px and at 200% text with a long realistic label; the track never overflows its container and never truncates a label.
        `,
      },
    },
  },
} satisfies Meta<typeof SegmentedControl<string>>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A controlled harness: the story renders the real, uncut production component and owns `value` itself, exactly as SearchScreen does. */
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
    const box = food.getBoundingClientRect();
    await expect(box.height).toBeGreaterThanOrEqual(48);
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
    await userEvent.click(canvas.getByRole('radio', { name: 'Recipes' }));
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(args.onValueChange).toHaveBeenLastCalledWith('recipes');
    await expect(canvas.getByRole('radio', { name: 'Recipes' })).toHaveAttribute('aria-checked', 'true');
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
  },
};

export const DisabledOption: Story = {
  name: 'Disabled option',
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
          'Demonstrates the general reusable shape — 2–4 mutually exclusive peer modes, one always active — with a generic, widely-understood example (a unit-system switch). This is documentation only: Portion does not have a unit-system feature, and this story is not wired to any real screen. The only real production consumer today is Search\'s Food | Recipes scope switch, shown in the stories above.',
      },
    },
  },
};
