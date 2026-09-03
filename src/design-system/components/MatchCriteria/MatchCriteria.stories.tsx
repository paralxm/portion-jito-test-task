import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { MatchCriteria, type MatchCriterion } from './MatchCriteria';

const allMet: MatchCriterion[] = [
  { id: 'calories', text: '450 kcal per serving — at most 500 kcal', met: true },
  { id: 'protein', text: '24 g protein per serving — at least 20 g', met: true },
  { id: 'preparation', text: '25 min preparation — at most 30 min', met: true },
];

const partial: MatchCriterion[] = [
  { id: 'calories', text: '450 kcal per serving — at most 500 kcal', met: true },
  { id: 'protein', text: 'Protein per serving not available — needs at least 20 g', met: false },
  { id: 'dietary', text: 'Dietary type not specified — Vegan cannot be confirmed', met: false },
];

const meta = {
  title: 'Components/MatchCriteria',
  component: MatchCriteria,
  args: { criteria: allMet, presentation: 'summary' },
  parameters: {
    docs: {
      description: {
        component:
          'Explains suitability strictly through the criteria the user selected. Summary is the one-line card wording; detailed restates each criterion against its known value. Unknown data is never a match, and with no active criteria the component renders nothing — no score, no health verdict.',
      },
    },
  },
} satisfies Meta<typeof MatchCriteria>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SummaryAllMet: Story = {
  name: 'Summary — all met',
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Matches all 3 filters')).toBeInTheDocument();
  },
};

export const SummaryPartial: Story = {
  name: 'Summary — partial',
  args: { criteria: partial },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Matches 1 of 3 filters')).toBeInTheDocument();
  },
};

export const Detailed: Story = {
  args: { criteria: partial, presentation: 'detailed' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('img', { name: 'Not met' })).toHaveLength(2);
    await expect(canvas.getAllByRole('img', { name: 'Met' })).toHaveLength(1);
  },
};

export const NoActiveCriteria: Story = {
  name: 'No active criteria (renders nothing)',
  args: { criteria: [] },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent?.trim()).toBe('');
  },
};
