import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';

import { Stack } from '../../primitives/layout/Stack';
import { MediaFrame } from './MediaFrame';

/** A clearly artificial placeholder — the repository ships no photographs. */
const placeholder =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#e4e8ec"/><circle cx="200" cy="150" r="70" fill="#c2c7cd"/><circle cx="200" cy="150" r="46" fill="#f7f8fa"/></svg>');

const meta = {
  title: 'Components/MediaFrame',
  component: MediaFrame,
  args: { aspect: '4:3', imageUrl: placeholder },
  parameters: {
    docs: {
      description: {
        component:
          'Fixed-aspect media region shared by RecipeCard (4:3 thumbnail, `compact` fallback) and recipe details (16:9 hero). A missing photo — absent, or present but failed to load — is usable loaded content: a quiet neutral fill with an image glyph and "No photo" (visible in wide frames, assistive-technology-only in compact thumbnails). Never a skeleton and never the browser broken-image icon. The details hero loads eagerly; card thumbnails lazy-load by default.',
      },
    },
  },
} satisfies Meta<typeof MediaFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CardAspect: Story = {
  name: '4:3 (card)',
  play: async ({ canvasElement }) => {
    // alt="" is deliberate (decorative, per RecipeCard's own title), so the image has
    // role "presentation" rather than "img" — queried directly instead of by role.
    const img = canvasElement.querySelector('img');
    await expect(img).not.toBeNull();
    await expect(img).toHaveAttribute('loading', 'lazy');
  },
};

export const DetailsAspect: Story = {
  name: '16:9 (details), eager',
  args: { aspect: '16:9', eager: true },
  play: async ({ canvasElement }) => {
    const img = canvasElement.querySelector('img');
    await expect(img).not.toBeNull();
    await expect(img).toHaveAttribute('loading', 'eager');
  },
};

export const NoPhoto: Story = {
  name: 'No photo',
  args: { imageUrl: undefined },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('No photo')).toBeVisible();
    await expect(within(canvasElement).queryByRole('img')).toBeNull();
  },
};

export const CompactNoPhoto: Story = {
  name: 'No photo — compact thumbnail (glyph only, words for assistive technology)',
  args: { imageUrl: undefined, compact: true },
  render: (args) => (
    <div style={{ inlineSize: 112 }}>
      <MediaFrame {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const words = within(canvasElement).getByText('No photo');
    await expect(words).toHaveClass('portion-visually-hidden');
  },
};

export const FailedImage: Story = {
  name: 'Image fails to load → same fallback, not a broken-image icon',
  args: { imageUrl: 'data:image/png;base64,not-an-image', eager: true },
  play: async ({ canvasElement }) => {
    await waitFor(async () => {
      await expect(canvasElement.querySelector('img')).toBeNull();
      await expect(within(canvasElement).getByText('No photo')).toBeVisible();
    });
    await expect(canvasElement.querySelector('[data-fallback]')).not.toBeNull();
  },
};

export const BothAspects: Story = {
  name: 'Both aspects, with and without a photo',
  render: () => (
    <Stack gap={16}>
      <MediaFrame aspect="4:3" imageUrl={placeholder} />
      <MediaFrame aspect="4:3" />
      <MediaFrame aspect="16:9" imageUrl={placeholder} eager />
      <MediaFrame aspect="16:9" />
    </Stack>
  ),
};
