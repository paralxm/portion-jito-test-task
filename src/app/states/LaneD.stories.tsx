import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { expectNoHorizontalOverflow, withRootFontSize } from '../../design-system/storybook/decorators';
import type { PhotoDraft } from '../../features/calorie-calculator/components/PhotoField';
import { barcodeCatalogue } from '../../features/calorie-calculator/domain/fixtures';
import { draftFromCandidate, EMPTY_MANUAL_DRAFT, type ManualDraft } from '../../features/calorie-calculator/domain/manual-entry';
import { ManualEntryScreen } from '../../features/calorie-calculator/screens/ManualEntryScreen';
import { ManualPortionScreen } from '../../features/calorie-calculator/screens/ManualPortionScreen';
import { filledDraft, invalidDraft, manualCandidate } from './stateFixtures';

const meta = {
  title: 'Product states/Lane D — Manual entry and correction',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Low-fi lane D (180:2) as a real two-step task (ledger §12 D1–D3, after R3 and R4): step 1 establishes the reference data (with an optional local photo), step 2 the actual portion, the meal and the day — the two quantities stay distinct and the draft survives Back / Edit between them. Covers the empty, filled-with-keyboard and field-error forms, the shared Discard changes? confirmation, the supported-unit chooser, the correction draft prefilled from a barcode match, and the portion step.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Step 1 with the task-level draft held locally, the way App holds it. */
function Manual({ initialDraft = EMPTY_MANUAL_DRAFT, provenanceNote }: { initialDraft?: ManualDraft; provenanceNote?: string }) {
  const [draft, setDraft] = useState(initialDraft);
  const [photo, setPhoto] = useState<PhotoDraft | null>(null);
  return <ManualEntryScreen draft={draft} onDraftChange={setDraft} photo={photo} onPhotoChange={setPhoto} initialDraft={initialDraft} provenanceNote={provenanceNote} candidateId="manual-lane-d" onContinue={fn()} onCancel={fn()} />;
}

const manual = (initialDraft = EMPTY_MANUAL_DRAFT) => <Manual initialDraft={initialDraft} />;

export const S06_1: Story = {
  name: 'S06-1 · 180:5 — Manual entry / Step 1 · Empty',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: name, an optional photo, the reference basis with its own amount and unit, and calories for that basis; macros optional with “blank means unknown” beside them, never above the required calories. Entry: Enter manually from O01 or a recovery action. Fixture: empty draft (reference amount 100 g). Primary action: Continue to portion → S06-3 when invalid, S06-5 when valid. Secondary: Cancel / Back → origin (an untouched form exits at once). Limitation: none.',
      },
    },
  },
  render: () => manual(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Food details' })).toBeInTheDocument();
    await expect(canvas.getByText('Step 1 of 2')).toBeVisible();
    await expect(canvas.getByLabelText('Food or dish name')).toHaveValue('');
    await expect(canvas.getByRole('button', { name: 'Add a photo' })).toBeVisible();
    await expect(canvas.getByRole('heading', { name: 'Reference amount' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Continue to portion' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(canvas.queryByRole('navigation')).toBeNull();
  },
};

export const S06_2: Story = {
  name: 'S06-2 · 180:43 — Manual entry / Filled · keyboard inset',
  globals: { viewport: { value: 'keyboardInset', isRotated: false } },
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: the focused field and Continue stay above the keyboard region; dismissing the keyboard preserves the form. Entry: typing with the software keyboard open. Fixture: a filled draft with the calories field focused. Primary action: Continue to portion. Limitation: a real keyboard cannot be scripted; the story emulates the visible area with a 393 × 552 viewport, and the runtime relies on the layout’s scroll padding (ledger D-7).',
      },
    },
  },
  render: () => manual(filledDraft),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const calories = canvas.getByLabelText('Calories');
    calories.focus();
    await expect(calories).toHaveFocus();
    await expect(calories).toHaveValue('450');
    const rect = calories.getBoundingClientRect();
    await expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight);
    await expect(canvas.getByRole('button', { name: 'Continue to portion' })).toBeVisible();
  },
};

export const S06_3: Story = {
  name: 'S06-3 · 180:71 — Manual entry / Field error',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: validation beside the offending field; every other value is kept and the first invalid field receives focus. Entry: Continue with invalid data. Fixture: reference amount “abc”, calories blank. Primary action: fix, then Continue to portion → S06-5. Limitation: the play function submits the invalid draft; the capture shows the result.',
      },
    },
  },
  render: () => manual(invalidDraft),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Continue to portion' }));
    await expect(canvas.getByRole('alert')).toHaveTextContent('Check the 2 highlighted fields before continuing.');
    await expect(canvas.getByLabelText('Amount')).toHaveFocus();
    await expect(canvas.getByLabelText('Food or dish name')).toHaveValue('Lentil soup');
  },
};

export const O03: Story = {
  name: 'O03 · 180:111 — Discard changes? on a dirty first step',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: the shared exit confirmation (O08 copy), asked only when there is meaningful unsaved input; Keep editing is the safe default and receives focus. Entry: Cancel or Back on a dirty manual draft. Fixture: name and calories typed into an empty form. Primary action: Keep editing → the form unchanged. Secondary: Discard changes → origin, draft dropped. Limitation: none.',
      },
    },
  },
  render: () => manual(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Food or dish name'), 'Lentil soup');
    await userEvent.type(canvas.getByLabelText('Calories'), '450');
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    const dialog = await canvas.findByRole('alertdialog', { name: 'Discard changes?' });
    await expect(within(dialog).getByRole('button', { name: 'Keep editing' })).toHaveFocus();
    await expect(within(dialog).getByRole('button', { name: 'Discard changes' })).toBeVisible();
  },
};

export const O04: Story = {
  name: 'O04 · 180:134 — Supported unit chooser',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: only conversions the data supports are offered; the selection is marked, not implied by colour. Entry: the unit control in the portion step or in step 1. Fixture: the manual candidate on its serving basis (one supported unit, so step 2 offers no chooser) — the story opens step 1’s reference-unit chooser instead. Primary action: Confirm → applies. Secondary: Cancel → prior unit. Limitation: none.',
      },
    },
  },
  render: () => manual(filledDraft),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Change unit, currently g' }));
    const dialog = await canvas.findByRole('dialog');
    await expect(within(dialog).getByRole('radio', { name: /Grams/ })).toBeChecked();
    await expect(within(dialog).getByRole('radio', { name: /serving/ })).not.toBeChecked();
    await expect(within(dialog).getByRole('button', { name: 'Confirm' })).toBeVisible();
    await expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeVisible();
  },
};

export const S06_4: Story = {
  name: 'S06-4 — Manual entry / Correction draft from a barcode match',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: Edit label values on a barcode (or photo) result opens step 1 prefilled with the matched record’s values, as a manual override that keeps its provenance and never changes the catalogue (ledger §12 E1). Entry: Edit label values on S07-4 / Edit nutrition values on S07-5. Fixture: the oat drink matched from barcode 5012345678900. Primary action: Continue to portion → S06-5. Secondary: Cancel (no confirmation while nothing was edited). Limitation: none.',
      },
    },
  },
  render: () => <Manual initialDraft={draftFromCandidate(barcodeCatalogue['5012345678900'])} provenanceNote="Editing the values matched from barcode 5012345678900. Your edits become your own entry; the original record is unchanged." />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText('Food or dish name')).toHaveValue('Oat drink, unsweetened');
    await expect(canvas.getByLabelText('Calories')).toHaveValue('43');
    await expect(canvas.getByText(/original record is unchanged/)).toBeVisible();
  },
};

export const S06_5: Story = {
  name: 'S06-5 — Manual entry / Step 2 · Portion and meal',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: the identity summary with Edit food details, the actual portion as a direct input with − / + steps and the item’s own presets, the live result, the meal and one final Add to {meal} (after R4, ledger §12 D2). Entry: Continue to portion with a valid draft. Fixture: Lentil soup, 1 serving = reference, 450 kcal, carbohydrates unknown; lunch suggested. Primary action: Add to lunch → one entry, Home. Secondary: Edit food details / Back → S06-1 with everything kept; Cancel → O08. Limitation: none.',
      },
    },
  },
  render: () => <ManualPortionScreen candidate={manualCandidate} initialPortion={{ quantity: 1, unitId: 'serving' }} initialMeal="lunch" mealHint="Suggested for this time of day. Change it if you like." onEditDetails={fn()} onAdd={fn()} onCancel={fn()} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Portion and meal' })).toBeInTheDocument();
    await expect(canvas.getByText('Step 2 of 2')).toBeVisible();
    await expect(canvas.getByText(/Entered by you/)).toBeVisible();
    await expect(canvas.getByText('450')).toBeVisible();
    await expect(canvas.getAllByText('Not available').length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getByRole('button', { name: 'Edit food details' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Increase by a quarter serving' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Add to lunch' })).toBeEnabled();
  },
};

export const S06_1_Narrow320: Story = {
  name: 'S06-1 at 320',
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  render: () => manual(),
  play: async () => {
    await expectNoHorizontalOverflow();
  },
};

export const S06_3_EnlargedText: Story = {
  name: 'S06-3 at 200 % text',
  decorators: [withRootFontSize(200)],
  render: () => manual(invalidDraft),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Continue to portion' }));
    await expect(canvas.getByRole('alert')).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};

export const S06_5_EnlargedText: Story = {
  name: 'S06-5 at 200 % text',
  decorators: [withRootFontSize(200)],
  render: () => <ManualPortionScreen candidate={manualCandidate} initialPortion={{ quantity: 1, unitId: 'serving' }} initialMeal="lunch" onEditDetails={fn()} onAdd={fn()} onCancel={fn()} />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Add to lunch' })).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};
