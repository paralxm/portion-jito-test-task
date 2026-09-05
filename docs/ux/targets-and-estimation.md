# Targets and the energy estimate

Owner: `docs/ux/` (behaviour). Composition lives in `DESIGN.md` §Targets flow; the domain lives in `src/features/calorie-calculator/domain/energy-estimate.ts`, `macro-presets.ts` and `goal-history.ts` with unit tests; the flow's draft logic is `src/features/calorie-calculator/targets/targets-draft.ts`; the decision record is `docs/design/hifi-decisions.md` §13.4 and §14.

## Scope

Targets stay optional. Nothing asks for them on first use, no average-person target is applied automatically, and logging, calculation and recipe discovery work without them. Existing saved targets are kept until the person changes them.

Targets are effective-dated (ledger §12 A6, §13.9, §14): every save records a period `{ from, goal }` that lasts until the next period starts. The flow saves from **today** unless the person chooses a later start date (see *Effective date* below); saving while viewing an earlier day still starts the period today, so that day keeps whatever was in force then; several saves for one day replace that day's period; removing targets records a cleared period from today and leaves earlier periods, entries and water untouched. The history lives in the existing versioned record, survives reloads and the local midnight rollover, and a version-1 record's single goal migrates as one period from the migration day — no historical value is invented.

## Entry

`Set targets` on Home's calorie card (the only targets action) opens the one bottom sheet of the flow, **Set daily goal — Choose how to set your target.**, with two routes: **Help me estimate** (prominent; "Use your body stats and activity.") and **I know my goal** ("Enter your daily calories."). A short informational note beneath says targets can be changed anytime from Home. The sheet has a Close action and no Cancel footer; opening or dismissing it changes nothing.

Either route moves into the app's focused full-screen layout (no logo, date or streak header, no bottom navigation, the mobile container kept on desktop). `Edit targets` skips the sheet and opens the editor on the saved values. The decision is made on today's targets, not the shown day's: on an earlier day without a target of its own, `Set targets` opens the editor on today's targets when they exist (the save replaces today's period and the earlier day keeps what it had), and the route sheet only when there are none. Re-estimating is always explicit: `Recalculate` for an estimated target, `Estimate instead` for a manual one; both open the three steps prefilled with what the saved estimate recorded (empty for a manual target) and Back from the first step returns to the editor.

## The focused shell

Every step shares one bar: **Back** at the start, the step count `1/3`, `2/3`, `3/3` centred on the container (read as "Step 1 of 3"), **Help** at the end. The screen heading sits below the bar; the footer holds one primary action (Continue → Continue → Review estimate, or Save targets) with a quiet text `Cancel setup` / `Cancel changes` where the flow allows leaving. The review and the editor have no step count. Focus moves to the heading on every screen change; no field is focused automatically, so the keyboard does not open until the person taps a field.

**Help** opens a short dialog for the current step — a heading and one to three sentences — with a *Calculation details* disclosure that holds the longer methodology (the equations' source, the goal policy, the preset shares). Escape or Close returns focus to Help; the draft is never touched. Formula names and years, equations, provenance banners and "nothing is saved" repetitions stay out of the main path; eligibility limits (adults 19 and over; the 1,200 kcal floor) remain visible where they apply.

## Path A — I know my goal

The editor (`Set daily targets`) with Daily calories in kcal (blank, invalid and zero are distinct errors beside the field; the draft stays editable), the nutrition preference, the macro rows, the start date and `Save targets`.

- Nutrition preference: Balanced / Higher protein / Lower carb / Custom.
- A preset shows **Suggested macros** as three rows — Protein, Carbs, Fat with their nutrient markers — grams derived from the calorie target and recomputed whenever the calories change, the share as secondary text, labelled a suggestion and never personalised.
- Custom shows three optional gram fields; they survive calorie changes, any of them may stay unset (a calorie-only target is valid), and when all three are set the editor states their energy against the calorie target without changing either.
- Save applies the reviewed values once. Back from the editor returns to the route choice with the draft kept; `Cancel setup` leaves (a confirmation only when something was entered).

### Preset shares and derivation

| Preset | Protein | Carbohydrate | Fat |
| --- | --- | --- | --- |
| Balanced | 20 % | 50 % | 30 % |
| Higher protein | 30 % | 45 % | 25 % |
| Lower carb | 25 % | 45 % | 30 % |

Every preset sits inside the adult Acceptable Macronutrient Distribution Ranges of the National Academies' *Dietary Reference Intakes for Energy, Carbohydrate, Fiber, Fat, Fatty Acids, Cholesterol, Protein, and Amino Acids* (2002/2005): protein 10–35 %, carbohydrate 45–65 %, fat 20–35 % of energy. "Higher protein" and "Lower carb" both stop at the 45 % carbohydrate floor rather than leaving the ranges; they differ in how the rest is split. The shares are product choices within those ranges, not a personal prescription.

Grams = calorie target × share ÷ energy per gram, with the general Atwater factors 4 kcal/g protein, 4 kcal/g carbohydrate and 9 kcal/g fat. Calculation keeps full precision; grams are rounded to whole numbers for display and saved as whole grams.

Sources: [AMDR description (NASEM, NCBI Bookshelf)](https://www.ncbi.nlm.nih.gov/books/NBK610333/); [National Academies, chapter 3](https://www.nationalacademies.org/read/27957/chapter/5).

## Path B — Help me estimate

Three focused steps, then a full-screen review; no Profile page, no rate of change, no target weight, no date.

1. **About you** (1/3, Continue) — Age (years); the sex the equation uses as two equal-width tiles, Female / Male; Height with a `cm | ft + in` selector in its label row (ft + in as two equal inputs) and Weight with `kg | lb`, the inputs beneath. Switching a unit converts the value already typed. Validation appears beside each field and Continue focuses the first problem. Help explains why the equation needs these details and the adult limit.
2. **Your activity** (2/3, "Think about a typical week.", Continue) — Mostly sedentary / Lightly active / Active / Very active as selection cards with one-line descriptions; the whole card selects, nothing auto-advances, no multipliers are shown.
3. **Your goal** (3/3, Review estimate) — Lose weight / Maintain weight / Gain weight as the same cards, with no rate or timeline. A loss goal the policy cannot support (see below) is explained the moment it is chosen, with `Set it myself` opening the manual editor and keeping every entered value.
4. **Your daily target** (no step count, Save targets) — a small *Estimated* label, the figure centred in the primary numeric style with `kcal/day` beneath, `Adjust` (the same number becomes a field in place; a changed value is labelled *Adjusted from the estimate* and saved as adjusted), "An estimate you can adjust.", the goal · activity summary with `Edit details` (back to About you; Continue through the steps returns to the review), the nutrition preference and macro rows, the start date, and one `Save targets`. Nothing is applied before Save. Changing the calories updates the preset grams; Custom grams stay as entered. Maintain shows the estimate as it is; Gain shows the maintenance estimate and says in words that the person adds the surplus.

### Method

The adult Estimated Energy Requirement (EER) equations of the National Academies' *Dietary Reference Intakes for Energy* (2023), Table S-3, for adults aged 19 and older — one linear equation per sex and physical-activity category:

| Sex | Category | Equation (kcal/day; age in years, height in cm, weight in kg) |
| --- | --- | --- |
| Men | Inactive | 753.07 − 10.83·age + 6.50·height + 14.10·weight |
| Men | Low active | 581.47 − 10.83·age + 8.30·height + 14.94·weight |
| Men | Active | 1,004.82 − 10.83·age + 6.52·height + 15.91·weight |
| Men | Very active | −517.88 − 10.83·age + 15.61·height + 19.11·weight |
| Women | Inactive | 584.90 − 7.01·age + 5.72·height + 11.71·weight |
| Women | Low active | 575.77 − 7.01·age + 6.60·height + 12.14·weight |
| Women | Active | 710.25 − 7.01·age + 6.54·height + 12.34·weight |
| Women | Very active | 511.83 − 7.01·age + 9.07·height + 12.56·weight |

The product's labels map to the report's categories in order: Mostly sedentary = Inactive, Lightly active = Low active, Active = Active, Very active = Very active; the descriptions paraphrase the report's chapter 7 (Table 7-1) examples of daily activity. The USDA DRI Calculator applies the same DRIs with the same four categories. In the product this method is named only inside Help's *Calculation details*; the steps and the review do not show formula names, years or equations.

Units: inches × 2.54 = cm; pounds × 0.45359237 = kg. Conversions and the equation run at full precision; the maintenance figure and the target are rounded to whole kcal for display and storage. A unit switch converts the typed value at full precision and shows it to one decimal.

### Goal policy

- **Maintain**: the EER as it is (for a weight-stable adult EER equals total energy expenditure).
- **Lose**: EER − 500 kcal/day. The NHLBI *Clinical Guidelines on the Identification, Evaluation, and Treatment of Overweight and Obesity in Adults* (1998) associate a deficit of 500–1,000 kcal/day with a loss of 1–2 lb/week; Portion uses the lower end. The same guidelines describe the low-calorie diet as 1,000–1,200 kcal/day for women and 1,200–1,500 kcal/day for men and reject anything under 800 kcal/day; Portion therefore refuses to produce a loss target under **1,200 kcal/day** (the bound common to both ranges). The goal step says so when Lose weight is chosen and offers the manual editor with the entered values kept.
- **Gain**: no primary source verified for this pass states a surplus, so Portion adds none. The review shows the maintenance estimate, says in words that the person adds the surplus above it, and never presents maintenance as a calculated gain target. This is a documented blocker, not a silent substitution.

The NIDDK Body Weight Planner (Hall et al.) is a dynamic simulation that needs a goal weight and a time frame, both outside this product; nothing here claims to reproduce it, and no "3,500 kcal per pound" rule is used.

### Eligibility and limits

- Adults aged 19 and older. Under 19, pregnancy and lactation use other DRI equations Portion does not implement; the Age field says so and points to the manual path.
- Input ranges: age up to 120; height 100–250 cm; weight 30–300 kg. Outside them the field is refused with its message; the other fields keep their values.
- The result is a population estimate. The report itself notes that an intake equal to the EER "could result in weight maintenance, weight gain, or weight loss" for a given person; Help on the review says the figure is not a measurement or medical advice and may be higher or lower than the person's own need.

## Effective date

The editor and the review show **Starts Today** with `Change`. Change reveals a date input limited to today or later (`Use today` returns); the start date is when the targets begin, never a deadline. One sentence states the consequence:

| Start | Situation | Copy |
| --- | --- | --- |
| Today | no scheduled change | From today until you change it. |
| Today | a change scheduled for later | From today until [Sep 11], when your scheduled change starts. |
| Future | current targets exist | Starts [date]. Your current targets stay until then. |
| Future | no current targets | Starts [date]. No targets apply before then. |
| Future | another change already scheduled | Starts [date]. This replaces the change scheduled for [Sep 8]. (+ the current-targets sentence) |

Rules (an extension of "targets apply from today until changed"; the history model is unchanged):

- One record per start date; saving for a date replaces that date's record.
- At most one pending change after today. A future-dated save replaces any other scheduled period; the editor says so before Save.
- An immediate (today) save keeps a scheduled change; Home and the editor show it as `Scheduled: 1,750 kcal from tomorrow.` and the editor offers `Cancel scheduled change`, which drops the scheduled period at once and keeps the current targets (a change that is confirmed, not part of the unsaved draft).
- `Remove targets` clears today's targets **and** any scheduled change after one confirmation that names both: *Remove daily targets — Food, water and past targets will stay. This also cancels the change scheduled for [date].* (`Keep targets` / `Remove targets`). Removal is not offered while creating targets for the first time.
- The start date is revalidated at Save: a date that passed while the flow was open is refused beside the date field.
- Days before the start keep whatever they had; Home shows the target in force on the selected day.

### After save

The flow returns to the Home context it started from — the same selected day, the same scroll — with one concise confirmation in the existing toast: *Targets saved. From today until you change them.*; *Targets saved. They start [date]. Your current targets stay until then.*; *Targets saved. Until [Sep 11], when your scheduled change starts.*; or, when Home showed an earlier day, *Targets saved from today. Nothing changes [yesterday].* Home's recommendation is reused unchanged.

## Draft ownership and exits

One draft belongs to the whole task (route, inputs, the reviewed estimate, calories, macro choice, start date). Back between steps, Help, Edit details and Recalculate keep it; Back from the first step or the manual editor returns to the route choice with the draft kept; browser Back and swipe-back follow the same stack and the same guard as the bar's Back. A discard confirmation (*Discard changes? — Your unsaved target changes will be lost. Saved targets, food and water stay.*) appears only when the draft differs from where it started; an untouched task leaves at once. Closing the route sheet ends the task. A refresh or tab closure only gets the browser's generic unload prompt while a draft is dirty; the draft itself is not persisted.

## Saving and failure

Save happens exactly once: the history is written to the device before it becomes state, so a refused write (quota, private browsing) keeps the whole draft on screen with *Not saved* and `Try again`; nothing is applied until the write succeeds. A second activation during a save is ignored.

### What is saved

`DailyGoal.source` is `manual` or `estimated`; `preset` is the preference behind the grams; `adjusted` is set when an estimated figure was changed before saving; `estimate` keeps `{ method: 'nasem-2023-eer', age, sex, heightCm, weightKg, activity, goal, eerKcal, adjustmentKcal }` so `Edit targets` can show the compact source row and recalculate explicitly. Older records without these fields read as manual. Everything lives in the existing local record (version 2, additive fields); no backend, no telemetry.

Sources: [DRI for Energy 2023, summary and Table S-3](https://www.nationalacademies.org/read/26818/chapter/2); [Applications chapter (activity categories, individual variability)](https://www.ncbi.nlm.nih.gov/books/NBK591020/); [NHLBI treatment guidelines](https://www.ncbi.nlm.nih.gov/books/NBK2004/); [USDA DRI Calculator](https://www.nal.usda.gov/human-nutrition-and-food-safety/dri-calculator); [NIDDK Body Weight Planner](https://www.niddk.nih.gov/health-information/weight-management/body-weight-planner).
