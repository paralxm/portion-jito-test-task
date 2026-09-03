import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { expectNoHorizontalOverflow } from '../../../design-system/storybook/decorators';
import { ManualEntryScreen } from './ManualEntryScreen';

const meta = {
  title: 'Product compositions/Manual entry (S06)',
  component: ManualEntryScreen,
  args: { onContinue: fn(), onBack: fn() },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'S06 — name, a positive reference amount with a supported unit, calories, and optional macros. Validation runs on Continue and focuses the first invalid field; blank optional values stay unknown. A meaningful dirty draft asks Keep editing / Discard; an untouched form leaves directly.',
      },
    },
  },
} satisfies Meta<typeof ManualEntryScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  play: async ({ canvasElement, args }) => {
    // Untouched entry leaves directly — no confirmation.
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Back' }));
    await expect(args.onBack).toHaveBeenCalledTimes(1);
  },
};

export const ValidationOnContinue: Story = {
  name: 'Validation on Continue',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Continue to review' }));
    await expect(args.onContinue).not.toHaveBeenCalled();
    const name = canvas.getByLabelText('Food or dish name');
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await expect(document.activeElement).toBe(name);
    await expect(canvas.getByRole('alert')).toHaveTextContent('Check the 2 highlighted fields before continuing.');
    await expect(canvas.getByLabelText(/^Protein/)).not.toHaveAttribute('aria-invalid');
  },
};

export const Completed: Story = {
  name: 'Completed entry continues to review',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Food or dish name'), 'Lentil soup');
    await userEvent.type(canvas.getByLabelText('Calories'), '150');
    await userEvent.type(canvas.getByLabelText(/^Protein/), '8');
    await userEvent.type(canvas.getByLabelText(/^Fat/), '0');
    await userEvent.click(canvas.getByRole('button', { name: 'Continue to review' }));
    await expect(args.onContinue).toHaveBeenCalledTimes(1);
    const candidate = (args.onContinue as ReturnType<typeof fn>).mock.calls[0][0];
    await expect(candidate.name).toBe('Lentil soup');
    await expect(candidate.nutrition).toEqual({ energyKcal: 150, proteinG: 8, carbohydratesG: null, fatG: 0 });
    await expect(candidate.reference).toEqual({ quantity: 100, unitId: 'g' });
  },
};

export const DirtyDraftAsksBeforeDiscarding: Story = {
  name: 'Dirty draft asks before discarding',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Food or dish name'), 'Oat');
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    const dialog = canvas.getByRole('alertdialog', { name: 'Discard this entry?' });
    await expect(dialog).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Keep editing' }));
    await expect(args.onBack).not.toHaveBeenCalled();
    await expect(canvas.getByLabelText('Food or dish name')).toHaveValue('Oat');
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Discard' }));
    await expect(args.onBack).toHaveBeenCalledTimes(1);
  },
};

export const ReferenceUnit: Story = {
  name: 'Reference unit chooser',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Change unit, currently g' }));
    await userEvent.click(canvas.getByRole('radio', { name: /serving/ }));
    await userEvent.click(canvas.getByRole('button', { name: 'Confirm' }));
    await expect(canvas.getByRole('button', { name: 'Change unit, currently serving' })).toBeInTheDocument();
  },
};

export const Enlarged200: Story = {
  name: '390 at 200 % text',
  globals: { viewport: { value: 'mobile390', isRotated: false } },
  decorators: [
    (Story) => {
      document.documentElement.style.fontSize = '200%';
      return <Story />;
    },
  ],
  play: async () => {
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth + 1);
    document.documentElement.style.fontSize = '';
  },
};

export const Narrow320: Story = {
  name: 'Narrow — 320',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Continue to review' })).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};
