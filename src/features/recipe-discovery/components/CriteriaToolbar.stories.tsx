import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { expectNoHorizontalOverflow, withRootFontSize } from '../../../design-system/storybook/decorators';
import { removeCriterion, type RecipeCriteria } from '../domain/matching';
import { CriteriaToolbar } from './CriteriaToolbar';

function Harness({ initial }: { initial: RecipeCriteria }) {
  const [criteria, setCriteria] = useState(initial);
  const [open, setOpen] = useState(false);
  return (
    <CriteriaToolbar
      criteria={criteria}
      sheetOpen={open}
      onOpenSheet={() => setOpen(true)}
      onCloseSheet={() => setOpen(false)}
      onApply={setCriteria}
      onRemove={(key) => setCriteria((c) => removeCriterion(c, key))}
    />
  );
}

const meta = {
  title: 'Product compositions/Recipe filters toolbar',
  component: CriteriaToolbar,
  args: { criteria: {}, sheetOpen: false, onOpenSheet: fn(), onCloseSheet: fn(), onApply: fn(), onRemove: fn() },
  parameters: {
    docs: {
      description: {
        component:
          'Filters entry plus the applied-criteria chips, shared by recipe browsing and the Recipes search scope. The Filters button opens the draft sheet; the chip row is the committed truth and removing a chip commits immediately.',
      },
    },
  },
} satisfies Meta<typeof CriteriaToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoActiveCriteria: Story = {
  name: 'No active criteria',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: /^Filters/ })).toBeInTheDocument();
    await expect(canvas.queryByRole('list')).toBeNull();
  },
};

export const AppliedCriteria: Story = {
  name: 'Applied criteria',
  args: { criteria: { caloriesMax: 500, proteinMin: 20, dietary: 'vegan' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('3')).toBeInTheDocument();
    await expect(canvas.getAllByRole('listitem')).toHaveLength(3);
  },
};

export const OpenSheetAndRemoveChip: Story = {
  name: 'Open the sheet and remove a chip',
  render: () => <Harness initial={{ caloriesMax: 500, dietary: 'vegan' }} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /^Filters/ }));
    await expect(canvas.getByRole('dialog', { name: 'Filters' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await userEvent.click(canvas.getByRole('button', { name: 'Remove filter: Vegan' }));
    // The closed sheet still holds a hidden "Vegan" dietary option in the DOM, so the
    // applied chip's own accessible name — not a bare text match — proves it is gone.
    await expect(canvas.queryByRole('button', { name: 'Remove filter: Vegan' })).toBeNull();
    await expect(canvas.getByText('1')).toBeInTheDocument();
  },
};

export const Narrow320: Story = {
  name: 'Narrow — 320',
  args: { criteria: { caloriesMin: 300, caloriesMax: 500, proteinMin: 10, preparationMax: 30, dietary: 'vegan' } },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('listitem')).toHaveLength(4);
    await expectNoHorizontalOverflow();
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 320 at 200 %',
  args: { criteria: { caloriesMin: 300, caloriesMax: 500, proteinMin: 10, preparationMax: 30, dietary: 'vegan' } },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: /^Filters/ })).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};
