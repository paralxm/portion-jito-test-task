import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { CameraSlash, MagnifyingGlass } from '@phosphor-icons/react';

import { Button } from '../../primitives/Button/Button';
import { expectNoHorizontalOverflow } from '../../storybook/decorators';
import { EmptyState } from './EmptyState';

const meta = {
  title: 'Components/EmptyState',
  component: EmptyState,
  args: {
    title: 'No recipes available',
    children: 'There is nothing to show yet. Use Add food below to search, scan a barcode, take a photo or enter values yourself.',
  },
  parameters: {
    docs: {
      description: {
        component:
          'An invitation to act, not a mood. `empty` is a legitimate starting point, `no-match` is a result of the current query or criteria, `failure` is a service condition — the words and actions name the cause; the layout stays the same.',
      },
    },
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const NoMatch: Story = {
  name: 'No match',
  args: {
    kind: 'no-match',
    icon: MagnifyingGlass,
    title: 'No foods match “zzzz”',
    children: 'Check the spelling or try a shorter name. You can also enter the nutrition yourself.',
    actions: <Button variant="secondary">Enter manually</Button>,
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('alert')).toBeNull();
  },
};

export const Failure: Story = {
  args: {
    kind: 'failure',
    icon: CameraSlash,
    title: 'Camera access is needed to scan',
    children: 'Allow camera access in your browser or system settings, or add the food another way.',
    actions: (
      <>
        <Button variant="primary">Search by name</Button>
        <Button variant="secondary">Enter manually</Button>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('alert')).toHaveTextContent('Camera access is needed to scan');
  },
};

export const LongContent: Story = {
  name: 'Long title and body at 320',
  args: {
    kind: 'no-match',
    icon: MagnifyingGlass,
    title: 'No recipes match “wholegrain pasta with roasted vegetables” and your filters',
    children:
      'Every recipe is compared with the query and all of your active filters at once. Try a shorter search term, or open Filters and loosen one of the criteria you set — for example the calorie range or the preparation time — to see more recipes.',
    actions: <Button variant="secondary">Change filters</Button>,
  },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/wholegrain pasta/)).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};
