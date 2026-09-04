import { useEffect, useState } from 'react';

import { AmountField } from '../../../design-system/components/AmountField/AmountField';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Inline } from '../../../design-system/primitives/layout/Inline';
import { Stack } from '../../../design-system/primitives/layout/Stack';
import { ModalSheet } from '../../../design-system/patterns/ModalSheet/ModalSheet';
import { parseGoalDraft } from '../domain/daily-log';

export interface GoalSheetProps {
  open: boolean;
  /** The committed goal; the draft starts from it and Cancel restores it. */
  goalKcal: number | null;
  /** Apply with a valid positive value. */
  onApply: (kcal: number) => void;
  /** Explicit clear: Home returns to "no goal". */
  onClear: () => void;
  onCancel: () => void;
}

const ERRORS = {
  empty: 'Enter a goal in calories, or cancel to keep things as they are',
  invalid: 'Enter a number of calories, for example 2000',
  'not-positive': 'Enter a goal greater than zero',
} as const;

/**
 * Home's contextual goal editor (ui-contract §3.2): an optional, user-entered daily
 * calorie goal as a modal draft. Apply validates and commits; an invalid draft stays
 * editable and never replaces the committed value; Cancel (close, backdrop, Escape)
 * keeps the previous goal; Clear goal removes it explicitly. Changing the goal never
 * touches entries or recipe criteria.
 */
export function GoalSheet({ open, goalKcal, onApply, onClear, onCancel }: GoalSheetProps) {
  const [draft, setDraft] = useState(goalKcal === null ? '' : String(goalKcal));
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (open) {
      setDraft(goalKcal === null ? '' : String(goalKcal));
      setError(undefined);
    }
  }, [open, goalKcal]);

  const apply = () => {
    const parsed = parseGoalDraft(draft);
    if (!parsed.ok) {
      setError(ERRORS[parsed.reason]);
      return;
    }
    onApply(parsed.kcal);
  };

  return (
    <ModalSheet
      open={open}
      onRequestClose={onCancel}
      title={goalKcal === null ? 'Set a daily goal' : 'Edit daily goal'}
      description="Optional. It only changes how much of the day Home shows as remaining; your entries and recipe filters stay as they are."
      footer={
        <Inline gap={8} distribute="fill" align="stretch">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={apply}>
            Apply
          </Button>
        </Inline>
      }
    >
      <Stack gap={16}>
        <AmountField
          label="Daily goal"
          value={draft}
          onChange={(value) => {
            setDraft(value);
            if (error) setError(undefined);
          }}
          unit="kcal"
          placeholder="For example, 2000"
          error={error}
          helper={error ? undefined : 'A number of calories for the whole day.'}
          autoFocus
        />
        {goalKcal !== null ? (
          <div>
            <Button variant="text" size="small" onClick={onClear}>
              Clear goal
            </Button>
          </div>
        ) : null}
      </Stack>
    </ModalSheet>
  );
}
