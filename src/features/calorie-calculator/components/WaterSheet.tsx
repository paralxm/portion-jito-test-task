import { useEffect, useId, useRef, useState } from 'react';

import { AmountField } from '../../../design-system/components/AmountField/AmountField';
import { FilterChip } from '../../../design-system/components/Chip/Chip';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Inline } from '../../../design-system/primitives/layout/Inline';
import { Stack } from '../../../design-system/primitives/layout/Stack';
import { Text } from '../../../design-system/primitives/Text/Text';
import { ModalSheet } from '../../../design-system/patterns/ModalSheet/ModalSheet';
import { formatWater, parseWaterAmount, WATER_ADD_MAX_ML, WATER_GOAL_ML, WATER_PRESETS_ML, WATER_TOTAL_MAX_ML } from '../domain/water';
import styles from './WaterSheet.module.css';

export type WaterSheetMode = 'add' | 'edit-total';

export interface WaterSheetProps {
  open: boolean;
  totalMl: number;
  goalMl?: number;
  /** Adds the chosen amount to today's total and closes. */
  onAdd: (ml: number) => void;
  /** Replaces today's total and closes. */
  onSaveTotal: (ml: number) => void;
  onCancel: () => void;
  /** The day the sheet edits, for its wording: "Today" (default), "Yesterday" or "Thu, Sep 3". */
  dayLabel?: string;
  /** Deterministic starting mode for stories; the runtime always opens in `add`. */
  initialMode?: WaterSheetMode;
}

const ADD_ERRORS = {
  empty: 'Choose an amount or enter one in millilitres',
  invalid: 'Enter whole millilitres, for example 300',
  range: `Enter between 1 and ${WATER_ADD_MAX_ML.toLocaleString('en')} ml`,
} as const;

const TOTAL_ERRORS = {
  empty: "Enter today's total in millilitres, or go back",
  invalid: 'Enter whole millilitres, for example 1250',
  range: `Enter between 0 and ${WATER_TOTAL_MAX_ML.toLocaleString('en')} ml`,
} as const;

/**
 * O06 — the water sheet (ledger D-22). Add mode: four preset amounts as radio chips, a
 * labelled custom amount in ml, and one primary `Add water` that stays unavailable until
 * a preset or a valid custom amount exists. Edit-total mode: today's total as one labelled
 * field with `Save total`. Both are drafts: Cancel, close, backdrop and Escape change
 * nothing; the sheet contains focus and returns it to the opener.
 */
export function WaterSheet({ open, totalMl, goalMl = WATER_GOAL_ML, onAdd, onSaveTotal, onCancel, dayLabel = 'Today', initialMode = 'add' }: WaterSheetProps) {
  const isToday = dayLabel === 'Today';
  const dayPossessive = isToday ? "today's" : `${dayLabel}'s`;
  const [mode, setMode] = useState<WaterSheetMode>(initialMode);
  const [preset, setPreset] = useState<number | null>(null);
  const [custom, setCustom] = useState('');
  const [totalDraft, setTotalDraft] = useState(String(totalMl));
  const [error, setError] = useState<string | undefined>(undefined);
  const submitted = useRef(false);
  // Initialised to the mount state: the state initialisers above already reflect the props,
  // so only a later closed-to-open transition resets the draft (a passive effect on mount
  // could otherwise run after a script had already typed into the field).
  const wasOpen = useRef(open);
  const id = useId();

  // The draft starts from the props each time the sheet opens; a parent re-render while it
  // is open never overwrites what the user has typed.
  useEffect(() => {
    if (open && !wasOpen.current) {
      setMode(initialMode);
      setPreset(null);
      setCustom('');
      setTotalDraft(String(totalMl));
      setError(undefined);
      submitted.current = false;
    }
    wasOpen.current = open;
  }, [open, initialMode, totalMl]);

  const customParse = custom.trim() === '' ? null : parseWaterAmount(custom, { min: 1, max: WATER_ADD_MAX_ML });
  const addValid = preset !== null || (customParse !== null && customParse.ok);
  // A typed amount that cannot be added says why beside the field while the action is unavailable.
  const customError = error ?? (customParse !== null && !customParse.ok ? ADD_ERRORS[customParse.reason] : undefined);
  const totalParse = parseWaterAmount(totalDraft, { min: 0, max: WATER_TOTAL_MAX_ML });

  const add = () => {
    if (submitted.current) return;
    if (preset !== null) {
      submitted.current = true;
      onAdd(preset);
      return;
    }
    const parsed = parseWaterAmount(custom, { min: 1, max: WATER_ADD_MAX_ML });
    if (!parsed.ok) {
      setError(ADD_ERRORS[parsed.reason]);
      return;
    }
    submitted.current = true;
    onAdd(parsed.ml);
  };

  const saveTotal = () => {
    if (submitted.current) return;
    if (!totalParse.ok) {
      setError(TOTAL_ERRORS[totalParse.reason]);
      return;
    }
    submitted.current = true;
    onSaveTotal(totalParse.ml);
  };

  const summary = (
    <div className={styles.summary}>
      <Text as="p" variant="supporting" color="secondary">
        {dayLabel}
      </Text>
      <p className={styles.figure}>
        <Text variant="metric-secondary" numeric color="primary">
          {formatWater(totalMl)}
        </Text>
        <Text variant="supporting" numeric color="secondary">
          of {formatWater(goalMl)}
        </Text>
      </p>
    </div>
  );

  if (mode === 'edit-total') {
    return (
      <ModalSheet
        open={open}
        onRequestClose={onCancel}
        title={`Edit ${dayPossessive} total`}
        description={`Replace the amount recorded for ${isToday ? 'today' : dayLabel}. Nothing else changes.`}
        footer={
          <Inline gap={8} distribute="fill" align="stretch">
            <Button variant="secondary" onClick={() => { setMode('add'); setError(undefined); }}>
              Back to adding
            </Button>
            <Button variant="primary" onClick={saveTotal} disabled={!totalParse.ok && totalDraft.trim() !== ''}>
              Save total
            </Button>
          </Inline>
        }
      >
        <Stack gap={16}>
          {summary}
          <AmountField
            label={`${isToday ? "Today's" : `${dayLabel}'s`} total`}
            value={totalDraft}
            onChange={(value) => {
              setTotalDraft(value);
              if (error) setError(undefined);
            }}
            unit="ml"
            error={error}
            helper={error ? undefined : `Whole millilitres, up to ${WATER_TOTAL_MAX_ML.toLocaleString('en')}.`}
            autoFocus
          />
        </Stack>
      </ModalSheet>
    );
  }

  return (
    <ModalSheet
      open={open}
      onRequestClose={onCancel}
      title="Add water"
      description={`Choose an amount or enter your own${isToday ? '' : ` for ${dayLabel}`}. The daily reference is a default, not advice.`}
      footer={
        <Inline gap={8} distribute="fill" align="stretch">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={add} disabled={!addValid}>
            Add water
          </Button>
        </Inline>
      }
    >
      <Stack gap={16}>
        {summary}
        <fieldset className={styles.group} role="radiogroup" aria-labelledby={`${id}-presets`}>
          <Text as="legend" id={`${id}-presets`} variant="label" color="primary" className={styles.legend}>
            Amount
          </Text>
          <Inline gap={8} wrap block>
            {WATER_PRESETS_ML.map((ml) => (
              <FilterChip
                key={ml}
                selectionRole="radio"
                selected={preset === ml}
                onClick={() => {
                  setPreset(ml);
                  setCustom('');
                  setError(undefined);
                }}
              >
                {ml} ml
              </FilterChip>
            ))}
          </Inline>
        </fieldset>
        <AmountField
          label="Custom amount"
          value={custom}
          onChange={(value) => {
            setCustom(value);
            setPreset(null);
            if (error) setError(undefined);
          }}
          unit="ml"
          placeholder="For example, 300"
          error={customError}
          helper={customError ? undefined : `Whole millilitres, up to ${WATER_ADD_MAX_ML.toLocaleString('en')}.`}
        />
        <div>
          <Button variant="text" size="small" onClick={() => { setMode('edit-total'); setError(undefined); }}>
            Edit {dayPossessive} total
          </Button>
        </div>
      </Stack>
    </ModalSheet>
  );
}
