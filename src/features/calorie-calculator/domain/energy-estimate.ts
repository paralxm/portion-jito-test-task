/**
 * Energy estimate for the "Help me estimate" path of Set targets (ledger §13.4).
 *
 * Method — the adult Estimated Energy Requirement (EER) prediction equations of the
 * National Academies' *Dietary Reference Intakes for Energy* (2023), Table S-3, for
 * adults 19 years and older: one linear equation per sex and physical-activity category
 * (inactive, low active, active, very active) in age (years), height (cm) and weight
 * (kg). For a weight-stable adult the EER equals total energy expenditure, so it is a
 * maintenance estimate for a population like the reference data, not a personal
 * measurement: the report itself says an intake equal to the EER "could result in weight
 * maintenance, weight gain, or weight loss" for a given person.
 *
 * Goal adjustment — the report gives no loss or gain rule and Portion invents none:
 * - Maintain: the EER as it is.
 * - Lose: the EER minus 500 kcal/day, the lower end of the 500–1,000 kcal/day deficit the
 *   NHLBI *Clinical Guidelines on the Identification, Evaluation, and Treatment of
 *   Overweight and Obesity in Adults* (1998) associate with a loss of 1–2 lb/week. The
 *   same guidelines put the low-calorie diet at 1,000–1,200 kcal/day for women and
 *   1,200–1,500 kcal/day for men and reject anything below 800 kcal/day; Portion refuses
 *   to estimate a target under 1,200 kcal/day (the bound common to both ranges) and asks
 *   the person to set one with professional advice instead.
 * - Gain: no primary source verified for this pass states a surplus, so the estimate is
 *   the maintenance EER with the gap stated in words; the person adds the surplus before
 *   saving. Nothing is substituted silently.
 * The NIDDK Body Weight Planner (Hall et al.) is a dynamic simulation needing a goal
 * weight and a time frame, both outside this product's scope; nothing here claims to
 * reproduce it.
 *
 * Sources: https://www.nationalacademies.org/read/26818/chapter/2 (Table S-3);
 * https://www.ncbi.nlm.nih.gov/books/NBK591020/ (applications, Table 7-1 activity
 * descriptions, individual variability); https://www.ncbi.nlm.nih.gov/books/NBK2004/
 * (NHLBI treatment guidelines: deficit and low-calorie ranges);
 * https://www.nal.usda.gov/human-nutrition-and-food-safety/dri-calculator (the USDA
 * calculator that applies the DRIs with the same four activity categories);
 * https://www.niddk.nih.gov/health-information/weight-management/body-weight-planner.
 */

export type Sex = 'female' | 'male';
export type ActivityLevel = 'inactive' | 'low-active' | 'active' | 'very-active';
export type WeightGoal = 'lose' | 'maintain' | 'gain';

export const ESTIMATE_METHOD = 'nasem-2023-eer' as const;

/** The youngest age the adult equations cover; younger people, pregnancy and lactation use other DRI equations Portion does not implement. */
export const ADULT_MIN_AGE = 19;
/** A practical upper bound for the age field; the equations state no upper limit. */
export const AGE_MAX = 120;
export const HEIGHT_CM_RANGE = { min: 100, max: 250 } as const;
export const WEIGHT_KG_RANGE = { min: 30, max: 300 } as const;

/** NHLBI 1998: a deficit of 500–1,000 kcal/day for 1–2 lb/week; Portion uses the lower end. */
export const LOSS_DEFICIT_KCAL = 500;
/** NHLBI 1998: the low-calorie diet supplies at least 1,000–1,200 kcal/day (women) and 1,200–1,500 (men); 1,200 is common to both. */
export const LOSS_FLOOR_KCAL = 1200;

export const CM_PER_INCH = 2.54;
export const KG_PER_POUND = 0.45359237;

export interface ActivityOption {
  id: ActivityLevel;
  /** The product's plain label. */
  label: string;
  /** The category as the 2023 report's Table 7-1 describes it, in the person's terms. */
  description: string;
  /** The report's own category name, for the documentation and the summary. */
  reportName: string;
}

export const ACTIVITY_OPTIONS: readonly ActivityOption[] = [
  { id: 'inactive', label: 'Mostly sedentary', description: 'Everyday living only: little or no physical activity at work or in your free time.', reportName: 'Inactive' },
  { id: 'low-active', label: 'Lightly active', description: 'Everyday living plus about an hour of moderate activity, such as brisk walking, on most days.', reportName: 'Low active' },
  { id: 'active', label: 'Active', description: 'Everyday living plus regular moderate activity and some vigorous exercise on most days.', reportName: 'Active' },
  { id: 'very-active', label: 'Very active', description: 'Everyday living plus more than two hours of vigorous activity on most days, or heavy physical work.', reportName: 'Very active' },
];

export const GOAL_OPTIONS: ReadonlyArray<{ id: WeightGoal; label: string; description: string }> = [
  { id: 'lose', label: 'Lose weight', description: 'Eat below the estimated maintenance intake.' },
  { id: 'maintain', label: 'Maintain weight', description: 'Eat about the estimated maintenance intake.' },
  { id: 'gain', label: 'Gain weight', description: 'Eat above the estimated maintenance intake.' },
];

export const SEX_OPTIONS: ReadonlyArray<{ id: Sex; label: string }> = [
  { id: 'female', label: 'Female' },
  { id: 'male', label: 'Male' },
];

export interface EstimateInputs {
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: WeightGoal;
}

/** Table S-3 (adults ≥ 19): EER = a + b·age + c·height(cm) + d·weight(kg). */
type Coefficients = readonly [a: number, age: number, height: number, weight: number];
const EER_COEFFICIENTS: Record<Sex, Record<ActivityLevel, Coefficients>> = {
  male: {
    inactive: [753.07, -10.83, 6.5, 14.1],
    'low-active': [581.47, -10.83, 8.3, 14.94],
    active: [1004.82, -10.83, 6.52, 15.91],
    'very-active': [-517.88, -10.83, 15.61, 19.11],
  },
  female: {
    inactive: [584.9, -7.01, 5.72, 11.71],
    'low-active': [575.77, -7.01, 6.6, 12.14],
    active: [710.25, -7.01, 6.54, 12.34],
    'very-active': [511.83, -7.01, 9.07, 12.56],
  },
};

/** The maintenance EER in kcal/day at full precision; the caller rounds for display and storage. */
export function estimatedEnergyRequirement({ age, sex, heightCm, weightKg, activity }: Omit<EstimateInputs, 'goal'>): number {
  const [a, b, c, d] = EER_COEFFICIENTS[sex][activity];
  return a + b * age + c * heightCm + d * weightKg;
}

export type EstimateFailure =
  /** Under 19: the adult equations do not apply. */
  | 'under-age'
  /** The loss target would fall under the 1,200 kcal/day floor. */
  | 'below-floor';

export interface EstimateResult {
  ok: true;
  /** The maintenance estimate, whole kcal. */
  eerKcal: number;
  /** eer + adjustment, whole kcal — what the review offers to save. */
  targetKcal: number;
  /** −500 for a loss goal, 0 otherwise. */
  adjustmentKcal: number;
  goal: WeightGoal;
  /** True for a gain goal: no verified surplus exists, so the target shown is maintenance. */
  surplusUnsupported: boolean;
}

export type EstimateOutcome = EstimateResult | { ok: false; reason: EstimateFailure };

/** Applies the method and the goal policy above to validated inputs. */
export function estimateTarget(inputs: EstimateInputs): EstimateOutcome {
  if (inputs.age < ADULT_MIN_AGE) return { ok: false, reason: 'under-age' };
  const eer = estimatedEnergyRequirement(inputs);
  const eerKcal = Math.round(eer);
  if (inputs.goal === 'lose') {
    const target = eer - LOSS_DEFICIT_KCAL;
    if (target < LOSS_FLOOR_KCAL) return { ok: false, reason: 'below-floor' };
    return { ok: true, eerKcal, targetKcal: Math.round(target), adjustmentKcal: -LOSS_DEFICIT_KCAL, goal: 'lose', surplusUnsupported: false };
  }
  return { ok: true, eerKcal, targetKcal: eerKcal, adjustmentKcal: 0, goal: inputs.goal, surplusUnsupported: inputs.goal === 'gain' };
}

/** What a saved estimate keeps so Home and the editor can explain it later (ledger §13.4). */
export interface EstimateRecord {
  method: typeof ESTIMATE_METHOD;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: WeightGoal;
  eerKcal: number;
  adjustmentKcal: number;
}

export function estimateRecord(inputs: EstimateInputs, result: EstimateResult): EstimateRecord {
  return { method: ESTIMATE_METHOD, age: inputs.age, sex: inputs.sex, heightCm: inputs.heightCm, weightKg: inputs.weightKg, activity: inputs.activity, goal: inputs.goal, eerKcal: result.eerKcal, adjustmentKcal: result.adjustmentKcal };
}

// ---------------------------------------------------------------------------
// Units and drafts
// ---------------------------------------------------------------------------

export type HeightUnit = 'cm' | 'ft-in';
export type WeightUnit = 'kg' | 'lb';

export function cmFromFeetInches(feet: number, inches: number): number {
  return (feet * 12 + inches) * CM_PER_INCH;
}

export function feetInchesFromCm(cm: number): { feet: number; inches: number } {
  const totalInches = cm / CM_PER_INCH;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round((totalInches - feet * 12) * 10) / 10;
  return inches >= 12 ? { feet: feet + 1, inches: 0 } : { feet, inches };
}

export function kgFromPounds(lb: number): number {
  return lb * KG_PER_POUND;
}

export function poundsFromKg(kg: number): number {
  return kg / KG_PER_POUND;
}

/** The string draft of the About you step; parsed on Continue, never rewritten while typing. */
export interface AboutDraft {
  age: string;
  sex: Sex | null;
  heightUnit: HeightUnit;
  heightCm: string;
  heightFeet: string;
  heightInches: string;
  weightUnit: WeightUnit;
  weight: string;
}

export const EMPTY_ABOUT_DRAFT: AboutDraft = { age: '', sex: null, heightUnit: 'cm', heightCm: '', heightFeet: '', heightInches: '', weightUnit: 'kg', weight: '' };

export type AboutErrors = Partial<Record<'age' | 'sex' | 'height' | 'weight', string>>;

const DECIMAL = /^\d+([.,]\d*)?$|^[.,]\d+$/;
function number(draft: string): number | null {
  const t = draft.trim();
  if (!DECIMAL.test(t)) return null;
  const n = Number(t.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

const INTEGER = /^\d+$/;

/** Validates the About you draft; returns the numeric inputs (height in cm, weight in kg) or field errors. */
export function parseAboutDraft(draft: AboutDraft): { ok: true; age: number; sex: Sex; heightCm: number; weightKg: number } | { ok: false; errors: AboutErrors } {
  const errors: AboutErrors = {};
  const ageText = draft.age.trim();
  const age = INTEGER.test(ageText) ? Number(ageText) : null;
  if (age === null) errors.age = ageText === '' ? 'Enter your age in years' : 'Enter a whole number of years';
  else if (age < ADULT_MIN_AGE) errors.age = `The estimate covers adults from ${ADULT_MIN_AGE}. For younger people, set the goal yourself.`;
  else if (age > AGE_MAX) errors.age = `Enter an age up to ${AGE_MAX}`;

  if (draft.sex === null) errors.sex = 'Choose the option the equation should use';

  let heightCm: number | null = null;
  if (draft.heightUnit === 'cm') {
    heightCm = number(draft.heightCm);
    if (heightCm === null) errors.height = draft.heightCm.trim() === '' ? 'Enter your height in centimetres' : 'Enter a number of centimetres';
  } else {
    const feet = number(draft.heightFeet);
    const inches = draft.heightInches.trim() === '' ? 0 : number(draft.heightInches);
    if (feet === null || inches === null) errors.height = draft.heightFeet.trim() === '' ? 'Enter your height in feet and inches' : 'Enter numbers of feet and inches';
    else heightCm = cmFromFeetInches(feet, inches);
  }
  if (heightCm !== null && (heightCm < HEIGHT_CM_RANGE.min || heightCm > HEIGHT_CM_RANGE.max)) {
    errors.height = draft.heightUnit === 'cm' ? `Enter a height between ${HEIGHT_CM_RANGE.min} and ${HEIGHT_CM_RANGE.max} cm` : 'Enter a height between 3 ft 4 in and 8 ft 2 in';
  }

  const weightRaw = number(draft.weight);
  const weightKg = weightRaw === null ? null : draft.weightUnit === 'kg' ? weightRaw : kgFromPounds(weightRaw);
  if (weightKg === null) errors.weight = draft.weight.trim() === '' ? `Enter your weight in ${draft.weightUnit === 'kg' ? 'kilograms' : 'pounds'}` : 'Enter a number';
  else if (weightKg < WEIGHT_KG_RANGE.min || weightKg > WEIGHT_KG_RANGE.max) {
    errors.weight = draft.weightUnit === 'kg' ? `Enter a weight between ${WEIGHT_KG_RANGE.min} and ${WEIGHT_KG_RANGE.max} kg` : `Enter a weight between ${Math.round(poundsFromKg(WEIGHT_KG_RANGE.min))} and ${Math.round(poundsFromKg(WEIGHT_KG_RANGE.max))} lb`;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, age: age as number, sex: draft.sex as Sex, heightCm: heightCm as number, weightKg: weightKg as number };
}

/** A saved estimate back into the About you draft, in the units it was entered with when they can be told apart (cm / kg otherwise). */
export function aboutDraftFromRecord(record: EstimateRecord): AboutDraft {
  return { age: String(record.age), sex: record.sex, heightUnit: 'cm', heightCm: String(Math.round(record.heightCm * 10) / 10), heightFeet: '', heightInches: '', weightUnit: 'kg', weight: String(Math.round(record.weightKg * 10) / 10) };
}

export function activityLabel(id: ActivityLevel): string {
  return ACTIVITY_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

export function goalLabel(id: WeightGoal): string {
  return GOAL_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

/** One-line description of a saved estimate's inputs: "female, 34, 168 cm, 62 kg, lightly active". */
export function describeEstimateInputs(record: EstimateRecord): string {
  return `${record.sex}, ${record.age}, ${Math.round(record.heightCm)} cm, ${Math.round(record.weightKg * 10) / 10} kg, ${activityLabel(record.activity).toLowerCase()}`;
}
