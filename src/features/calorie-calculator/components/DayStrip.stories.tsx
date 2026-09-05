import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { Container } from '../../../design-system/primitives/layout/Container';
import { expectNoHorizontalOverflow, withRootFontSize } from '../../../design-system/storybook/decorators';
import { addDays, localDayKey } from '../domain/day-keys';
import { DayStrip, stripDays } from './DayStrip';

const todayKey = localDayKey(new Date('2026-09-04T12:00:00Z'));

function Controlled({ initial, onSelectDay }: { initial: string; onSelectDay?: (dayKey: string) => void }) {
  const [selected, setSelected] = useState(initial);
  return (
    <DayStrip
      selectedDayKey={selected}
      todayKey={todayKey}
      onSelectDay={(dayKey) => {
        setSelected(dayKey);
        onSelectDay?.(dayKey);
      }}
    />
  );
}

const meta = {
  title: 'Product compositions/Home (S01)/Day strip',
  component: DayStrip,
  args: { selectedDayKey: todayKey, todayKey, onSelectDay: fn() },
  decorators: [
    (Story) => (
      <Container>
        <Story />
      </Container>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: `
Home's compact day strip (ledger §13, after H-REF 1): one row of 48 px day tiles that scrolls sideways by touch, trackpad, mouse drag and keyboard. Today carries a dot and the word in its name; the selected day is the filled tile; days after today are unavailable. There is no calendar container and no previous / next week control — \`Today\` returns from an earlier day, arrow keys move the selection, Home and End jump to the earliest listed day and today, and the selected tile is scrolled into view. The row lists whole weeks back to a week before the earlier of (today − 3 weeks) and the selected day, so selecting the earliest tile always reveals another week.
        `,
      },
    },
  },
} satisfies Meta<typeof DayStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Today: Story = {
  name: 'Today selected — the filled tile carries the dot; later days unavailable',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radio', { name: 'Friday, September 4, today' })).toBeChecked();
    await expect(canvas.getByRole('radio', { name: /Saturday, September 5, not available yet/ })).toBeDisabled();
    await expect(canvas.queryByRole('button', { name: 'Today' })).toBeNull();
    await expect(canvas.queryByRole('button', { name: /week/ })).toBeNull();
    await expect(canvas.getByText('September 2026')).toBeVisible();
    // Unselected and future days are text on the canvas; only the selected day is filled.
    const unselected = getComputedStyle(canvas.getByRole('radio', { name: 'Thursday, September 3' }));
    const future = getComputedStyle(canvas.getByRole('radio', { name: /Saturday, September 5/ }));
    const selected = getComputedStyle(canvas.getByRole('radio', { name: 'Friday, September 4, today' }));
    expect(unselected.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(unselected.borderTopColor).toBe('rgba(0, 0, 0, 0)');
    expect(future.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(selected.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  },
};

export const EarlierDay: Story = {
  name: 'An earlier day selected — Today returns; the strip reaches further back',
  render: () => <Controlled initial={addDays(todayKey, -1)} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radio', { name: 'Thursday, September 3' })).toBeChecked();
    await expect(canvas.getByRole('radio', { name: 'Friday, September 4, today' })).not.toBeChecked();
    await userEvent.click(canvas.getByRole('button', { name: 'Today' }));
    await expect(canvas.getByRole('radio', { name: 'Friday, September 4, today' })).toBeChecked();
    // End on the earlier day so the capture shows the state this story documents.
    await userEvent.click(canvas.getByRole('radio', { name: 'Thursday, September 3' }));
    await expect(canvas.getByRole('radio', { name: 'Thursday, September 3' })).toBeChecked();
    await expect(canvas.getByRole('button', { name: 'Today' })).toBeVisible();
  },
};

export const Keyboard: Story = {
  name: 'Keyboard — arrows move the selection, End returns to today, the future is skipped',
  render: () => <Controlled initial={todayKey} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const today = canvas.getByRole('radio', { name: 'Friday, September 4, today' });
    today.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(today).toBeChecked();
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    await expect(canvas.getByRole('radio', { name: 'Wednesday, September 2' })).toBeChecked();
    await waitFor(() => expect(canvas.getByRole('radio', { name: 'Wednesday, September 2' })).toHaveFocus());
    await userEvent.keyboard('{End}');
    await expect(canvas.getByRole('radio', { name: 'Friday, September 4, today' })).toBeChecked();
  },
};

export const ReachesBack: Story = {
  name: 'Selecting the earliest tile reveals another week',
  render: () => <Controlled initial={todayKey} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const before = stripDays(todayKey, todayKey);
    const earliest = canvas.getAllByRole('radio')[0];
    await userEvent.click(earliest);
    await expect(canvas.getAllByRole('radio')).toHaveLength(before.length + 7);
  },
};

export const Narrow320: Story = {
  name: 'Narrow — 320: the row scrolls, tiles keep their 48 px targets',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tile = canvas.getByRole('radio', { name: 'Friday, September 4, today' });
    expect(tile.getBoundingClientRect().width).toBeGreaterThanOrEqual(48);
    await expectNoHorizontalOverflow();
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 320 at 200 %',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('radio', { name: 'Friday, September 4, today' })).toBeChecked();
    await expectNoHorizontalOverflow();
  },
};
