import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { expectNoHorizontalOverflow, withRootFontSize } from '../../design-system/storybook/decorators';
import { EMPTY_MANUAL_DRAFT } from '../../features/calorie-calculator/domain/manual-entry';
import { FoodReviewScreen } from '../../features/calorie-calculator/screens/FoodReviewScreen';
import { ManualEntryScreen } from '../../features/calorie-calculator/screens/ManualEntryScreen';
import { filledDraft, fixtureCandidate, invalidDraft, manualCandidate, reviewPortion } from './stateFixtures';

const meta = {
  title: 'Product states/Lane D — Manual entry and correction',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Low-fi lane D (180:2): reference data is entered here and the portion being calculated is set in review — the two quantities stay distinct. Covers the empty, filled-with-keyboard and field-error forms, the discard confirmation, the supported-unit chooser and review from manual entry.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const manual = (initialDraft = EMPTY_MANUAL_DRAFT) => <ManualEntryScreen initialDraft={initialDraft} onContinue={fn()} onBack={fn()} />;

export const S06_1: Story = {
  name: 'S06-1 · 180:5 — Manual entry / Empty',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: name, reference basis with its own amount and unit, and calories for that basis; macros optional. Entry: Enter manually from O01 or a recovery action. Fixture: empty draft (reference amount 100 g). Primary action: Continue to review → S06-3 when invalid, S07-6 when valid. Secondary: Back → origin (an untouched form exits at once). Limitation: none.',
      },
    },
  },
  render: () => manual(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Enter manually' })).toBeInTheDocument();
    await expect(canvas.getByLabelText('Food or dish name')).toHaveValue('');
    await expect(canvas.getByRole('heading', { name: 'Reference amount' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Continue to review' })).toBeVisible();
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
          'Purpose: the focused field and Continue stay above the keyboard region; dismissing the keyboard preserves the form. Entry: typing with the software keyboard open. Fixture: a filled draft with the calories field focused. Primary action: Continue to review. Limitation: a real keyboard cannot be scripted; the story emulates the visible area with a 393 × 552 viewport, and the runtime relies on the layout’s scroll padding (ledger D-7).',
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
    await expect(canvas.getByRole('button', { name: 'Continue to review' })).toBeVisible();
  },
};

export const S06_3: Story = {
  name: 'S06-3 · 180:71 — Manual entry / Field error',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: validation beside the offending field; every other value is kept and the first invalid field receives focus. Entry: Continue with invalid data. Fixture: reference amount “abc”, calories blank. Primary action: fix, then Continue to review → S07-6. Limitation: the play function submits the invalid draft; the capture shows the result.',
      },
    },
  },
  render: () => manual(invalidDraft),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Continue to review' }));
    await expect(canvas.getByRole('alert')).toHaveTextContent('Check the 2 highlighted fields before continuing.');
    await expect(canvas.getByLabelText('Amount')).toHaveFocus();
    await expect(canvas.getByLabelText('Food or dish name')).toHaveValue('Lentil soup');
  },
};

export const O03: Story = {
  name: 'O03 · 180:111 — Discard unsaved entry',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: asked only when there is meaningful unsaved input; Keep editing is the safe default. Entry: Back on a dirty manual draft. Fixture: a filled draft. Primary action: Keep editing → the form unchanged. Secondary: Discard → origin, draft dropped. Limitation: none.',
      },
    },
  },
  render: () => manual(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Meaningful unsaved input: the name and calories were typed into an empty form.
    await userEvent.type(canvas.getByLabelText('Food or dish name'), 'Lentil soup');
    await userEvent.type(canvas.getByLabelText('Calories'), '450');
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    const dialog = await canvas.findByRole('alertdialog', { name: 'Discard this entry?' });
    await expect(within(dialog).getByRole('button', { name: 'Keep editing' })).toHaveFocus();
    await expect(within(dialog).getByRole('button', { name: 'Discard' })).toBeVisible();
  },
};

export const O04: Story = {
  name: 'O04 · 180:134 — Supported unit chooser',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: only conversions the data supports are offered; the selection is marked, not implied by colour. Entry: the unit control in review or manual entry. Fixture: fixture C with g and serving (1 serving = 300 g). Primary action: Confirm → applies and re-expresses the amount. Secondary: Cancel → prior unit. Limitation: none.',
      },
    },
  },
  render: () => <FoodReviewScreen candidate={fixtureCandidate} mode="new" initialPortion={reviewPortion} onBack={fn()} onChangeMatch={fn()} onAddToToday={fn()} onDone={fn()} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Change unit, currently g' }));
    const dialog = await canvas.findByRole('dialog');
    await expect(within(dialog).getByRole('radio', { name: /^g$/ })).toBeChecked();
    await expect(within(dialog).getByText('1 serving = 300 g')).toBeVisible();
    await expect(within(dialog).getByRole('button', { name: 'Confirm' })).toBeVisible();
    await expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeVisible();
  },
};

export const S07_6: Story = {
  name: 'S07-6 · 180:162 — Food review / From manual entry',
  parameters: {
    docs: {
      description: {
        story:
          'Purpose: the entered reference basis and the desired portion are separate groups; a value left blank stays unknown, never zero. Entry: Continue with a valid draft. Fixture: Lentil soup, 1 serving = reference, 450 kcal, carbohydrates unknown. Primary action: Add to today. Secondary: Change food → the form with input intact; Done. Limitation: none.',
      },
    },
  },
  render: () => <FoodReviewScreen candidate={manualCandidate} mode="new" onBack={fn()} onChangeMatch={fn()} onAddToToday={fn()} onDone={fn()} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Entered by you/)).toBeVisible();
    await expect(canvas.getByText('Nutrition basis: per 1 serving')).toBeVisible();
    await expect(canvas.getAllByText('Not available').length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getByText('450')).toBeVisible();
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
    await userEvent.click(canvas.getByRole('button', { name: 'Continue to review' }));
    await expect(canvas.getByRole('alert')).toBeVisible();
    await expectNoHorizontalOverflow();
  },
};
