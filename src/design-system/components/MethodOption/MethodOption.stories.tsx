import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Barcode, Camera, MagnifyingGlass, PencilSimple } from '@phosphor-icons/react';

import { expectNoHorizontalOverflow, withRootFontSize } from '../../storybook/decorators';
import { MethodOption } from './MethodOption';

const meta = {
  title: 'Components/MethodOption',
  component: MethodOption,
  args: { icon: MagnifyingGlass, title: 'Search food', description: 'Find a product or dish', onClick: fn() },
  parameters: {
    docs: {
      description: {
        component: `
**Purpose.** One entry-method choice inside the Add food sheet (O01). The whole surface is the single control; selecting it starts that method's journey and never commits food data.

**Anatomy.** A \`button\` containing a 24 px Phosphor glyph in the action colour, a method title (method-title 16/24) and a one-line description (supporting 14/20). No chevron, no nested controls, no selected/radio state — the contract says choosing a method acts immediately.

**Layout.** Tile by default (icon above text) on the light surface with the card radius. Inside the sheet's named \`method-grid\` container narrower than 20 rem, the same element turns into a row (icon beside text). The condition is container width, not viewport width, so the adaptation is deterministic: 320 px viewports at 100 % text and every supported width at 200 % text render rows.

**States.** rest, hover (pointer only: sunken fill + control boundary), pressed (same), focus-visible (3 px ring). There is no disabled state: every method is always available in this product, so none is drawn.

**Token usage.** \`radius-card\`, \`background-surface\` / \`background-sunken\`, \`border-decorative\` / \`border-control\`, \`action-primary\` (glyph), \`spacing-card-padding\`, \`spacing-icon-to-label\`, \`spacing-title-to-secondary\`.
        `,
      },
    },
  },
} satisfies Meta<typeof MethodOption>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tile: Story = {
  name: 'Tile (default)',
  render: (args) => (
    <div style={{ inlineSize: 171 }}>
      <MethodOption {...args} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const option = within(canvasElement).getByRole('button', { name: /Search food/ });
    await expect(option.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
    await expect(getComputedStyle(option).flexDirection).toBe('column');
    await userEvent.click(option);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const RowInNarrowContainer: Story = {
  name: 'Row — inside a method-grid container under 20 rem',
  render: (args) => (
    <div style={{ inlineSize: 288, containerType: 'inline-size', containerName: 'method-grid' }}>
      <MethodOption {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const option = within(canvasElement).getByRole('button', { name: /Search food/ });
    await expect(getComputedStyle(option).flexDirection).toBe('row');
    await expect(option.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
  },
};

export const AllFourMethods: Story = {
  name: 'All four methods, contract order',
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
      <MethodOption icon={MagnifyingGlass} title="Search food" description="Find a product or dish" />
      <MethodOption icon={Barcode} title="Scan barcode" description="For packaged food" />
      <MethodOption icon={Camera} title="Take a photo" description="Review suggested matches" />
      <MethodOption icon={PencilSimple} title="Enter manually" description="Use known label values" />
    </div>
  ),
};

export const LongLabelsAt320: Story = {
  name: 'Long labels at 320',
  args: { title: 'Search the whole product catalogue by name', description: 'Type part of a name and choose the closest matching product or dish from the results' },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  render: (args) => (
    <div style={{ inlineSize: 140 }}>
      <MethodOption {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const option = within(canvasElement).getByRole('button');
    await expect(option.scrollWidth).toBeLessThanOrEqual(option.clientWidth + 1);
    await expectNoHorizontalOverflow();
  },
};

export const FocusVisible: Story = {
  name: 'Keyboard focus-visible',
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    const option = within(canvasElement).getByRole('button', { name: /Search food/ });
    await expect(document.activeElement).toBe(option);
    const style = getComputedStyle(option);
    await expect(style.outlineStyle).toBe('solid');
    await expect(parseFloat(style.outlineWidth)).toBe(3);
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 200 %',
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: /Search food/ })).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};
