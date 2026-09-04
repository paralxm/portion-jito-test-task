# Verification evidence — manifest

Curated, tracked captures of the implemented product and design system after the Hi-Fi migration (`docs/design-system/README.md` §16). Every image here was rendered by a script from the committed source and then read at full resolution; the "Inspection" column is that reading, not an automated result. The complete local capture sets (55 runtime + 31 Storybook images) are regenerated into the ignored `.verification/` directory by the same scripts; only this deliberate subset is tracked, so the repository does not carry redundant or transient output.

- Source state: commit `6b830ee` (`feat(design-system): migrate the system to hi-fi in place`) on `feat/navigation-hifi`; scripts from commit `d009823`.
- Renderer: Playwright's bundled Chromium (headless), `deviceScaleFactor: 2`, mobile emulation with touch. Enlarged text is injected as `html { font-size: 200% }`, the same mechanism the Storybook decorator uses.
- Regenerate: `npm run build && npx vite preview --port 4173`, then `node scripts/verify/runtime-walkthrough.mjs`; `npm run build-storybook`, then `node scripts/verify/storybook-captures.mjs`. Both scripts fail on console/page errors; the Storybook script also fails when a story's play function throws.
- Pre-redesign baseline: the previous captures (`01-calculate-empty.png` … `53-manual-390-200pct.png`, and the earlier SegmentedControl set) were local, ignored files documenting the superseded current-calculation Home and the pre-migration components; they were deleted after these replacements were inspected. Git history holds no earlier tracked images.

## Runtime (`verification/runtime/`)

| File | Surface / walkthrough step | Viewport | State | Commit | Inspection |
| --- | --- | --- | --- | --- | --- |
| 01-home-empty.png | S01-1 Home at launch | 390 × 844, 100 % | no entries, no goal | 6b830ee | Ring track only with "0 kcal logged", Goal "Not set", 0 g macros, "Add first food" primary, tinted "Find recipes"; Home current in the bar. Hierarchy reads ring → today's food → recipes. |
| 02-method-sheet.png | O01 Add food sheet over Home | 390 × 844, 100 % | open, 2 × 2 | 6b830ee | Four equal tiles in contract order with action-coloured glyphs; scrim covers the bar; close control focused on open. |
| 04-search-food-results.png | S02 Search, Food scope | 390 × 844, 100 % | 1 result for "rice" | 6b830ee | Segmented control: selected "Food" contained on the sunken track, unselected "Recipes" legible; result row with kcal and basis. |
| 06-review-300.png | S07 Review food (new) | 390 × 844, 100 % | fixture C at 300 g = 540 kcal | 6b830ee | Small tinted "Change food", amount with unit control, 40/48 result, 20/28 macros, "Add to today" primary + "Done" text. |
| 07-home-populated.png | S01-2 Home after Add to today | 390 × 844, 100 % | 1 entry, no goal | 6b830ee | "1 entry · 540 kcal", entry row with portion and energy, macros 18/63/24 g; ring shows logged amount with the no-goal note. |
| 09-entry-invalid-stale.png | S07 Edit entry | 390 × 844, 100 % | invalid draft "abc" | 6b830ee | Field invalid with error text; result shows the stale placeholder, not the old 540. |
| 13-goal-sheet.png | Goal editor over Home | 390 × 844, 100 % | empty draft | 6b830ee | Title, optional-goal explanation, kcal field with helper, tinted Cancel + primary Apply. |
| 14-home-goal.png | S01-2 Home with goal | 390 × 844, 100 % | 540 of 2,200, 25 % | 6b830ee | Arc at a quarter, "1,660 kcal remaining" centred, Logged/Goal beneath, "Edit daily goal" action. |
| 22-manual-errors.png | S06 Manual entry | 390 × 844, 100 % | two validation errors | 6b830ee | First invalid field focused with the ring outside the error boundary; error summary at the end; sticky footer in flow. |
| 31-recipes-browse.png | S03-1 Recipes browse | 390 × 844, 100 % | 5 recipes, no criteria | 6b830ee | Cards with thumbnail beside text; no match claims; "Protein not available" in words on the tofu card; small tinted Filters. |
| 34-recipes-filtered.png | S03-2 Recipes filtered | 390 × 844, 100 % | Vegan, ≤ 500 kcal, ≥ 10 g protein | 6b830ee | Applied chips, "Matches all 3 filters" evidence under each title. |
| 38-recipe-loaded.png | S08-1 Recipe details | 390 × 844, 100 % | loaded, one active criterion | 6b830ee | 16:9 hero, title, evidence under "Your filters", nutrition summary with 20/28 macros, ingredients and numbered method; Recipes stays current. |
| 46-remove-entry-dialog.png | Remove confirmation over S07 | 390 × 844, 100 % | dialog open | 6b830ee | Centred dialog names the food; Keep entry (safe, focused) beside tinted destructive Remove; background inert under the scrim. |
| 50-home-320.png | S01-2 Home | 320 × 800, 100 % | 2 entries, goal 2,200 | 6b830ee | Ring keeps the figure inside; three compact macro columns fit; no horizontal overflow. |
| 50-home-430.png | S01-2 Home | 430 × 800, 100 % | 2 entries, goal 2,200 | 6b830ee | Same composition with more breathing room; nothing stretches awkwardly. |
| 51-home-320-200pct.png | S01-2 Home | 320 × 800, 200 % text | 1 entry, no goal | 6b830ee | Bar reflows 2 × 2; goal action wraps under "Today"; figure stacks under a medium ring; macros stack one per row; entry figure moves under the name without breaking a word. |
| 54-method-sheet-320.png | O01 over Home | 320 × 800, 100 % | open, one column | 6b830ee | Tiles become rows with the glyph beside the text; same order and copy. |
| 55-method-sheet-390-200pct.png | O01 over Home | 390 × 844, 200 % text | open, one column | 6b830ee | Rows at 200 %; title and description wrap; close control reachable. |

## Storybook (`verification/storybook/`)

| File | Story id | Viewport | State | Commit | Inspection |
| --- | --- | --- | --- | --- | --- |
| 01-button-treatments-sizes.png | primitives-button--treatments-and-sizes | 390, 100 % | rest | 6b830ee | Four treatments × two sizes; only primary is filled; small is visibly lighter and shorter; icon buttons align with labels. |
| 02-button-disabled.png | primitives-button--disabled | 390, 100 % | disabled | 6b830ee | Disabled surface with the lighter disabled text; still legible; clearly unlike an enabled secondary button. |
| 04-segmentedcontrol-default.png | components-segmentedcontrol--default | 390, 100 % | Food selected | 6b830ee | Sunken track, contained selected segment with boundary and 600 weight, unselected secondary text. |
| 06-segmentedcontrol-disabled.png | components-segmentedcontrol--disabled-option | 390, 100 % | Recipes disabled | 6b830ee | Disabled segment faded and distinct from the enabled-unselected treatment. |
| 08-segmentedcontrol-long-labels-320-200.png | components-segmentedcontrol--enlarged-text | 320, 200 % | long labels | 6b830ee | Labels wrap inside equal segments; nothing truncates or overflows. |
| 12-progressring-all-states.png | primitives-progressring--all-states | 390, 100 % | zero → over, unavailable | 6b830ee | 0 % has no stray cap; near-complete keeps a visible gap; complete and over share one geometry; unavailable = track only. |
| 15-calorie-ring-exceeded.png | product-compositions-home-s01-calorieprogressring--exceeded | 390, 100 % | 150 over | 6b830ee | Full neutral ring, "150 kcal over goal" centred, excess stated in words; no error colour. |
| 16-calorie-ring-no-goal.png | product-compositions-home-s01-calorieprogressring--no-goal | 390, 100 % | no goal | 6b830ee | Track only, logged amount centred, Goal "Not set", explanatory note. |
| 18-calorie-ring-320-200.png | product-compositions-home-s01-calorieprogressring--enlarged-text | 320, 200 % | 850 remaining | 6b830ee | Medium ring with the 40/48 figure beneath; Logged/Goal stacked; no overflow. |
| 19-recipecard-with-criteria.png | patterns-recipecard--with-criteria | 390, 100 % | two criteria met | 6b830ee | Evidence directly under the title; calories · protein; basis; time and tags. |
| 21-recipecard-200.png | patterns-recipecard--enlarged-text | 390, 200 % | stacked | 6b830ee | Thumbnail above the text; every line readable. |
| 22-mediaframe-failed-image.png | components-mediaframe--failed-image | 390, 100 % | image failed | 6b830ee | Neutral fill with glyph and "No photo"; no browser broken-image icon. |
| 27-goal-editor-invalid.png | product-compositions-home-s01-goal-editor--invalid-draft | 390, 100 % | "0" applied | 6b830ee | Field invalid with "Enter a goal greater than zero"; draft retained; Apply still available. |
| 30-radius-roles.png | foundations-radius--semantic-roles | 430, 100 % | — | 6b830ee | Seven roles resolve to 0 / 4 / 8 / 12 / 16 / 16 / 9999 px. |

## Obsolete or not re-captured

- The superseded current-calculation Home (`50-calculate-*`, `51-calculate-320-200pct`, `07-calculate-result`, `08-calculate-invalid-stale`, `10-calculate-servings`, `11-calculate-expanded`) has no equivalent: the surface no longer exists. Its behaviour (local recalculation, stale draft, unit change, expanded nutrition) is now captured on the edit-entry screen (`08-entry-edit` … `12-entry-expanded` in the local set; `09-entry-invalid-stale` here).
- `14-review-barcode-replaces` (replacement warning) is superseded by `17-review-barcode` (local set): the warning no longer exists.
- Barcode, photo, filters, search-failure and no-match states are unchanged in behaviour and are covered by the local run (`15`–`30`, `32`–`45`); they are not duplicated here.
