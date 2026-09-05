import { useId, useRef, useState } from 'react';
import { Question } from '@phosphor-icons/react';

import { AmountField } from '../../../design-system/components/AmountField/AmountField';
import { SelectionCard } from '../../../design-system/components/SelectionCard/SelectionCard';
import { IconButton } from '../../../design-system/primitives/IconButton/IconButton';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Container } from '../../../design-system/primitives/layout/Container';
import { Stack } from '../../../design-system/primitives/layout/Stack';
import { Text } from '../../../design-system/primitives/Text/Text';
import { FocusedBar } from '../../../design-system/patterns/FocusedBar/FocusedBar';
import { HelpDialog } from '../../../design-system/patterns/HelpDialog/HelpDialog';
import { FocusedFlowLayout } from '../../../design-system/templates/FocusedFlowLayout/FocusedFlowLayout';
import { useExitGuard } from '../../../app/exit-guard';
import { DiscardChangesDialog } from '../components/DiscardChangesDialog';
import { InlineMessage } from '../../../design-system/components/InlineMessage/InlineMessage';
import { ACTIVITY_OPTIONS, estimateTarget, GOAL_OPTIONS, LOSS_DEFICIT_KCAL, LOSS_FLOOR_KCAL, parseAboutDraft, SEX_OPTIONS, type AboutErrors, type HeightUnit, type WeightUnit, cmFromFeetInches, feetInchesFromCm, kgFromPounds, poundsFromKg } from '../domain/energy-estimate';
import { formatKcal } from '../domain/daily-log';
import { HELP } from './help';
import { withInputsChanged, type TargetsDraft } from './targets-draft';
import { UnitField } from './UnitField';
import styles from './EstimateStepScreen.module.css';

export type EstimateStep = 'about' | 'activity' | 'goal';

export const DISCARD_TARGETS_COPY = 'Your unsaved target changes will be lost. Saved targets, food and water stay.';

export interface EstimateStepScreenProps {
  step: EstimateStep;
  draft: TargetsDraft;
  onDraftChange: (draft: TargetsDraft) => void;
  /** Continue with a valid step (the app advances); the last step's label is "Review estimate". */
  onContinue: () => void;
  /** Back to the previous step or the origin; the draft is kept. */
  onBack: () => void;
  /** Leaves the whole task; asks first when `dirty`. */
  onExit: () => void;
  /** The manual editor, keeping the draft, when the chosen goal cannot be estimated. */
  onUseManual: () => void;
  /** The draft differs from its start (the app decides). */
  dirty: boolean;
  /** Back from the first step leaves the task (first-time setup); the label says so. */
  backLeavesTask?: boolean;
  /** Deterministic starting states for stories. */
  initialHelpOpen?: boolean;
}

const STEP_INDEX: Record<EstimateStep, number> = { about: 1, activity: 2, goal: 3 };

const HEIGHT_UNITS: ReadonlyArray<{ value: HeightUnit; label: string }> = [
  { value: 'cm', label: 'cm' },
  { value: 'ft-in', label: 'ft + in' },
];
const WEIGHT_UNITS: ReadonlyArray<{ value: WeightUnit; label: string }> = [
  { value: 'kg', label: 'kg' },
  { value: 'lb', label: 'lb' },
];

const round1 = (n: number) => String(Math.round(n * 10) / 10);

/**
 * The three estimate steps (ledger §14) — About you, Your activity, Your goal — on the
 * focused shell: the compact bar (Back, the centred step count, Help), the heading, the
 * fields or the selection cards, and one primary action in the footer. Every value
 * lives in the task's draft, so Back, Help and later edits keep it; Continue validates
 * in place, focuses the first problem and never clears a valid field.
 */
export function EstimateStepScreen({ step, draft, onDraftChange, onContinue, onBack, onExit, onUseManual, dirty, backLeavesTask = false, initialHelpOpen = false }: EstimateStepScreenProps) {
  const [helpOpen, setHelpOpen] = useState(initialHelpOpen);
  const [errors, setErrors] = useState<AboutErrors>({});
  const [stepError, setStepError] = useState<string | undefined>(undefined);
  const [discardOpen, setDiscardOpen] = useState(false);
  const leaveTarget = useRef<() => void>(onExit);
  const id = useId();
  const about = draft.about;

  const requestLeave = (leave: () => void) => () => {
    if (!dirty) {
      leave();
      return;
    }
    leaveTarget.current = leave;
    setDiscardOpen(true);
  };
  useExitGuard(() => {
    if (!dirty) return false;
    leaveTarget.current = onExit;
    setDiscardOpen(true);
    return true;
  }, dirty);
  const requestBack = backLeavesTask ? requestLeave(onBack) : onBack;

  const setAbout = (patch: Partial<TargetsDraft['about']>) => onDraftChange(withInputsChanged(draft, { about: { ...about, ...patch } }));

  // Unit switches convert the value already typed, at full precision, so nothing drifts.
  const switchHeightUnit = (unit: HeightUnit) => {
    if (unit === about.heightUnit) return;
    if (unit === 'ft-in') {
      const cm = Number(about.heightCm.replace(',', '.'));
      const pair = about.heightCm.trim() !== '' && Number.isFinite(cm) ? feetInchesFromCm(cm) : null;
      setAbout({ heightUnit: unit, heightFeet: pair ? String(pair.feet) : about.heightFeet, heightInches: pair ? String(pair.inches) : about.heightInches });
    } else {
      const feet = Number(about.heightFeet.replace(',', '.'));
      const inches = about.heightInches.trim() === '' ? 0 : Number(about.heightInches.replace(',', '.'));
      const cm = about.heightFeet.trim() !== '' && Number.isFinite(feet) && Number.isFinite(inches) ? round1(cmFromFeetInches(feet, inches)) : about.heightCm;
      setAbout({ heightUnit: unit, heightCm: cm });
    }
    setErrors((e) => ({ ...e, height: undefined }));
  };
  const switchWeightUnit = (unit: WeightUnit) => {
    if (unit === about.weightUnit) return;
    const n = Number(about.weight.replace(',', '.'));
    const converted = about.weight.trim() !== '' && Number.isFinite(n) ? round1(unit === 'kg' ? kgFromPounds(n) : poundsFromKg(n)) : about.weight;
    setAbout({ weightUnit: unit, weight: converted });
    setErrors((e) => ({ ...e, weight: undefined }));
  };

  const continueStep = () => {
    if (step === 'about') {
      const parsed = parseAboutDraft(about);
      if (!parsed.ok) {
        setErrors(parsed.errors);
        const first = (['age', 'sex', 'height', 'weight'] as const).find((key) => parsed.errors[key]);
        requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-field="${id}-${first}"] input, [data-field="${id}-${first}"] [role="radio"]`)?.focus());
        return;
      }
      setErrors({});
      onContinue();
      return;
    }
    if (step === 'activity' && !draft.activity) {
      setStepError('Choose the level closest to a typical week');
      requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-field="${id}-activity"] input`)?.focus());
      return;
    }
    if (step === 'goal' && !draft.weightGoal) {
      setStepError('Choose a goal');
      requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-field="${id}-goal"] input`)?.focus());
      return;
    }
    if (step === 'goal' && unsupported) {
      document.getElementById(`${id}-unsupported`)?.focus();
      return;
    }
    setStepError(undefined);
    onContinue();
  };

  // The goal step already holds validated body and activity inputs, so an unsupported
  // loss target is known — and explained — the moment it is chosen.
  const unsupported = (() => {
    if (step !== 'goal' || draft.weightGoal !== 'lose' || !draft.activity) return null;
    const parsed = parseAboutDraft(about);
    if (!parsed.ok) return null;
    const outcome = estimateTarget({ age: parsed.age, sex: parsed.sex, heightCm: parsed.heightCm, weightKg: parsed.weightKg, activity: draft.activity, goal: 'lose' });
    return outcome.ok ? null : outcome.reason;
  })();

  const help = HELP[step];
  const heading = step === 'about' ? 'About you' : step === 'activity' ? 'Your activity' : 'Your goal';

  return (
    <>
      <FocusedFlowLayout
        header={<FocusedBar onBack={requestBack} backLabel={backLeavesTask ? 'Back to the choice' : 'Back'} step={{ current: STEP_INDEX[step], total: 3 }} trailing={<IconButton icon={Question} label="Help" onClick={() => setHelpOpen(true)} aria-haspopup="dialog" />} />}
        footer={
          <Container className={styles.footer}>
            <Stack gap={8}>
              <Button variant="primary" size="large" block onClick={continueStep}>
                {step === 'goal' ? 'Review estimate' : 'Continue'}
              </Button>
              <Button variant="text" size="small" block onClick={requestLeave(onExit)}>
                Cancel setup
              </Button>
            </Stack>
          </Container>
        }
      >
        <Container className={styles.content}>
          <Stack gap={24}>
            <Stack gap={4}>
              <Text as="h1" variant="screen-heading" color="primary" wrap>
                {heading}
              </Text>
              {step === 'activity' ? (
                <Text as="p" variant="body" color="secondary" wrap>
                  Think about a typical week.
                </Text>
              ) : null}
            </Stack>

            {step === 'about' ? (
              <Stack gap={16}>
                <div data-field={`${id}-age`}>
                  <AmountField
                    label="Age"
                    value={about.age}
                    onChange={(value) => {
                      setAbout({ age: value });
                      setErrors((e) => ({ ...e, age: undefined }));
                    }}
                    unit="years"
                    placeholder="34"
                    error={errors.age}
                    helper={errors.age ? undefined : 'Adults 19 and over.'}
                  />
                </div>
                <fieldset className={styles.group} data-field={`${id}-sex`} aria-describedby={errors.sex ? `${id}-sex-error` : undefined}>
                  <Text as="legend" variant="label" color="primary" className={styles.legend}>
                    Sex used by the estimate
                  </Text>
                  <div className={styles.pair} role="radiogroup" aria-label="Sex used by the estimate">
                    {SEX_OPTIONS.map((option) => (
                      <SelectionCard
                        key={option.id}
                        presentation="tile"
                        name={`${id}-sex`}
                        value={option.id}
                        checked={about.sex === option.id}
                        onChange={() => {
                          setAbout({ sex: option.id });
                          setErrors((e) => ({ ...e, sex: undefined }));
                        }}
                        title={option.label}
                      />
                    ))}
                  </div>
                  {errors.sex ? (
                    <Text as="p" id={`${id}-sex-error`} variant="supporting" color="error" role="alert">
                      {errors.sex}
                    </Text>
                  ) : null}
                </fieldset>
                <div data-field={`${id}-height`}>
                  <UnitField
                    label="Height"
                    unit={about.heightUnit}
                    units={HEIGHT_UNITS}
                    onUnitChange={switchHeightUnit}
                    error={errors.height}
                    inputs={
                      about.heightUnit === 'cm'
                        ? [{ value: about.heightCm, onChange: (value) => { setAbout({ heightCm: value }); setErrors((e) => ({ ...e, height: undefined })); }, suffix: 'cm', placeholder: '168' }]
                        : [
                            { label: 'ft', value: about.heightFeet, onChange: (value) => { setAbout({ heightFeet: value }); setErrors((e) => ({ ...e, height: undefined })); }, suffix: 'ft', placeholder: '5' },
                            { label: 'in', value: about.heightInches, onChange: (value) => { setAbout({ heightInches: value }); setErrors((e) => ({ ...e, height: undefined })); }, suffix: 'in', placeholder: '6' },
                          ]
                    }
                  />
                </div>
                <div data-field={`${id}-weight`}>
                  <UnitField
                    label="Weight"
                    unit={about.weightUnit}
                    units={WEIGHT_UNITS}
                    onUnitChange={switchWeightUnit}
                    error={errors.weight}
                    inputs={[{ value: about.weight, onChange: (value) => { setAbout({ weight: value }); setErrors((e) => ({ ...e, weight: undefined })); }, suffix: about.weightUnit, placeholder: about.weightUnit === 'kg' ? '62' : '137' }]}
                  />
                </div>
              </Stack>
            ) : null}

            {step === 'activity' ? (
              <fieldset className={styles.group} data-field={`${id}-activity`} aria-describedby={stepError ? `${id}-activity-error` : undefined}>
                <legend className="portion-visually-hidden">Activity level</legend>
                <div className={styles.cards} role="radiogroup" aria-label="Activity level">
                  {ACTIVITY_OPTIONS.map((option) => (
                    <SelectionCard
                      key={option.id}
                      name={`${id}-activity`}
                      value={option.id}
                      checked={draft.activity === option.id}
                      onChange={() => {
                        onDraftChange(withInputsChanged(draft, { activity: option.id }));
                        setStepError(undefined);
                      }}
                      title={option.label}
                      description={option.description}
                    />
                  ))}
                </div>
                {stepError ? (
                  <Text as="p" id={`${id}-activity-error`} variant="supporting" color="error" role="alert">
                    {stepError}
                  </Text>
                ) : null}
              </fieldset>
            ) : null}

            {step === 'goal' ? (
              <fieldset className={styles.group} data-field={`${id}-goal`} aria-describedby={stepError ? `${id}-goal-error` : undefined}>
                <legend className="portion-visually-hidden">Goal</legend>
                <div className={styles.cards} role="radiogroup" aria-label="Goal">
                  {GOAL_OPTIONS.map((option) => (
                    <SelectionCard
                      key={option.id}
                      name={`${id}-goal`}
                      value={option.id}
                      checked={draft.weightGoal === option.id}
                      onChange={() => {
                        onDraftChange(withInputsChanged(draft, { weightGoal: option.id }));
                        setStepError(undefined);
                      }}
                      title={option.label}
                      description={option.id === 'lose' ? '500 kcal a day below the estimate.' : option.id === 'maintain' ? 'The estimate as it is.' : 'Shows the maintenance estimate; you add the surplus.'}
                    />
                  ))}
                </div>
                {stepError ? (
                  <Text as="p" id={`${id}-goal-error`} variant="supporting" color="error" role="alert">
                    {stepError}
                  </Text>
                ) : null}
                {unsupported === 'below-floor' ? (
                  <div id={`${id}-unsupported`} tabIndex={-1} className={styles.unsupported}>
                    <InlineMessage
                      tone="warning"
                      announce="status"
                      title={`A loss target for you would be under ${formatKcal(LOSS_FLOOR_KCAL)} kcal a day`}
                      actions={
                        <Button variant="secondary" size="small" onClick={onUseManual}>
                          Set it myself
                        </Button>
                      }
                    >
                      Portion does not suggest targets below that floor, so it cannot estimate one {formatKcal(LOSS_DEFICIT_KCAL)} kcal under your maintenance. Choose Maintain, or enter your own target — your details are kept.
                    </InlineMessage>
                  </div>
                ) : null}
              </fieldset>
            ) : null}

          </Stack>
        </Container>
      </FocusedFlowLayout>

      <HelpDialog open={helpOpen} title={help.title} details={help.details} onClose={() => setHelpOpen(false)}>
        {help.body}
      </HelpDialog>
      <DiscardChangesDialog
        open={discardOpen}
        body={DISCARD_TARGETS_COPY}
        onKeepEditing={() => setDiscardOpen(false)}
        onDiscard={() => {
          setDiscardOpen(false);
          leaveTarget.current();
        }}
      />
    </>
  );
}
