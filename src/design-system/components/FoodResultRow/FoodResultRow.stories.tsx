import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Stack } from '../../primitives/layout/Stack';
import { expectNoHorizontalOverflow, withRootFontSize } from '../../storybook/decorators';
import { bananaPhoto, oatmealPhoto } from '../../../assets/images';
import { FoodResultRow } from './FoodResultRow';

const meta = {
  title: 'Components/FoodResultRow',
  component: FoodResultRow,
  args: { name: 'Lentil soup', detail: 'Homemade', calories: 150, basis: 'per 100 g', onClick: fn() },
  parameters: {
    docs: {
      description: {
        component: 'Compact search-result row. Selecting it opens review — it does not replace the current calculation. The identity wraps; the calorie value stays inline at 16/24 with its basis.',
      },
    },
  },
} satisfies Meta<typeof FoodResultRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /Lentil soup/ }));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const LongNameAndMissingCalories: Story = {
  name: 'Long name and missing calories at 320',
  render: () => (
    <Stack gap={0}>
      <FoodResultRow name="Wholegrain pasta with roasted vegetables and tahini dressing" detail="Prepared dish" calories={152} basis="per 100 g" />
      <FoodResultRow name="Mixed salad leaves" detail="Fresh · partial nutrition" calories={null} basis="per 100 g" />
      <FoodResultRow name="Sparkling water" detail="Drink" calories={0} basis="per 100 ml" />
    </Stack>
  ),
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Not available')).toBeInTheDocument();
    await expect(canvas.getByText('0 kcal')).toBeInTheDocument();
    const long = canvas.getByRole('button', { name: /Wholegrain pasta/ });
    await expect(long.scrollWidth).toBeLessThanOrEqual(long.clientWidth + 1);
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 200 %',
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: /Lentil soup/ })).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};

export const WithThumbnail: Story = {
  name: 'With a thumbnail — the list presentation of a catalogue item',
  args: { name: 'Banana', detail: 'Fruit', calories: 89, basis: 'per 100 g', imageUrl: bananaPhoto },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: /Banana/ })).toBeVisible();
    await expect(canvas.getByRole('button', { name: /Banana/ }).querySelector('img')).not.toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: /Banana/ }));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const ThumbnailLongName: Story = {
  name: 'Thumbnail with a long name at 390 — the name wraps between words, the basis gives way',
  args: { name: 'Oatmeal with blueberries and banana', detail: 'Breakfast', calories: 420, basis: 'per serving (350 g)', imageUrl: oatmealPhoto },
  render: (args) => (
    <Stack gap={0}>
      <FoodResultRow {...args} />
      <FoodResultRow {...args} name="Scrambled eggs on toast" detail="Dish" calories={360} basis={'per serving (200 g)'} />
      <FoodResultRow {...args} name="Banana" detail="Fruit" calories={89} basis="per 100 g" />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByRole('button', { name: /Oatmeal/ });
    await expect(row).toBeVisible();
    // The identity column never drops under 7.5 rem (120 px at 100 % text), so "blueberries" wraps whole.
    const identity = canvas.getByText('Oatmeal with blueberries and banana').parentElement as HTMLElement;
    await expect(identity.getBoundingClientRect().width).toBeGreaterThanOrEqual(120);
    // The calorie value stays on one line; the basis wraps instead of the name.
    const value = canvas.getByText('420 kcal');
    await expect(value.getClientRects().length).toBe(1);
    await expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth + 1);
    await expectNoHorizontalOverflow();
  },
};

export const ThumbnailNarrowEnlarged: Story = {
  name: 'Thumbnail at 320 and 200 % — the figure wraps under the identity',
  args: { name: 'Oatmeal with blueberries and banana', detail: 'Breakfast', calories: 420, basis: 'per serving (350 g)', imageUrl: oatmealPhoto },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  render: (args) => (
    <Stack gap={4}>
      <FoodResultRow {...args} />
      <FoodResultRow {...args} name="Sparkling water" detail="Drink" calories={0} basis="per 100 ml" imageUrl={undefined} />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: /Oatmeal/ })).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};
