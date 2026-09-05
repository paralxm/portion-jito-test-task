import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { SlidersHorizontal, X } from '@phosphor-icons/react';

import { Button } from '../../primitives/Button/Button';
import { IconButton } from '../../primitives/IconButton/IconButton';
import { withIPhone16PortraitSafeAreas, withRootFontSize, expectNoHorizontalOverflow } from '../../storybook/decorators';
import { AppHeader } from './AppHeader';

const meta = {
  title: 'Patterns/AppHeader',
  component: AppHeader,
  args: { title: 'Search' },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Three variants, one per screen: **root** — the `PortionLogo` lockup, a contextual line (the local date on Home) and an optional trailing action, with the screen name as a visually hidden h1; **section** — the 28/36 screen title with an optional trailing action (Search, Recipes); **focused** — Back, the 18/24 bar title and an optional trailing control (acquisition, review, recipe details). Each variant owns the top safe area exactly once. Titles wrap; nothing is truncated. Under 20 rem the root variant wraps the context line under the lockup.',
      },
    },
  },
} satisfies Meta<typeof AppHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Root: Story = {
  name: 'Root — logo, date, Set goal (Home)',
  args: {
    variant: 'root',
    title: 'Home',
    context: 'Today · 4 Sep',
    trailing: (
      <Button variant="text" size="small" onClick={fn()}>
        Set goal
      </Button>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
    await expect(canvas.getByRole('img', { name: 'Portion' })).toBeVisible();
    await expect(canvas.getByText('Today · 4 Sep')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Set goal' })).toBeVisible();
    // The screen name is not shown twice: the h1 is visually hidden, the lockup is the visible brand.
    await expect(canvas.getByRole('heading', { level: 1 }).classList.contains('portion-visually-hidden')).toBe(true);
  },
};

export const RootEditGoal: Story = {
  name: 'Root — Edit goal',
  args: { variant: 'root', title: 'Home', context: 'Today · 4 Sep', trailing: <Button variant="text" size="small">Edit goal</Button> },
};

export const Section: Story = {
  name: 'Section — screen title (Search, Recipes)',
  args: { variant: 'section', title: 'Recipes', trailing: <IconButton icon={SlidersHorizontal} label="Filters" /> },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('heading', { level: 1, name: 'Recipes' })).toBeVisible();
  },
};

export const Focused: Story = {
  args: { variant: 'focused', title: 'Review food', onBack: fn() },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Back' }));
    await expect(args.onBack).toHaveBeenCalledTimes(1);
  },
};

export const FocusedWithTrailing: Story = {
  name: 'Focused with trailing close',
  args: { variant: 'focused', title: 'Scan barcode', onBack: fn(), trailing: <IconButton icon={X} label="Cancel scan" /> },
};

export const LongTitle320: Story = {
  name: 'Long title wraps at 320',
  args: { variant: 'focused', title: 'Review the wholegrain pasta with roasted vegetables and tahini dressing', onBack: fn() },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { level: 1 });
    await expect(heading.getBoundingClientRect().height).toBeGreaterThan(24);
    await expect(heading.scrollWidth).toBeLessThanOrEqual(heading.clientWidth + 1);
  },
};

export const RootEnlarged: Story = {
  name: 'Root at 320 and 200 % text — context wraps under the lockup',
  args: { variant: 'root', title: 'Home', context: 'Today · 4 Sep', trailing: <Button variant="text" size="small">Edit goal</Button> },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Edit goal' })).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};

export const SafeArea: Story = {
  name: 'Root with the iPhone 16 safe-area fixture — header owns the 59 px top inset',
  args: { variant: 'root', title: 'Home', context: 'Today · 4 Sep' },
  globals: { viewport: { value: 'iPhone16Portrait', isRotated: false } },
  decorators: [withIPhone16PortraitSafeAreas],
  play: async ({ canvasElement }) => {
    const header = canvasElement.querySelector('header') as HTMLElement;
    await expect(parseFloat(getComputedStyle(header).paddingBlockStart)).toBeGreaterThanOrEqual(59);
  },
};
