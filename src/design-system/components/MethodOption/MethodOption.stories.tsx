import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Barcode, Camera, MagnifyingGlass, PencilSimple } from '@phosphor-icons/react';

import { expectNoHorizontalOverflow } from '../../storybook/decorators';
import { MethodOption } from './MethodOption';

const meta = {
  title: 'Components/MethodOption',
  component: MethodOption,
  args: { icon: MagnifyingGlass, title: 'Search food', description: 'Find a product, brand or dish', onClick: fn() },
  parameters: {
    docs: {
      description: {
        component: `
**Purpose.** One entry-method choice inside the Log food sheet (O01, after R6). The whole surface is the single control; selecting it starts that method's journey and never commits food data.

**Anatomy.** A \`button\` with a 24 px Phosphor glyph on a 40 px tinted tile, a method title (method-title 16/24), a one-line description (supporting 14/20) and a trailing chevron cue. No nested controls, no selected/radio state.

**Presentations.** \`row\` (default): tile, text and chevron on one full-width row. \`card\`: glyph and chevron on the first line, the text beneath, stretching to its pair's height. \`tone="quiet"\`: no tint and no fill, for the secondary method at the end of the sheet.

**States.** rest, hover (pointer only: sunken fill + control boundary), pressed, focus-visible (3 px ring). No disabled state: every method is always available.
        `,
      },
    },
  },
} satisfies Meta<typeof MethodOption>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Row: Story = {
  name: 'Row (default)',
  render: (args) => (
    <div style={{ inlineSize: 358 }}>
      <MethodOption {...args} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const option = within(canvasElement).getByRole('button', { name: /Search food/ });
    await expect(option.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
    await expect(option.getAttribute('data-presentation')).toBe('row');
    await userEvent.click(option);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const Card: Story = {
  name: 'Card — the camera pair',
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, inlineSize: 358 }}>
      <MethodOption presentation="card" icon={Barcode} title="Scan barcode" description="For packaged food" />
      <MethodOption presentation="card" icon={Camera} title="Take a photo" description="Meals and plated dishes" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [a, b] = within(canvasElement).getAllByRole('button');
    await expect(Math.abs(a.getBoundingClientRect().height - b.getBoundingClientRect().height)).toBeLessThan(1);
    await expect(a.getAttribute('data-presentation')).toBe('card');
  },
};

export const Quiet: Story = {
  name: 'Quiet row — the secondary method',
  args: { icon: PencilSimple, title: 'Enter manually', description: 'Use known label values or your own', tone: 'quiet' },
  render: (args) => (
    <div style={{ inlineSize: 358 }}>
      <MethodOption {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const option = within(canvasElement).getByRole('button', { name: /Enter manually/ });
    await expect(option.getAttribute('data-tone')).toBe('quiet');
  },
};

export const LongLabelsAt320: Story = {
  name: 'Long labels at 320',
  args: { title: 'Search the whole product catalogue by name', description: 'Type part of a name and choose the closest matching product or dish from the results' },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  render: (args) => (
    <div style={{ inlineSize: 140 }}>
      <MethodOption {...args} presentation="card" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const option = within(canvasElement).getByRole('button');
    await expect(option.scrollWidth).toBeLessThanOrEqual(option.clientWidth + 1);
    await expectNoHorizontalOverflow();
  },
};
