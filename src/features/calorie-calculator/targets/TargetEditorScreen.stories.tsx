import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test';

import { expectNoHorizontalOverflow, withIPhone16PortraitSafeAreas, withRootFontSize } from '../../../design-system/storybook/decorators';
import type { DailyGoal } from '../domain/daily-log';
import type { GoalPeriod } from '../domain/goal-history';
import { TargetEditorScreen, type EditorMode, type SaveOutcome } from './TargetEditorScreen';
import { draftSnapshot, type TargetsDraft } from './targets-draft';
import { adjustedDraft, editEstimatedDraft, editManualDraft, ESTIMATED_GOAL, FIXTURE_TODAY, MANUAL_GOAL, manualDraft, PENDING_PERIOD, reviewedDraft } from './targets-fixtures';

interface HarnessProps {
  mode: EditorMode;
  initial: () => TargetsDraft;
  current?: DailyGoal | null;
  pending?: GoalPeriod | null;
  /** Overrides the computed dirtiness (the app measures it against the task's start, not the story's). */
  dirty?: boolean;
  onSave?: () => SaveOutcome;
  onBack?: () => void;
  onExit?: () => void;
  onEditDetails?: () => void;
  onRecalculate?: () => void;
  onRemove?: () => void;
  onCancelPending?: () => void;
  initialAdjusting?: boolean;
  initialHelpOpen?: boolean;
  initialRemoveOpen?: boolean;
  initialSaveError?: string;
}

const saved = (): SaveOutcome => ({ ok: true });

function Harness({ mode, initial, current = null, pending = null, dirty, onSave = fn(saved), onBack = fn(), onExit = fn(), ...rest }: HarnessProps) {
  const [start] = useState(initial);
  const [draft, setDraft] = useState(start);
  return <TargetEditorScreen mode={mode} draft={draft} onDraftChange={setDraft} current={current} pending={pending} todayKey={FIXTURE_TODAY} dirty={dirty ?? draftSnapshot(draft) !== draftSnapshot(start)} onSave={onSave} onBack={onBack} onExit={onExit} {...rest} />;
}

const meta = {
  title: 'Product compositions/Targets/Target editor',
  component: Harness,
  args: { mode: 'review', initial: reviewedDraft, onSave: fn(saved), onBack: fn(), onExit: fn(), onEditDetails: fn(), onCancelPending: fn() },
  decorators: [withIPhone16PortraitSafeAreas],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The one editor every route ends in (ledger §14). **Review** presents the estimate as the result — a small *Estimated* label, the centred 40/48 figure with *kcal/day*, Adjust in place, the goal · activity summary with Edit details. **Manual** and **Edit** show the calories as a field; Edit adds the compact source row (Recalculate for an estimate, Estimate instead for a manual target) and *Remove targets*. All share the nutrition preference with its nutrient rows, the effective-date control (*Starts Today · Change*), the one scheduled change with its cancel action, and a single *Save targets* with a quiet Cancel beneath. A refused save keeps the draft and offers Try again.',
      },
    },
  },
} satisfies Meta<typeof Harness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Review: Story = {
  name: 'Review — the estimate as the result (1,699 kcal/day)',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Your daily target' })).toBeInTheDocument();
    await expect(canvas.queryByText(/Step \d of 3/)).toBeNull();
    await expect(canvas.getByText('Estimated')).toBeVisible();
    await expect(canvas.getByText('1,699')).toBeVisible();
    await expect(canvas.getByText('kcal/day')).toBeVisible();
    await expect(canvas.getByText('An estimate you can adjust.')).toBeVisible();
    await expect(canvas.getByText('Lose weight · Lightly active')).toBeVisible();
    await expect(canvas.getByText('Starts')).toBeVisible();
    await expect(canvas.getByText('From today until you change it.')).toBeVisible();
    await expect(canvas.getByText('85 g')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Edit details' }));
    await expect(args.onEditDetails).toHaveBeenCalledTimes(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Save targets' }));
    await expect(args.onSave).toHaveBeenCalledTimes(1);
    await expectNoHorizontalOverflow();
  },
};

export const ReviewAdjust: Story = {
  name: 'Review — Adjust edits the number in place and labels it adjusted',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Adjust' }));
    const field = canvas.getByLabelText('Daily calories');
    await expect(field).toHaveFocus();
    await expect(field).toHaveValue('1699');
    await expect(canvas.queryByText('1,699')).toBeNull();
    await userEvent.clear(field);
    await userEvent.type(field, '1650');
    await expect(canvas.getByText('Adjusted from the estimate')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Done' }));
    await expect(canvas.getByText('1,650')).toBeVisible();
    await expect(canvas.getByText('83 g')).toBeVisible();
  },
};

export const ReviewAdjusted: Story = {
  name: 'Review — an adjusted value (1,650) stays labelled',
  args: { initial: adjustedDraft },
};

export const Manual: Story = {
  name: 'Manual — new targets entered by hand',
  args: { mode: 'manual', initial: manualDraft },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Set daily targets' })).toBeInTheDocument();
    await expect(canvas.getByLabelText('Daily calories')).toHaveValue('2000');
    await expect(canvas.getByText('100 g')).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'Remove targets' })).toBeNull();
    await userEvent.click(canvas.getByRole('radio', { name: 'Custom' }));
    await expect(canvas.getByLabelText(/^Protein/)).toHaveValue('');
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel setup' }));
    const dialog = await within(canvasElement.ownerDocument.body).findByRole('alertdialog', { name: 'Discard changes?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Discard changes' }));
    await expect(args.onExit).toHaveBeenCalledTimes(1);
  },
};

export const ManualInvalid: Story = {
  name: 'Manual — a blank calorie target is refused beside the field',
  args: { mode: 'manual', initial: () => ({ ...manualDraft(), kcal: '' }) },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Save targets' }));
    await expect(canvas.getByText('Enter a daily calorie target')).toBeVisible();
    await expect(canvas.getByLabelText('Daily calories')).toHaveFocus();
    await expect(args.onSave).not.toHaveBeenCalled();
  },
};

export const EditEstimated: Story = {
  name: 'Edit — a saved estimate: source row, Recalculate, Remove targets',
  args: { mode: 'edit', initial: editEstimatedDraft, current: ESTIMATED_GOAL, onRecalculate: fn(), onRemove: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Edit targets' })).toBeInTheDocument();
    await expect(canvas.getByText(/Estimated · Lose weight · Lightly active/)).toBeVisible();
    await expect(canvas.getByLabelText('Daily calories')).toHaveValue('1699');
    await userEvent.click(canvas.getByRole('button', { name: 'Recalculate' }));
    await expect(args.onRecalculate).toHaveBeenCalledTimes(1);
    await expect(canvas.getByRole('button', { name: 'Cancel changes' })).toBeVisible();
  },
};

export const EditManual: Story = {
  name: 'Edit — a manual target offers Estimate instead',
  args: { mode: 'edit', initial: editManualDraft, current: MANUAL_GOAL, onRecalculate: fn(), onRemove: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Entered by you')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Estimate instead' }));
    await expect(args.onRecalculate).toHaveBeenCalledTimes(1);
  },
};

export const Scheduled: Story = {
  name: 'Edit — a scheduled change stated once, with Cancel scheduled change',
  args: { mode: 'edit', initial: editEstimatedDraft, current: ESTIMATED_GOAL, pending: PENDING_PERIOD, onRemove: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('From today until Sep 11, when your scheduled change starts.')).toBeVisible();
    await expect(canvas.getByText(/Scheduled: 1,800 kcal from/)).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel scheduled change' }));
    await expect(args.onCancelPending).toHaveBeenCalledTimes(1);
  },
};

export const FutureStart: Story = {
  name: 'Effective date — Change reveals the date; a future start keeps the current targets until then',
  args: { mode: 'edit', initial: editEstimatedDraft, current: ESTIMATED_GOAL, onRemove: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Change' }));
    const date = canvas.getByLabelText('Start date');
    await expect(date).toHaveAttribute('min', FIXTURE_TODAY);
    await fireEvent.change(date, { target: { value: '2026-09-11' } });
    await expect(canvas.getByText('Starts Friday, September 11. Your current targets stay until then.')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Use today' }));
    await expect(canvas.getByText('From today until you change it.')).toBeVisible();
  },
};

export const RemoveConfirm: Story = {
  name: 'Remove daily targets — confirmation names the scheduled change too',
  args: { mode: 'edit', initial: editEstimatedDraft, current: ESTIMATED_GOAL, pending: PENDING_PERIOD, onRemove: fn(), initialRemoveOpen: true },
  play: async ({ canvasElement, args }) => {
    const body = within(canvasElement.ownerDocument.body);
    const dialog = await body.findByRole('alertdialog', { name: 'Remove daily targets' });
    await expect(within(dialog).getByText(/Food, water and past targets will stay\. This also cancels the change scheduled for/)).toBeVisible();
    await expect(within(dialog).getByRole('button', { name: 'Keep targets' })).toHaveFocus();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Remove targets' }));
    await expect(args.onRemove).toHaveBeenCalledTimes(1);
  },
};

export const SaveFailed: Story = {
  name: 'Save failed — the draft stays, Try again',
  args: { mode: 'manual', initial: manualDraft, initialSaveError: 'Portion could not store the targets on this device. Free some space or leave private browsing, then try again.' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Not saved')).toBeVisible();
    await expect(canvas.getByLabelText('Daily calories')).toHaveValue('2000');
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
    await expect(args.onSave).toHaveBeenCalledTimes(1);
  },
};

export const Help: Story = {
  name: 'Help — How targets apply',
  args: { mode: 'edit', initial: editEstimatedDraft, current: ESTIMATED_GOAL, onRemove: fn(), initialHelpOpen: true },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const dialog = await body.findByRole('dialog', { name: 'How targets apply' });
    await expect(within(dialog).getByText(/Targets apply from their start date/)).toBeVisible();
  },
};

export const DiscardChanges: Story = {
  name: 'Cancel changes with edits — Discard changes? with the targets wording',
  args: { mode: 'edit', initial: () => ({ ...editEstimatedDraft(), kcal: '1600' }), current: ESTIMATED_GOAL, onRemove: fn(), dirty: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel changes' }));
    const dialog = await body.findByRole('alertdialog', { name: 'Discard changes?' });
    await expect(within(dialog).getByText('Your unsaved target changes will be lost. Saved targets, food and water stay.')).toBeVisible();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Discard changes' }));
    await expect(args.onExit).toHaveBeenCalledTimes(1);
  },
};

export const ReviewNarrowEnlarged: Story = {
  name: 'Review — 320 at 200 %',
  decorators: [withRootFontSize(200)],
  play: async () => {
    await expectNoHorizontalOverflow();
  },
};

export const ReducedMotion: Story = {
  name: 'Reduced motion — the help dialog opens without transition',
  args: { initialHelpOpen: true },
  parameters: { chromatic: { prefersReducedMotion: 'reduce' } },
  globals: { reducedMotion: true },
};
