import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Inline } from '../../primitives/layout/Inline';
import { Stack } from '../../primitives/layout/Stack';
import { AppliedCriterionChip, FilterChip } from './Chip';

const meta = {
  title: 'Components/Chip',
  component: FilterChip,
  args: { children: 'Vegan', selected: false },
  parameters: {
    docs: {
      description: {
        component:
          'FilterChip is a selectable option (toggle with `aria-pressed`, or radio inside a `role="radiogroup"`); selection is shown by boundary, fill and a check mark. AppliedCriterionChip is a committed criterion with its own remove action — removing it commits immediately.',
      },
    },
  },
} satisfies Meta<typeof FilterChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Toggle: Story = {
  render: (args) => {
    const [selected, setSelected] = useState(args.selected);
    return (
      <FilterChip {...args} selected={selected} onClick={() => setSelected((s) => !s)}>
        {args.children}
      </FilterChip>
    );
  },
  play: async ({ canvasElement }) => {
    const chip = within(canvasElement).getByRole('button', { name: 'Vegan' });
    await expect(chip).toHaveAttribute('aria-pressed', 'false');
    const width = chip.getBoundingClientRect().width;
    await userEvent.click(chip);
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    // The check mark is added; the label keeps the same style so the row barely reflows.
    await expect(chip.getBoundingClientRect().width).toBeGreaterThanOrEqual(width);
  },
};

export const RadioGroup: Story = {
  name: 'Radio group (scope switch)',
  render: () => {
    const [scope, setScope] = useState<'food' | 'recipes'>('food');
    return (
      <div role="radiogroup" aria-label="Search in">
        <Inline gap={8}>
          <FilterChip selectionRole="radio" selected={scope === 'food'} onClick={() => setScope('food')}>
            Food
          </FilterChip>
          <FilterChip selectionRole="radio" selected={scope === 'recipes'} onClick={() => setScope('recipes')}>
            Recipes
          </FilterChip>
        </Inline>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('radio', { name: 'Recipes' }));
    await expect(canvas.getByRole('radio', { name: 'Recipes' })).toHaveAttribute('aria-checked', 'true');
    await expect(canvas.getByRole('radio', { name: 'Food' })).toHaveAttribute('aria-checked', 'false');
  },
};

export const Applied: Story = {
  name: 'Applied criteria',
  render: () => {
    const [chips, setChips] = useState(['300–500 kcal', '10 g protein or more', 'Under 30 min', 'Vegan']);
    return (
      <Stack gap={8}>
        <Inline as="ul" gap={8} wrap block aria-label="Applied filters" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {chips.map((label) => (
            <li key={label}>
              <AppliedCriterionChip removeLabel={`Remove filter: ${label}`} onRemove={() => setChips((c) => c.filter((x) => x !== label))}>
                {label}
              </AppliedCriterionChip>
            </li>
          ))}
        </Inline>
      </Stack>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Remove filter: Vegan' }));
    await expect(canvas.queryByText('Vegan')).toBeNull();
    await expect(canvas.getAllByRole('listitem')).toHaveLength(3);
  },
};

export const RemoveTarget: Story = {
  name: 'Remove action target',
  args: { onClick: fn() },
  render: (args) => (
    <AppliedCriterionChip removeLabel="Remove filter: Under 500 kcal" onRemove={() => args.onClick?.({} as never)}>
      Under 500 kcal
    </AppliedCriterionChip>
  ),
  play: async ({ canvasElement, args }) => {
    const remove = within(canvasElement).getByRole('button', { name: 'Remove filter: Under 500 kcal' });
    // The drawn control is 32 px; its ::before extends the hit area by 8 px on every side (48 × 48).
    await expect(remove.getBoundingClientRect().height).toBeGreaterThanOrEqual(32);
    const before = getComputedStyle(remove, '::before');
    await expect(before.position).toBe('absolute');
    await expect(parseFloat(before.top)).toBe(-8);
    await expect(parseFloat(before.left)).toBe(-8);
    await userEvent.click(remove);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};
