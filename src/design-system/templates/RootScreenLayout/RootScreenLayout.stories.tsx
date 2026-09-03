import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, within } from 'storybook/test';

import { EmptyState } from '../../components/EmptyState/EmptyState';
import { AppHeader } from '../../patterns/AppHeader/AppHeader';
import { NavigationBar } from '../../patterns/NavigationBar/NavigationBar';
import { Text } from '../../primitives/Text/Text';
import { RootScreenLayout } from './RootScreenLayout';

const meta = {
  title: 'Templates/RootScreenLayout',
  component: RootScreenLayout,
  args: {
    header: <AppHeader title="Home" showWordmark />,
    navigation: <NavigationBar selected="home" onSelect={fn()} onAddFood={fn()} />,
    children: (
      <EmptyState title="Nothing calculated yet">Add a food or dish to see the calories and nutrition for the amount you choose.</EmptyState>
    ),
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Root destination layout: header, scrolling content, optional in-flow footer and the bottom navigation. The column fills the viewport height so the bar sits at the bottom on tall screens and follows the content on short ones. Nothing is fixed over content.',
      },
    },
  },
} satisfies Meta<typeof RootScreenLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('main')).toBeInTheDocument();
    await expect(canvas.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Home');
  },
};

export const LongContent: Story = {
  name: 'Long content — bar follows the content',
  args: {
    children: Array.from({ length: 30 }, (_, i) => (
      <Text key={i} as="p" variant="body">
        Content block {i + 1}. The page scrolls normally; the navigation is reached at the end of the document rather than covering the last item.
      </Text>
    )),
  },
  globals: { viewport: { value: 'shortHeight', isRotated: false } },
};
