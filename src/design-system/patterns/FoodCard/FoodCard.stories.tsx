import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { bananaPhoto, oatmealPhoto } from '../../../assets/images';
import { withRootFontSize, expectNoHorizontalOverflow } from '../../storybook/decorators';
import { FoodCard } from './FoodCard';

const meta = {
  title: 'Patterns/FoodCard',
  component: FoodCard,
  args: {
    name: 'Banana',
    detail: 'Fruit',
    imageUrl: bananaPhoto,
    calories: 89,
    basis: 'per 100 g',
    onOpen: fn(),
  },
  parameters: {
    docs: {
      description: {
        component:
          'The grid presentation of a food item: photograph above the identity, calories with their basis beneath. The same data as FoodResultRow in the list presentation. The name is the single control and its hit area covers the whole card; a missing or failed photo shows the shared No photo fallback.',
      },
    },
  },
  decorators: [
    (StoryFn) => (
      <div style={{ inlineSize: '170px' }}>
        <StoryFn />
      </div>
    ),
  ],
} satisfies Meta<typeof FoodCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'With a photograph — the whole card opens the item',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Banana' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Banana' }));
    await expect(args.onOpen).toHaveBeenCalledTimes(1);
  },
};

export const LongNamePerServing: Story = {
  name: 'Long name on a per-serving basis',
  args: { name: 'Oatmeal with blueberries and banana', detail: 'Breakfast', imageUrl: oatmealPhoto, calories: 420, basis: 'per serving (350 g)' },
  play: async () => expectNoHorizontalOverflow(),
};

export const NoPhoto: Story = {
  name: 'No photo — the fallback is loaded content',
  args: { imageUrl: undefined },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('No photo')).toBeInTheDocument();
  },
};

export const UnknownCalories: Story = {
  name: 'Calories not available',
  args: { calories: null },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Not available')).toBeInTheDocument();
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 200 %',
  decorators: [withRootFontSize(200)],
  play: async () => expectNoHorizontalOverflow(),
};
