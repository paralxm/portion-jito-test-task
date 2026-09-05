import { useEffect, useId, useRef, useState } from 'react';
import { Question } from '@phosphor-icons/react';

import { AmountField } from '../../../design-system/components/AmountField/AmountField';
import { InlineMessage } from '../../../design-system/components/InlineMessage/InlineMessage';
import { Button } from '../../../design-system/primitives/Button/Button';
import { IconButton } from '../../../design-system/primitives/IconButton/IconButton';
import { Container } from '../../../design-system/primitives/layout/Container';
import { Stack } from '../../../design-system/primitives/layout/Stack';
import { Separator } from '../../../design-system/primitives/Separator/Separator';
import { Text } from '../../../design-system/primitives/Text/Text';
import { ConfirmDialog } from '../../../design-system/patterns/ConfirmDialog/ConfirmDialog';
import { FocusedBar } from '../../../design-system/patterns/FocusedBar/FocusedBar';
import { HelpDialog } from '../../../design-system/patterns/HelpDialog/HelpDialog';
import { FocusedFlowLayout } from '../../../design-system/templates/FocusedFlowLayout/FocusedFlowLayout';
import { useExitGuard } from '../../../app/exit-guard';
import { DiscardChangesDialog } from '../components/DiscardChangesDialog';
import { MacroTargetsEditor, type TargetKey } from '../components/MacroTargetsEditor';
import { formatKcal, parseGoalDraft, type DailyGoal } from '../domain/daily-log';
import { describeDay } from '../domain/day-keys';
import { activityLabel, goalLabel } from '../domain/energy-estimate';
import type { GoalPeriod } from '../domain/goal-history';
import { EffectiveDateControl } from './EffectiveDateControl';
import { DISCARD_TARGETS_COPY } from './EstimateStepScreen';
import { HELP } from './help';
import { buildGoal, parseCustomGrams, type TargetsDraft } from './targets-draft';
import styles from './TargetEditorScreen.module.css';

export type EditorMode =
  /** The estimate's result: the prominent figure, Adjust in place, Edit details. */
  | 'review'
  /** New targets entered by hand. */
  | 'manual'
  /** Existing targets: the source row, Recalculate for an estimate, Remove targets. */
  | 'edit';

/** What the app reports back from Save; every failure keeps the draft on screen. */
export type SaveOutcome = { ok: true } | { ok: false; kcalError?: string; macroErrors?: Partial<Record<TargetKey, string>>; startError?: string; storageError?: string };

export interface TargetEditorScreenProps {
  mode: EditorMode;
  draft: TargetsDraft;
  onDraftChange: (draft: TargetsDraft) => void;
  /** The targets in force today (`null` when none), for the source row and the date copy. */
  current: DailyGoal | null;
  pending: GoalPeriod | null;
  todayKey: string;
  dirty: boolean;
  /** Saves exactly once; the outcome's errors are shown near their fields. */
  onSave: () => SaveOutcome;
  /** The bar's Back: to the goal step (review), the choice (manual) or Home (edit). */
  onBack: () => void;
  /** Leaves the task; asks first when `dirty`. */
  onExit: () => void;
  onEditDetails?: () => void;
  onRecalculate?: () => void;
  /** Removes today's targets and any scheduled change, after one confirmation. */
  onRemove?: () => void;
  onCancelPending?: () => void;
  /** Deterministic starting states for stories. */
  initialAdjusting?: boolean;
  initialHelpOpen?: boolean;
  initialRemoveOpen?: boolean;
  initialSaveError?: string;
}

const HEADINGS: Record<EditorMode, string> = { review: 'Your daily target', manual: 'Set daily targets', edit: 'Edit targets' };

/**
 * The one editor every route ends in (ledger §14). Review presents the estimate as the
 * screen's result — a small "Estimated" label, the 40/48 figure centred with "kcal/day"
 * beneath, one "An estimate you can adjust." line — and Adjust edits the same number in
 * place, marking it adjusted. Manual and edit show the calories as a field. All three
 * share the nutrition preference and its rows, the effective-date control, one pending
 * change with its cancel action, and a single primary Save targets. Remove targets only
 * exists for saved targets and confirms first. A save that fails to store keeps the
 * draft and offers a retry; nothing is saved twice.
 */
export function TargetEditorScreen({
  mode,
  draft,
  onDraftChange,
  current,
  pending,
  todayKey,
  dirty,
  onSave,
  onBack,
  onExit,
  onEditDetails,
  onRecalculate,
  onRemove,
  onCancelPending,
  initialAdjusting = false,
  initialHelpOpen = false,
  initialRemoveOpen = false,
  initialSaveError,
}: TargetEditorScreenProps) {
  const id = useId();
  const [helpOpen, setHelpOpen] = useState(initialHelpOpen);
  const [adjusting, setAdjusting] = useState(initialAdjusting);
  const [removeOpen, setRemoveOpen] = useState(initialRemoveOpen);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [kcalError, setKcalError] = useState<string | undefined>(undefined);
  const [macroErrors, setMacroErrors] = useState<Partial<Record<TargetKey, string>>>({});
  const [startError, setStartError] = useState<string | undefined>(undefined);
  const [storageError, setStorageError] = useState<string | undefined>(initialSaveError);
  const saving = useRef(false);
  const leaveTarget = useRef<() => void>(onExit);
  const adjustFieldRef = useRef<HTMLDivElement>(null);
  const kcalFieldRef = useRef<HTMLDivElement>(null);
  const figureRef = useRef<HTMLButtonElement>(null);

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

  const estimate = draft.estimate?.result.ok ? draft.estimate.result : null;
  const parsedKcal = parseGoalDraft(draft.kcal);
  const kcalValue = parsedKcal.ok ? parsedKcal.kcal : null;
  const customParsed = parseCustomGrams(draft.macros.custom).values;
  const savedEstimate = mode === 'edit' && current?.source === 'estimated' ? current.estimate ?? null : null;
  const adjustedNow = mode === 'review' && estimate !== null && (draft.adjusted || kcalValue !== estimate.targetKcal);

  // Adjust moves focus into the field it reveals; Done returns it to the figure.
  useEffect(() => {
    if (adjusting) adjustFieldRef.current?.querySelector('input')?.focus();
  }, [adjusting]);

  const setKcal = (kcal: string) => {
    setKcalError(undefined);
    setStorageError(undefined);
    onDraftChange({ ...draft, kcal, adjusted: estimate !== null ? draft.adjusted || kcal !== String(estimate.targetKcal) : draft.adjusted });
  };

  const save = () => {
    if (saving.current) return;
    const built = buildGoal(draft);
    if (!built.ok) {
      setKcalError(built.kcalError);
      setMacroErrors(built.macroErrors);
      if (built.kcalError && mode === 'review') setAdjusting(true);
      // The first problem gets focus once the errors have rendered: the calorie field, else the first invalid gram field.
      setTimeout(() => {
        const field = built.kcalError ? (adjustFieldRef.current ?? kcalFieldRef.current)?.querySelector('input') : Array.from(document.querySelectorAll<HTMLElement>('[aria-invalid="true"]')).find((el) => el.closest('[hidden]') === null);
        field?.focus();
      }, 0);
      return;
    }
    saving.current = true;
    const outcome = onSave();
    saving.current = false;
    if (outcome.ok) return;
    setKcalError(outcome.kcalError);
    setMacroErrors(outcome.macroErrors ?? {});
    setStartError(outcome.startError);
    setStorageError(outcome.storageError);
  };

  const help = HELP[mode === 'review' ? 'review' : 'editor'];
  const summary = estimate && draft.activity ? `${goalLabel(estimate.goal)} · ${activityLabel(draft.activity)}` : null;
  const removeBody = pending
    ? `Food, water and past targets will stay. This also cancels the change scheduled for ${describeDay(pending.from).long}.`
    : 'Food, water and past targets will stay.';

  return (
    <>
      <FocusedFlowLayout
        header={<FocusedBar onBack={mode === 'edit' ? requestLeave(onBack) : onBack} backLabel={mode === 'review' ? 'Back' : mode === 'manual' ? 'Back to the choice' : 'Back'} trailing={<IconButton icon={Question} label="Help" onClick={() => setHelpOpen(true)} aria-haspopup="dialog" />} />}
        footer={
          <Container className={styles.footer}>
            <Stack gap={8}>
              {storageError ? (
                <InlineMessage tone="error" announce="alert" title="Not saved">
                  {storageError}
                </InlineMessage>
              ) : null}
              <Button variant="primary" size="large" block onClick={save}>
                {storageError ? 'Try again' : 'Save targets'}
              </Button>
              <Button variant="text" size="small" block onClick={requestLeave(onExit)}>
                {mode === 'edit' ? 'Cancel changes' : 'Cancel setup'}
              </Button>
            </Stack>
          </Container>
        }
      >
        <Container className={styles.content}>
          <Stack gap={24}>
            <Text as="h1" variant="screen-heading" color="primary" wrap>
              {HEADINGS[mode]}
            </Text>

            {mode === 'review' && estimate ? (
              <section className={styles.result} aria-labelledby={`${id}-result-label`}>
                <Text as="p" id={`${id}-result-label`} variant="label" color="secondary" align="center">
                  {adjustedNow ? 'Adjusted from the estimate' : 'Estimated'}
                </Text>
                {adjusting ? (
                  <div ref={adjustFieldRef} className={styles.adjust}>
                    <AmountField label="Daily calories" value={draft.kcal} onChange={setKcal} unit="kcal" placeholder={String(estimate.targetKcal)} error={kcalError} helper={kcalError ? undefined : `The estimate is ${formatKcal(estimate.targetKcal)} kcal.`} />
                    <div className={styles.adjustActions}>
                      {adjustedNow ? (
                        <Button variant="text" size="small" onClick={() => onDraftChange({ ...draft, kcal: String(estimate.targetKcal), adjusted: false })}>
                          Use the estimate
                        </Button>
                      ) : null}
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => {
                          const parsed = parseGoalDraft(draft.kcal);
                          if (!parsed.ok) {
                            setKcalError(parsed.reason === 'empty' ? 'Enter a daily calorie target' : parsed.reason === 'invalid' ? 'Enter a number of calories, for example 2000' : 'Enter a target greater than zero');
                            return;
                          }
                          setAdjusting(false);
                          requestAnimationFrame(() => figureRef.current?.focus());
                        }}
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className={styles.figure}>
                      <Text as="span" variant="main-result" numeric color="primary">
                        {kcalValue !== null ? formatKcal(kcalValue) : '—'}
                      </Text>
                      <Text as="span" variant="body" color="secondary">
                        kcal/day
                      </Text>
                    </p>
                    <Button ref={figureRef} variant="secondary" size="small" onClick={() => setAdjusting(true)} aria-describedby={`${id}-result-label`}>
                      Adjust
                    </Button>
                  </>
                )}
                <Text as="p" variant="supporting" color="secondary" align="center" wrap>
                  An estimate you can adjust.
                </Text>
                {estimate.surplusUnsupported ? (
                  <Text as="p" variant="supporting" color="secondary" align="center" wrap>
                    This is the maintenance estimate. Add the surplus you want above it.
                  </Text>
                ) : null}
              </section>
            ) : null}

            {mode === 'review' && summary ? (
              <div className={styles.summaryRow}>
                <Text as="p" variant="body" color="primary" className={styles.summary}>
                  {summary}
                </Text>
                {onEditDetails ? (
                  <Button variant="text" size="small" onClick={onEditDetails}>
                    Edit details
                  </Button>
                ) : null}
              </div>
            ) : null}

            {mode !== 'review' ? (
              <Stack gap={8}>
                {savedEstimate ? (
                  <div className={styles.summaryRow}>
                    <Text as="p" variant="supporting" color="secondary" className={styles.summary} wrap>
                      Estimated{current?.adjusted ? ', then adjusted' : ''} · {goalLabel(savedEstimate.goal)} · {activityLabel(savedEstimate.activity)}
                    </Text>
                    {onRecalculate ? (
                      <Button variant="text" size="small" onClick={onRecalculate}>
                        Recalculate
                      </Button>
                    ) : null}
                  </div>
                ) : mode === 'edit' && onRecalculate ? (
                  <div className={styles.summaryRow}>
                    <Text as="p" variant="supporting" color="secondary" className={styles.summary} wrap>
                      Entered by you
                    </Text>
                    <Button variant="text" size="small" onClick={onRecalculate}>
                      Estimate instead
                    </Button>
                  </div>
                ) : null}
                <div ref={kcalFieldRef}>
                  <AmountField label="Daily calories" value={draft.kcal} onChange={setKcal} unit="kcal" placeholder="2000" error={kcalError} helper={kcalError ? undefined : mode === 'manual' ? 'Whole calories a day.' : undefined} />
                </div>
              </Stack>
            ) : null}

            <MacroTargetsEditor
              kcal={kcalValue}
              preset={draft.macros.preset}
              onPresetChange={(preset) => onDraftChange({ ...draft, macros: { ...draft.macros, preset } })}
              custom={draft.macros.custom}
              onCustomChange={(custom) => {
                setMacroErrors({});
                onDraftChange({ ...draft, macros: { ...draft.macros, custom } });
              }}
              customParsed={customParsed}
              errors={macroErrors}
            />

            <Separator />

            <EffectiveDateControl
              startDayKey={draft.startDayKey}
              onChange={(startDayKey) => {
                setStartError(undefined);
                onDraftChange({ ...draft, startDayKey });
              }}
              todayKey={todayKey}
              hasCurrent={current !== null}
              pending={pending}
              error={startError}
            />

            {pending && onCancelPending ? (
              <div className={styles.summaryRow}>
                <Text as="p" variant="supporting" color="secondary" className={styles.summary} wrap>
                  {pending.goal ? `Scheduled: ${formatKcal(pending.goal.kcal)} kcal from ${describeDay(pending.from).long}.` : `Scheduled: targets removed from ${describeDay(pending.from).long}.`}
                </Text>
                <Button variant="text" size="small" onClick={onCancelPending}>
                  Cancel scheduled change
                </Button>
              </div>
            ) : null}

            {mode === 'edit' && onRemove ? (
              <div>
                <Button variant="destructive" size="small" onClick={() => setRemoveOpen(true)}>
                  Remove targets
                </Button>
              </div>
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
      {onRemove ? (
        <ConfirmDialog
          open={removeOpen}
          title="Remove daily targets"
          confirmLabel="Remove targets"
          cancelLabel="Keep targets"
          destructive
          onCancel={() => setRemoveOpen(false)}
          onConfirm={() => {
            setRemoveOpen(false);
            onRemove();
          }}
        >
          {removeBody}
        </ConfirmDialog>
      ) : null}
    </>
  );
}
