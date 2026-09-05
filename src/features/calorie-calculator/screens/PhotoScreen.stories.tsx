import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { expectNoHorizontalOverflow, withRootFontSize } from '../../../design-system/storybook/decorators';
import { photoSuggestions, samplePhotoImage } from '../domain/fixtures';
import { PhotoScreen, type PhotoAnalysisResult } from './PhotoScreen';

const analyse = async (): Promise<PhotoAnalysisResult> => {
  await new Promise((resolve) => setTimeout(resolve, 60));
  return { kind: 'suggestions', candidates: [...photoSuggestions] };
};

const meta = {
  title: 'Product compositions/Photo (S05)',
  component: PhotoScreen,
  args: { analyse, sampleImageUrl: samplePhotoImage, onSuggestionChosen: fn(), onBack: fn(), onSearchInstead: fn(), onEnterManually: fn() },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'S05 — the dark capture stage with a circular framing guide and a 72 px shutter; preview with retake; analysis; then suggestions with an explicit selection: a radio row is marked, **Review selected match** opens review, and **None of these** reveals Retake / Search by name / Enter manually. A suggestion is never a measurement; the amount is set on review. Analysis failure and camera denial are reached through `initialPhase` — there are no simulator controls in the product (ledger D-24). There is no camera or recognition service in this prototype; the sample photograph and fixed suggestions are labelled as such.',
      },
    },
  },
} satisfies Meta<typeof PhotoScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Capture: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const shutter = canvas.getByRole('button', { name: 'Take photo' });
    await expect(shutter).toBeInTheDocument();
    await expect(shutter.getBoundingClientRect().width).toBeGreaterThanOrEqual(72);
    await expect(canvas.getByText('Frame the food')).toBeVisible();
    await expect(canvas.queryByText(/Simulate/)).toBeNull();
  },
};

export const PreviewAndRetake: Story = {
  name: 'Preview and retake',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Take photo' }));
    await expect(canvas.getByRole('img', { name: /Sample image/ })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Retake' }));
    await expect(canvas.getByRole('button', { name: 'Take photo' })).toBeInTheDocument();
  },
};

export const Suggestions: Story = {
  name: 'Analysis → suggestions → select → review',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Take photo' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Analyse photo' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Analysing photo');
    await new Promise((resolve) => setTimeout(resolve, 150));
    await expect(canvas.getByRole('group', { name: 'Suggested foods' })).toBeInTheDocument();
    const review = canvas.getByRole('button', { name: 'Review selected match' });
    // Nothing is auto-accepted: review is unavailable until a suggestion is marked.
    await expect(review).toBeDisabled();
    await userEvent.click(canvas.getByRole('radio', { name: /Lentil soup/ }));
    await expect(canvas.getByRole('radio', { name: /Lentil soup/ })).toBeChecked();
    await userEvent.click(review);
    await expect(args.onSuggestionChosen).toHaveBeenCalledTimes(1);
    await expect(args.onSuggestionChosen.mock.calls[0][0].name).toBe('Lentil soup');
    // None of these reveals the recovery routes without leaving the step.
    await userEvent.click(canvas.getByRole('button', { name: 'None of these' }));
    await expect(canvas.getByRole('button', { name: 'Retake photo' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Search by name' }));
    await expect(args.onSearchInstead).toHaveBeenCalledTimes(1);
  },
};

export const CancelAnalysis: Story = {
  name: 'Cancel during analysis keeps the preview',
  // A slower fixture than the default 60 ms so Cancel always lands during the analysis, even under a loaded parallel run.
  args: {
    analyse: async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return analyse();
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Take photo' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Analyse photo' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await expect(canvas.getByRole('button', { name: 'Analyse photo' })).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 500));
    // The late response is ignored: still in preview, no suggestions.
    await expect(canvas.queryByRole('group', { name: 'Suggested foods' })).toBeNull();
  },
};

export const AnalysisFailed: Story = {
  name: 'Analysis failed → retry with the same image',
  args: { initialPhase: { kind: 'failed', imageId: 'sample-1' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('alert')).toHaveTextContent('Analysis failed');
    await expect(canvas.getByRole('img', { name: /Sample image/ })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
    await new Promise((resolve) => setTimeout(resolve, 150));
    await expect(canvas.getByRole('group', { name: 'Suggested foods' })).toBeInTheDocument();
  },
};

export const NoUsableMatch: Story = {
  name: 'No usable match — nothing invented',
  args: { initialPhase: { kind: 'suggestions', imageId: 'sample-1', candidates: [] } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('No food was recognised')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Enter manually' }));
    await expect(args.onEnterManually).toHaveBeenCalledTimes(1);
  },
};

export const PermissionPending: Story = {
  name: 'Waiting for the system camera prompt (P01, app side)',
  args: { initialPhase: { kind: 'permission-pending' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Waiting for camera permission')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Search by name' })).toBeVisible();
  },
};

export const CameraDenied: Story = {
  name: 'Camera denied',
  args: { initialPhase: { kind: 'denied' } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('alert')).toHaveTextContent('Camera access is needed to take a photo');
    await userEvent.click(canvas.getByRole('button', { name: 'Search by name' }));
    await expect(args.onSearchInstead).toHaveBeenCalledTimes(1);
  },
};

export const Narrow320: Story = {
  name: 'Narrow — 320',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Take photo' })).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 200 %',
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Take photo' })).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};
