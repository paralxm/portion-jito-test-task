import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { expectNoHorizontalOverflow } from '../../../design-system/storybook/decorators';
import { recipeCatalogue } from '../domain/fixtures';
import { RecipeList } from './RecipeList';

const meta = {
  title: 'Product compositions/RecipeList',
  component: RecipeList,
  args: { recipes: recipeCatalogue, criteria: {}, onOpen: fn() },
  parameters: {
    docs: {
      description: {
        component: 'The single recipe list used by browsing and the Recipes search scope: a list of RecipeCard, each showing per-card match evidence only when criteria are active.',
      },
    },
  },
} satisfies Meta<typeof RecipeList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoCriteria: Story = {
  name: 'No active criteria',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('listitem')).toHaveLength(recipeCatalogue.length);
    await expect(canvas.queryByText(/Matches/)).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Lentil soup' }));
    await expect(args.onOpen).toHaveBeenCalledWith('recipe-lentil-soup');
  },
};

export const WithCriteria: Story = {
  name: 'Active criteria — per-card evidence',
  args: { criteria: { caloriesMax: 500, dietary: 'vegan' } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByText(/Matches/).length).toBeGreaterThan(0);
  },
};

export const Empty: Story = {
  args: { recipes: [] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('listitem')).toBeNull();
  },
};

export const Narrow320: Story = {
  name: 'Narrow — 320',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('listitem').length).toBeGreaterThan(0);
    await expectNoHorizontalOverflow();
  },
};
