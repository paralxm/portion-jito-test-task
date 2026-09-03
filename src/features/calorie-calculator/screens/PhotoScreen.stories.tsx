import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { photoSuggestions, samplePhotoImage } from '../domain/fixtures';
import { PhotoScreen, type PhotoAnalysisResult } from './PhotoScreen';

const analyse = async (_imageId: string, options: { simulateFailure: boolean }): Promise<PhotoAnalysisResult> => {
  await new Promise((resolve) => setTimeout(resolve, 60));
  return options.simulateFailure ? { kind: 'failed' } : { kind: 'suggestions', candidates: [...photoSuggestions] };
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
          'S05 — capture, preview with retake, analysis, then suggestions the user must review. A suggestion is never a measurement; the amount is set on review. Analysis failure keeps the image for a retry. There is no camera or recognition service in this prototype; the sample image and fixed suggestions are labelled as such.',
      },
    },
  },
} satisfies Meta<typeof PhotoScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Capture: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Take photo' })).toBeInTheDocument();
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
  name: 'Analysis → suggestions → review',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Take photo' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Analyse photo' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Analysing photo');
    await new Promise((resolve) => setTimeout(resolve, 150));
    await expect(canvas.getByRole('heading', { name: 'Suggested foods' })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: /Lentil soup/ }));
    await expect(args.onSuggestionChosen).toHaveBeenCalledTimes(1);
  },
};

export const CancelAnalysis: Story = {
  name: 'Cancel during analysis keeps the preview',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Take photo' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Analyse photo' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await expect(canvas.getByRole('button', { name: 'Analyse photo' })).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 150));
    // The late response is ignored: still in preview, no suggestions.
    await expect(canvas.queryByRole('heading', { name: 'Suggested foods' })).toBeNull();
  },
};

export const AnalysisFailed: Story = {
  name: 'Analysis failed → retry with the same image',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Take photo' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Analyse with a simulated failure' }));
    await new Promise((resolve) => setTimeout(resolve, 150));
    await expect(canvas.getByRole('alert')).toHaveTextContent('Analysis failed');
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
    await new Promise((resolve) => setTimeout(resolve, 150));
    await expect(canvas.getByRole('heading', { name: 'Suggested foods' })).toBeInTheDocument();
  },
};

export const CameraDenied: Story = {
  name: 'Camera denied',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Simulate camera denied' }));
    await expect(canvas.getByRole('alert')).toHaveTextContent('Camera access is needed to take a photo');
    await userEvent.click(canvas.getByRole('button', { name: 'Search by name' }));
    await expect(args.onSearchInstead).toHaveBeenCalledTimes(1);
  },
};
