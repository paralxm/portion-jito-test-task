import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { expectNoHorizontalOverflow, withRootFontSize } from '../../design-system/storybook/decorators';
import { barcodeCatalogue } from '../../features/calorie-calculator/domain/fixtures';
import { BarcodeScreen, type BarcodePhase } from '../../features/calorie-calculator/screens/BarcodeScreen';
import { FoodReviewScreen } from '../../features/calorie-calculator/screens/FoodReviewScreen';
import { BARCODE } from './stateFixtures';

/** A lookup that never resolves: the pending state stays on screen for inspection. */
const pendingLookup = () => new Promise<never>(() => {});

const meta = {
  title: 'Product states/Lane C1 — Barcode acquisition',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Low-fi lane C1 (178:2): reading, lookup and four distinct failures, the app-side state behind the system permission prompt (P01), and review of a matched product. Each phase is set through the screen’s `initialPhase` test-harness prop; in the runtime the same phases follow a real (simulated) read.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const barcode = (initialPhase: BarcodePhase, lookup: BarcodeScreenLookup = pendingLookup) => (
  <BarcodeScreen lookup={lookup} demoCodes={BARCODE} onFound={fn()} onBack={fn()} onSearchInstead={fn()} onEnterManually={fn()} initialPhase={initialPhase} />
);
type BarcodeScreenLookup = Parameters<typeof BarcodeScreen>[0]['lookup'];

export const S04_1: Story = {
  name: 'S04-1 · 178:5 — Barcode / Scanning',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: the live scan region with guidance; the other methods stay reachable. Entry: Scan barcode from O01 with camera access. Fixture: scanning phase. Primary action: a read → S04-2. Next: S04-2 / S04-3. Limitation: the prototype has no camera, so reads come from the labelled prototype controls.',
      },
    },
  },
  render: () => barcode({ kind: 'scanning' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Scan barcode' })).toBeInTheDocument();
    await expect(canvas.getByText('Point the camera at the product barcode')).toBeVisible();
    await expect(canvas.queryByRole('navigation')).toBeNull();
  },
};

export const S04_2: Story = {
  name: 'S04-2 · 178:20 — Barcode / Code read · lookup pending',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: a real progress indicator while capture is paused; reading a code is not finding a product. Entry: a code was read. Fixture: code 5012345678900, lookup pending (never resolves here). Primary action: none; Back cancels and ignores a late response. Next: S07-4 / S04-4 / S04-5. Limitation: frozen pending state.',
      },
    },
  },
  render: () => barcode({ kind: 'looking-up', code: BARCODE.found }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status')).toHaveTextContent('Looking up product');
    await expect(canvas.getByText(/Scanning is paused/)).toBeVisible();
  },
};

export const S04_3: Story = {
  name: 'S04-3 · 178:31 — Barcode / Code not readable',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: guidance grows and rescanning continues; no lookup was attempted, so this is not a retry. Entry: an unreadable read. Fixture: unreadable phase. Primary action: Try again → S04-1. Secondary: Enter manually → S06-1. Limitation: none.',
      },
    },
  },
  render: () => barcode({ kind: 'unreadable' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status')).toHaveTextContent('The barcode could not be read');
    await expect(canvas.getByRole('button', { name: 'Try again' })).toBeVisible();
  },
};

export const S04_4: Story = {
  name: 'S04-4 · 178:47 — Barcode / Product not found',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: the code read correctly but no product matched; search or manual entry take over and rescan is the lesser option. Entry: lookup returned not-found. Fixture: code 4009999999990. Primary action: Scan again / Search by name / Enter manually. Limitation: none.',
      },
    },
  },
  render: () => barcode({ kind: 'not-found', code: BARCODE.unknown }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('alert')).toHaveTextContent('Product not found');
    await expect(canvas.getByRole('alert')).toHaveTextContent(BARCODE.unknown);
    await expect(canvas.getByRole('button', { name: 'Search by name' })).toBeVisible();
  },
};

export const S04_5: Story = {
  name: 'S04-5 · 178:65 — Barcode / Lookup service failure',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: a service failure distinct from “product not found”; the code is kept for a retry. Entry: lookup failed. Fixture: code 0000000000000. Primary action: Retry lookup → S04-2 for the same code. Secondary: Enter manually. Limitation: none.',
      },
    },
  },
  render: () => barcode({ kind: 'lookup-failed', code: BARCODE.failing }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('alert')).toHaveTextContent('Lookup failed');
    await expect(canvas.getByRole('button', { name: 'Retry lookup' })).toBeVisible();
  },
};

export const P01: Story = {
  name: 'P01 · 178:81 — Conceptual system permission request (app side)',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: the app’s state while the system camera prompt is showing — requested when the camera action needs it, never at launch. Entry: first camera use. Fixture: permission-pending phase. Primary action: the system prompt (not drawn); Search by name / Enter manually stay available. Next: S04-1 (allowed) or S04-6 (denied). Limitation: the web prototype has no camera and cannot show a real prompt; no OS chrome is drawn (ledger D-6).',
      },
    },
  },
  render: () => barcode({ kind: 'permission-pending' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Waiting for camera permission')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Enter manually' })).toBeVisible();
    await expect(canvas.queryByRole('dialog')).toBeNull();
  },
};

export const S04_6: Story = {
  name: 'S04-6 · 178:94 — Barcode / Camera access denied',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: denial keeps search and manual entry available, with a settings hint and no repeated prompting. Entry: permission denied. Fixture: denied phase. Primary action: Search by name → S02 Food. Secondary: Enter manually. Limitation: none.',
      },
    },
  },
  render: () => barcode({ kind: 'denied' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('alert')).toHaveTextContent('Camera access is needed to scan');
    await expect(canvas.getByRole('button', { name: 'Search by name' })).toBeVisible();
  },
};

export const S07_4: Story = {
  name: 'S07-4 · 178:109 — Food review / From barcode',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: the same review step with the scanned source shown and correction emphasised before anything is added. Entry: lookup found a product. Fixture: Oat drink, unsweetened, 43 kcal per 100 ml. Primary action: Add to today. Secondary: Change food → search; Done; Back → the paused scanner. Limitation: none.',
      },
    },
  },
  render: () => <FoodReviewScreen candidate={barcodeCatalogue[BARCODE.found]} mode="new" onBack={fn()} onChangeMatch={fn()} onAddToToday={fn()} onDone={fn()} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Matched from the barcode/)).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Change food' })).toBeVisible();
    await expect(canvas.getByText('43')).toBeVisible();
  },
};

export const S04_1_Narrow320: Story = {
  name: 'S04-1 at 320',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  render: () => barcode({ kind: 'scanning' }),
  play: async () => {
    await expectNoHorizontalOverflow();
  },
};

export const S04_4_EnlargedText: Story = {
  name: 'S04-4 at 200 % text — every recovery action still reachable',
  decorators: [withRootFontSize(200)],
  render: () => barcode({ kind: 'not-found', code: BARCODE.unknown }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Enter manually' })).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};
