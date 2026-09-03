import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { withRootFontSize } from '../../storybook/decorators';
import { NavigationBar, type Destination } from './NavigationBar';

const meta = {
  title: 'Patterns/NavigationBar',
  component: NavigationBar,
  args: { selected: 'calculate', onSelect: fn(), onAddFood: fn() },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'One bottom row: Calculate | Search | Recipes | + Add food. Three destinations expose `aria-current="page"`; Add food is a 56 × 56 action, never a tab. Selection uses the bold glyph, action colour, a 2 px indicator and label weight — hover, press and focus never look selected. Retapping the current destination is ignored. Under enlarged text the same four controls rearrange into two rows of two, measured with ResizeObserver rather than guessed.',
      },
    },
  },
} satisfies Meta<typeof NavigationBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const calculate = canvas.getByRole('button', { name: 'Calculate' });
    await expect(calculate).toHaveAttribute('aria-current', 'page');
    await userEvent.click(calculate);
    await expect(args.onSelect).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole('button', { name: 'Search' }));
    await expect(args.onSelect).toHaveBeenCalledWith('search');
    const add = canvas.getByRole('button', { name: 'Add food' });
    await expect(add).not.toHaveAttribute('aria-current');
    const box = add.getBoundingClientRect();
    await expect(box.width).toBeGreaterThanOrEqual(56);
    await expect(box.height).toBeGreaterThanOrEqual(56);
    await userEvent.click(add);
    await expect(args.onAddFood).toHaveBeenCalledTimes(1);
    await expect(canvas.getByRole('navigation', { name: 'Main' }).getAttribute('data-layout')).toBe('row');
  },
};

export const Selection: Story = {
  name: 'Selection follows the destination',
  render: (args) => {
    const [selected, setSelected] = useState<Destination>('calculate');
    return <NavigationBar {...args} selected={selected} onSelect={setSelected} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Recipes' }));
    await expect(canvas.getByRole('button', { name: 'Recipes' })).toHaveAttribute('aria-current', 'page');
    await expect(canvas.getByRole('button', { name: 'Calculate' })).not.toHaveAttribute('aria-current');
  },
};

export const Hidden: Story = {
  name: 'Hidden while the software keyboard is open',
  args: { hidden: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('navigation')).toBeNull();
  },
};

export const Narrow320: Story = {
  name: 'Narrow — 320, 100 % text',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('navigation').getAttribute('data-layout')).toBe('row');
  },
};

export const EnlargedText: Story = {
  name: 'Enlargement fallback — 320, 200 % text',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole('navigation');
    await new Promise((resolve) => setTimeout(resolve, 50));
    await expect(nav.getAttribute('data-layout')).toBe('stacked');
    for (const name of ['Calculate', 'Search', 'Recipes', 'Add food']) {
      const label = within(canvasElement).getByRole('button', { name }).querySelector<HTMLElement>('[data-nav-label]');
      await expect(label).not.toBeNull();
      if (label) await expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth + 1);
    }
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
