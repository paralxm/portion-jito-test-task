import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Stack } from '../../primitives/layout/Stack';
import { RecipeCard } from './RecipeCard';

/** A clearly artificial placeholder — the repository ships no photographs. */
const placeholder =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#e4e8ec"/><circle cx="200" cy="150" r="70" fill="#c2c7cd"/><circle cx="200" cy="150" r="46" fill="#f7f8fa"/></svg>');

const meta = {
  title: 'Patterns/RecipeCard',
  component: RecipeCard,
  args: {
    title: 'Lentil soup',
    imageUrl: placeholder,
    calories: 450,
    protein: 24,
    servingBasis: 'per serving (300 g)',
    preparationMinutes: 25,
    dietary: [],
    onOpen: fn(),
  },
  parameters: {
    docs: {
      description: {
        component:
          'Scannable recipe card with a 4:3 image, wrapping title, calories and protein on the stated basis, preparation time and dietary tags. The title is the single control; its hit area stretches over the card. A missing photo is usable loaded content, not a skeleton. With active criteria the card shows a compact match summary; with none it makes no match claim.',
      },
    },
  },
} satisfies Meta<typeof RecipeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithPhoto: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const title = canvas.getByRole('button', { name: 'Lentil soup' });
    await expect(getComputedStyle(title, '::after').position).toBe('absolute');
    await userEvent.click(title);
    await expect(args.onOpen).toHaveBeenCalledTimes(1);
    await expect(canvas.queryByText(/Matches/)).toBeNull();
  },
};

export const NoPhotoLongTitle: Story = {
  name: 'No photo, long title at 320',
  args: { imageUrl: undefined, title: 'Wholegrain pasta with roasted vegetables and tahini dressing', calories: 610, protein: 19, servingBasis: 'per serving (400 g)', preparationMinutes: 35, dietary: ['Vegetarian'] },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('No photo')).toBeVisible();
    const title = canvas.getByRole('button', { name: /Wholegrain pasta/ });
    await expect(title.getBoundingClientRect().height).toBeGreaterThan(24);
  },
};

export const WithCriteria: Story = {
  name: 'With active criteria',
  args: {
    dietary: ['Vegan', 'Gluten-free', 'Dairy-free'],
    criteria: [
      { id: 'calories', text: '450 kcal per serving — at most 500 kcal', met: true },
      { id: 'protein', text: '24 g protein per serving — at least 20 g', met: true },
    ],
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Matches all 2 filters')).toBeInTheDocument();
  },
};

export const MissingProtein: Story = {
  name: 'Unknown protein, partial match',
  args: {
    title: 'Quick tofu stir-fry',
    imageUrl: undefined,
    protein: null,
    calories: 395,
    preparationMinutes: 15,
    dietary: ['Vegan'],
    criteria: [
      { id: 'calories', text: '395 kcal per serving — at most 500 kcal', met: true },
      { id: 'protein', text: 'Protein per serving not available — needs at least 20 g', met: false },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Protein Not available')).toBeInTheDocument();
    await expect(canvas.getByText('Matches 1 of 2 filters')).toBeInTheDocument();
  },
};

export const List: Story = {
  name: 'In a list',
  render: (args) => (
    <Stack as="ul" gap={12} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      <li>
        <RecipeCard {...args} />
      </li>
      <li>
        <RecipeCard {...args} title="Roasted vegetable and chickpea traybake" imageUrl={undefined} calories={420} protein={14} preparationMinutes={40} dietary={['Vegan', 'Gluten-free']} />
      </li>
    </Stack>
  ),
};
