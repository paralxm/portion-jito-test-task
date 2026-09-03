import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, within } from 'storybook/test';

import { AmountField } from '../../components/AmountField/AmountField';
import { TextField } from '../../components/TextField/TextField';
import { AppHeader } from '../../patterns/AppHeader/AppHeader';
import { Button } from '../../primitives/Button/Button';
import { FocusedFlowLayout } from './FocusedFlowLayout';

const meta = {
  title: 'Templates/FocusedFlowLayout',
  component: FocusedFlowLayout,
  args: {
    header: <AppHeader variant="focused" title="Enter manually" onBack={fn()} />,
    footer: (
      <Button variant="primary" block>
        Continue to review
      </Button>
    ),
    children: (
      <>
        <TextField label="Food or dish name" placeholder="For example, Lentil soup" />
        <AmountField label="Amount" value="100" onChange={fn()} unit="g" />
        <AmountField label="Calories" value="" onChange={fn()} unit="kcal" />
        <AmountField label="Protein" optional value="" onChange={fn()} unit="g" />
        <AmountField label="Carbohydrates" optional value="" onChange={fn()} unit="g" />
        <AmountField label="Fat" optional value="" onChange={fn()} unit="g" error="Enter fat in grams, or leave it blank" />
      </>
    ),
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Focused subtask layout — review, manual entry, camera steps. No bottom navigation, a sticky header with the real Back destination, and an anchored footer that stays in flow so the last field and its error are always reachable above it.',
      },
    },
  },
} satisfies Meta<typeof FocusedFlowLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Form: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('navigation')).toBeNull();
    const footer = canvas.getByRole('button', { name: 'Continue to review' }).parentElement as HTMLElement;
    await expect(getComputedStyle(footer).position).toBe('sticky');
  },
};

export const ShortViewport: Story = {
  name: 'Short viewport — last error stays reachable',
  globals: { viewport: { value: 'shortHeight', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const error = canvas.getByText('Enter fat in grams, or leave it blank');
    error.scrollIntoView({ block: 'end' });
    const footer = canvas.getByRole('button', { name: 'Continue to review' }).parentElement as HTMLElement;
    await expect(error.getBoundingClientRect().bottom).toBeLessThanOrEqual(footer.getBoundingClientRect().top + 1);
  },
};
