import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, within } from 'storybook/test';
import { Question } from '@phosphor-icons/react';

import { IconButton } from '../../primitives/IconButton/IconButton';
import { withRootFontSize } from '../../storybook/decorators';
import { FocusedBar } from './FocusedBar';

const meta = {
  title: 'Patterns/FocusedBar',
  component: FocusedBar,
  args: { onBack: fn(), step: { current: 1, total: 3 }, trailing: <IconButton icon={Question} label="Help" onClick={fn()} /> },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The compact header of a focused step without a title (ledger §14): Back in a 48 px slot at the start, Help (or nothing) in a 48 px slot at the end, and the step count centred on the container between two equal slots, in tabular figures with *Step 1 of 3* for assistive technology. The heading belongs to the content below, not the bar. It owns the top safe area once.',
      },
    },
  },
} satisfies Meta<typeof FocusedBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StepCount: Story = {
  name: 'Step 1/3 — centred between equal slots',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Step 1 of 3')).toBeInTheDocument();
    const back = canvas.getByRole('button', { name: 'Back' }).getBoundingClientRect();
    const help = canvas.getByRole('button', { name: 'Help' }).getBoundingClientRect();
    const count = canvas.getByText('1/3').getBoundingClientRect();
    const bar = canvasElement.querySelector('header')?.getBoundingClientRect();
    await expect(Math.abs(back.width - help.width)).toBeLessThan(1);
    await expect(Math.abs((count.left + count.right) / 2 - ((bar?.left ?? 0) + (bar?.right ?? 0)) / 2)).toBeLessThan(1.5);
  },
};

export const LastStep: Story = { name: 'Step 3/3', args: { step: { current: 3, total: 3 } } };

export const NoStep: Story = { name: 'No step count — the review and the editor', args: { step: undefined } };

export const Enlarged: Story = { name: 'Enlarged text — 200 %', decorators: [withRootFontSize(200)] };
