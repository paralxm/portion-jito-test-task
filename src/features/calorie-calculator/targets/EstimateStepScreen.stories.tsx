import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { expectNoHorizontalOverflow, withIPhone16PortraitSafeAreas, withRootFontSize } from '../../../design-system/storybook/decorators';
import { EstimateStepScreen, type EstimateStep } from './EstimateStepScreen';
import { draftSnapshot, type TargetsDraft } from './targets-draft';
import { emptyEstimateDraft, filledEstimateDraft, floorGoalDraft, imperialEstimateDraft } from './targets-fixtures';

interface HarnessProps {
  step: EstimateStep;
  initial: () => TargetsDraft;
  backLeavesTask?: boolean;
  initialHelpOpen?: boolean;
  /** Overrides the computed dirtiness (the app measures it against the task's start, not the story's). */
  dirty?: boolean;
  onContinue?: () => void;
  onBack?: () => void;
  onExit?: () => void;
  onUseManual?: () => void;
}

/** Holds the draft the way the app does, so typing, unit switches and selections persist within the story. */
function Harness({ step, initial, backLeavesTask, initialHelpOpen, dirty, onContinue = fn(), onBack = fn(), onExit = fn(), onUseManual = fn() }: HarnessProps) {
  const [start] = useState(initial);
  const [draft, setDraft] = useState(start);
  return <EstimateStepScreen step={step} draft={draft} onDraftChange={setDraft} dirty={dirty ?? draftSnapshot(draft) !== draftSnapshot(start)} onContinue={onContinue} onBack={onBack} onExit={onExit} onUseManual={onUseManual} backLeavesTask={backLeavesTask} initialHelpOpen={initialHelpOpen} />;
}

const meta = {
  title: 'Product compositions/Targets/Estimate steps',
  component: Harness,
  args: { step: 'about', initial: emptyEstimateDraft, onContinue: fn(), onBack: fn(), onExit: fn(), onUseManual: fn() },
  decorators: [withIPhone16PortraitSafeAreas],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The three estimate steps on the focused shell (ledger §14): `FocusedBar` with Back, the centred step count and Help; the heading; the fields or `SelectionCard`s; one primary action in the footer. **About you** holds Age, the sex the equation uses (two equal tiles), Height with cm | ft + in and Weight with kg | lb in the label rows. **Your activity** and **Your goal** are single-select card stacks with no auto-advance. Validation stays beside the fields and focuses the first problem; Help is a short dialog with a Calculation details disclosure; every value lives in the task draft, so Back and Help keep it.',
      },
    },
  },
} satisfies Meta<typeof Harness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const About: Story = {
  name: 'About you — 1/3, metric',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'About you' })).toBeInTheDocument();
    await expect(canvas.getByText('Step 1 of 3')).toBeInTheDocument();
    await expect(canvas.getByRole('radiogroup', { name: 'Sex used by the estimate' })).toBeInTheDocument();
    await expect(canvas.getByRole('radiogroup', { name: 'Height units' })).toBeInTheDocument();
    await expect(canvas.getByRole('radiogroup', { name: 'Weight units' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Continue' })).toBeVisible();
    await expect(canvas.queryByRole('navigation')).toBeNull();
    await expectNoHorizontalOverflow();
  },
};

export const AboutErrors: Story = {
  name: 'About you — validation near the fields, focus on the first',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }));
    await expect(canvas.getByText('Enter your age in years')).toBeVisible();
    await expect(canvas.getByText('Choose the option the equation should use')).toBeVisible();
    await expect(canvas.getByText('Enter your height in centimetres')).toBeVisible();
    await expect(canvas.getByText('Enter your weight in kilograms')).toBeVisible();
    await expect(canvas.getByLabelText('Age')).toHaveFocus();
    await expect(args.onContinue).not.toHaveBeenCalled();
  },
};

export const AboutImperial: Story = {
  name: 'About you — ft + in and lb, converted from the typed values',
  args: { initial: imperialEstimateDraft },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText('Height ft')).toHaveValue('5');
    await expect(canvas.getByLabelText('Height in')).toHaveValue('6');
    await expect(canvas.getByLabelText('Weight')).toHaveValue('136.7');
    await userEvent.click(canvas.getByRole('radio', { name: 'kg' }));
    await expect(canvas.getByLabelText('Weight')).toHaveValue('62');
    await userEvent.click(canvas.getByRole('radio', { name: 'cm' }));
    await expect(canvas.getByLabelText('Height')).toHaveValue('167.6');
  },
};

export const AboutHelp: Story = {
  name: 'Help — a short explanation with Calculation details, focus returned',
  args: { initial: filledEstimateDraft, initialHelpOpen: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body);
    const dialog = await canvas.findByRole('dialog', { name: 'Why these details?' });
    await expect(within(dialog).getByText(/covers adults aged 19 and over/)).toBeVisible();
    await expect(within(dialog).getByText('Calculation details')).toBeVisible();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await expect(canvas.queryByRole('dialog', { name: 'Why these details?' })).toBeNull();
    await expect(within(canvasElement).getByLabelText('Age')).toHaveValue('34');
  },
};

export const Activity: Story = {
  name: 'Your activity — 2/3, one selection card chosen',
  args: { step: 'activity', initial: filledEstimateDraft },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Your activity' })).toBeInTheDocument();
    await expect(canvas.getByText('Step 2 of 3')).toBeInTheDocument();
    await expect(canvas.getByRole('radio', { name: /Lightly active/ })).toBeChecked();
    await userEvent.click(canvas.getByRole('radio', { name: /Very active/ }));
    await expect(canvas.getByRole('radio', { name: /Very active/ })).toBeChecked();
    await expect(args.onContinue).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }));
    await expect(args.onContinue).toHaveBeenCalledTimes(1);
  },
};

export const Goal: Story = {
  name: 'Your goal — 3/3, Review estimate',
  args: { step: 'goal', initial: filledEstimateDraft },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Step 3 of 3')).toBeInTheDocument();
    await expect(canvas.getByRole('radio', { name: /Lose weight/ })).toBeChecked();
    await expect(canvas.getByRole('button', { name: 'Review estimate' })).toBeVisible();
  },
};

export const GoalUnsupported: Story = {
  name: 'Your goal — a loss target under the floor is explained at selection',
  args: { step: 'goal', initial: floorGoalDraft },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/would be under 1,200 kcal a day/)).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Review estimate' }));
    await expect(args.onContinue).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole('button', { name: 'Set it myself' }));
    await expect(args.onUseManual).toHaveBeenCalledTimes(1);
  },
};

export const BackDiscard: Story = {
  name: 'Cancel setup with a dirty draft — Discard changes? keeps the draft unless confirmed',
  args: { initial: filledEstimateDraft, dirty: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel setup' }));
    await expect(await body.findByRole('alertdialog', { name: 'Discard changes?' })).toBeVisible();
    await userEvent.click(body.getByRole('button', { name: 'Keep editing' }));
    await expect(args.onExit).not.toHaveBeenCalled();
    await expect(canvas.getByLabelText('Age')).toHaveValue('34');
  },
};

export const AboutNarrowEnlarged: Story = {
  name: 'About you — 320 at 200 %',
  args: { initial: filledEstimateDraft },
  decorators: [withRootFontSize(200)],
  play: async () => {
    await expectNoHorizontalOverflow();
  },
};
