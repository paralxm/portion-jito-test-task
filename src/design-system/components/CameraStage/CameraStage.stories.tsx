import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { sampleCapturePhoto } from '../../../assets/images';
import { Stack } from '../../primitives/layout/Stack';
import { Text } from '../../primitives/Text/Text';
import { expectNoHorizontalOverflow } from '../../storybook/decorators';
import { CameraStage } from './CameraStage';

const meta = {
  title: 'Components/CameraStage',
  component: CameraStage,
  args: { status: 'Scanning', tone: 'scanning', guide: 'corners', scanLine: true },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The shared dark viewfinder of the barcode and photo steps: the stage surface (`camera.stage`, the only dark surface in the product), a text status chip, focus corners or a circular guide, an optional scan line that runs only while scanning, and the captured frame when one exists. Tones: scanning (neutral frame), detected (light-blue frame and chip, paired with wording), paused (dimmed frame). Over a photo the chip gets its own dark ground. Reduced motion removes the scan-line animation. The prototype has no camera: the stage shows fixture media the surrounding copy names as such.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '0 var(--portion-spacing-page-inset)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CameraStage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Scanning: Story = {
  name: 'Scanning — corners and the moving scan line',
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Scanning')).toBeVisible();
    const line = canvasElement.querySelector('[class*="scanLine"]') as HTMLElement;
    await expect(line).not.toBeNull();
    await expect(getComputedStyle(line).animationName).not.toBe('none');
    // Only the four corners carry the corner treatment; the scan line is a plain rule.
    await expect(canvasElement.querySelectorAll('[data-corner]')).toHaveLength(4);
    await expect(parseFloat(getComputedStyle(line).height)).toBeLessThanOrEqual(2);
  },
};

export const Detected: Story = {
  name: 'Detected — code read, line stopped, chip and corners in the detected treatment',
  args: { status: 'Code read', tone: 'detected', scanLine: false },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Code read')).toBeVisible();
    await expect(canvasElement.querySelector('[class*="scanLine"]')).toBeNull();
  },
};

export const Paused: Story = {
  args: { status: 'Paused', tone: 'paused', scanLine: false },
};

export const CircleGuide: Story = {
  name: 'Photo framing — circular guide, 1:1',
  args: { status: 'Frame the food', guide: 'circle', aspect: '1:1', scanLine: false },
};

export const WithImage: Story = {
  name: 'Captured frame — the chip keeps its own dark ground over the photo',
  args: { status: 'Sample photo', guide: 'none', imageUrl: sampleCapturePhoto, imageAlt: 'Sample image standing in for your photo', tone: 'paused', scanLine: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('img', { name: /Sample image/ })).toBeVisible();
    const chip = canvas.getByText('Sample photo');
    await expect(getComputedStyle(chip).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  },
};

export const Tones: Story = {
  name: 'All tones side by side',
  render: () => (
    <Stack gap={16}>
      {(['scanning', 'detected', 'paused'] as const).map((tone) => (
        <Stack key={tone} gap={4}>
          <Text as="p" variant="supporting" color="secondary">
            {tone}
          </Text>
          <CameraStage status={tone === 'scanning' ? 'Scanning' : tone === 'detected' ? 'Code read' : 'Paused'} tone={tone} scanLine={tone === 'scanning'} />
        </Stack>
      ))}
    </Stack>
  ),
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
  play: async () => {
    await expectNoHorizontalOverflow();
  },
};
