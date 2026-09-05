import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { expectNoHorizontalOverflow, withRootFontSize } from '../../../design-system/storybook/decorators';
import { barcodeCatalogue } from '../domain/fixtures';
import { BarcodeScreen, type BarcodeLookupResult } from './BarcodeScreen';

const CODES = { found: '5012345678900', unknown: '4009999999990', failing: '0000000000000' };

/** A camera that never reads: the scanning state stays on screen for inspection. */
const neverReads = () => new Promise<string>(() => {});
/** The prototype camera, shortened: reads the sample code after 60 ms. */
const readsSample = async () => {
  await new Promise((resolve) => setTimeout(resolve, 60));
  return CODES.found;
};

const lookup = async (code: string): Promise<BarcodeLookupResult> => {
  await new Promise((resolve) => setTimeout(resolve, 60));
  if (code === CODES.failing) return { kind: 'failed' };
  const candidate = barcodeCatalogue[code];
  return candidate ? { kind: 'found', candidate } : { kind: 'not-found' };
};

const meta = {
  title: 'Product compositions/Barcode (S04)',
  component: BarcodeScreen,
  args: { read: neverReads, lookup, onFound: fn(), onBack: fn(), onSearchInstead: fn(), onEnterManually: fn() },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'S04 — the dark camera stage with focus corners, a text status chip and the scan line while scanning; the scanner pauses after one read and looks a product up once. Unreadable code, unknown product, failed lookup and camera denial are separate states with cause-specific recovery, reached here through `initialPhase` — there are no simulator controls in the product (ledger D-24). There is no camera in this prototype: the runtime reads a sample barcode after a moment and says so.',
      },
    },
  },
} satisfies Meta<typeof BarcodeScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Scanning: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Point the camera at the barcode')).toBeInTheDocument();
    await expect(canvas.getByText('Scanning')).toBeVisible();
    await expect(canvasElement.querySelector('[class*="scanLine"]')).not.toBeNull();
    await expect(canvas.queryByRole('navigation')).toBeNull();
    await expect(canvas.queryByText(/Simulate/)).toBeNull();
  },
};

export const MatchedProduct: Story = {
  name: 'Sample read → lookup → review',
  args: { read: readsSample },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole('status')).toHaveTextContent('Looking up product');
    await expect(canvas.getByText('Code read')).toBeVisible();
    // The scan line stops once a code is read.
    await expect(canvasElement.querySelector('[class*="scanLine"]')).toBeNull();
    await new Promise((resolve) => setTimeout(resolve, 150));
    await expect(args.onFound).toHaveBeenCalledTimes(1);
    await expect(canvas.getByRole('button', { name: 'Scan again' })).toBeInTheDocument();
  },
};

export const ProductNotFound: Story = {
  name: 'Product not found — read succeeded, catalogue miss',
  args: { initialPhase: { kind: 'not-found', code: CODES.unknown } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('alert')).toHaveTextContent('Product not found');
    await expect(canvas.getByRole('alert')).toHaveTextContent('read correctly');
    await expect(canvas.getByRole('alert')).toHaveTextContent(CODES.unknown);
    await userEvent.click(canvas.getByRole('button', { name: 'Search by name' }));
    await expect(args.onSearchInstead).toHaveBeenCalledTimes(1);
  },
};

export const LookupFailed: Story = {
  name: 'Lookup failed → retry the same code',
  args: { initialPhase: { kind: 'lookup-failed', code: CODES.failing } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('alert')).toHaveTextContent('Lookup failed');
    await userEvent.click(canvas.getByRole('button', { name: 'Retry lookup' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Looking up product');
  },
};

export const Unreadable: Story = {
  name: 'Unreadable code',
  args: { initialPhase: { kind: 'unreadable' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status')).toHaveTextContent('The barcode could not be read');
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
    await expect(canvas.getByText('Point the camera at the barcode')).toBeInTheDocument();
  },
};

export const CameraDenied: Story = {
  name: 'Camera denied',
  args: { initialPhase: { kind: 'denied' } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('alert')).toHaveTextContent('Camera access is needed to scan');
    await expect(canvas.getByRole('alert')).toHaveTextContent('browser settings');
    await expect(canvas.queryByRole('button', { name: /Open settings/ })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Enter manually' }));
    await expect(args.onEnterManually).toHaveBeenCalledTimes(1);
  },
};

export const ReducedMotion: Story = {
  name: 'Reduced motion — no scan-line animation',
  decorators: [
    (Story) => (
      <div data-portion-motion="reduced">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const line = canvasElement.querySelector('[class*="scanLine"]') as HTMLElement;
    await expect(getComputedStyle(line).animationName).toBe('none');
  },
};

export const Narrow320: Story = {
  name: 'Narrow — 320',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Point the camera at the barcode')).toBeInTheDocument();
    await expectNoHorizontalOverflow();
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 200 %',
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Point the camera at the barcode')).toBeInTheDocument();
    await expectNoHorizontalOverflow();
  },
};
