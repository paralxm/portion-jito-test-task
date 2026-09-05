import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, within } from 'storybook/test';

import { EmptyState } from '../../components/EmptyState/EmptyState';
import { AppHeader } from '../../patterns/AppHeader/AppHeader';
import { NavigationBar } from '../../patterns/NavigationBar/NavigationBar';
import { Text } from '../../primitives/Text/Text';
import { iPhone16PortraitSafeAreas, withIPhone16PortraitSafeAreas } from '../../storybook/decorators';
import { RootScreenLayout } from './RootScreenLayout';

const meta = {
  title: 'Templates/RootScreenLayout',
  component: RootScreenLayout,
  args: {
    header: <AppHeader variant="root" title="Home" context="Today · Sep 4" />,
    navigation: <NavigationBar selected="home" onSelect={fn()} onLogFood={fn()} />,
    children: (
      <EmptyState title="Nothing logged today">Add a food or dish to review its portion and nutrition. Adding it to today is optional.</EmptyState>
    ),
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Root destination layout: header, scrolling content, optional in-flow footer and the bottom navigation, whose slot is fixed to the viewport (ledger D-26). The layout measures the bar and reserves matching bottom padding, scroll padding and the `--portion-navigation-inset` custom property, so content, focused fields and anchored feedback never sit under the bar. Header and navigation own their safe areas once.',
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
  name: 'Long content — the bar stays fixed and the content reserves its height',
  args: {
    children: Array.from({ length: 30 }, (_, i) => (
      <Text key={i} as="p" variant="body">
        Content block {i + 1}. The page scrolls normally; the navigation is reached at the end of the document rather than covering the last item.
      </Text>
    )),
  },
  globals: { viewport: { value: 'shortHeight', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole('navigation', { name: 'Main' });
    const slot = nav.parentElement as HTMLElement;
    await expect(getComputedStyle(slot).position).toBe('fixed');
    await expect(Math.round(slot.getBoundingClientRect().bottom)).toBe(window.innerHeight);
    // The content reserves at least the bar's height, and the bar has no top border.
    await expect(parseFloat(getComputedStyle(canvas.getByRole('main')).paddingBlockEnd)).toBeGreaterThanOrEqual(nav.getBoundingClientRect().height);
    await expect(getComputedStyle(nav).borderTopWidth).toBe('0px');
    await expect(getComputedStyle(document.documentElement).getPropertyValue('--portion-navigation-inset').trim()).not.toBe('0px');
  },
};

export const IPhone16PortraitSafeAreas: Story = {
  name: 'iPhone 16 portrait - header and navigation own 59/34 once',
  globals: { viewport: { value: 'iPhone16Portrait', isRotated: false } },
  decorators: [withIPhone16PortraitSafeAreas],
  play: async ({ canvasElement }) => {
    const header = canvasElement.querySelector('header') as HTMLElement;
    const navigation = within(canvasElement).getByRole('navigation', { name: 'Main' });
    await expect(parseFloat(getComputedStyle(header).paddingBlockStart)).toBe(12 + iPhone16PortraitSafeAreas.top);
    await expect(parseFloat(getComputedStyle(navigation).paddingBlockEnd)).toBe(iPhone16PortraitSafeAreas.bottom);
    const main = within(canvasElement).getByRole('main');
    await expect(parseFloat(getComputedStyle(main).paddingBlockStart)).toBe(0);
  },
};
