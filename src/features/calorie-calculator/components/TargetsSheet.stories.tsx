import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { expectNoHorizontalOverflow, withRootFontSize } from '../../../design-system/storybook/decorators';
import type { DailyGoal } from '../domain/daily-log';
import { TargetsSheet } from './TargetsSheet';

const estimated: DailyGoal = {
  kcal: 1550,
  proteinG: 116,
  carbohydratesG: 174,
  fatG: 43,
  source: 'estimated',
  preset: 'higher-protein',
  estimate: { method: 'nasem-2023-eer', age: 34, sex: 'female', heightCm: 168, weightKg: 62, activity: 'low-active', goal: 'lose', eerKcal: 2050, adjustmentKcal: -500 },
};

const manual: DailyGoal = { kcal: 2000, proteinG: 150, carbohydratesG: 200, fatG: 60, source: 'manual', preset: 'custom' };

const meta = {
  title: 'Product compositions/Home (S01)/Targets sheet',
  component: TargetsSheet,
  args: { open: true, goal: null, onSave: fn(), onRemove: fn(), onCancel: fn() },
  parameters: {
    docs: {
      description: {
        component: `
Set targets / Edit targets (ledger §13.4). Without saved targets the sheet opens on **Set daily goal — How would you like to set it?** with *Help me estimate* and *I know my goal*. The manual path takes a daily calorie target and a nutrition preference (Balanced / Higher protein / Lower carb / Custom) whose grams are suggested from the target with the documented shares and the Atwater factors — labelled suggested, never personal; Custom exposes optional gram fields that survive calorie changes and states a mismatch without changing anything. The estimate path asks about you (age, the sex the equation uses, height, weight in either unit), lifestyle (the four activity categories of the 2023 DRI energy equations) and goal, then reviews the **Estimated daily target** with its assumptions; a loss target under 1,200 kcal is refused, a gain goal adds no surplus and says so. Back keeps every draft; dismissing with edits asks first; Save applies once.
        `,
      },
    },
  },
} satisfies Meta<typeof TargetsSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Entry: Story = {
  name: 'Entry — Set daily goal, two routes',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = canvas.getByRole('dialog', { name: 'Set daily goal' });
    await expect(within(dialog).getByText(/How would you like to set it/)).toBeVisible();
    await expect(within(dialog).getByRole('button', { name: /Help me estimate/ })).toBeVisible();
    await userEvent.click(within(dialog).getByRole('button', { name: /I know my goal/ }));
    await expect(within(dialog).getByLabelText('Daily calorie target')).toBeVisible();
    await expect(within(dialog).getByText(/Applies from today until you change it/)).toBeVisible();
  },
};

export const ManualPreset: Story = {
  name: 'I know my goal — a preset suggests grams that follow the calories',
  args: { initialStep: 'manual' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Daily calorie target'), '2000');
    await expect(canvas.getByRole('radio', { name: 'Balanced' })).toHaveAttribute('aria-checked', 'true');
    await expect(canvas.getByText('100 g')).toBeVisible();
    await expect(canvas.getByText('250 g')).toBeVisible();
    await expect(canvas.getByText('67 g')).toBeVisible();
    await userEvent.click(canvas.getByRole('radio', { name: 'Higher protein' }));
    await expect(canvas.getByText('150 g')).toBeVisible();
    await userEvent.clear(canvas.getByLabelText('Daily calorie target'));
    await userEvent.type(canvas.getByLabelText('Daily calorie target'), '1800');
    await expect(canvas.getByText('135 g')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(args.onSave).toHaveBeenCalledWith({ kcal: 1800, proteinG: 135, carbohydratesG: 203, fatG: 50, preset: 'higher-protein', source: 'manual' });
  },
};

export const ManualCustom: Story = {
  name: 'Custom grams — kept across calorie changes, any unset, mismatch stated',
  args: { initialStep: 'manual' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Daily calorie target'), '2000');
    await userEvent.click(canvas.getByRole('radio', { name: 'Custom' }));
    await userEvent.type(canvas.getByLabelText(/^Protein/), '150');
    await userEvent.type(canvas.getByLabelText(/^Carbohydrates/), '200');
    await userEvent.type(canvas.getByLabelText(/^Fat/), '60');
    await expect(canvas.getByText(/add up to 1,940 kcal, 60 kcal below/)).toBeVisible();
    await userEvent.clear(canvas.getByLabelText('Daily calorie target'));
    await userEvent.type(canvas.getByLabelText('Daily calorie target'), '2200');
    await expect(canvas.getByLabelText(/^Protein/)).toHaveValue('150');
    await userEvent.clear(canvas.getByLabelText(/^Fat/));
    await expect(canvas.queryByText(/add up to/)).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(args.onSave).toHaveBeenCalledWith({ kcal: 2200, proteinG: 150, carbohydratesG: 200, fatG: null, preset: 'custom', source: 'manual' });
  },
};

export const ManualValidation: Story = {
  name: 'Validation — blank, invalid and zero are distinct and stay editable',
  args: { initialStep: 'manual' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(canvas.getByText(/Enter a daily calorie target/)).toBeVisible();
    await userEvent.type(canvas.getByLabelText('Daily calorie target'), 'abc');
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(canvas.getByText(/Enter a number of calories/)).toBeVisible();
    await userEvent.clear(canvas.getByLabelText('Daily calorie target'));
    await userEvent.type(canvas.getByLabelText('Daily calorie target'), '0');
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(canvas.getByText(/greater than zero/)).toBeVisible();
    await expect(args.onSave).not.toHaveBeenCalled();
  },
};

export const EstimatePath: Story = {
  name: 'Help me estimate — three steps, the reviewed estimate, save',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /Help me estimate/ }));
    await expect(canvas.getByRole('dialog', { name: 'About you' })).toBeVisible();
    await userEvent.type(canvas.getByLabelText('Age'), '34');
    await userEvent.click(canvas.getByLabelText('Female'));
    await userEvent.type(canvas.getByLabelText('Height'), '168');
    await userEvent.type(canvas.getByLabelText('Weight'), '62');
    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }));
    await expect(canvas.getByRole('dialog', { name: 'Lifestyle' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }));
    await expect(canvas.getByText('Choose the option closest to your usual days')).toBeVisible();
    await userEvent.click(canvas.getByLabelText(/Lightly active/));
    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }));
    await expect(canvas.getByRole('dialog', { name: 'Goal' })).toBeVisible();
    await userEvent.click(canvas.getByLabelText(/Lose weight/));
    await userEvent.click(canvas.getByRole('button', { name: 'See the estimate' }));
    await expect(canvas.getByRole('dialog', { name: 'Estimated daily target' })).toBeVisible();
    // 575.77 − 7.01·34 + 6.60·168 + 12.14·62 = 2198.91 → −500 = 1698.91 → 1,699
    await expect(canvas.getByText('1,699')).toBeVisible();
    await expect(canvas.getByText(/Maintenance estimate 2,199 kcal/)).toBeVisible();
    await expect(canvas.getByText(/not a measurement or medical advice/)).toBeVisible();
    await expect(canvas.getByLabelText('Daily calorie target')).toHaveValue('1699');
    // Back keeps the answers; the estimate is recomputed explicitly.
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    await expect(canvas.getByLabelText(/Lose weight/)).toBeChecked();
    await userEvent.click(canvas.getByRole('button', { name: 'See the estimate' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Save targets' }));
    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({ kcal: 1699, source: 'estimated', preset: 'balanced', proteinG: 85, carbohydratesG: 212, fatG: 57, estimate: expect.objectContaining({ method: 'nasem-2023-eer', activity: 'low-active', goal: 'lose', eerKcal: 2199, adjustmentKcal: -500 }) }),
    );
  },
};

export const EstimateGain: Story = {
  name: 'Gain weight — maintenance shown, no surplus invented',
  args: { initialStep: 'about' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Age'), '40');
    await userEvent.click(canvas.getByLabelText('Male'));
    await userEvent.click(canvas.getByRole('radio', { name: 'Feet and inches' }));
    await userEvent.type(canvas.getByLabelText('Height'), '5');
    await userEvent.type(canvas.getByLabelText('Inches'), '11');
    await userEvent.click(canvas.getByRole('radio', { name: 'Pounds' }));
    await userEvent.type(canvas.getByLabelText('Weight'), '180');
    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }));
    await userEvent.click(canvas.getByLabelText(/^Active/));
    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }));
    await userEvent.click(canvas.getByLabelText(/Gain weight/));
    await userEvent.click(canvas.getByRole('button', { name: 'See the estimate' }));
    await expect(canvas.getByText('No surplus is added for gaining weight')).toBeVisible();
    await expect(canvas.getByText(/Enter the amount you want above it/)).toBeVisible();
  },
};

export const EstimateBelowFloor: Story = {
  name: 'Loss below the 1,200 kcal floor is refused, not produced',
  args: { initialStep: 'about' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Age'), '80');
    await userEvent.click(canvas.getByLabelText('Female'));
    await userEvent.type(canvas.getByLabelText('Height'), '145');
    await userEvent.type(canvas.getByLabelText('Weight'), '40');
    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }));
    await userEvent.click(canvas.getByLabelText(/Mostly sedentary/));
    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }));
    await userEvent.click(canvas.getByLabelText(/Lose weight/));
    await userEvent.click(canvas.getByRole('button', { name: 'See the estimate' }));
    await expect(canvas.getByText(/would be under 1,200 kcal a day/)).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'Save targets' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Set it myself' }));
    await expect(canvas.getByLabelText('Daily calorie target')).toBeVisible();
    await expect(args.onSave).not.toHaveBeenCalled();
  },
};

export const AboutValidation: Story = {
  name: 'About you — under 19 and blank fields are refused without clearing the rest',
  args: { initialStep: 'about' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Age'), '16');
    await userEvent.type(canvas.getByLabelText('Height'), '160');
    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }));
    await expect(canvas.getByText(/adults from 19/)).toBeVisible();
    await expect(canvas.getByText('Choose the option the equation should use')).toBeVisible();
    await expect(canvas.getByLabelText('Height')).toHaveValue('160');
    await expect(canvas.getByRole('dialog', { name: 'About you' })).toBeVisible();
  },
};

export const EditEstimated: Story = {
  name: 'Edit targets — saved estimate explained, recalculation explicit, removal offered',
  args: { goal: estimated },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const dialog = canvas.getByRole('dialog', { name: 'Edit targets' });
    await expect(within(dialog).getByLabelText('Daily calorie target')).toHaveValue('1550');
    await expect(within(dialog).getByText(/Estimated from female, 34, 168 cm, 62 kg, lightly active/)).toBeVisible();
    await expect(within(dialog).getByRole('radio', { name: 'Higher protein' })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Recalculate estimate' }));
    await expect(canvas.getByRole('dialog', { name: 'About you' })).toBeVisible();
    await expect(canvas.getByLabelText('Age')).toHaveValue('34');
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Remove targets' }));
    await expect(args.onRemove).toHaveBeenCalled();
  },
};

export const EditManualCancel: Story = {
  name: 'Cancel keeps saved values; an edited draft asks first',
  args: { goal: manual },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radio', { name: 'Custom' })).toHaveAttribute('aria-checked', 'true');
    await expect(canvas.getByLabelText(/^Protein/)).toHaveValue('150');
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await expect(args.onCancel).toHaveBeenCalledTimes(1);
    await userEvent.type(canvas.getByLabelText('Daily calorie target'), '5');
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    const confirm = await canvas.findByRole('alertdialog', { name: 'Discard changes?' });
    await userEvent.click(within(confirm).getByRole('button', { name: 'Keep editing' }));
    await expect(canvas.getByLabelText('Daily calorie target')).toHaveValue('20005');
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(within(await canvas.findByRole('alertdialog', { name: 'Discard changes?' })).getByRole('button', { name: 'Discard changes' }));
    await expect(args.onCancel).toHaveBeenCalledTimes(2);
    await expect(args.onSave).not.toHaveBeenCalled();
  },
};

export const Narrow320: Story = {
  name: 'Narrow — 320, the review step',
  args: { initialStep: 'manual', goal: estimated },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Save' })).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 320 at 200 %, the About you step',
  args: { initialStep: 'about' },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Continue' })).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};
