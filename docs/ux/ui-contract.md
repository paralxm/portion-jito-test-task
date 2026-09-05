Portion — UI Contract

Updated: 2026-09-03.
Status: Current target behavior; new Home/logging behavior requires Figma and runtime alignment.
Repository location: docs/ux/ui-contract.md.

This document owns component, interaction and data behavior. Low-fidelity owns screen structure, IDs and coverage; task flows own task goals and completion. Visual direction owns brand and visual decisions. Shared rules must agree; superseded runtime reports are not instructions for the new design.

1. Demonstration fixtures and numeric presentation

All fixtures are synthetic UI-test data, not database records, photo-derived values or nutrition recommendations.

Fixture C amount

Energy

Protein

Carbohydrates

Fat

100 g

180 kcal

6 g

21 g

8 g

250 g

450 kcal

15 g

52.5 g

20 g

300 g

540 kcal

18 g

63 g

24 g

Fixture C scales from its per-100-g basis. Fixture R: Lentil soup; 1 serving = 300 g; 450 kcal, 24 g protein, 48 g carbohydrates, 18 g fat, 25 minutes; dietary type unspecified. Expanded specimen: fibre 8 g, calcium 120 mg, iron 3 mg, vitamin C 12 mg; vitamin D unavailable. For R, carbohydrate total includes fibre; do not add it again.

C and R are independent. Do not derive one from the other, an image or recomputation of declared energy from rounded macro values.

Home fixtures: goal 2,200 kcal. Empty: no entries, logged 0, remaining 2,200. Populated: two synthetic entries totaling 1,350 kcal, remaining 850; aggregate protein/carbs/fat 90/135/50 g. Example rows: Oatmeal with mixed berries, 300 g, 550 kcal; Grilled chicken Caesar salad, 350 g, 800 kcal. Use separate internally consistent per-entry nutrient fixtures when implementing aggregate tests; do not infer real nutrition from those names.

Retain precision internally; display whole kcal and up to one decimal for macro grams without unnecessary trailing zeros. Keep units and portion basis explicit. Set appropriate precision for micronutrients so a known small quantity does not appear as a misleading zero. Use the established tabular-number typography for changing values.

2. Food candidates, results and daily entries

2.1 Separate states

Object

Meaning

What can change it

Food candidate

Selected search/barcode/photo data or manually entered reference data

Acquisition and identity correction

Portion preview

Result derived from the candidate and a valid desired portion

Local portion/unit edits in S07

Edit draft

Proposed changes to one existing logged entry

Existing-entry review controls; not yet reflected in Home totals

Daily entry

Explicitly logged snapshot of identity, portion, energy and available nutrients

Add to today creates; Update entry changes the same ID; confirmed Remove deletes

Daily goal

Optional user-entered calorie value

Contextual goal editor on Home

Understanding the portion preview completes JTBD 01. Reading a result, selecting a recognition suggestion, adjusting a portion, viewing a recipe or returning Home never logs food automatically.

2.2 New food review

All four acquisition methods lead to S07, including S06 → S07-6. Present identity, source/reference basis, desired portion, energy and available nutrition. Provide an explicit correction action and distinguish reference quantity from desired portion.

Valid edits recalculate the preview locally, without a Calculate/Save step or artificial loading. Keep invalid drafts and label the result unavailable for that draft; an old result must not look current.

Add to today is optional and enabled only for valid, reviewed identity/reference/portion data with a calculable energy result. One activation creates one entry and returns to Home. Implemented 2026-09-04: the button is disabled while the portion draft is invalid or the result is not calculable; the guidance stays beside the field. The button itself communicates the logging intent; no preceding generic Confirm or additional Save decision is required.

Prevent duplicate activation for the same submission. Deliberately adding the same food again in a new acquisition is allowed and creates a separate entry; duplicate protection must not collapse legitimate repeated portions.

Back returns to the previous acquisition step. Close, labelled **Done** in the implementation (2026-09-04), exits the food task to its invoking surface without logging. Implemented 2026-09-04: opening Log food records the invoking surface (root destination plus the focused stack, Recipe Details included); Done restores it even when Search food switched the root to Search, and a task started on the Search tab itself returns to Search (docs/design/hifi-decisions.md D-4). A read-only visit or new portion preview does not require a warning solely because it was not logged. Meaningful unsaved manual-reference work uses the existing Keep editing/Discard rule.

2.3 Existing-entry review and removal

Open a Home food row into S07 existing-entry mode. Load the entry's committed data into a draft. The calorie preview updates locally, but Home totals continue to use the committed entry until Update entry is activated.

Update entry preserves the entry ID and logged day; it does not append another food or replace unrelated entries. Cancel/Close preserves committed data; changed edit drafts offer Keep editing/Discard, while an unchanged visit closes directly. Implemented 2026-09-04: S07 in existing-entry mode is titled "Edit entry", offers no Change food (identity is fixed for a logged entry), and its footer is Update entry + Remove entry.

Remove entry is an explicit action in existing-entry mode. Use a concise confirmation identifying the food; confirmation removes that record and returns Home, cancellation changes nothing. Implemented 2026-09-04 with the existing `ConfirmDialog` ("Remove {food} from today?", Keep entry / Remove).

The proposed target for the former S07-3 replacement specimen is existing-entry editing. Its canvas and code changes remain pending. The old single-current-calculation replacement model is superseded.

2.4 Session and daily ownership

For the prototype, retain entries, goal, search and criteria during the active app session and internal navigation. Reload persistence, account sync and durable storage are not promised; do not claim diary history survives reload until persistence is implemented and verified.

At Add to today, assign a stable entry ID and the user's current local calendar-day key. Home aggregates entries for the current local day. On day change, show the new day's entries; unlogged drafts remain drafts and do not carry over as records. Keep earlier in-session entries associated with their original day; this does not introduce a history-browsing feature. Editing an entry preserves its original day key. Do not silently reassign logged dates after a timezone change.

Committed entries retain their portion/nutrition snapshot; later searches or candidate corrections cannot mutate them. Check duplicate actions, stale responses and local-day rollover during implementation verification.

3. Daily calories, goal and ring

3.1 Arithmetic and unavailable values

todayEntries = committed entries whose day key is today's local day
loggedKcal = sum(todayEntries.energyKcal), when all energies are known
remainingKcal = dailyGoalKcal - loggedKcal, when goal and total are valid
visualRatio = clamp(loggedKcal / dailyGoalKcal, 0, 1)

Home state uses todayEntries.length, not loggedKcal: a zero-kcal entry is still an entry. An empty set has a recorded total of zero; it says nothing about food consumed outside the app.

Only calculate a ratio for a valid positive goal and complete energy data. For incomplete energy, show a labeled known subtotal/partial total and make the exact remainder unavailable. Never turn unknown values into zero or show an indeterminate loading spinner for permanently unavailable data. Each macro aggregate handles missing constituent values independently.

For a reached goal, show 0 kcal remaining. Above goal, cap the arc at 100% and explicitly show X kcal over your set goal. Do not hide the excess by displaying 0 remaining, or use praise/shame and food-quality judgments.

3.2 Optional goal editor

No goal is set by default; 2,200 kcal is a fixture only. Home offers Set a daily goal or Edit daily goal through a contextual editor. Allow a positive finite user-entered value and an explicit clear-goal action. Invalid drafts remain editable and do not replace the committed value. Apply commits, Cancel preserves the previous goal.

Without a goal, recorded totals remain available and the remainder is labeled unavailable. Both core jobs and explicit food logging remain accessible. Setting/changing/clearing the goal changes no entries or recipe criteria. Automatic recommended-goal calculation and onboarding/Profile are outside scope.

3.3 Component responsibilities

Layer

Responsibility

Reusable ring, proposed name ProgressRing

Render the track, bounded arc and supplied central content. Accept a known ratio or an unavailable presentation. Own no food records, nutrition-goal calculation or daily aggregation.

Home composition, proposed name DailyCaloriesCard

Compose ring, Remaining, Logged, Goal and any contextual action from prepared display data.

Feature logic

Own entries, goal, arithmetic, completeness, local-day selection and add/edit/remove commands.

First inspect the existing component library; reuse/extend a suitable ring if available. Keep one implementation for the product and Storybook.

Implemented 2026-09-04 (`feat/navigation-hifi`): the reusable ring is `ProgressRing` (design-system primitive; `value: null` is the unavailable presentation), the Home composition is `CalorieProgressRing` (feature component; the centre figure is remaining while a goal exists and the total is complete, the excess above the goal, otherwise the logged amount), the contextual editor is `GoalSheet` (ModalSheet + AmountField; Apply / Cancel / Clear goal), and the feature logic is `domain/daily-log.ts` (`summarizeDay`, `createEntry`, `updateEntryPortion`, `localDayKey`). With no entries every nutrient total is a recorded 0; with entries, an unknown constituent makes the total a labelled partial subtotal.

Use the approved visual tokens. Values remain neutral, and text communicates the quantity and state without depending on arc color. The ring represents a quantity relative to a goal, not a loading task. Provide an equivalent accessible text description with units and state; do not expose the decorative arc as another focusable control or announce every animation frame. Respect reduced motion and avoid counting effects that obscure the actual value.

Required representative stories: no entries; partial progress; goal reached; above goal; no goal; incomplete energy/macros; a valid zero-kcal entry; narrow width/large text. Goal-field validation belongs in the editor's stories.

4. Component coverage

This is required coverage, not an assertion that every named component is implemented. Follow existing repository naming and ownership before creating new abstractions.

Group

Required coverage

Main states/behavior

Actions

Button, IconButton

Primary/secondary/text; pressed, focus-visible, disabled/loading; pointer hover; duplicate prevention.

Inputs

TextField, AmountField, SearchField

Empty, filled, focused, invalid, disabled; visible label/helper/error; retain input.

Units

UnitControl and O04

Supported conversions; selected unit; explicit apply/cancel.

Criteria

DietaryControl, FilterChip, AppliedCriterionChip

Selectable versus removable semantics; selected boundary/check/text; no contradictory selection.

Nutrition

NutrientBadge, NutritionSummary, NutrientRow

Known/partial/unavailable; compact/expanded; explicit units and basis.

Daily display

Reusable ring and Home calorie-card composition

States defined in section 3; no duplication for empty/populated Home.

Food rows

FoodResultRow; logged-entry row composition

Search selects a candidate; Home opens an existing entry. Preserve their different meanings.

Method choice

Existing method-control pattern extended to tiles/rows

Immediate action with icon, label and helper; no selected/radio state.

Recipes

RecipeCard, MatchCriteria

Photo/no photo, long title, active/no criteria; factual match evidence.

Overlays

ModalSheet and confirmation patterns

Methods/filters/units; goal editor and entry removal coverage pending; close, scroll and focus containment.

Feedback

InlineMessage, EmptyState, LoadingState

Cause-specific recovery, invalid input, progress and actual outcomes.

Navigation

AppHeader, BackAction, NavigationBar

Three destinations in one width-filling group and one separate circular Log food action (the plus; accessible name "Log food", implemented 2026-09-04); correct origin selection.

Avoid copying an existing MethodRow into an unrelated new implementation merely to achieve a grid. Preserve a shared action pattern while adapting its layout. No voice method or Create a dish/ingredient builder is introduced.

5. Navigation, overlays and state ownership

One bottom row: Home | Search | Recipes | + Log food. Implemented 2026-09-04: the three destinations form one group of equal cells that fills the width beside the plus; the plus is a separate 56 px circular action after a 16 px gap, labelled Log food (superseding the earlier Add food label for the plus, the O01 title and Home's body action; Add to today remains the commit).

Surface

Selected destination

Behavior

S01 Home

Home

Initial launch; empty/populated by today's entry count. No inline portion form.

S02, either scope

Search

Scope selector belongs near the search field.

S03 Recipes

Recipes

Query-free browse, optional criteria.

S08 details

Search or Recipes origin

Same bar; Back restores originating results.

S04–S07

No root selection shown

Focused task steps with Back/Close, without bottom bar.

Foreground sheet

Underlying selection retained

Background and bar inactive.

Plus is a trailing button, never a selected tab or floating duplicate. Retain the project's 56×56 plus target. Other interactive controls have at least 48×48 CSS px targets. Use current-page/selected semantics appropriate to the actual implemented navigation pattern.

O01 opens over Home, Search, Recipes or Recipe Details where Log food is present. Closing it preserves screen, input, criteria and scroll; selecting a method retains its origin and starts that flow. Camera permission is requested only when the chosen camera flow needs it.

Implemented 2026-09-04: Search's Food | Recipes switch is exposed as a tablist whose selected tab controls the results tabpanel (automatic activation, arrow keys move focus and selection together); it was a radio group before. Recipe criteria still never filter Food results.

First Search entry uses Food and no query. Scope changes retain the query, while recipe criteria remain Recipes-specific. Tab switches retain contexts without duplicating navigation entries. New queries reset result scroll; returning from details restores it.

Recipes browse owns its applied criteria. Browse-to-Search copies a snapshot into Search's Recipes scope; subsequent Search edits do not silently change browse. Home's criteria summary references Recipes browse only. Find recipes opens/restores browse; See matching recipes restores that same owner with its applied criteria. Never infer recipe constraints from food entries or daily remaining calories.

Hide the entire root bar behind the software keyboard and restore it afterward. Keep focused controls and actions reachable; do not reposition only the plus.

6. Shared interaction patterns

6.1 O01 method sheet

Four buttons: Search food, Scan barcode, Take a photo, Enter manually. At 393 px, the target LF is a neutral 2×2 tile grid with icon, label and helper. At narrow widths/large text, grow or reflow to rows rather than shrinking content. No extra Continue or selected state. The old runtime list is a historical layout, not a restriction on the new target.

Close/backdrop/supported Escape dismiss the sheet only; swipe is optional. Maintain one foreground modal. Selecting a method closes the chooser as the focused journey opens; do not stack it invisibly beneath later sheets.

6.2 Reference data, portions and units

Manual entry requires a food identity, nonnegative calorie value, positive reference amount and supported unit. Optional macros left blank remain unknown. Reject malformed/nonfinite and negative nutrient values without clearing other fields. Desired portion must be positive.

portion nutrition = reference nutrition × desired quantity / reference quantity

Convert to compatible units first. Never assume grams equal milliliters, pieces or servings without food-specific conversion data. Preserve the source's reference and carbohydrate/fibre convention.

When switching supported units, re-express a valid amount so the portion stays equivalent: 300 g → 1 serving when the data defines 1 serving = 300 g. Preserve internal precision; rounded display must not compound into later conversions. Invalid drafts remain invalid and editable.

O04 uses a modal draft: mark the unit, Confirm applies it, Cancel preserves the prior value. A valid unit/amount change updates the S07 preview, not an existing logged entry until Update entry is activated.

Use additional-nutrition disclosure on food review and recipe details for available fibre, vitamins and minerals. Do not add an expanded nutrient table to every Home row. Missing data is unavailable, not zero. Dietary preference is not an allergy guarantee.

6.3 Recipe filters and matching

Supported criteria: calories per serving min/max, protein per serving minimum, preparation time maximum and dietary preference, plus the separate optional query. Blank bounds mean unrestricted; reject invalid bounds and minimum above maximum. Do not silently relax hard criteria.

Criteria combine with AND. A known value must satisfy each active hard criterion; an unknown nutrient or dietary value cannot establish a match. No active criteria means no match claim or invented personal preference.

O02 edits are drafts until Apply. Reset clears the draft and still requires Apply. Cancel discards unapplied edits. Removing an applied chip updates the owning result set immediately and is not undone by cancelling a later sheet.

Cards expose calories/protein per serving and available dietary/preparation facts. With active criteria, show a compact factual summary such as Matches all 3 filters, supported by the visible values. Details show each active criterion against its known recipe value. Do not label every recipe healthy or suitable without actual criteria.

6.4 Recipe details

From

Event

To

S02-5 or S03-1/S03-2

Open recipe

S08-2, retaining origin

S08-2

Success

S08-1, including S08-4 no-photo/long-title variant

S08-2

Failure

S08-3

S08-3

Retry

S08-2 for the same recipe

Any S08 state

Back

Exact originating list, query, criteria and scroll

No matches cannot open details. Back during loading ignores any late response. A failed image does not make an otherwise valid recipe unavailable. Cards use the established 4:3 imagery ratio; details use 16:9; absent photos retain valid content.

Recipe discovery ends when the user identifies a suitable option. No mandatory Save, Cook or Add to today is introduced on recipe details by this revision.

6.5 Recovery and asynchronous work

Cause

Recovery

Food no matches

Change query, manual entry or another method.

Recipe no matches

Change query or criteria in the current discovery context.

Search/browse service failure

Retry while preserving input; food also offers manual entry.

Unreadable barcode

Continue/rescan or switch method.

Barcode product missing

Search/manual or optional rescan.

Barcode lookup failure

Retry with the read code or switch method.

Camera denied/unavailable

Search/manual; platform settings where appropriate, without prompt loops.

Photo no usable match

Retake/search/manual.

Photo analysis failure

Retain image; retry, retake or leave.

Invalid input

Keep values, identify the affected field, prevent invalid submission.

Pause capture after a barcode read to avoid repeated lookup. Photo flow has preview/retake before analysis and explicit selection from suggestions afterward. Implemented 2026-09-04: suggestions are radio rows with a visible selection mark; **Review selected match** (unavailable until a suggestion is marked) opens review, and **None of these** reveals Retake photo / Search by name / Enter manually without leaving the step (docs/design/hifi-decisions.md D-3). Cancelled operations and obsolete responses cannot navigate, log food or overwrite newer state. Service failures never become zero nutrition or no matches.

7. Accessibility and responsive requirements

Use visible labels; placeholders are not labels. Give icon-only actions accessible names and keep decorative glyphs out of repeated announcements.

Preserve the approved navigation selection indicator and label; color alone does not convey selection. Use the approved Phosphor weights and design tokens.

Keep visible focus, including the existing 3 px focus ring with a 2 px gap where defined by tokens; ancestors must not clip it.

One modal at a time; background inactive; initial focus inside; keyboard focus contained; restore focus to the opener where it still exists.

Close is visible and operable; gestures are optional. Dirty-draft behavior is consistent for explicit close and dismissal gestures.

Use the approved sheet radius/shadow/scrim tokens. LF placeholder geometry does not override the visual system. Scrolling and anchored actions must not cover content or focus.

Verify 320/393/430 CSS px, software keyboard, safe areas, long English labels and 200% text resizing. Keep the established 390 px check if already covered by repository tests.

Ring text and nutrition labels communicate quantities without requiring color perception. Loading announcements and result updates must be useful without excessive repetition.

Respect reduced motion. Verify keyboard use, focus order, modal return and screen-reader interpretation in runtime.

Existing reports of 24 verified color pairs apply to those listed pairs only. They do not establish contrast in every new ring/card placement or overall accessibility conformance. Check actual token combinations when implementing.

Implemented 2026-09-05 (Hi-Fi redesign, docs/design/hifi-decisions.md §10): every committed entry belongs to one meal (breakfast, lunch, dinner, snack); Add to today on S07 opens the shared Add-to-meal sheet whose Add to {meal} is the single commit (D-23); Recipe Details offers Add, which creates a recipe entry on a per-serving basis (superseding the 6.4 sentence that no Add to today exists on details); the Home ring is replaced by the horizontal calorie budget bar with a goal marker (D-19, D-20) and the goal editor takes optional user-entered macro targets (D-18); Home records today's water (D-22); the bottom navigation is fixed within the shell (D-26); the barcode and photo steps show no simulator controls (D-24).

Implemented 2026-09-05 (Stage B, docs/design/hifi-decisions.md §11): the Food scope of Search shows a 15-item catalogue (12 foods or dishes, 3 drinks, each with a local licensed photograph, name, detail and calories per explicit basis) as soon as the tab opens (S02-7); `Recently added` — derived only from confirmed meal entries, newest first, one row per item — sits above `Explore foods` when history exists (S02-8); a compact toolbar under the field carries the List / Grid toggle (List default, persisted on the device; S02-9) and the `Food filters` action opening the shared filter sheet with All / Foods / Drinks, Clear all and Apply (O07; dismissal keeps the previous filter; the applied filter shows as a chip and in the action's count, S02-10); a query yields one unified, deduplicated set across recents and catalogue with a unique-item count ("2 items found", "3 drinks"); loading, no-match (with Change filters when a filter is applied) and failure stay distinct. Drinks are logged like foods and never change the water record. Entries, the goal, water per day and the view are kept on the device and restored on launch; each entry keeps its own local day and the current day rolls over at local midnight (D-32 – D-38).

Implemented 2026-09-05 (revision R1–R6, docs/design/hifi-decisions.md §12) — the following clauses supersede the earlier ones where they conflict:

- §2.2 / §2.4: every food commits on its own screen — the review after search, barcode or photo, or manual entry's second step — through the shared portion form (amount with documented steps and item-supported presets, the live result, the meal choice, the target day) and one final `Add to {meal}`. The food Add-to-meal sheet is retired; the sheet remains for Recipe Details, which has no portion or meal yet. There is no ambiguous `Done`: `Cancel` is the explicit secondary exit, and every food task shares one exit policy — an untouched task exits at once; a task with entered or edited data opens `Discard changes?` (Keep editing focused; Escape and backdrop keep the draft; only Discard changes clears it and returns to the recorded origin). Back between the manual steps and Edit food details preserve the whole draft without a confirmation; cancelling a nested sheet never clears the parent draft. Browser Back and swipe-back follow the focused-step stack and use the same guard; a refresh or tab closure only gets the browser's generic unload prompt.
- §2.2 (sources): barcode review shows the matched record's image, name, brand when supplied, the read code and the basis, described as a match (never verified), with `Change product` and `Edit label values`; photo review keeps the suggestion-selection step, shows the captured frame (a labelled sample in this prototype), explains that the user checks the match and enters the portion, and offers `Change match`, `Retake photo` and `Edit nutrition values`. Corrections open manual entry prefilled from the record and produce a manual override with provenance; the catalogue is never changed. Barcode metadata never appears on a photo result.
- §2.4 (day ownership): entries are bound to the local day selected when the task started and keep that key; Home shows any selected day up to today (week strip, previous/next week, Today, future days unavailable), with that day's entries, totals and water; a midnight rollover moves neither the selection of an earlier day nor a pending task's target day. The device record (version 2) keeps every day's entries, an effective-dated goal history (a version-1 goal migrates from the migration day), water per day and the Search view; user photos live in a separate bounded preview store.
- §3: the goal in force on a day comes from the goal history; a goal edit applies from today onward and leaves earlier periods intact; a day before the first period shows logged amounts alone. The sole Set goal / Edit goal action is on the calorie surface. Each macro with a user-entered target shows `24 / 120 g` with its own compact bar (fill capped at 100 %, numbers always visible). The header shows the streak: consecutive local days with at least one confirmed food or recipe entry, ending today or yesterday, recomputed from the entries; water, opening the app, goals and viewing a day never count.
- Recipes: the root is curated discovery (real unique count; Featured is an editorial flag; Ready in under 30 minutes and 30 g protein or more come from each record; View all / Browse all hand Search a criteria snapshot). Search's Recipes scope holds the complete catalogue with its count while the query is empty. Dietary constraints are a set combined with AND (vegan satisfies vegetarian; unspecified data satisfies nothing); a calorie range counts as one criterion; quick chips apply at once and share the filter sheet's applied model. The scanner is a labelled sibling beside the Food field, below it under 22 rem.

Implemented 2026-09-05 (revision H2, docs/design/hifi-decisions.md §13): the calorie surface is the daily-nutrition section — a calorie card (remaining / logged / reached / over / partial as before, `Set targets` / `Edit targets` as its only action, `Target N kcal` stated beneath the bar) and three macro cards, each with its own bar only when that nutrient has a user-entered target and complete without one; a calorie target never implies macro targets. §3.2's goal editor is superseded by the targets sheet (docs/ux/targets-and-estimation.md): an entry choice, a manual path with suggested preset macros or custom grams (any unset; a mismatch is stated, never corrected), and an estimate path (2023 DRI energy equations, a 500 kcal/day loss deficit with a 1,200 kcal floor, no gain surplus) reviewed and saved explicitly; targets keep their provenance and, for an estimate, its assumptions; `Remove targets` clears from today onward and touches nothing else. The day strip is one scrolling row without previous / next week buttons (keyboard: arrows, Home, End). The recommendation sits above the meals as `Recipe to try` / `Matches your preferences`, with one factual "fits in your remaining N kcal" line only when a complete total is below the target. The water reference is adjustable (500–5,000 ml, every day) and labelled so. Recipes discovery has no search field; quick preferences are the dietary set plus one exclusive time bound; View all / Browse all carry them into Search's Recipes scope, whose results toolbar holds List / Grid and the recipe filter action (the filter sheet is unchanged). The Food scope's scanner is an icon-only sibling named "Scan barcode".
