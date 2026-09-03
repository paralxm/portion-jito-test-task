import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Stack } from '../../primitives/layout/Stack';
import { ResultsHeading } from './ResultsHeading';

const meta = {
  title: 'Components/ResultsHeading',
  component: ResultsHeading,
  args: { id: 'results', heading: 'Matching recipes', summary: '3 recipes match your filters', countText: '3 recipes match your filters' },
  parameters: {
    docs: {
      description: {
        component:
          'A results section\'s heading: a visible title, a screen-reader-only live summary and a visible secondary count line. Shared by every screen that lists search or browse results, so the announcement behaviour never drifts between them. Loading and failure states announce themselves elsewhere — pass an empty `summary` while either is active.',
      },
    },
  },
} satisfies Meta<typeof ResultsHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 2, name: 'Matching recipes' })).toBeInTheDocument();
    const status = canvas.getByRole('status', { name: 'Results summary' });
    await expect(status).toHaveTextContent('3 recipes match your filters');
    // The visible count line is a separate, non-live paragraph — announced once, shown always.
    await expect(canvas.getByText('3 recipes match your filters', { selector: 'p:not([role])' })).toBeInTheDocument();
  },
};

export const NoCountYet: Story = {
  name: 'No count line yet (idle)',
  args: { summary: '', countText: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The heading itself still renders — only the live summary and the visible count line are empty.
    await expect(canvas.getByRole('heading', { level: 2 })).toBeInTheDocument();
    await expect(canvas.getByRole('status', { name: 'Results summary' })).toHaveTextContent('');
    await expect(canvas.queryByText('3 recipes match your filters')).toBeNull();
  },
};

export const Hidden: Story = {
  name: 'Hidden while idle',
  args: { hidden: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('heading')).toBeNull();
  },
};

export const BothScreensShape: Story = {
  name: 'Recipes and Search shapes',
  render: () => (
    <Stack gap={24}>
      <ResultsHeading id="recipes-results" heading="All recipes" summary="5 recipes" countText="5 recipes" />
      <ResultsHeading id="search-results" heading="Results" summary="1 food found" countText="1 food found" />
    </Stack>
  ),
};
