# Targets and the energy estimate

Owner: `docs/ux/` (behaviour). Composition lives in `DESIGN.md` §Targets sheet; the domain lives in `src/features/calorie-calculator/domain/energy-estimate.ts` and `macro-presets.ts` with unit tests; the decision record is `docs/design/hifi-decisions.md` §13.4.

## Scope

Targets stay optional. Nothing asks for them on first use, no average-person target is applied automatically, and logging, calculation and recipe discovery work without them. Existing saved targets are kept until the person changes them. Targets are effective-dated (ledger §12 A6): a save applies from today onward and never rewrites earlier days.

## Entry

`Set targets` on Home's calorie card (the only targets action) opens **Set daily goal — How would you like to set it?** with two routes: **Help me estimate** and **I know my goal**. `Edit targets` opens the editor on the saved values; re-estimating is an explicit action (`Recalculate estimate` for an estimated goal, `Help me estimate instead` for a manual one).

## Path A — I know my goal

- Daily calorie target in kcal (blank, invalid and zero are distinct errors; the draft stays editable).
- Nutrition preference: Balanced / Higher protein / Lower carb / Custom.
- A preset shows **Suggested macros** — grams derived from the calorie target, recomputed whenever the calories change, labelled a suggestion and never personalised.
- Custom shows three optional gram fields; they survive calorie changes, any of them may stay unset (a calorie-only target is valid), and when all three are set the editor states their energy against the calorie target without changing either.
- Save applies the reviewed values once. `Remove targets` clears them from today onward; entries, water and earlier days stay.

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

Three steps, then a review; no Profile page, no rate of change, no target weight, no date.

1. **About you** — age (years), the sex the equation uses (the equations come in a female and a male version), height (cm, or feet and inches), weight (kg or lb), with a sentence on why the equation needs them.
2. **Lifestyle** — Mostly sedentary / Lightly active / Active / Very active, each with a short description; no multipliers are shown.
3. **Goal** — Lose weight / Maintain weight / Gain weight.
4. **Estimated daily target** — the figure, the inputs and assumptions in words, the same nutrition-preference controls as Path A, the calorie field editable, and one `Save targets`. Nothing is applied before Save.

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

The product's labels map to the report's categories in order: Mostly sedentary = Inactive, Lightly active = Low active, Active = Active, Very active = Very active; the descriptions paraphrase the report's chapter 7 (Table 7-1) examples of daily activity. The USDA DRI Calculator applies the same DRIs with the same four categories.

Units: inches × 2.54 = cm; pounds × 0.45359237 = kg. Conversions and the equation run at full precision; the maintenance figure and the target are rounded to whole kcal for display and storage.

### Goal policy

- **Maintain**: the EER as it is (for a weight-stable adult EER equals total energy expenditure).
- **Lose**: EER − 500 kcal/day. The NHLBI *Clinical Guidelines on the Identification, Evaluation, and Treatment of Overweight and Obesity in Adults* (1998) associate a deficit of 500–1,000 kcal/day with a loss of 1–2 lb/week; Portion uses the lower end. The same guidelines describe the low-calorie diet as 1,000–1,200 kcal/day for women and 1,200–1,500 kcal/day for men and reject anything under 800 kcal/day; Portion therefore refuses to produce a loss target under **1,200 kcal/day** (the bound common to both ranges) and asks the person to set one with professional advice instead.
- **Gain**: no primary source verified for this pass states a surplus, so Portion adds none. The review shows the maintenance estimate, says in words that no surplus was added, and asks the person to enter the amount they want above it before saving. This is a documented blocker, not a silent substitution.

The NIDDK Body Weight Planner (Hall et al.) is a dynamic simulation that needs a goal weight and a time frame, both outside this product; nothing here claims to reproduce it, and no "3,500 kcal per pound" rule is used.

### Eligibility and limits

- Adults aged 19 and older. Under 19, pregnancy and lactation use other DRI equations Portion does not implement; the About you step says so and points to the manual path.
- Input ranges: age up to 120; height 100–250 cm; weight 30–300 kg. Outside them the field is refused with its message; the other fields keep their values.
- The result is a population estimate. The report itself notes that an intake equal to the EER "could result in weight maintenance, weight gain, or weight loss" for a given person; the review says the figure is not a measurement or medical advice and may be higher or lower than the person's own need.

### What is saved

`DailyGoal.source` is `manual` or `estimated`; `preset` is the preference behind the grams; `estimate` keeps `{ method: 'nasem-2023-eer', age, sex, heightCm, weightKg, activity, goal, eerKcal, adjustmentKcal }` so `Edit targets` can explain the estimate and recalculate it explicitly. Older records without these fields read as manual. Everything lives in the existing local record (version 2, additive fields); no backend, no telemetry.

Sources: [DRI for Energy 2023, summary and Table S-3](https://www.nationalacademies.org/read/26818/chapter/2); [Applications chapter (activity categories, individual variability)](https://www.ncbi.nlm.nih.gov/books/NBK591020/); [NHLBI treatment guidelines](https://www.ncbi.nlm.nih.gov/books/NBK2004/); [USDA DRI Calculator](https://www.nal.usda.gov/human-nutrition-and-food-safety/dri-calculator); [NIDDK Body Weight Planner](https://www.niddk.nih.gov/health-information/weight-management/body-weight-planner).
