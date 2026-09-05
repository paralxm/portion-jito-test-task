import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { expectNoHorizontalOverflow, withRootFontSize } from '../../design-system/storybook/decorators';
import { samplePhotoImage } from '../../features/calorie-calculator/domain/fixtures';
import { FoodReviewScreen } from '../../features/calorie-calculator/screens/FoodReviewScreen';
import { PhotoScreen, type PhotoPhase } from '../../features/calorie-calculator/screens/PhotoScreen';
import { photoCandidates, photoPartialSuggestion } from './stateFixtures';

/** An analysis that never resolves: the analysing state stays on screen for inspection. */
const pendingAnalysis = () => new Promise<never>(() => {});

const meta = {
  title: 'Product states/Lane C2 — Photo acquisition',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Low-fi lane C2 (179:2): capture, preview, analysis with cancellation, suggestions with an explicit selection mark, the no-usable-match and failure states, and review of a suggestion as an estimate. Phases are set through `initialPhase`; the runtime reaches them through the simulated capture and analysis. The captured frame is a licensed sample photograph labelled as a sample.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const photo = (initialPhase: PhotoPhase) => (
  <PhotoScreen analyse={pendingAnalysis} sampleImageUrl={samplePhotoImage} onSuggestionChosen={fn()} onBack={fn()} onSearchInstead={fn()} onEnterManually={fn()} initialPhase={initialPhase} />
);

export const S05_1: Story = {
  name: 'S05-1 · 179:5 — Photo / Capture',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: framing guidance and a shutter; exit is always present. Entry: Take a photo from O01 with camera access. Fixture: capture phase. Primary action: Take photo → S05-2. Limitation: the prototype has no camera; the shutter produces the labelled sample photograph.',
      },
    },
  },
  render: () => photo({ kind: 'capture' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Take a photo' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Take photo' })).toBeVisible();
    await expect(canvas.queryByRole('navigation')).toBeNull();
  },
};

export const S05_2: Story = {
  name: 'S05-2 · 179:12 — Photo / Preview',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: the captured frame with Retake and Analyse; nothing is analysed until asked. Entry: after the shutter. Fixture: the sample photograph. Primary action: Analyse photo → S05-3. Secondary: Retake → S05-1. Limitation: none.',
      },
    },
  },
  render: () => photo({ kind: 'preview', imageId: 'sample-1' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('img', { name: /Sample image/ })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Analyse photo' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Retake' })).toBeVisible();
  },
};

export const S05_3: Story = {
  name: 'S05-3 · 179:21 — Photo / Analysing',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: real progress with cancellation; the image is retained and a cancelled analysis never opens a stale result. Entry: Analyse pressed. Fixture: analysing phase (never resolves here). Primary action: Cancel → S05-2. Next: S05-4 / S05-5 / S05-6. Limitation: frozen pending state.',
      },
    },
  },
  render: () => photo({ kind: 'analysing', imageId: 'sample-1' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status')).toHaveTextContent('Analysing photo');
    await expect(canvas.getByRole('button', { name: 'Cancel' })).toBeVisible();
  },
};

export const S05_4: Story = {
  name: 'S05-4 · 179:31 — Photo / Suggested matches',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: several suggestions with an explicit selection mark; none is auto-accepted. Entry: analysis returned suggestions. Fixture: three suggestions; the play function marks Lentil soup so the selected treatment is visible. Primary action: Review selected match → S07-5 (disabled until a choice). Secondary: None of these → Retake / Search by name / Enter manually. Limitation: none (ledger D-3).',
      },
    },
  },
  render: () => photo({ kind: 'suggestions', imageId: 'sample-1', candidates: [...photoCandidates] }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const review = canvas.getByRole('button', { name: 'Review selected match' });
    await expect(review).toBeDisabled();
    await userEvent.click(canvas.getByRole('radio', { name: /Lentil soup/ }));
    await expect(canvas.getByRole('radio', { name: /Lentil soup/ })).toBeChecked();
    await expect(review).toBeEnabled();
    await expect(canvas.getByRole('button', { name: 'None of these' })).toBeVisible();
  },
};

export const S05_5: Story = {
  name: 'S05-5 · 179:57 — Photo / No usable match',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: the photo produced nothing usable and no nutrition is invented. Entry: analysis returned zero suggestions. Fixture: empty suggestion list. Primary action: Retake photo → S05-1. Secondary: Search by name / Enter manually. Limitation: story-only — the prototype analyser always returns fixed suggestions (ledger D-9).',
      },
    },
  },
  render: () => photo({ kind: 'suggestions', imageId: 'sample-1', candidates: [] }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('No food was recognised')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Retake photo' })).toBeVisible();
  },
};

export const S05_6: Story = {
  name: 'S05-6 · 179:70 — Photo / Analysis failure',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: a service failure keeps the image and offers retry — a different cause from an unusable image. Entry: analysis failed. Fixture: failed phase. Primary action: Try again → S05-3 with the same image. Secondary: Retake / Search by name / Enter manually. Limitation: none.',
      },
    },
  },
  render: () => photo({ kind: 'failed', imageId: 'sample-1' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('alert')).toHaveTextContent('Analysis failed');
    await expect(canvas.getByRole('img', { name: /Sample image/ })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Try again' })).toBeVisible();
  },
};

export const S07_5: Story = {
  name: 'S07-5 · 179:81 — Food review / From photo · estimate',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: the photo result in the R5 hierarchy (ledger §12 E2): the captured frame — in this prototype a labelled sample photograph, never a catalogue product photo — the selected identity, the source stated as a suggestion the user must check, then the portion, meal and one final action; unknown macros stay unknown, never zero. Entry: Review selected match. Fixture: a suggested food with partial nutrition. Primary action: Add to {meal}. Secondary: Change match → S05-4 with the selection kept; Retake photo → S05-1; Edit nutrition values → S06-4; Cancel. Limitation: none.',
      },
    },
  },
  render: () => <FoodReviewScreen candidate={photoPartialSuggestion} mode="new" initialMeal="lunch" capturedImageUrl={samplePhotoImage} onBack={fn()} onCancel={fn()} onChangeMatch={fn()} onRetake={fn()} onEditValues={fn()} onAdd={fn()} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Photo suggestion')).toBeVisible();
    await expect(canvas.getByRole('img', { name: /Sample photograph/ })).toBeVisible();
    await expect(canvas.getByText(/the photo does not measure the amount/)).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Change match' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Retake photo' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Edit nutrition values' })).toBeVisible();
    await expect(canvas.queryByText(/Barcode/)).toBeNull();
    const visible = canvas.getAllByText('Not available').filter((el) => !el.classList.contains('portion-visually-hidden'));
    await expect(visible.length).toBeGreaterThanOrEqual(2);
    await expect(canvas.queryByText(/\b0 g\b/)).toBeNull();
  },
};

export const S05_4_Narrow320: Story = {
  name: 'S05-4 at 320',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  render: () => photo({ kind: 'suggestions', imageId: 'sample-1', candidates: [...photoCandidates] }),
  play: async () => {
    await expectNoHorizontalOverflow();
  },
};

export const S05_4_EnlargedText: Story = {
  name: 'S05-4 at 200 % text',
  decorators: [withRootFontSize(200)],
  render: () => photo({ kind: 'suggestions', imageId: 'sample-1', candidates: [...photoCandidates] }),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Review selected match' })).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};
