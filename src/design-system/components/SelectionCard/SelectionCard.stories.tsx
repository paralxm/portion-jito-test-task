import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { withRootFontSize } from '../../storybook/decorators';
import { SelectionCard } from './SelectionCard';

const OPTIONS = [
  { value: 'inactive', title: 'Mostly sedentary', description: 'Sitting most of the day; little planned exercise.' },
  { value: 'low-active', title: 'Lightly active', description: 'Some walking or light activity most days.' },
  { value: 'active', title: 'Active', description: 'Regular exercise or an active job.' },
  { value: 'very-active', title: 'Very active', description: 'Hard training or heavy physical work most days.' },
];

function Stack({ presentation = 'card', initial = 'low-active' }: { presentation?: 'card' | 'tile'; initial?: string | null }) {
  const [value, setValue] = useState<string | null>(initial);
  const items = presentation === 'tile' ? [{ value: 'female', title: 'Female' }, { value: 'male', title: 'Male' }] : OPTIONS;
  return (
    <div role="radiogroup" aria-label={presentation === 'tile' ? 'Sex used by the estimate' : 'Activity level'} style={{ display: 'flex', flexDirection: presentation === 'tile' ? 'row' : 'column', gap: 'var(--portion-ref-space-12)', maxWidth: '24rem' }}>
      {items.map((item) => (
        <SelectionCard key={item.value} name="demo" presentation={presentation} value={item.value} checked={value === item.value} onChange={setValue} title={item.title} description={'description' in item ? item.description : undefined} />
      ))}
    </div>
  );
}

const meta = {
  title: 'Components/SelectionCard',
  component: Stack,
  parameters: {
    docs: {
      description: {
        component:
          'One selectable option in a single-choice set (ledger §14): a whole-card label around a native radio, 16 px padding, a 4 px title-to-helper gap, a reserved 24 px indicator slot at the end so nothing shifts on selection, the selected surface and boundary plus the check mark — never colour alone. `presentation="tile"` centres a short label for equal-width pairs (Female / Male). Cards never auto-advance; the step\'s Continue does.',
      },
    },
  },
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Cards: Story = {
  name: 'Cards — one chosen, the indicator slot reserved',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radio', { name: /Lightly active/ })).toBeChecked();
    await userEvent.click(canvas.getByText('Hard training or heavy physical work most days.'));
    await expect(canvas.getByRole('radio', { name: /Very active/ })).toBeChecked();
    await expect(canvas.getByRole('radio', { name: /Lightly active/ })).not.toBeChecked();
  },
};

export const Tiles: Story = {
  name: 'Tiles — an equal-width pair with centred labels',
  args: { presentation: 'tile', initial: 'female' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [female, male] = canvas.getAllByRole('radio');
    const a = female.closest('label')?.getBoundingClientRect();
    const b = male.closest('label')?.getBoundingClientRect();
    await expect(Math.abs((a?.width ?? 0) - (b?.width ?? 0))).toBeLessThan(1);
    await expect(female).toBeChecked();
    female.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(male).toBeChecked();
  },
};

export const NoneChosen: Story = {
  name: 'Nothing chosen — keyboard focus shows the ring',
  args: { initial: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole('radio', { name: /Mostly sedentary/ })).toHaveFocus();
  },
};

export const Enlarged: Story = {
  name: 'Enlarged text — 200 %, the helper wraps under the title',
  decorators: [withRootFontSize(200)],
};
