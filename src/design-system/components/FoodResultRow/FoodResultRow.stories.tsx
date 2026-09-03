import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Stack } from '../../primitives/layout/Stack';
import { expectNoHorizontalOverflow, withRootFontSize } from '../../storybook/decorators';
import { FoodResultRow } from './FoodResultRow';

const meta = {
  title: 'Components/FoodResultRow',
  component: FoodResultRow,
  args: { name: 'Lentil soup', detail: 'Homemade · per 100 g', calories: 150, basis: 'per 100 g', onClick: fn() },
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
      <FoodResultRow name="Wholegrain pasta with roasted vegetables and tahini dressing" detail="Prepared dish · per 100 g" calories={152} basis="per 100 g" />
      <FoodResultRow name="Mixed salad leaves" detail="Fresh · per 100 g · partial nutrition" calories={null} basis="per 100 g" />
      <FoodResultRow name="Sparkling water" detail="Drink · per 100 ml" calories={0} basis="per 100 ml" />
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
