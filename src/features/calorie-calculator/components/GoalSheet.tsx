import { useEffect, useRef, useState } from 'react';

import { AmountField } from '../../../design-system/components/AmountField/AmountField';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Inline } from '../../../design-system/primitives/layout/Inline';
import { Stack } from '../../../design-system/primitives/layout/Stack';
import { Text } from '../../../design-system/primitives/Text/Text';
import { ModalSheet } from '../../../design-system/patterns/ModalSheet/ModalSheet';
import { parseGoalDraft, parseTargetDraft, type DailyGoal } from '../domain/daily-log';

export interface GoalSheetProps {
  open: boolean;
  /** The committed goal; the draft starts from it and Cancel restores it. */
  goal: DailyGoal | null;
  /** Apply with a valid positive calorie goal and optional targets. */
  onApply: (goal: DailyGoal) => void;
  /** Explicit clear: Home returns to "no goal". */
  onClear: () => void;
  onCancel: () => void;
}

const ERRORS = {
  empty: 'Enter a goal in calories, or cancel to keep things as they are',
  invalid: 'Enter a number of calories, for example 2000',
  'not-positive': 'Enter a goal greater than zero',
} as const;

const TARGET_ERRORS = {
  invalid: 'Enter a number of grams, or leave it blank',
  'not-positive': 'Enter a target greater than zero, or leave it blank',
} as const;

type TargetKey = 'proteinG' | 'carbohydratesG' | 'fatG';
const TARGETS: ReadonlyArray<{ key: TargetKey; label: string }> = [
  { key: 'proteinG', label: 'Protein' },
  { key: 'carbohydratesG', label: 'Carbohydrates' },
  { key: 'fatG', label: 'Fat' },
];

const draftOf = (value: number | null | undefined) => (value === null || value === undefined ? '' : String(value));

/**
 * Home's contextual goal editor (ui-contract §3.2, ledger D-18): an optional, user-entered
 * daily calorie goal with optional macro targets in grams, as a modal draft. Apply
 * validates and commits; an invalid draft stays editable and never replaces the committed
 * value; Cancel (close, backdrop, Escape) keeps the previous goal; Clear goal removes it.
 * Targets are never calculated from the calorie goal. Changing the goal never touches
 * entries or recipe criteria.
 */
export function GoalSheet({ open, goal, onApply, onClear, onCancel }: GoalSheetProps) {
  const [draft, setDraft] = useState(draftOf(goal?.kcal));
  const [targets, setTargets] = useState<Record<TargetKey, string>>({ proteinG: draftOf(goal?.proteinG), carbohydratesG: draftOf(goal?.carbohydratesG), fatG: draftOf(goal?.fatG) });
  const [error, setError] = useState<string | undefined>(undefined);
  const [targetErrors, setTargetErrors] = useState<Partial<Record<TargetKey, string>>>({});
  // Initialised to the mount state: the state initialisers above already reflect the props,
  // so only a later closed-to-open transition resets the draft (a passive effect on mount
  // could otherwise run after a script had already typed into the field).
  const wasOpen = useRef(open);

  // The draft starts from the committed goal each time the sheet opens, never on a later re-render.
  useEffect(() => {
    if (open && !wasOpen.current) {
      setDraft(draftOf(goal?.kcal));
      setTargets({ proteinG: draftOf(goal?.proteinG), carbohydratesG: draftOf(goal?.carbohydratesG), fatG: draftOf(goal?.fatG) });
      setError(undefined);
      setTargetErrors({});
    }
    wasOpen.current = open;
  }, [open, goal]);

  const apply = () => {
    const parsed = parseGoalDraft(draft);
    const nextErrors: Partial<Record<TargetKey, string>> = {};
    const parsedTargets: Partial<Record<TargetKey, number | null>> = {};
    for (const { key } of TARGETS) {
      const result = parseTargetDraft(targets[key]);
      if (result.ok) parsedTargets[key] = result.grams;
      else nextErrors[key] = TARGET_ERRORS[result.reason];
    }
    setError(parsed.ok ? undefined : ERRORS[parsed.reason]);
    setTargetErrors(nextErrors);
    if (!parsed.ok || Object.keys(nextErrors).length > 0) return;
    onApply({ kcal: parsed.kcal, proteinG: parsedTargets.proteinG ?? null, carbohydratesG: parsedTargets.carbohydratesG ?? null, fatG: parsedTargets.fatG ?? null });
  };

  return (
    <ModalSheet
      open={open}
      onRequestClose={onCancel}
      title={goal === null ? 'Set goal' : 'Edit goal'}
      description="Optional. The goal only changes what Home shows as remaining; targets are yours to enter and are never calculated for you. Entries and recipe filters stay as they are."
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
        <Stack gap={12}>
          <Stack gap={4}>
            <Text as="h3" variant="label" color="primary">
              Targets
            </Text>
            <Text as="p" variant="supporting" color="secondary" wrap>
              Optional grams per day for each macronutrient. Leave a field blank to show the logged amount alone.
            </Text>
          </Stack>
          {TARGETS.map(({ key, label }) => (
            <AmountField
              key={key}
              label={label}
              optional
              value={targets[key]}
              onChange={(value) => {
                setTargets((t) => ({ ...t, [key]: value }));
                if (targetErrors[key]) setTargetErrors((e) => ({ ...e, [key]: undefined }));
              }}
              unit="g"
              placeholder="None"
              error={targetErrors[key]}
            />
          ))}
        </Stack>
        {goal !== null ? (
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
