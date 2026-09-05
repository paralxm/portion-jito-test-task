import { useEffect, useId, useRef, useState } from 'react';
import { Calculator, PencilSimple } from '@phosphor-icons/react';

import { AmountField } from '../../../design-system/components/AmountField/AmountField';
import { InlineMessage } from '../../../design-system/components/InlineMessage/InlineMessage';
import { MethodOption } from '../../../design-system/components/MethodOption/MethodOption';
import { SegmentedControl } from '../../../design-system/components/SegmentedControl/SegmentedControl';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Radio } from '../../../design-system/primitives/Choice/Radio';
import { Stack } from '../../../design-system/primitives/layout/Stack';
import { Text } from '../../../design-system/primitives/Text/Text';
import { ModalSheet } from '../../../design-system/patterns/ModalSheet/ModalSheet';
import { formatKcal, parseGoalDraft, parseTargetDraft, type DailyGoal } from '../domain/daily-log';
import {
  aboutDraftFromRecord,
  ACTIVITY_OPTIONS,
  activityLabel,
  describeEstimateInputs,
  EMPTY_ABOUT_DRAFT,
  estimateRecord,
  estimateTarget,
  GOAL_OPTIONS,
  goalLabel,
  LOSS_DEFICIT_KCAL,
  LOSS_FLOOR_KCAL,
  parseAboutDraft,
  SEX_OPTIONS,
  type AboutDraft,
  type AboutErrors,
  type ActivityLevel,
  type EstimateInputs,
  type EstimateOutcome,
  type Sex,
  type WeightGoal,
} from '../domain/energy-estimate';
import { roundMacros, suggestedMacros, type MacroPreset } from '../domain/macro-presets';
import { DiscardChangesDialog } from './DiscardChangesDialog';
import { EMPTY_CUSTOM, MacroTargetsEditor, TARGET_FIELDS, type CustomGrams, type TargetKey } from './MacroTargetsEditor';
import styles from './TargetsSheet.module.css';

export type TargetsStep = 'entry' | 'manual' | 'about' | 'lifestyle' | 'goal' | 'review';

export interface TargetsSheetProps {
  open: boolean;
  /** The saved targets; the editor starts from them and Cancel keeps them. */
  goal: DailyGoal | null;
  /** Save applies the reviewed values exactly once, from today onward. */
  onSave: (goal: DailyGoal) => void;
  /** Removes the targets from today onward; entries, water and history stay. */
  onRemove: () => void;
  onCancel: () => void;
  /** Deterministic starting step for stories; the runtime starts at the entry sheet (no targets) or the editor (targets set). */
  initialStep?: TargetsStep;
}

const KCAL_ERRORS = {
  empty: 'Enter a daily calorie target, or cancel to keep things as they are',
  invalid: 'Enter a number of calories, for example 2000',
  'not-positive': 'Enter a target greater than zero',
} as const;

const TARGET_ERRORS = {
  invalid: 'Enter a number of grams, or leave it blank',
  'not-positive': 'Enter a target greater than zero, or leave it blank',
} as const;

interface MacroDraft {
  preset: MacroPreset;
  custom: CustomGrams;
}

const draftOf = (value: number | null | undefined) => (value === null || value === undefined ? '' : String(value));

/** The saved targets as drafts: a goal without a preset (older, or calorie-only) is custom, so nothing is suggested that the person did not choose. */
function macroDraftFrom(goal: DailyGoal | null): MacroDraft {
  if (!goal) return { preset: 'balanced', custom: EMPTY_CUSTOM };
  return { preset: goal.preset ?? 'custom', custom: { proteinG: draftOf(goal.proteinG), carbohydratesG: draftOf(goal.carbohydratesG), fatG: draftOf(goal.fatG) } };
}

function parseCustom(custom: CustomGrams): { values: Record<TargetKey, number | null>; errors: Partial<Record<TargetKey, string>> } {
  const values: Record<TargetKey, number | null> = { proteinG: null, carbohydratesG: null, fatG: null };
  const errors: Partial<Record<TargetKey, string>> = {};
  for (const { key } of TARGET_FIELDS) {
    const result = parseTargetDraft(custom[key]);
    if (result.ok) values[key] = result.grams;
    else errors[key] = TARGET_ERRORS[result.reason];
  }
  return { values, errors };
}

/**
 * Set targets / Edit targets (ledger §13.4). Without saved targets the sheet opens on the
 * entry choice — *Help me estimate* or *I know my goal*; with saved targets it opens on
 * the editor with the current values, and re-estimating is an explicit action. The
 * manual path takes a calorie target and a nutrition preference whose grams are
 * suggested from it (or custom grams, any of them unset). The estimate path asks three
 * things — about you, lifestyle, goal — then reviews the estimated target with its
 * assumptions before anything is saved. Back inside the sheet keeps every draft;
 * dismissing it with unsaved edits asks first; Save applies the reviewed values once.
 */
export function TargetsSheet({ open, goal, onSave, onRemove, onCancel, initialStep }: TargetsSheetProps) {
  const startStep = (): TargetsStep => initialStep ?? (goal ? 'manual' : 'entry');
  const [step, setStep] = useState<TargetsStep>(startStep);
  const [kcal, setKcal] = useState(draftOf(goal?.kcal));
  const [macros, setMacros] = useState<MacroDraft>(() => macroDraftFrom(goal));
  const [about, setAbout] = useState<AboutDraft>(() => (goal?.estimate ? aboutDraftFromRecord(goal.estimate) : EMPTY_ABOUT_DRAFT));
  const [activity, setActivity] = useState<ActivityLevel | null>(goal?.estimate?.activity ?? null);
  const [weightGoal, setWeightGoal] = useState<WeightGoal | null>(goal?.estimate?.goal ?? null);
  const [outcome, setOutcome] = useState<{ inputs: EstimateInputs; result: EstimateOutcome } | null>(null);
  const [reviewKcal, setReviewKcal] = useState('');
  const [kcalError, setKcalError] = useState<string | undefined>(undefined);
  const [targetErrors, setTargetErrors] = useState<Partial<Record<TargetKey, string>>>({});
  const [aboutErrors, setAboutErrors] = useState<AboutErrors>({});
  const [stepError, setStepError] = useState<string | undefined>(undefined);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const saved = useRef(false);
  const wasOpen = useRef(open);
  const id = useId();

  const snapshot = () => JSON.stringify({ kcal, macros, about, activity, weightGoal, reviewKcal });
  const initial = useRef(snapshot());

  // The drafts start from the saved targets each time the sheet opens, never on a later re-render.
  useEffect(() => {
    if (open && !wasOpen.current) {
      setStep(startStep());
      setKcal(draftOf(goal?.kcal));
      setMacros(macroDraftFrom(goal));
      setAbout(goal?.estimate ? aboutDraftFromRecord(goal.estimate) : EMPTY_ABOUT_DRAFT);
      setActivity(goal?.estimate?.activity ?? null);
      setWeightGoal(goal?.estimate?.goal ?? null);
      setOutcome(null);
      setReviewKcal('');
      setKcalError(undefined);
      setTargetErrors({});
      setAboutErrors({});
      setStepError(undefined);
      setConfirmDiscard(false);
      saved.current = false;
      initial.current = JSON.stringify({ kcal: draftOf(goal?.kcal), macros: macroDraftFrom(goal), about: goal?.estimate ? aboutDraftFromRecord(goal.estimate) : EMPTY_ABOUT_DRAFT, activity: goal?.estimate?.activity ?? null, weightGoal: goal?.estimate?.goal ?? null, reviewKcal: '' });
    }
    wasOpen.current = open;
    // initialStep is a story-only starting point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, goal]);

  const dirty = snapshot() !== initial.current;
  const requestClose = () => {
    if (dirty) setConfirmDiscard(true);
    else onCancel();
  };

  const parsedKcal = (draft: string) => {
    const parsed = parseGoalDraft(draft);
    return parsed.ok ? parsed.kcal : null;
  };

  /** Builds and saves the targets from a calorie draft and the macro draft; invalid drafts stay editable. */
  const save = (kcalDraft: string, provenance: Pick<DailyGoal, 'source' | 'estimate'>) => {
    if (saved.current) return;
    const parsed = parseGoalDraft(kcalDraft);
    const { values, errors } = parseCustom(macros.custom);
    setKcalError(parsed.ok ? undefined : KCAL_ERRORS[parsed.reason]);
    setTargetErrors(macros.preset === 'custom' ? errors : {});
    if (!parsed.ok || (macros.preset === 'custom' && Object.keys(errors).length > 0)) return;
    const grams = macros.preset === 'custom' ? values : roundMacros(suggestedMacros(parsed.kcal, macros.preset));
    saved.current = true;
    onSave({ kcal: parsed.kcal, proteinG: grams.proteinG, carbohydratesG: grams.carbohydratesG, fatG: grams.fatG, preset: macros.preset, ...provenance });
  };

  const continueAbout = () => {
    const parsed = parseAboutDraft(about);
    if (!parsed.ok) {
      setAboutErrors(parsed.errors);
      return;
    }
    setAboutErrors({});
    setStep('lifestyle');
  };

  const continueLifestyle = () => {
    if (!activity) {
      setStepError('Choose the option closest to your usual days');
      return;
    }
    setStepError(undefined);
    setStep('goal');
  };

  const review = () => {
    const parsed = parseAboutDraft(about);
    if (!parsed.ok || !activity || !weightGoal) {
      setStepError(weightGoal ? undefined : 'Choose a goal');
      return;
    }
    const inputs: EstimateInputs = { age: parsed.age, sex: parsed.sex, heightCm: parsed.heightCm, weightKg: parsed.weightKg, activity, goal: weightGoal };
    const result = estimateTarget(inputs);
    setOutcome({ inputs, result });
    setReviewKcal(result.ok ? String(result.targetKcal) : '');
    setStepError(undefined);
    setStep('review');
  };

  const customParsed = parseCustom(macros.custom).values;
  const macroEditor = (currentKcal: string) => (
    <MacroTargetsEditor
      kcal={parsedKcal(currentKcal)}
      preset={macros.preset}
      onPresetChange={(preset) => setMacros((m) => ({ ...m, preset }))}
      custom={macros.custom}
      onCustomChange={(custom) => {
        setMacros((m) => ({ ...m, custom }));
        setTargetErrors({});
      }}
      customParsed={customParsed}
      errors={targetErrors}
    />
  );

  const back = (to: TargetsStep) => () => {
    setStepError(undefined);
    setStep(to);
  };

  // --- Steps -------------------------------------------------------------------------
  let title: string;
  let description: string | undefined;
  let body: React.ReactNode;
  let footer: React.ReactNode;

  if (step === 'entry') {
    title = 'Set daily goal';
    description = 'How would you like to set it? Optional — logging and recipes work without a target. Applies from today until you change it.';
    body = (
      <Stack gap={8}>
        <MethodOption icon={Calculator} title="Help me estimate" description="Three short questions, then a reviewed estimate you can adjust" onClick={() => setStep('about')} />
        <MethodOption icon={PencilSimple} title="I know my goal" description="Enter a daily calorie target and choose how to split it" onClick={() => setStep('manual')} />
      </Stack>
    );
    footer = (
      <div className={styles.footer}>
        <Button variant="secondary" onClick={requestClose}>
          Cancel
        </Button>
      </div>
    );
  } else if (step === 'manual') {
    const editing = goal !== null;
    title = editing ? 'Edit targets' : 'Set daily goal';
    description = editing ? 'Applies from today until you change it. Earlier days keep the targets they had.' : 'Applies from today until you change it. Entries and recipe filters stay as they are.';
    body = (
      <Stack gap={16}>
        {goal?.source === 'estimated' && goal.estimate ? (
          <InlineMessage
            tone="info"
            announce="none"
            title="Estimated targets"
            actions={
              <Button variant="secondary" size="small" onClick={() => setStep('about')}>
                Recalculate estimate
              </Button>
            }
          >
            Estimated from {describeEstimateInputs(goal.estimate)}; goal {goalLabel(goal.estimate.goal).toLowerCase()}
            {goal.estimate.adjustmentKcal !== 0 ? ` (${formatKcal(goal.estimate.adjustmentKcal)} kcal/day from the ${formatKcal(goal.estimate.eerKcal)} kcal maintenance estimate)` : ` (maintenance estimate ${formatKcal(goal.estimate.eerKcal)} kcal)`}. Nothing is recalculated until you ask.
          </InlineMessage>
        ) : null}
        <AmountField
          label="Daily calorie target"
          value={kcal}
          onChange={(value) => {
            setKcal(value);
            if (kcalError) setKcalError(undefined);
          }}
          unit="kcal"
          placeholder="For example, 2000"
          error={kcalError}
          helper={kcalError ? undefined : 'A number of calories for the whole day.'}
          autoFocus={!editing}
        />
        {macroEditor(kcal)}
        {goal?.source !== 'estimated' ? (
          <div>
            <Button variant="text" size="small" onClick={() => setStep('about')}>
              Help me estimate instead
            </Button>
          </div>
        ) : null}
        {editing ? (
          <div>
            <Button variant="text" size="small" onClick={onRemove}>
              Remove targets
            </Button>
            <Text as="p" variant="caption" color="secondary" wrap>
              Removing targets keeps every entry, water record and earlier day as it is.
            </Text>
          </div>
        ) : null}
      </Stack>
    );
    footer = (
      <div className={styles.footer}>
        {editing || initialStep === 'manual' ? (
          <Button variant="secondary" onClick={requestClose}>
            Cancel
          </Button>
        ) : (
          <Button variant="secondary" onClick={back('entry')}>
            Back
          </Button>
        )}
        <Button variant="primary" onClick={() => save(kcal, { source: 'manual' })}>
          Save
        </Button>
      </div>
    );
  } else if (step === 'about') {
    title = 'About you';
    description = 'Step 1 of 3 · The estimate uses the 2023 Dietary Reference Intakes energy equations, which need your age, sex, height and weight. Nothing is saved until you save the result.';
    body = (
      <Stack gap={16}>
        <AmountField
          label="Age"
          value={about.age}
          onChange={(value) => {
            setAbout((a) => ({ ...a, age: value }));
            setAboutErrors((e) => ({ ...e, age: undefined }));
          }}
          unit="years"
          placeholder="34"
          error={aboutErrors.age}
          helper={aboutErrors.age ? undefined : 'The adult equations cover ages 19 and over.'}
          autoFocus
        />
        <fieldset className={styles.group} aria-describedby={aboutErrors.sex ? `${id}-sex-error` : `${id}-sex-help`}>
          <Text as="legend" variant="label" color="primary" className={styles.legend}>
            Sex used by the equation
          </Text>
          <Text as="p" id={`${id}-sex-help`} variant="supporting" color="secondary" wrap>
            The equations come in two versions; choose the one that fits you best.
          </Text>
          <div className={styles.choices}>
            {SEX_OPTIONS.map((option) => (
              <Radio
                key={option.id}
                id={`${id}-sex-${option.id}`}
                name={`${id}-sex`}
                label={option.label}
                checked={about.sex === option.id}
                onChange={() => {
                  setAbout((a) => ({ ...a, sex: option.id as Sex }));
                  setAboutErrors((e) => ({ ...e, sex: undefined }));
                }}
              />
            ))}
          </div>
          {aboutErrors.sex ? (
            <Text as="p" id={`${id}-sex-error`} variant="supporting" color="error" role="alert">
              {aboutErrors.sex}
            </Text>
          ) : null}
        </fieldset>
        <Stack gap={8}>
          <SegmentedControl
            ariaLabel="Height unit"
            value={about.heightUnit}
            onValueChange={(unit) => setAbout((a) => ({ ...a, heightUnit: unit }))}
            options={[
              { value: 'cm', label: 'Centimetres' },
              { value: 'ft-in', label: 'Feet and inches' },
            ]}
          />
          {about.heightUnit === 'cm' ? (
            <AmountField
              label="Height"
              value={about.heightCm}
              onChange={(value) => {
                setAbout((a) => ({ ...a, heightCm: value }));
                setAboutErrors((e) => ({ ...e, height: undefined }));
              }}
              unit="cm"
              placeholder="For example, 168"
              error={aboutErrors.height}
            />
          ) : (
            <div className={styles.pair}>
              <AmountField
                label="Height"
                value={about.heightFeet}
                onChange={(value) => {
                  setAbout((a) => ({ ...a, heightFeet: value }));
                  setAboutErrors((e) => ({ ...e, height: undefined }));
                }}
                unit="ft"
                placeholder="5"
                error={aboutErrors.height}
              />
              <AmountField
                label="Inches"
                value={about.heightInches}
                onChange={(value) => {
                  setAbout((a) => ({ ...a, heightInches: value }));
                  setAboutErrors((e) => ({ ...e, height: undefined }));
                }}
                unit="in"
                placeholder="6"
              />
            </div>
          )}
        </Stack>
        <Stack gap={8}>
          <SegmentedControl
            ariaLabel="Weight unit"
            value={about.weightUnit}
            onValueChange={(unit) => setAbout((a) => ({ ...a, weightUnit: unit }))}
            options={[
              { value: 'kg', label: 'Kilograms' },
              { value: 'lb', label: 'Pounds' },
            ]}
          />
          <AmountField
            label="Weight"
            value={about.weight}
            onChange={(value) => {
              setAbout((a) => ({ ...a, weight: value }));
              setAboutErrors((e) => ({ ...e, weight: undefined }));
            }}
            unit={about.weightUnit}
            placeholder={about.weightUnit === 'kg' ? 'For example, 62' : 'For example, 137'}
            error={aboutErrors.weight}
          />
        </Stack>
      </Stack>
    );
    footer = (
      <div className={styles.footer}>
        <Button variant="secondary" onClick={back(goal ? 'manual' : 'entry')}>
          Back
        </Button>
        <Button variant="primary" onClick={continueAbout}>
          Continue
        </Button>
      </div>
    );
  } else if (step === 'lifestyle') {
    title = 'Lifestyle';
    description = 'Step 2 of 3 · Choose the activity level closest to your usual days. These are the four categories the equations use.';
    body = (
      <fieldset className={styles.group} aria-describedby={stepError ? `${id}-activity-error` : undefined}>
        <Text as="legend" variant="label" color="primary" className={styles.legend}>
          Activity level
        </Text>
        <div className={styles.choices}>
          {ACTIVITY_OPTIONS.map((option) => (
            <Radio
              key={option.id}
              id={`${id}-activity-${option.id}`}
              name={`${id}-activity`}
              label={option.label}
              description={option.description}
              checked={activity === option.id}
              onChange={() => {
                setActivity(option.id);
                setStepError(undefined);
              }}
            />
          ))}
        </div>
        {stepError ? (
          <Text as="p" id={`${id}-activity-error`} variant="supporting" color="error" role="alert">
            {stepError}
          </Text>
        ) : null}
      </fieldset>
    );
    footer = (
      <div className={styles.footer}>
        <Button variant="secondary" onClick={back('about')}>
          Back
        </Button>
        <Button variant="primary" onClick={continueLifestyle}>
          Continue
        </Button>
      </div>
    );
  } else if (step === 'goal') {
    title = 'Goal';
    description = 'Step 3 of 3 · What the target is for. There is no rate, target weight or date: the estimate is a daily amount to review.';
    body = (
      <fieldset className={styles.group} aria-describedby={stepError ? `${id}-goal-error` : undefined}>
        <Text as="legend" variant="label" color="primary" className={styles.legend}>
          Goal
        </Text>
        <div className={styles.choices}>
          {GOAL_OPTIONS.map((option) => (
            <Radio
              key={option.id}
              id={`${id}-goal-${option.id}`}
              name={`${id}-goal`}
              label={option.label}
              description={option.description}
              checked={weightGoal === option.id}
              onChange={() => {
                setWeightGoal(option.id);
                setStepError(undefined);
              }}
            />
          ))}
        </div>
        {stepError ? (
          <Text as="p" id={`${id}-goal-error`} variant="supporting" color="error" role="alert">
            {stepError}
          </Text>
        ) : null}
      </fieldset>
    );
    footer = (
      <div className={styles.footer}>
        <Button variant="secondary" onClick={back('lifestyle')}>
          Back
        </Button>
        <Button variant="primary" onClick={review}>
          See the estimate
        </Button>
      </div>
    );
  } else {
    title = 'Estimated daily target';
    const result = outcome?.result;
    const inputs = outcome?.inputs;
    if (!result || !inputs) {
      description = undefined;
      body = null;
      footer = (
        <Button variant="secondary" onClick={back('goal')}>
          Back
        </Button>
      );
    } else if (!result.ok) {
      description = 'Portion could not produce a target for this goal.';
      body = (
        <InlineMessage tone="warning" announce="status" title={result.reason === 'below-floor' ? `A loss target for you would be under ${formatKcal(LOSS_FLOOR_KCAL)} kcal a day` : 'The estimate does not cover this age'}>
          {result.reason === 'below-floor'
            ? `Your estimated maintenance intake minus the ${formatKcal(LOSS_DEFICIT_KCAL)} kcal/day loss deficit falls below the ${formatKcal(LOSS_FLOOR_KCAL)} kcal/day floor of the low-calorie ranges Portion follows, so it will not suggest one. Talk to a professional, or set a target yourself.`
            : 'The adult equations apply from age 19. Set a target yourself instead.'}
        </InlineMessage>
      );
      footer = (
        <div className={styles.footer}>
          <Button variant="secondary" onClick={back('goal')}>
            Back
          </Button>
          <Button variant="primary" onClick={() => setStep('manual')}>
            Set it myself
          </Button>
        </div>
      );
    } else {
      description = 'Review it, adjust it if you like, then save. Applies from today until you change it.';
      const summary = `${inputs.sex}, ${inputs.age}, ${Math.round(inputs.heightCm)} cm, ${Math.round(inputs.weightKg * 10) / 10} kg, ${activityLabel(inputs.activity).toLowerCase()}`;
      body = (
        <Stack gap={16}>
          <div className={styles.result}>
            <Text as="p" variant="label" color="secondary">
              Estimated daily target
            </Text>
            <p className={styles.figure}>
              <Text variant="main-result" numeric color="primary">
                {formatKcal(result.targetKcal)}
              </Text>
              <Text variant="body" color="secondary">
                kcal
              </Text>
            </p>
            <Text as="p" variant="supporting" color="secondary" wrap>
              Based on {summary}. Maintenance estimate {formatKcal(result.eerKcal)} kcal a day from the 2023 Dietary Reference Intakes equations
              {result.adjustmentKcal !== 0 ? `, ${formatKcal(Math.abs(result.adjustmentKcal))} kcal below it to ${goalLabel(result.goal).toLowerCase()}` : result.goal === 'maintain' ? ', unchanged for maintaining weight' : ''}. An estimate for people like you, not a measurement or medical advice; your own need may be higher or lower.
            </Text>
          </div>
          {result.surplusUnsupported ? (
            <InlineMessage tone="warning" announce="none" title="No surplus is added for gaining weight">
              Portion has no verified rule for how much to add, so this is the maintenance estimate. Enter the amount you want above it before saving.
            </InlineMessage>
          ) : null}
          <AmountField
            label="Daily calorie target"
            value={reviewKcal}
            onChange={(value) => {
              setReviewKcal(value);
              if (kcalError) setKcalError(undefined);
            }}
            unit="kcal"
            error={kcalError}
            helper={kcalError ? undefined : parsedKcal(reviewKcal) !== null && parsedKcal(reviewKcal) !== result.targetKcal ? `Adjusted from the ${formatKcal(result.targetKcal)} kcal estimate.` : 'Change it here if you want a different amount.'}
          />
          {macroEditor(reviewKcal)}
        </Stack>
      );
      footer = (
        <div className={styles.footer}>
          <Button variant="secondary" onClick={back('goal')}>
            Back
          </Button>
          <Button variant="primary" onClick={() => save(reviewKcal, { source: 'estimated', estimate: estimateRecord(inputs, result) })}>
            Save targets
          </Button>
        </div>
      );
    }
  }

  return (
    <>
      <ModalSheet open={open} onRequestClose={requestClose} title={title} description={description} footer={footer}>
        {body}
      </ModalSheet>
      <DiscardChangesDialog
        open={confirmDiscard}
        onKeepEditing={() => setConfirmDiscard(false)}
        onDiscard={() => {
          setConfirmDiscard(false);
          onCancel();
        }}
      />
    </>
  );
}
