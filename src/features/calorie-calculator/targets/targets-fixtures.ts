import type { DailyGoal } from '../domain/daily-log';
import { estimateRecord, estimateTarget, type AboutDraft, type EstimateInputs } from '../domain/energy-estimate';
import type { GoalPeriod } from '../domain/goal-history';
import { draftFromGoal, newTargetsDraft, withEstimate, type TargetsDraft } from './targets-draft';

/**
 * Deterministic fixtures for the targets stories and docs (ledger §14): the brief's
 * person — female, 34, 168 cm, 62 kg, lightly active, losing weight — whose maintenance
 * estimate is 2,199 kcal and whose loss target is 1,699.
 */
export const FIXTURE_TODAY = '2026-09-04';
export const FIXTURE_TOMORROW = '2026-09-05';
export const FIXTURE_NEXT_WEEK = '2026-09-11';

export const FIXTURE_ABOUT: AboutDraft = { age: '34', sex: 'female', heightUnit: 'cm', heightCm: '168', heightFeet: '', heightInches: '', weightUnit: 'kg', weight: '62' };
export const FIXTURE_ABOUT_IMPERIAL: AboutDraft = { age: '34', sex: 'female', heightUnit: 'ft-in', heightCm: '', heightFeet: '5', heightInches: '6', weightUnit: 'lb', weight: '136.7' };
export const FIXTURE_INPUTS: EstimateInputs = { age: 34, sex: 'female', heightCm: 168, weightKg: 62, activity: 'low-active', goal: 'lose' };

/** A person for whom a loss target would fall under the 1,200 kcal floor. */
export const FLOOR_ABOUT: AboutDraft = { age: '60', sex: 'female', heightUnit: 'cm', heightCm: '150', heightFeet: '', heightInches: '', weightUnit: 'kg', weight: '40' };

export const emptyEstimateDraft = (): TargetsDraft => newTargetsDraft('estimate');
export const filledEstimateDraft = (): TargetsDraft => ({ ...newTargetsDraft('estimate'), about: FIXTURE_ABOUT, activity: 'low-active', weightGoal: 'lose' });
export const imperialEstimateDraft = (): TargetsDraft => ({ ...newTargetsDraft('estimate'), about: FIXTURE_ABOUT_IMPERIAL });
export const floorGoalDraft = (): TargetsDraft => ({ ...newTargetsDraft('estimate'), about: FLOOR_ABOUT, activity: 'inactive', weightGoal: 'lose' });
export const reviewedDraft = (): TargetsDraft => withEstimate(filledEstimateDraft(), FIXTURE_INPUTS);
export const adjustedDraft = (): TargetsDraft => ({ ...reviewedDraft(), kcal: '1650', adjusted: true });
export const manualDraft = (): TargetsDraft => ({ ...newTargetsDraft('manual'), kcal: '2000' });

const result = estimateTarget(FIXTURE_INPUTS);
/** The saved estimate as Home keeps it: 1,699 kcal, balanced macros, the record of its inputs. */
export const ESTIMATED_GOAL: DailyGoal = result.ok
  ? { kcal: result.targetKcal, proteinG: 85, carbohydratesG: 212, fatG: 57, preset: 'balanced', source: 'estimated', estimate: estimateRecord(FIXTURE_INPUTS, result) }
  : { kcal: 1699 };
export const MANUAL_GOAL: DailyGoal = { kcal: 2000, proteinG: 120, carbohydratesG: 220, fatG: 65, preset: 'custom', source: 'manual' };
export const editEstimatedDraft = (): TargetsDraft => draftFromGoal(ESTIMATED_GOAL);
export const editManualDraft = (): TargetsDraft => draftFromGoal(MANUAL_GOAL);
export const PENDING_PERIOD: GoalPeriod = { from: FIXTURE_NEXT_WEEK, goal: { kcal: 1800, proteinG: 90, carbohydratesG: 225, fatG: 60, preset: 'balanced', source: 'manual' } };
