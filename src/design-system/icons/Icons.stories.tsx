import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Calculator, MagnifyingGlass } from '@phosphor-icons/react';

import { Inline } from '../primitives/layout/Inline';
import { Stack } from '../primitives/layout/Stack';
import { Text } from '../primitives/Text/Text';
import { iconCatalogue, iconGroups } from './catalogue';
import { Icon, type IconSize } from './Icon';

const meta = {
  title: 'Foundations/Icons',
  component: Icon,
  args: { icon: MagnifyingGlass },
  parameters: {
    docs: {
      description: {
        component:
          'Official Phosphor glyphs from `@phosphor-icons/react`, rendered only through `Icon`. Regular is the default weight; bold is reserved for the persistently selected navigation destination; there is no “medium” weight in the package. Sizes come from the semantic size tokens; a 24 px glyph sits inside a target of at least 48 × 48 CSS px. The catalogue below is Storybook-only and is not exported from the design-system entry point.',
      },
    },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

const SIZES: IconSize[] = ['compact', 'small-action', 'default', 'emphasis', 'empty-state', 'large-illustrative'];

export const SizesAndWeights: Story = {
  name: 'Sizes and weights',
  render: () => (
    <Stack gap={24}>
      <div>
        <Text as="p" variant="label">
          Size roles
        </Text>
        <Inline gap={16} align="end" wrap>
          {SIZES.map((size) => (
            <Stack key={size} gap={4} align="center" block={false}>
              <Icon icon={MagnifyingGlass} size={size} />
              <Text variant="caption" color="secondary">
                {size}
              </Text>
            </Stack>
          ))}
        </Inline>
      </div>
      <div>
        <Text as="p" variant="label">
          Weights (regular default · bold only for selected navigation · fill where a solid glyph is the official form)
        </Text>
        <Inline gap={16} wrap>
          <Icon icon={Calculator} weight="regular" label="Calculator, regular" />
          <Icon icon={Calculator} weight="bold" label="Calculator, bold" />
          <Icon icon={Calculator} weight="fill" label="Calculator, fill" />
        </Inline>
      </div>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const glyph = within(canvasElement).getByRole('img', { name: 'Calculator, regular' });
    await expect(glyph.getAttribute('width')).toContain('var(--portion-size-icon-default)');
  },
};

export const Catalogue: Story = {
  render: () => (
    <Stack gap={24}>
      <Text as="p" variant="supporting" color="secondary">
        {iconCatalogue.length} verified glyphs in {iconGroups.length} groups.
      </Text>
      {iconGroups.map((group) => (
        <section key={group}>
          <Text as="h2" variant="section-title">
            {group}
          </Text>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
            {iconCatalogue
              .filter((entry) => entry.group === group)
              .map((entry) => (
                <li key={entry.name} data-icon={entry.name} style={{ display: 'grid', gridTemplateColumns: '48px minmax(0, 1fr)', gap: 8, alignItems: 'start' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', inlineSize: 48, blockSize: 48, border: '1px solid var(--portion-color-border-decorative)', borderRadius: 8 }}>
                    <Icon icon={entry.icon} />
                  </span>
                  <span>
                    <Text as="span" variant="label" wrap>
                      {entry.name}
                    </Text>
                    <br />
                    <Text as="span" variant="caption" color="secondary" wrap>
                      {entry.use}
                    </Text>
                  </span>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    await expect(iconCatalogue.length).toBeGreaterThanOrEqual(80);
    const items = canvasElement.querySelectorAll('[data-icon]');
    await expect(items.length).toBe(iconCatalogue.length);
    for (const item of items) {
      await expect(item.querySelector('svg')).not.toBeNull();
    }
  },
};
