import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { expectNoHorizontalOverflow, withRootFontSize } from '../../../design-system/storybook/decorators';
import { createEntry, type FoodEntry } from '../domain/daily-log';
import { foodCatalogue } from '../domain/fixtures';
import { homeEntries } from '../domain/home-fixtures';
import type { MealType } from '../domain/meal';
import { MealGroup } from './MealGroup';
import { MealPicker } from './MealPicker';

const populated = homeEntries();
const longName = createEntry(foodCatalogue[2], { quantity: 250, unitId: 'g' }, 'dinner', { id: 'long' }) as FoodEntry;

const meta = {
  title: 'Product compositions/Home (S01)/MealGroup',
  component: MealGroup,
  args: { entries: populated, onOpenEntry: fn(), onAdd: fn() },
  parameters: {
    docs: {
      description: {
        component:
          "Today's meals (ledger D-16): one grouped surface with Breakfast, Lunch, Dinner and Snacks always present, empty ones included. Each `MealSection` header pairs its filled/hollow indicator with text — the kcal subtotal or the add action — never colour alone; populated meals list `MealEntryRow`s (name, portion, kcal) that open the entry for editing, and offer *Add to {meal}*; empty meals offer *Add {meal}*. A record without a meal (the unassigned guard) appears in its own section with a Choose a meal resolution. `MealPicker` is the shared radio group of four chips used by the Add-to-meal sheet and existing-entry review.",
      },
    },
  },
} satisfies Meta<typeof MealGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {
  name: 'Two meals populated, two empty',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('1,350 kcal logged')).toBeVisible();
    for (const meal of ['Breakfast', 'Lunch', 'Dinner', 'Snacks']) await expect(canvas.getByRole('heading', { level: 3, name: meal })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Add to breakfast' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Add dinner' }));
    await expect(args.onAdd).toHaveBeenCalledWith('dinner');
    await userEvent.click(canvas.getByRole('button', { name: /Grilled chicken Caesar salad/ }));
    await expect(args.onOpenEntry).toHaveBeenCalledWith('demo-caesar');
  },
};

export const Empty: Story = {
  name: 'Nothing logged — all four meals shown',
  args: { entries: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Nothing logged')).toBeVisible();
    await expect(canvas.getAllByRole('button', { name: /^Add / })).toHaveLength(4);
  },
};

export const LongNamesAndHighlight: Story = {
  name: 'Long entry name, a just-added highlight, a partial subtotal',
  args: {
    entries: [...populated, longName, { ...(createEntry(foodCatalogue[5], { quantity: 100, unitId: 'g' }, 'dinner', { id: 'leaves' }) as FoodEntry) }],
    highlightEntryId: 'long',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: /Wholegrain pasta/ })).toBeVisible();
    await expect(canvasElement.querySelector('[data-highlighted]')).not.toBeNull();
  },
};

export const Unassigned: Story = {
  name: 'Unassigned guard — a record without a meal',
  args: { entries: [{ ...populated[0], meal: null }] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 3, name: 'Unassigned' })).toBeInTheDocument();
    await expect(canvas.getByText('Choose a meal')).toBeVisible();
  },
};

function PickerHarness() {
  const [meal, setMeal] = useState<MealType | null>(null);
  return <MealPicker value={meal} onChange={setMeal} hint="Suggested for this time of day. Change it if you like." />;
}

export const Picker: Story = {
  name: 'MealPicker — radio chips, keyboard and selection',
  render: () => <PickerHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('radiogroup', { name: 'Meal' });
    await expect(within(group).getAllByRole('radio')).toHaveLength(4);
    await userEvent.click(within(group).getByRole('radio', { name: 'Dinner' }));
    await expect(within(group).getByRole('radio', { name: 'Dinner' })).toHaveAttribute('aria-checked', 'true');
    await expect(within(group).getByRole('radio', { name: 'Lunch' })).toHaveAttribute('aria-checked', 'false');
  },
};

export const Narrow320: Story = {
  name: 'Narrow — 320',
  args: { entries: [...populated, longName] },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async () => {
    await expectNoHorizontalOverflow();
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 320 at 200 %',
  args: { entries: [...populated, longName] },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  play: async () => {
    await expectNoHorizontalOverflow();
  },
};
