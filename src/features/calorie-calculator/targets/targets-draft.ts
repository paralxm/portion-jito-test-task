/**
 * The one draft of the targets task (ledger §14): everything the estimate steps, the
 * review and the editor read and write, owned by the app for the task's life so Back,
 * Edit details, Help and Recalculate never lose a value. Pure functions here; the
 * screens render and validate, the app persists.
 */
import { addDays, compareDayKeys, describeDay } from '../domain/day-keys';
import { parseGoalDraft, parseTargetDraft, type DailyGoal } from '../domain/daily-log';
import { aboutDraftFromRecord, EMPTY_ABOUT_DRAFT, estimateRecord, estimateTarget, type AboutDraft, type ActivityLevel, type EstimateInputs, type EstimateOutcome, type WeightGoal } from '../domain/energy-estimate';
import type { GoalPeriod } from '../domain/goal-history';
import { roundMacros, suggestedMacros, type MacroPreset } from '../domain/macro-presets';
import { EMPTY_CUSTOM, TARGET_FIELDS, type CustomGrams, type TargetKey } from '../components/MacroTargetsEditor';

export type TargetsRoute = 'estimate' | 'manual';

export interface TargetsDraft {
  route: TargetsRoute;
  about: AboutDraft;
  activity: ActivityLevel | null;
  weightGoal: WeightGoal | null;
  /** The last explicit estimate (Review estimate), or `null` before one was computed or after an input changed. */
  estimate: { inputs: EstimateInputs; result: EstimateOutcome } | null;
  /** The calorie draft the review or editor shows. */
  kcal: string;
  /** True when an estimated calorie value was changed by hand (Adjust) — kept as a label, never a recalculation. */
  adjusted: boolean;
  macros: { preset: MacroPreset; custom: CustomGrams };
  /** The local day the targets start on; `null` means "today, resolved at save". */
  startDayKey: string | null;
}

const draftOf = (value: number | null | undefined) => (value === null || value === undefined ? '' : String(value));

export function newTargetsDraft(route: TargetsRoute): TargetsDraft {
  return { route, about: EMPTY_ABOUT_DRAFT, activity: null, weightGoal: null, estimate: null, kcal: '', adjusted: false, macros: { preset: 'balanced', custom: EMPTY_CUSTOM }, startDayKey: null };
}

/** A saved goal as a draft: its calories, preset (custom when none was recorded) and, for an estimate, the inputs it came from. */
export function draftFromGoal(goal: DailyGoal, startDayKey: string | null = null): TargetsDraft {
  const estimate = goal.estimate;
  return {
    route: goal.source === 'estimated' ? 'estimate' : 'manual',
    about: estimate ? aboutDraftFromRecord(estimate) : EMPTY_ABOUT_DRAFT,
    activity: estimate?.activity ?? null,
    weightGoal: estimate?.goal ?? null,
    estimate: null,
    kcal: draftOf(goal.kcal),
    adjusted: goal.adjusted === true,
    macros: { preset: goal.preset ?? 'custom', custom: { proteinG: draftOf(goal.proteinG), carbohydratesG: draftOf(goal.carbohydratesG), fatG: draftOf(goal.fatG) } },
    startDayKey,
  };
}

/** What the dirty check compares; the estimate itself is derived, so it is left out. */
export function draftSnapshot(draft: TargetsDraft): string {
  const { estimate: _e, ...rest } = draft;
  return JSON.stringify(rest);
}

/** Runs the estimate for the draft's validated inputs (Review estimate) and seeds the calorie draft from it. */
export function withEstimate(draft: TargetsDraft, inputs: EstimateInputs): TargetsDraft {
  const result = estimateTarget(inputs);
  return { ...draft, estimate: { inputs, result }, kcal: result.ok ? String(result.targetKcal) : draft.kcal, adjusted: false };
}

/** Any change to the body, activity or goal inputs makes the previous estimate stale; it is recomputed only on Review estimate. */
export function withInputsChanged(draft: TargetsDraft, patch: Partial<Pick<TargetsDraft, 'about' | 'activity' | 'weightGoal'>>): TargetsDraft {
  return { ...draft, ...patch, estimate: null };
}

export function parseCustomGrams(custom: CustomGrams): { values: Record<TargetKey, number | null>; errors: Partial<Record<TargetKey, string>> } {
  const values: Record<TargetKey, number | null> = { proteinG: null, carbohydratesG: null, fatG: null };
  const errors: Partial<Record<TargetKey, string>> = {};
  for (const { key } of TARGET_FIELDS) {
    const result = parseTargetDraft(custom[key]);
    if (result.ok) values[key] = result.grams;
    else errors[key] = result.reason === 'invalid' ? 'Enter a number of grams, or leave it blank' : 'Enter a target greater than zero, or leave it blank';
  }
  return { values, errors };
}

export const KCAL_ERRORS = {
  empty: 'Enter a daily calorie target',
  invalid: 'Enter a number of calories, for example 2000',
  'not-positive': 'Enter a target greater than zero',
} as const;

export type BuildResult = { ok: true; goal: DailyGoal } | { ok: false; kcalError?: string; macroErrors: Partial<Record<TargetKey, string>> };

/** The goal the draft would save, or the field errors that stop it. Provenance follows the route and the adjusted flag. */
export function buildGoal(draft: TargetsDraft): BuildResult {
  const parsed = parseGoalDraft(draft.kcal);
  const { values, errors } = parseCustomGrams(draft.macros.custom);
  const macroErrors = draft.macros.preset === 'custom' ? errors : {};
  if (!parsed.ok || Object.keys(macroErrors).length > 0) return { ok: false, kcalError: parsed.ok ? undefined : KCAL_ERRORS[parsed.reason], macroErrors };
  const grams = draft.macros.preset === 'custom' ? values : roundMacros(suggestedMacros(parsed.kcal, draft.macros.preset));
  const goal: DailyGoal = { kcal: parsed.kcal, proteinG: grams.proteinG, carbohydratesG: grams.carbohydratesG, fatG: grams.fatG, preset: draft.macros.preset, source: draft.route === 'estimate' && draft.estimate?.result.ok ? 'estimated' : 'manual' };
  if (goal.source === 'estimated' && draft.estimate?.result.ok) {
    goal.estimate = estimateRecord(draft.estimate.inputs, draft.estimate.result);
    if (parsed.kcal !== draft.estimate.result.targetKcal || draft.adjusted) goal.adjusted = true;
  }
  return { ok: true, goal };
}

export type StartValidation = { ok: true; dayKey: string } | { ok: false; error: string };

/** Resolves the start day at save: an untouched Today is the current local day; an explicit date must not lie in the past. */
export function resolveStart(startDayKey: string | null, todayKey: string): StartValidation {
  if (startDayKey === null) return { ok: true, dayKey: todayKey };
  if (compareDayKeys(startDayKey, todayKey) < 0) return { ok: false, error: `${describeDay(startDayKey).long} has passed. Choose today or a later date.` };
  return { ok: true, dayKey: startDayKey };
}

/** The short, truthful effective-date sentence for the chosen start, the current targets and any pending change. */
export function describeStart(startDayKey: string | null, todayKey: string, hasCurrent: boolean, pending: GoalPeriod | null): string {
  const isToday = startDayKey === null || startDayKey === todayKey;
  if (isToday) {
    if (pending && compareDayKeys(pending.from, todayKey) > 0) return `From today until ${describeDay(pending.from).monthDay}, when your scheduled change starts.`;
    return 'From today until you change it.';
  }
  const date = describeDay(startDayKey as string).long;
  if (pending && pending.from !== startDayKey) return `Starts ${date}. This replaces the change scheduled for ${describeDay(pending.from).monthDay}.${hasCurrent ? ' Your current targets stay until then.' : ''}`;
  return hasCurrent ? `Starts ${date}. Your current targets stay until then.` : `Starts ${date}. No targets apply before then.`;
}

/** The short label of a scheduled change on Home and in the editor. */
export function describePending(pending: GoalPeriod, todayKey: string): string {
  const when = describeDay(pending.from);
  const label = pending.from === addDays(todayKey, 1) ? 'tomorrow' : when.long;
  return pending.goal ? `Scheduled: ${pending.goal.kcal.toLocaleString('en')} kcal from ${label}.` : `Scheduled: targets removed from ${label}.`;
}
