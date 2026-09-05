import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Stack } from '../../../design-system/primitives/layout/Stack';
import { expectNoHorizontalOverflow, withRootFontSize } from '../../../design-system/storybook/decorators';
import { activeCriteriaCount, removeCriterion, type RecipeCriteria } from '../domain/matching';
import { CriteriaToolbar } from './CriteriaToolbar';
import { FilterAction } from './FilterAction';

function Harness({ initial }: { initial: RecipeCriteria }) {
  const [criteria, setCriteria] = useState(initial);
  const [open, setOpen] = useState(false);
  return (
    <Stack gap={12} align="start">
      <FilterAction count={activeCriteriaCount(criteria)} expanded={open} onClick={() => setOpen(true)} />
      <CriteriaToolbar criteria={criteria} sheetOpen={open} onCloseSheet={() => setOpen(false)} onApply={setCriteria} onRemove={(key) => setCriteria((c) => removeCriterion(c, key))} />
    </Stack>
  );
}

const meta = {
  title: 'Product compositions/Recipe filters toolbar',
  component: CriteriaToolbar,
  args: { criteria: {}, sheetOpen: false, onCloseSheet: fn(), onApply: fn(), onRemove: fn() },
  parameters: {
    docs: {
      description: {
        component:
          'The applied-criteria chips beneath the search field and the filter sheet they come from, shared by recipe browsing and the Recipes search scope. The sheet is opened from the field’s trailing `FilterAction` (an icon button named “Filters” or “Filters, 2 active”, with the count as a visible badge — ledger D-27). The chip row is the committed truth and removing a chip commits immediately.',
      },
    },
  },
} satisfies Meta<typeof CriteriaToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoActiveCriteria: Story = {
  name: 'No active criteria — nothing visible',
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('list')).toBeNull();
  },
};

export const AppliedCriteria: Story = {
  name: 'Applied criteria',
  args: { criteria: { caloriesMax: 500, proteinMin: 20, dietary: ['vegan'] } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('listitem')).toHaveLength(3);
  },
};

export const FilterActionStates: Story = {
  name: 'Filter action — none applied and 2 active',
  render: () => (
    <Stack gap={12} align="start">
      <FilterAction count={0} expanded={false} onClick={fn()} />
      <FilterAction count={2} expanded={false} onClick={fn()} />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Filters' })).toBeVisible();
    const applied = canvas.getByRole('button', { name: 'Filters, 2 active' });
    await expect(applied).toBeVisible();
    await expect(applied.parentElement).toHaveTextContent('2');
  },
};

export const OpenSheetAndRemoveChip: Story = {
  name: 'Open the sheet from the action and remove a chip',
  render: () => <Harness initial={{ caloriesMax: 500, dietary: ['vegan'] }} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Filters, 2 active' }));
    await expect(canvas.getByRole('dialog', { name: 'Filters' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await userEvent.click(canvas.getByRole('button', { name: 'Remove filter: Vegan' }));
    // The closed sheet still holds a hidden "Vegan" dietary option in the DOM, so the
    // applied chip's own accessible name — not a bare text match — proves it is gone.
    await expect(canvas.queryByRole('button', { name: 'Remove filter: Vegan' })).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Filters, 1 active' })).toBeVisible();
  },
};

export const Narrow320: Story = {
  name: 'Narrow — 320',
  args: { criteria: { caloriesMin: 300, caloriesMax: 500, proteinMin: 10, preparationMax: 30, dietary: ['vegan'] } },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('listitem')).toHaveLength(4);
    await expectNoHorizontalOverflow();
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 320 at 200 %',
  args: { criteria: { caloriesMin: 300, caloriesMax: 500, proteinMin: 10, preparationMax: 30, dietary: ['vegan'] } },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('listitem')).toHaveLength(4);
    await expectNoHorizontalOverflow();
  },
};
