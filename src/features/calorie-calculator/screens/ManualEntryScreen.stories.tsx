import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { expectNoHorizontalOverflow, withRootFontSize } from '../../../design-system/storybook/decorators';
import type { PhotoDraft } from '../components/PhotoField';
import { barcodeCatalogue } from '../domain/fixtures';
import { draftFromCandidate, EMPTY_MANUAL_DRAFT, type ManualDraft } from '../domain/manual-entry';
import { ManualEntryScreen, type ManualEntryScreenProps } from './ManualEntryScreen';

type HarnessProps = Partial<Pick<ManualEntryScreenProps, 'initialDraft' | 'provenanceNote' | 'onContinue' | 'onCancel'>> & { initialDraft?: ManualDraft; initialPhoto?: PhotoDraft | null };

/** Holds the task-level draft the way App does, so the screen stays controlled. */
function Harness({ initialDraft = EMPTY_MANUAL_DRAFT, initialPhoto = null, provenanceNote, onContinue = fn(), onCancel = fn() }: HarnessProps) {
  const [draft, setDraft] = useState(initialDraft);
  const [photo, setPhoto] = useState<PhotoDraft | null>(initialPhoto);
  return <ManualEntryScreen draft={draft} onDraftChange={setDraft} photo={photo} onPhotoChange={setPhoto} initialDraft={initialDraft} provenanceNote={provenanceNote} candidateId="manual-story" onContinue={onContinue} onCancel={onCancel} />;
}

const meta = {
  title: 'Product compositions/Manual entry (S06)',
  component: ManualEntryScreen,
  args: { draft: EMPTY_MANUAL_DRAFT, onDraftChange: fn(), photo: null, onPhotoChange: fn(), initialDraft: EMPTY_MANUAL_DRAFT, candidateId: 'manual-story', onContinue: fn(), onCancel: fn() },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'S06 — Step 1 of 2, food details (ledger §12 D1, after R3): name, an optional local photo, a positive reference amount with a supported unit, calories (required; 0 is a value) and optional macros where blank stays unknown. Validation runs on Continue and focuses the first invalid field. The draft is owned by the task, so Back / Edit from the second step keeps it. Back and Cancel apply the shared exit policy: an untouched form leaves at once; meaningful input opens the shared Discard changes? confirmation with Keep editing focused.',
      },
    },
  },
} satisfies Meta<typeof ManualEntryScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  render: (args) => <Harness onContinue={args.onContinue} onCancel={args.onCancel} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Step 1 of 2')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Add a photo' })).toBeVisible();
    // Untouched entry leaves directly — no confirmation.
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await expect(args.onCancel).toHaveBeenCalledTimes(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    await expect(args.onCancel).toHaveBeenCalledTimes(2);
  },
};

export const ValidationOnContinue: Story = {
  name: 'Validation on Continue',
  render: (args) => <Harness onContinue={args.onContinue} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Continue to portion' }));
    await expect(args.onContinue).not.toHaveBeenCalled();
    const name = canvas.getByLabelText('Food or dish name');
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await expect(document.activeElement).toBe(name);
    await expect(canvas.getByRole('alert')).toHaveTextContent('Check the 2 highlighted fields before continuing.');
    await expect(canvas.getByLabelText(/^Protein/)).not.toHaveAttribute('aria-invalid');
  },
};

export const Completed: Story = {
  name: 'Completed entry continues to the portion step',
  render: (args) => <Harness onContinue={args.onContinue} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Food or dish name'), 'Lentil soup');
    await userEvent.type(canvas.getByLabelText('Calories'), '150');
    await userEvent.type(canvas.getByLabelText(/^Protein/), '8');
    await userEvent.type(canvas.getByLabelText(/^Fat/), '0');
    await userEvent.click(canvas.getByRole('button', { name: 'Continue to portion' }));
    await expect(args.onContinue).toHaveBeenCalledTimes(1);
    const candidate = (args.onContinue as ReturnType<typeof fn>).mock.calls[0][0];
    await expect(candidate.id).toBe('manual-story');
    await expect(candidate.name).toBe('Lentil soup');
    // A known zero is a value; a blank optional field stays unknown.
    await expect(candidate.nutrition).toEqual({ energyKcal: 150, proteinG: 8, carbohydratesG: null, fatG: 0 });
    await expect(candidate.reference).toEqual({ quantity: 100, unitId: 'g' });
  },
};

export const DirtyDraftAsksBeforeLeaving: Story = {
  name: 'Dirty draft — Cancel and Back ask; Keep editing and Escape preserve it',
  render: (args) => <Harness onCancel={args.onCancel} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Food or dish name'), 'Oat');
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    const dialog = canvas.getByRole('alertdialog', { name: 'Discard changes?' });
    await expect(dialog).toBeVisible();
    await expect(within(dialog).getByRole('button', { name: 'Keep editing' })).toHaveFocus();
    await expect(within(dialog).getByText(/Nothing already logged will be changed/)).toBeVisible();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Keep editing' }));
    await expect(args.onCancel).not.toHaveBeenCalled();
    await expect(canvas.getByLabelText('Food or dish name')).toHaveValue('Oat');
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    await userEvent.keyboard('{Escape}');
    await expect(args.onCancel).not.toHaveBeenCalled();
    await expect(canvas.getByLabelText('Food or dish name')).toHaveValue('Oat');
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Discard changes' }));
    await expect(args.onCancel).toHaveBeenCalledTimes(1);
  },
};

export const CorrectionFromBarcode: Story = {
  name: 'Correction draft — values prefilled from a barcode match',
  render: (args) => <Harness initialDraft={draftFromCandidate(barcodeCatalogue['5012345678900'])} provenanceNote="Editing the values matched from barcode 5012345678900. Your edits become your own entry; the original record is unchanged." onCancel={args.onCancel} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText('Food or dish name')).toHaveValue('Oat drink, unsweetened');
    await expect(canvas.getByLabelText('Calories')).toHaveValue('43');
    await expect(canvas.getByRole('button', { name: 'Change unit, currently ml' })).toBeInTheDocument();
    await expect(canvas.getByText(/original record is unchanged/)).toBeVisible();
    // Untouched relative to the prefilled record: leaving needs no confirmation.
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await expect(args.onCancel).toHaveBeenCalledTimes(1);
  },
};

export const ReferenceUnit: Story = {
  name: 'Reference unit chooser',
  render: () => <Harness />,
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
  decorators: [withRootFontSize(200)],
  render: () => <Harness />,
  play: async () => {
    await expectNoHorizontalOverflow();
  },
};

export const Narrow320: Story = {
  name: 'Narrow — 320',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Continue to portion' })).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};
