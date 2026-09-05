import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { withIPhone16PortraitSafeAreas, withRootFontSize, expectNoHorizontalOverflow } from '../../../design-system/storybook/decorators';
import { WaterSheet } from './WaterSheet';

const meta = {
  title: 'Product compositions/Home (S01)/WaterSheet',
  component: WaterSheet,
  args: { open: true, totalMl: 1250, goalMl: 2000, onAdd: fn(), onSaveTotal: fn(), onCancel: fn() },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'O06 — the water sheet (ledger D-22) on `ModalSheet`. Add mode: presets 150 / 250 / 350 / 500 ml as radio chips, a labelled Custom amount in whole millilitres (1–5,000), and one primary Add water that stays unavailable until a preset or a valid custom amount exists. Edit-total mode (O06-2): today’s total as one labelled field (0–10,000) with Save total. Both are drafts: Cancel, close, backdrop and Escape change nothing; focus is contained and returned; the footer owns the bottom safe area.',
      },
    },
  },
} satisfies Meta<typeof WaterSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Sheet default — nothing chosen, Add water unavailable',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = canvas.getByRole('dialog', { name: 'Add water' });
    await expect(within(dialog).getByText('1.25 L')).toBeVisible();
    await expect(within(dialog).getByRole('button', { name: 'Add water' })).toBeDisabled();
    await expect(within(dialog).getAllByRole('radio')).toHaveLength(4);
  },
};

export const PresetSelected: Story = {
  name: 'Preset selected → Add water adds it',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('radio', { name: '350 ml' }));
    await expect(canvas.getByRole('radio', { name: '350 ml' })).toHaveAttribute('aria-checked', 'true');
    const add = canvas.getByRole('button', { name: 'Add water' });
    await expect(add).toBeEnabled();
    await userEvent.click(add);
    await userEvent.click(add);
    await expect(args.onAdd).toHaveBeenCalledTimes(1);
    await expect(args.onAdd).toHaveBeenCalledWith(350);
  },
};

export const CustomValid: Story = {
  name: 'Custom amount valid — 300 ml, presets cleared',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('radio', { name: '250 ml' }));
    await userEvent.type(canvas.getByLabelText('Custom amount'), '300');
    await expect(canvas.getByRole('radio', { name: '250 ml' })).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(canvas.getByRole('button', { name: 'Add water' }));
    await expect(args.onAdd).toHaveBeenCalledWith(300);
  },
};

export const CustomInvalid: Story = {
  name: 'Custom amount invalid — decimal and out of range are refused',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByLabelText('Custom amount');
    await userEvent.type(field, '1.5');
    await expect(canvas.getByRole('button', { name: 'Add water' })).toBeDisabled();
    await userEvent.clear(field);
    await userEvent.type(field, '6000');
    await expect(canvas.getByRole('button', { name: 'Add water' })).toBeDisabled();
    await expect(field).toHaveAccessibleDescription('Enter between 1 and 5,000 ml');
    await expect(args.onAdd).not.toHaveBeenCalled();
  },
};

export const EditTotal: Story = {
  name: 'Edit today’s total — zero allowed, Save total replaces',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /Edit today/ }));
    const dialog = await canvas.findByRole('dialog', { name: "Edit today's total" });
    const field = within(dialog).getByLabelText("Today's total");
    await expect(field).toHaveValue('1250');
    await userEvent.clear(field);
    await userEvent.type(field, '0');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save total' }));
    await expect(args.onSaveTotal).toHaveBeenCalledWith(0);
  },
};

export const EditTotalInvalid: Story = {
  name: 'Edit today’s total — invalid stays editable',
  args: { initialMode: 'edit-total' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByLabelText("Today's total");
    await userEvent.clear(field);
    await userEvent.type(field, '12000');
    await expect(canvas.getByRole('button', { name: 'Save total' })).toBeDisabled();
    await userEvent.clear(field);
    await userEvent.click(canvas.getByRole('button', { name: 'Save total' }));
    await expect(field).toHaveAccessibleDescription(/Enter today's total/);
    await expect(args.onSaveTotal).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole('button', { name: 'Back to adding' }));
    await expect(canvas.getByRole('dialog', { name: 'Add water' })).toBeVisible();
  },
};

export const CancelAndEscape: Story = {
  name: 'Cancel, Escape and close change nothing',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('radio', { name: '500 ml' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await userEvent.keyboard('{Escape}');
    await userEvent.click(canvas.getByRole('button', { name: 'Close' }));
    await expect(args.onCancel).toHaveBeenCalledTimes(3);
    await expect(args.onAdd).not.toHaveBeenCalled();
  },
};

export const KeyboardFocus: Story = {
  name: 'Keyboard — focus stays inside the sheet',
  play: async ({ canvasElement }) => {
    const dialog = within(canvasElement).getByRole('dialog', { name: 'Add water' });
    // Tab through every control the dialog offers; the native modal keeps the page inert
    // and focus never lands on anything behind the sheet.
    const focusable = dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), [tabindex="0"]').length;
    for (let i = 0; i < focusable - 1; i += 1) {
      await userEvent.tab();
      await expect(dialog.contains(document.activeElement)).toBe(true);
    }
  },
};

export const Narrow320: Story = {
  name: 'Narrow — 320',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async () => {
    await expectNoHorizontalOverflow();
  },
};

export const Wide430: Story = {
  name: 'Wide — 430',
  globals: { viewport: { value: 'mobile430', isRotated: false } },
  play: async () => {
    await expectNoHorizontalOverflow();
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 320 at 200 %',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Add water' })).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};

export const SafeArea: Story = {
  name: 'iPhone 16 fixture — the footer owns the bottom inset',
  globals: { viewport: { value: 'iPhone16Portrait', isRotated: false } },
  decorators: [withIPhone16PortraitSafeAreas],
  play: async ({ canvasElement }) => {
    const footer = within(canvasElement).getByRole('button', { name: 'Add water' }).closest('footer') as HTMLElement;
    await expect(parseFloat(getComputedStyle(footer).paddingBlockEnd)).toBeGreaterThanOrEqual(34);
  },
};
