import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { PhotoField, type PhotoDraft } from './PhotoField';

function Harness({ initial = null }: { initial?: PhotoDraft | null }) {
  const [value, setValue] = useState<PhotoDraft | null>(initial);
  return (
    <div style={{ inlineSize: 360 }}>
      <PhotoField value={value} onChange={setValue} />
    </div>
  );
}

/** A small valid PNG (1 × 1) as a File, so the preview path runs without a real camera roll. */
function pngFile(name = 'lunch.png'): File {
  const bytes = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0));
  return new File([bytes], name, { type: 'image/png' });
}

const meta = {
  title: 'Components/PhotoField',
  component: PhotoField,
  args: { value: null, onChange: fn() },
  parameters: {
    docs: {
      description: {
        component:
          'The optional photo of a manually entered food (ledger §12 D1): a local file validated by type (JPEG, PNG, WebP, HEIC) and size (8 MB), previewed at 4:3 with Change photo and Remove. The image is the user’s own data: never uploaded, never used to infer nutrition, kept only as a small bounded preview once the entry is logged. The native file input stays in the document for the keyboard and assistive technology.',
      },
    },
  },
} satisfies Meta<typeof PhotoField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Add a photo' })).toBeVisible();
    await expect(canvas.getByText(/Stays on this device/)).toBeVisible();
  },
};

export const ChooseChangeRemove: Story = {
  name: 'Choose, change and remove a photo',
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText(/Photo/) as HTMLInputElement;
    await userEvent.upload(input, pngFile());
    await expect(await canvas.findByRole('img', { name: 'Your photo, lunch.png' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Change photo' })).toBeVisible();
    await userEvent.upload(input, pngFile('dinner.png'));
    await expect(await canvas.findByRole('img', { name: 'Your photo, dinner.png' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Remove' }));
    await expect(canvas.getByRole('button', { name: 'Add a photo' })).toBeVisible();
  },
};

export const Rejected: Story = {
  name: 'Unsupported type and oversized file are refused with a reason',
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText(/Photo/) as HTMLInputElement;
    await userEvent.upload(input, new File(['gif'], 'a.gif', { type: 'image/gif' }), { applyAccept: false });
    await expect(await canvas.findByText('Choose a JPEG, PNG, WebP or HEIC image.')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Add a photo' })).toBeVisible();
    const big = new File([new Uint8Array(9 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });
    await userEvent.upload(input, big);
    await expect(await canvas.findByText('Choose an image under 8 MB.')).toBeVisible();
  },
};
