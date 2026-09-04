import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Stack } from '../layout/Stack';
import { Text, type TextVariant } from './Text';

const meta = {
  title: 'Primitives/Text',
  component: Text,
  args: { children: 'Vegetable rice bowl', variant: 'body', color: 'primary' },
  parameters: {
    docs: {
      description: {
        component:
          'Every visible string renders through Text. `variant` maps to the semantic typography tokens; `as` is chosen for document semantics, never for size. `numeric` applies tabular figures for values that update or align.',
      },
    },
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

const VARIANTS: readonly TextVariant[] = [
  'main-result',
  'screen-heading',
  'detail-heading',
  'section-title',
  'compact-title',
  'action-md',
  'body',
  'label',
  'supporting',
  'action-sm',
  'caption',
  'caption-strong',
  'item-title',
  'method-title',
  'metric-inline',
  'metric-secondary',
  'wordmark',
];

export const Body: Story = {};

export const AllVariants: Story = {
  render: () => (
    <Stack gap={12}>
      {VARIANTS.map((variant) => (
        <div key={variant}>
          <Text as="p" variant="caption" color="secondary">
            {variant}
          </Text>
          <Text as="p" variant={variant} color="primary" wrap>
            {variant === 'wordmark' ? 'portion' : 'Lentil soup, 450 kcal per serving'}
          </Text>
        </div>
      ))}
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const wordmark = within(canvasElement).getByText('portion');
    const style = getComputedStyle(wordmark);
    await expect(style.fontFamily.startsWith('"Inter Variable"')).toBe(true);
    await expect(parseFloat(style.letterSpacing)).toBeLessThan(0);
  },
};

export const Numeric: Story = {
  name: 'Numeric (tabular figures)',
  render: () => (
    <Stack gap={4}>
      <Text as="p" variant="metric-secondary" numeric color="primary">
        1111 kcal
      </Text>
      <Text as="p" variant="metric-secondary" numeric color="primary">
        8888 kcal
      </Text>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const [ones, eights] = within(canvasElement).getAllByText(/kcal/);
    await expect(getComputedStyle(ones).fontVariantNumeric).toContain('tabular-nums');
    // Tabular figures: the same number of digits occupies the same width.
    await expect(Math.abs(ones.getBoundingClientRect().width - eights.getBoundingClientRect().width)).toBeLessThan(1);
  },
};

export const LongUnbrokenWord: Story = {
  args: { children: 'Supercalifragilisticexpialidociousvegetableandchickpeatraybake', variant: 'compact-title', wrap: true, as: 'p' },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    const paragraph = within(canvasElement).getByText(/Supercali/);
    await expect(paragraph.scrollWidth).toBeLessThanOrEqual(paragraph.clientWidth + 1);
  },
};
