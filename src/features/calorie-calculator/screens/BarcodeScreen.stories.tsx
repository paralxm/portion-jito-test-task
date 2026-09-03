import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { barcodeCatalogue } from '../domain/fixtures';
import { BarcodeScreen, type BarcodeLookupResult } from './BarcodeScreen';

const demoCodes = { found: '5012345678900', unknown: '4009999999990', failing: '0000000000000' };

const lookup = async (code: string): Promise<BarcodeLookupResult> => {
  await new Promise((resolve) => setTimeout(resolve, 60));
  if (code === demoCodes.failing) return { kind: 'failed' };
  const candidate = barcodeCatalogue[code];
  return candidate ? { kind: 'found', candidate } : { kind: 'not-found' };
};

const meta = {
  title: 'Product compositions/Barcode (S04)',
  component: BarcodeScreen,
  args: { lookup, demoCodes, onFound: fn(), onBack: fn(), onSearchInstead: fn(), onEnterManually: fn() },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'S04 — the scanner pauses after one read and looks a product up once. Unreadable code, unknown product, failed lookup and camera denial are separate states with cause-specific recovery. There is no camera in this prototype; the labelled prototype controls simulate what a scan would produce.',
      },
    },
  },
} satisfies Meta<typeof BarcodeScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Scanning: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Point the camera at the product barcode')).toBeInTheDocument();
    await expect(within(canvasElement).queryByRole('navigation')).toBeNull();
  },
};

export const MatchedProduct: Story = {
  name: 'Matched product → review',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Simulate a matched product' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Looking up product');
    await new Promise((resolve) => setTimeout(resolve, 150));
    await expect(args.onFound).toHaveBeenCalledTimes(1);
    await expect(canvas.getByRole('button', { name: 'Scan again' })).toBeInTheDocument();
  },
};

export const ProductNotFound: Story = {
  name: 'Product not found',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Simulate an unknown product' }));
    await new Promise((resolve) => setTimeout(resolve, 150));
    await expect(canvas.getByRole('alert')).toHaveTextContent('Product not found');
    await expect(canvas.getByRole('alert')).toHaveTextContent('4009999999990');
    await userEvent.click(canvas.getByRole('button', { name: 'Search by name' }));
    await expect(args.onSearchInstead).toHaveBeenCalledTimes(1);
  },
};

export const LookupFailed: Story = {
  name: 'Lookup failed → retry the same code',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Simulate a failed lookup' }));
    await new Promise((resolve) => setTimeout(resolve, 150));
    await expect(canvas.getByRole('alert')).toHaveTextContent('Lookup failed');
    await userEvent.click(canvas.getByRole('button', { name: 'Retry lookup' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Looking up product');
  },
};

export const Unreadable: Story = {
  name: 'Unreadable code',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Simulate an unreadable code' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('The barcode could not be read');
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
    await expect(canvas.getByText('Point the camera at the product barcode')).toBeInTheDocument();
  },
};

export const CameraDenied: Story = {
  name: 'Camera denied',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Simulate camera denied' }));
    await expect(canvas.getByRole('alert')).toHaveTextContent('Camera access is needed to scan');
    await userEvent.click(canvas.getByRole('button', { name: 'Enter manually' }));
    await expect(args.onEnterManually).toHaveBeenCalledTimes(1);
  },
};
