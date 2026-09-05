# Verification evidence — manifest

Curated, tracked captures of the implemented product after the Hi-Fi redesign (`docs/design/hifi-decisions.md` §10) and Stage B (§11: the populated Food tab, device record, local icons and app icon). Every image was rendered by a script from the committed source and then read at full resolution; the “Inspection” column is that reading, not an automated result. The complete local sets (64 runtime + 146 Storybook images) are regenerated into the ignored `.verification/` directory by the same scripts.

- Source state: the Stage B checkpoint on `feat/hifi-screens` (the commit that updates this file); every image below was rendered from that tree. Stage A rows whose composition Stage B changed (the Search rows, and every row containing a `FoodResultRow`, whose columns were re-balanced in D-41) were re-read and their notes updated; the rest were replaced by pixel-near re-renders of the same states.
- Renderer: Playwright’s bundled Chromium (headless), `deviceScaleFactor: 2`, mobile emulation with touch. Enlarged text is injected as `html { font-size: 200% }`, the same mechanism the Storybook decorator uses. Safe-area variants use the Storybook fixture (59 px top / 34 px bottom at 393 × 852); the runtime reads `env(safe-area-inset-*)`.
- Capture rule (ledger D-14): while a dialog is open, and for the keyboard-inset fixture, the capture is the viewport; every other capture is full-page. A full-page capture of a page taller than the viewport shows the **fixed navigation bar and sticky headers/footers at their scroll-0 position, i.e. mid-image** — a screenshot artefact, not a layout defect; at runtime the bar is fixed to the real viewport bottom (ledger D-26) and the content reserves its height once.
- Regenerate: `npm run build && npx vite preview --port 4173`, then `node scripts/verify/runtime-walkthrough.mjs`; `npm run build-storybook`, then `node scripts/verify/storybook-captures.mjs`. Both scripts fail on console/page errors; the Storybook script also fails when a story’s play function throws.
- Superseded evidence: the previous curated sets (rendered from `97905ad`, tracked at `e229cbe`; the Stage A set tracked at `a789d10`) were replaced file-for-file once each replacement had been inspected; git history holds them.

## The 51 mapped states (`verification/storybook/states/`, 393 × 852)

41 low-fi rows keep their IDs; five rows are new in the redesign (O05, O05-2, S01-4, O06, O06-2) and five in Stage B (S02-7, S02-8, S02-9, O07, S02-10; ledger §11.4). Home rows show the fixed navigation mid-image where the page is taller than the viewport (see the capture rule).

| # | ID · Figma node | Frame | Mode | File | Inspection |
| --- | --- | --- | --- | --- | --- |
| 1 | S01-1 · 175:10 | Home / Today — No food logged | runtime + story | `S01-1-175-10.png` | Brand lockup + “Today · Sep 4” + Edit goal; budget group “2,200 kcal remaining”, “0 consumed · 0 %”, Goal 2,200, empty track with the end marker, macros 0 g; Recommended recipe card (Lentil soup photo); Today’s meals “Nothing logged” with four rows, each “Add {meal}”; Water 0 ml / 2 L with +250 ml. No Log food button in the content; the bar keeps the blue circle. |
| 2 | S01-2 · 175:38 | Home / Today — Food logged | runtime + story | `S01-2-175-38.png` | “850 kcal remaining”, “1,350 consumed · 61 %”, bar at 61 %, 90 / 135 / 50 g; Breakfast 550 kcal with its entry row (Oatmeal, 300 g, chevron) and Lunch 800 kcal; empty Dinner/Snacks keep “Add”; meal totals carry the blue dot; Water 1.25 L / 2 L with the cyan track. |
| 3 | S02-1 · 175:93 | Search / Food scope · results | runtime + story | `S02-1-175-93.png` | Field “rice” with clear and the barcode action inside the field; Food tab filled; toolbar List (checked) / Grid + Food filters; “Results · 1 item found”; row with the rice-bowl thumbnail, “Vegetable rice bowl · Fixture C · 180 kcal per 100 g”; Search active. |
| 4 | S03-1 · 175:158 | Recipes / Browse | runtime + story | `S03-1-175-158.png` | Search row with the filter action; “5 recipes”; five cards all with photographs (lentil soup, traybake, pasta, chicken salad, tofu); “Protein not available” in words on the tofu card; dietary tags wrap under the time; Recipes active. |
| 5 | S01-4 · new | Home / Water quick add + Undo | runtime + story | `S01-4-water-quick-add.png` | After one tap: budget 1,600 remaining, entry row “Yoghurt bowl with oats · 1 serving”; toast “250 ml added. 1.5 litres today.” with Undo and Close sitting above the bar, water card behind it. |
| 6 | O06 · new | Water sheet / Add | runtime + story | `O06-water-sheet.png` | Sheet “Add water” over the dimmed Home: Today 1.25 L of 2 L, four preset chips with 250 ml checked, Custom amount with helper, “Edit today’s total”, Cancel / Add water (enabled); viewport capture. |
| 7 | O06-2 · new | Water sheet / Edit total | runtime + story | `O06-2-water-edit-total.png` | “Edit today’s total”, Today 1.25 L of 2 L, field 1000 ml with helper “up to 10,000”, Back to adding / Save total. |
| 8 | O01 · 176:20 | Log food / Choose a method (overlay) | runtime + story | `O01-176-20.png` | Sheet over the dimmed Home: title, description, close, four equal tiles in contract order; scrim covers the page; viewport capture. |
| 9 | S02-2 · 176:43 | Search / Food · loading | runtime + story | `S02-2-176-43.png` | Query and barcode action kept, Food tab, toolbar kept, “Results”, spinner “Searching foods”. |
| 10 | S02-3 · 176:77 | Search / Food · no matches | runtime + story | `S02-3-176-77.png` | Query “rice cake” kept; toolbar kept; “No foods match ‘rice cake’” with guidance; tinted “Enter manually”; no retry, no Change filters (nothing applied). |
| 11 | S02-4 · 176:118 | Search / Food · request failure | runtime + story | `S02-4-176-118.png` | Query kept; toolbar kept; “Search is not available right now”; primary “Try again”, text “Enter manually”. |
| 12 | S07-1 · 176:157 | Food review / From search | runtime + story | `S07-1-176-157.png` | Identity, basis line, tinted “Change food”, 300 g with the unit control, 540 kcal, full macro names in three columns, “Show all nutrition”, large “Add to today”, text “Done”; no bar. |
| 13 | S07-2 · 176:201 | Food review / Invalid portion | runtime + story | `S07-2-176-201.png` | Amount “0” with the error boundary and “Enter an amount greater than zero”; result dash + one stale sentence; macro dashes; “Add to today” disabled. |
| 14 | S07-3 · 176:247 | Food review / Edit logged entry | runtime + story | `S07-3-176-247.png` | “Edit entry”, no Change food, meal picker with Breakfast checked, basis per 300 g, 150 g → 275 kcal, 15 / 37.5 / 7.5 g; footer “Update entry” + destructive-tinted “Remove entry”. |
| 15 | O05 · new | Add to meal / From food review | runtime + story | `O05-add-to-meal-food.png` | Sheet over the dimmed review: name and basis, Meal picker with Lunch checked and “Suggested for this time of day”, Amount 300 g, preview group 540 kcal “For 300 g” + short-named macros, Cancel / “Add to lunch”; viewport capture. |
| 16 | S04-1 · 178:5 | Barcode / Scanning | runtime + story | `S04-1-178-5.png` | Dark camera stage with “Scanning” chip, four corner marks, the sample barcode graphic and the sweep line; guidance heading; prototype note; “Search by name” and “Enter manually” text actions; no simulator controls. |
| 17 | S04-2 · 178:20 | Barcode / Code read · lookup pending | runtime + story | `S04-2-178-20.png` | Blue “Code read” chip and blue corners; “Code 5012345678900 read. Scanning is paused.”; spinner “Looking up product”. |
| 18 | S04-3 · 178:31 | Barcode / Code not readable | runtime + story | `S04-3-178-31.png` | “Not readable” chip; “Scanning is paused.”; warning message with Try again + Enter manually; the row below now offers only “Search by name” (the duplicate Enter manually was removed in this pass). |
| 19 | S04-4 · 178:47 | Barcode / Product not found | runtime + story | `S04-4-178-47.png` | “Paused” chip; error message naming 4009999999990; Enter manually (primary) / Search by name / Scan again. |
| 20 | S04-5 · 178:65 | Barcode / Lookup service failure | runtime + story | `S04-5-178-65.png` | “Lookup failed” keeps code 0000000000000; “Retry lookup” primary, “Enter manually”. |
| 21 | P01 · 178:81 | Conceptual system permission request (app side) | story | `P01-178-81.png` | Stage with “Waiting for permission” chip, dimmed corners and “Allow access in the system prompt to continue.”; explanation; Search by name / Enter manually; no OS chrome drawn. |
| 22 | S04-6 · 178:94 | Barcode / Camera access denied | runtime + story | `S04-6-178-94.png` | No stage; “Camera access is needed to scan” with the settings hint; primary Try again, tinted Search by name / Enter manually. |
| 23 | S07-4 · 178:109 | Food review / From barcode | runtime + story | `S07-4-178-109.png` | “Oat drink, unsweetened · Scanned”, basis per 100 ml, info note, 100 ml, 43 kcal, 1 / 6.6 / 1.5 g. |
| 24 | S05-1 · 179:5 | Photo / Capture | runtime + story | `S05-1-179-5.png` | Dark 4:3 stage with “Frame the food” chip and the dashed circle guide; heading and guidance; 72 px blue shutter labelled “Take photo”; prototype note. |
| 25 | S05-2 · 179:12 | Photo / Preview | runtime + story | `S05-2-179-12.png` | Sample photograph fills the stage with the “Sample photo” chip; sample note; “Analyse photo” + “Retake”. |
| 26 | S05-3 · 179:21 | Photo / Analysing | runtime + story | `S05-3-179-21.png` | Image kept, blue “Analysing” chip, spinner “Analysing photo”, “does not measure the amount”, text “Cancel”. |
| 27 | S05-4 · 179:31 | Photo / Suggested matches | runtime + story | `S05-4-179-31.png` | “Suggestions ready” chip; three radio rows with kcal · basis; Lentil soup marked (mark + selected surface + boundary); “Review selected match” enabled; “None of these”. |
| 28 | S05-5 · 179:57 | Photo / No usable match | story | `S05-5-179-57.png` | Image kept with the “No match” chip (corrected in this pass from “Suggestions ready”); “No food was recognised”; Retake photo primary, Search by name / Enter manually. |
| 29 | S05-6 · 179:70 | Photo / Analysis failure | runtime + story | `S05-6-179-70.png` | “Analysis failed” chip; error message keeps the image; Try again / Retake photo / Search by name / Enter manually. |
| 30 | S07-5 · 179:81 | Food review / From photo · estimate | runtime + story | `S07-5-179-81.png` | “Mixed salad leaves · Suggested from your photo · partial nutrition”, photo note, 17 kcal, protein 1.4 g, carbohydrates and fat “Not available” with dashes, partial-data note. |
| 31 | S06-1 · 180:5 | Manual entry / Empty | runtime + story | `S06-1-180-5.png` | Intro, name field, Reference amount (100 g), Nutrition with Calories and optional macros; sticky footer “Continue to review” shows mid-page in the full-page capture (artefact). |
| 32 | S06-2 · 180:43 | Manual entry / Filled · keyboard inset | story | `S06-2-180-43.png` | Viewport capture at 393 × 552: Calories 450 and Protein 24 visible above the footer; header stays at the top. |
| 33 | S06-3 · 180:71 | Manual entry / Field error | runtime + story | `S06-3-180-71.png` | Reference amount “abc” and empty Calories with red boundaries and messages; other values kept; summary “Check the 2 highlighted fields before continuing.”; sticky header mid-image (artefact). |
| 34 | O03 · 180:111 | Discard unsaved entry | runtime + story | `O03-180-111.png` | Centred dialog: “Discard this entry?”, consequence line, Keep editing beside destructive-tinted Discard; viewport capture. |
| 35 | O04 · 180:134 | Supported unit chooser | runtime + story | `O04-180-134.png` | Sheet “Choose a unit” with g (checked) and serving (“1 serving = 300 g”), Cancel / Confirm (disabled until a change); viewport capture. |
| 36 | S07-6 · 180:162 | Food review / From manual entry | runtime + story | `S07-6-180-162.png` | “Lentil soup · Entered manually”, basis per 1 serving, “Entered by you…” note, 450 kcal for 1 serving, carbohydrates “Not available”, partial note. |
| 37 | S03-2 · 181:5 | Recipes / Filtered results | runtime + story | `S03-2-181-5.png` | Filter action with the count badge “3”; three removable chips; “Matching recipes · 1 recipe matches your filters”; traybake card with photo and “Matches all 3 filters”. |
| 38 | O02 · 181:72 | Recipe filters / Applied values | runtime + story | `O02-181-72.png` | Sheet with dietary chips (Vegan checked), Minimum / Maximum (500), protein 10, preparation Any; Reset all + Apply filters footer; viewport capture. |
| 39 | O02-2 · 181:117 | Recipe filters / Invalid range | runtime + story | `O02-2-181-117.png` | Maximum 300 below minimum 600 with the error boundary and “The maximum must be at least the minimum”; sheet stays open; viewport capture. |
| 40 | S02-5 · 181:133 | Search / Recipes scope · results | runtime + story | `S02-5-181-133.png` | Field “lentil” with the filter action (badge 1) inside it; Recipes tab filled; chip “Under 460 kcal”; “1 recipe matches your filters”; lentil soup card with photo and “Matches all 1 filter”. |
| 41 | S08-2 · 181:289 | Recipe details / Loading | runtime + story | `S08-2-181-289.png` | Focused header “Recipe” with Back, spinner “Loading recipe”, Recipes active in the retained bar. |
| 42 | S08-1 · 181:237 | Recipe details / Loaded | runtime + story | `S08-1-181-237.png` | 16:9 hero, “25 min preparation” chip, title with the blue “Add” beside it, “Your filters” with two met rows, calories card 450 kcal per serving (300 g) with short-named macros (24 / 48 / 18 g), Show all nutrition, Ingredients “7 items”, Method “3 steps”; bar mid-image (artefact). |
| 43 | S08-3 · 181:317 | Recipe details / Unavailable | story | `S08-3-181-317.png` | “This recipe could not be loaded”, primary Try again, text Back to results, bar retained. |
| 44 | S08-4 · 181:350 | Recipe details / No photo · long title · partial nutrition | runtime + story | `S08-4-181-350.png` | No photo frame, three-line title beside Add, chips “35 min preparation” + Vegetarian, not-met protein row in words, 610 kcal, protein dash + “Not available”, 84 / 21 g. |
| 45 | S02-6 · 181:193 | Search / Recipes · no matches | runtime + story | `S02-6-181-193.png` | Query “lentil” and chip “Under 200 kcal” kept; “No recipes match ‘lentil’ and your filters”; tinted “Change filters”; no retry. |
| 46 | O05-2 · new | Add to meal / From a recipe | runtime + story | `O05-2-add-to-meal-recipe.png` | Sheet over the dimmed details: thumbnail, “Lentil soup”, “per 1 serving · 1 serving = 300 g”, Dinner checked with the time-of-day hint, Servings 2, preview 900 kcal “For 2 servings (600 g)”, 48 / 96 / 36 g, Cancel / “Add to dinner”; viewport capture. |
| 47 | S02-7 · new (Stage B) | Search / Food · first use: the catalogue at once | runtime + story | `S02-7-food-catalogue.png` | Empty field with the barcode action; Food tab; toolbar List (checked) / Grid + Food filters (no badge); “All foods · 15 items”; fifteen rows each with a 4 rem photograph, name, detail and kcal per basis (“per 100 g”, “per 100 ml”, “per serving (320 g)”); long names wrap between words and the basis wraps only between “per serving” and its amount (D-41); three drinks carry “Drink”; the fixed bar mid-image (artefact). |
| 48 | S02-8 · new (Stage B) | Search / Food · Recently added above Explore foods | runtime + story | `S02-8-recently-added.png` | “Foods · 15 items”; “Recently added” with Oatmeal (now), Greek yoghurt (this morning), Banana (yesterday) — newest first, one row each; “Explore foods” with the remaining twelve in catalogue order; no duplicates. |
| 49 | S02-9 · new (Stage B) | Search / Food · grid view | runtime + story | `S02-9-grid-view.png` | Grid checked; the same sections as S02-8 as two-column cards (4:3 photo, name, detail, kcal + basis); cards in one row share their height; Banana alone in the recents’ second row; no card is cut except by the mid-image bar artefact. |
| 50 | O07 · new (Stage B) | Food filters (overlay) | runtime + story | `O07-food-filters.png` | Sheet “Filters” over the dimmed catalogue: “Show everything, or only foods or only drinks. Based on each item's own record, not on its photo.”; “Show” radio chips All / Foods / Drinks with Drinks checked (the draft); Clear all / Apply filters; viewport capture. |
| 51 | S02-10 · new (Stage B) | Search / Food · Drinks only applied | runtime + story | `S02-10-drinks-only.png` | Food filters carries the “1” badge on a canvas halo; chip “Drinks only” with its remove control; “All foods · 3 drinks”; Sparkling water 0 kcal, Orange juice 45 kcal, Oat drink 43 kcal, all “per 100 ml”; the bar at the bottom of the short page. |

## Representative and risk-bearing variants (`verification/storybook/states/`)

| File | Story | Inspection |
| --- | --- | --- |
| `V-S01-2-320.png` | S01-2 at 320 | Budget figure and macros in three compact columns, meal rows keep name / kcal / chevron, active Home label stacks under its glyph; no overflow. |
| `V-S01-2-430.png` | S01-2 at 430 | Same composition with more room; cells widen; nothing stretches awkwardly. |
| `V-S01-2-320-200.png` | S01-2 at 320 and 200 % text | Lockup wraps the context line, macros one per row, meal headers wrap total + action under the name, water figure stacks; no overflow. |
| `V-S01-2-safe-areas.png` | S01-2 with the 59 / 34 safe-area fixture | Header carries the 59 px top inset above the lockup; the fixed bar adds the 34 px bottom inset to its own padding (asserted in the play function). |
| `V-S01-reduced-motion.png` | S01-4 with `data-portion-motion="reduced"` | Water figure and track land on their final values without animation (asserted); layout identical to the animated state. |
| `V-O01-320.png` | O01 at 320 | Two columns of tiles with wrapped titles; scrim covers the page; viewport capture. |
| `V-O05-200.png` | O05 at 200 % text · invalid amount | Sheet at 200 %: empty Amount with “Enter the amount to add”, preview dashes, “Add to lunch” disabled; nothing overflows (asserted). |
| `V-S07-1-320.png` | S07-1 at 320 | Title wraps, macros in two columns, footer intact. |
| `V-S07-1-200.png` | S07-1 at 200 % text | Everything wraps; the sticky footer appears mid-page in the full-page capture (artefact) and remains reachable (asserted). |
| `V-S07-1-safe-areas.png` | S07-1 with the safe-area fixture | Focused header owns the 59 px top inset; the footer owns the 34 px bottom inset once. |
| `V-S04-1-320.png` | S04-1 at 320 | Stage keeps its aspect and corner marks; guidance and text actions wrap without overflow. |
| `V-S04-4-200.png` | S04-4 at 200 % text | Recovery actions wrap onto several lines and stay reachable. |
| `V-S05-4-320.png` | S05-4 at 320 | Radio rows wrap the long pasta name; buttons full width. |
| `V-S05-4-200.png` | S05-4 at 200 % text | Rows grow; Review selected match still visible; the 24 px radio mark keeps its size inside a taller row. |
| `V-S06-1-320.png` | S06-1 at 320 | Fields full width; unit control keeps its 48 px target. |
| `V-S06-3-200.png` | S06-3 at 200 % text | Errors wrap beside their fields; the alert is visible. |
| `V-S03-2-320.png` | S03-2 at 320 | Chips wrap to three rows; the card keeps a thumbnail with a wrapped title. |
| `V-S08-1-430.png` | S08-1 at 430 | Hero at 16:9, Add beside the title, content centred inside the 430 px container. |
| `V-S03-2-320-200.png` | S03-2 at 320 and 200 % text | Search row wraps its label; card stacks the thumbnail above the text; “Matches all 3 filters” visible. |
| `V-O02-safe-areas.png` | O02 with the safe-area fixture | Sheet footer owns the 34 px bottom inset; Apply filters reachable; viewport capture. |
| `V-S02-9-320.png` | S02-9 at 320 | The grid falls to one column (container under 20 rem); each card keeps its full-width 4:3 photo, name, detail and kcal with basis; Recently added then Explore foods; nothing shrinks or overflows. |
| `V-S02-8-200.png` | S02-8 at 200 % text | Toolbar wraps (List / Grid and the filter action on one row, “Foods · 15 items” beneath); every row stacks photo → identity → figure (container under 22 rem) with the chevron centred beside the stack; names wrap whole; no horizontal overflow. |

## Runtime walkthrough (`verification/runtime/`, 390 × 844 unless stated)

The walkthrough drives the built app through the goal, meal, water, barcode, manual, photo, recipe and search journeys, then the Stage B Food-tab journey (catalogue, filters, grid, drink logging, recents, unified query, reload, day boundary, midnight with a mocked clock) — 75 checks; see `scripts/verify/runtime-walkthrough.mjs`. Tracked subset:

| File | Surface / step | Viewport | Inspection |
| --- | --- | --- | --- |
| 01-home-empty.png | S01-1 at launch (no goal) | 390 × 844 | “0 kcal logged”, Set goal in the header and in the group, optional-goal sentence, four empty meal rows, Water 0 ml / 2 L; fixed bar at the bottom. |
| 02-goal-sheet.png | Set goal | 390 × 844 | Sheet “Set goal” with the kcal field and three optional gram targets, Cancel / Apply (viewport capture). |
| 03-home-goal-empty.png | S01-1 with goal 2,000 and targets | 390 × 844 | “2,000 kcal remaining”, “0 consumed · 0 %”, macros “0 / 120 g” etc. with empty tracks. |
| 04-method-sheet.png | O01 over Home | 390 × 844 | “Log food” sheet, four tiles, Scan barcode focused (viewport capture). |
| 06-search-food-results.png | S02-1 | 390 × 844 | Barcode action inside the focused field; toolbar; “1 item found”; one row with its thumbnail. |
| 08-review-300.png | S07-1 at 300 g | 390 × 844 | 540 kcal, macros, Add to today, Done. |
| 09-add-to-meal-sheet.png | O05 from a Home meal row | 390 × 844 | Hint “Preselected from the meal you started from.”, Lunch checked, preview 540 kcal, “Add to lunch” (viewport capture). |
| 10-home-populated.png | S01-2 after the commit | 390 × 844 | “1,460 kcal remaining”, entry under Lunch with the highlight, “Added to lunch.” toast above the bar. |
| 11-entry-edit.png | S07-3 | 390 × 844 | Meal picker with Lunch checked; 300 g. |
| 14-entry-expanded.png | S07-3 with all nutrition | 390 × 844 | Unit switched to serving (“For 1 serving (300 g)”), fibre row under “Show less nutrition”. |
| 15-home-water-quick-add.png | S01-4 | 390 × 844 | Toast “250 ml added. 500 millilitres today.” with Undo; entry now under Dinner after the move. |
| 16-water-sheet.png | O06 | 390 × 844 | Add water with Today 250 ml of 2 L; nothing chosen, Add water disabled (viewport capture). |
| 17-water-edit-total.png | O06-2 | 390 × 844 | Edit today’s total, 600 ml, Save total (viewport capture). |
| 18-review-from-home-origin.png | S07-1 reached from Home → Log food → Search food | 390 × 844 | Review of the search result; Done then returns to Home (asserted, ledger D-4). |
| 19-barcode-scanning.png | S04-1 | 390 × 844 | Stage with the sweep line, prototype note, text actions. |
| 21-review-barcode.png | S07-4 | 390 × 844 | Oat drink, 100 ml, 43 kcal. |
| 22-barcode-paused-after-back.png | S04-1 re-entered after Back | 390 × 844 | Scanning again; the late read from the first visit was ignored (asserted). |
| 24-manual-errors.png | S06-3 | 390 × 844 | Two field errors and the summary; sticky footer mid-image (artefact). |
| 26-manual-discard-dialog.png | O03 | 390 × 844 | Dialog over the dimmed form (viewport capture). |
| 30-photo-suggestions.png | S05-4 | 390 × 844 | Sample photograph with “Suggestions ready”, three radio rows, disabled “Review selected match”, “None of these”. |
| 32-recipes-browse.png | S03-1 | 390 × 844 | Five photographed cards; bar mid-image (artefact). |
| 35-recipes-filtered.png | S03-2 | 390 × 844 | Badge 3, three chips, one matching card with evidence. |
| 39-recipe-loaded.png | S08-1 from browse | 390 × 844 | Hero, Add beside the title, filter evidence, short-named macros, ingredients, method; Recipes stays current. |
| 41-recipe-add-sheet.png | O05-2 | 390 × 844 | Thumbnail, 2 servings → 900 kcal “For 2 servings (600 g)”, Dinner (viewport capture). |
| 42-home-with-recipe.png | S01-2 with a recipe entry | 390 × 844 | Dinner 1,440 kcal with two rows, “Lentil soup · 2 servings (600 g) · 900 kcal” highlighted, “Added to dinner.” toast; recommendation “Matches your filters”. |
| 47-search-failure.png | S02-4 | 390 × 844 | Query “offline” kept; Try again / Enter manually. |
| 49-remove-entry-dialog.png | Remove confirmation over S07-3 | 390 × 844 | Dialog names the food; Keep entry beside destructive-tinted Remove (viewport capture). |
| 50-home-after-remove.png | S01-2 after removal | 390 × 844 | Totals recalculated (900 consumed, 1,100 remaining); the removed entry gone; Water 1 L / 2 L. |
| 52-method-sheet-320.png | O01 | 320 × 800 | Two columns of tiles (viewport capture). |
| 53-home-320-200pct.png | S01-2 | 320 × 800, 200 % | Lockup wraps its context, macros one per row, meal rows wrap, bar intact; toast above the bar. |
| 54-recipes-320-200pct.png | S03-1 | 320 × 800, 200 % | Cards stack thumbnail over text; nothing overflows. |
| 55-method-sheet-390-200pct.png | O01 | 390 × 844, 200 % | One column of rows (viewport capture). |
| 56-manual-390-200pct.png | S06-1 | 390 × 844, 200 % | Fields full width; sticky footer mid-image (artefact). |
| 57-search-first-use.png | S02-7 at launch (no record) | 390 × 844 | “All foods · 15 items”, List checked, fifteen rows with photographs in catalogue order; names wrap between words; the basis wraps only before its amount. |
| 58-food-filters-sheet.png | O07 | 390 × 844 | Sheet over the dimmed catalogue, All checked, Clear all / Apply filters (viewport capture). |
| 59-search-drinks-only.png | S02-10 | 390 × 844 | Badge “1”, chip “Drinks only”, “All foods · 3 drinks”, the three drink rows; bar at the bottom of the short page. |
| 60-search-grid-drinks.png | S02-9 with Drinks only | 390 × 844 | Grid checked; Sparkling water and Orange juice side by side at equal height, Oat drink alone below (cut by the mid-image bar artefact). |
| 61-home-drink-logged.png | S01-2 after Orange juice → Add to lunch (250 ml) | 390 × 844 | “113 kcal logged” without a goal, Lunch 113 kcal with the Orange juice row, toast “Added to lunch.”; Water stays 0 ml / 2 L (a drink never changes the water record). |
| 62-search-recents-grid.png | S02-8 in the grid | 390 × 844 | “Foods · 15 items”; Recently added holds the Orange juice card alone; Explore foods holds the other fourteen in two columns. |
| 63-search-after-reload.png | S02-8 after a reload | 390 × 844 | Identical to 62: the grid choice and the recent drink (with its photograph re-resolved by id) survive the reload. |
| 64-home-after-day-boundary.png | S01-1 after the record's day is rewritten to yesterday | 390 × 844 | “0 kcal logged”, “Nothing logged”, four Add rows, Water 0 ml / 2 L: yesterday's entry and water never read as today, while Recently added keeps the drink (checked in the log). |

## Component and foundation captures (`verification/storybook/`)

Captures of the redesign’s shared components, read at full resolution.

| File | Story | Inspection |
| --- | --- | --- |
| 12-portionlogo-tones.png | PortionLogo tones | Wordmark + dot in default, monochrome and inverse tones at both sizes; the dot is the only accent. |
| 13-portionlogo-clear-space.png | PortionLogo clear space | Padding equal to the dot keeps neighbours off the lockup. |
| 14-progressbar-all-states.png | ProgressBar states | Empty, partial, reached, over (clamped with the end marker) and unavailable (no fill, “not available”). |
| 15-progressbar-tones.png | ProgressBar tones | Default, water (cyan), protein, carbohydrates, fat; compact size. |
| 16-appheader-root.png | AppHeader root | Lockup, divider, context, trailing text action. |
| 17-appheader-section.png | AppHeader section | Plain section title. |
| 18-appheader-root-320-200.png | AppHeader root at 320 / 200 % | Context wraps under the lockup; trailing action stays reachable. |
| 19-budgetbar-partial.png | CalorieBudgetBar partial | Remaining figure, consumed · %, Goal, bar, macros with targets and tracks. |
| 20-budgetbar-no-goal.png | CalorieBudgetBar no goal | “kcal logged”, Set goal, optional-goal sentence; no bar fill. |
| 21-budgetbar-over.png | CalorieBudgetBar over goal | States the excess; bar full with the marker; neutral colour. |
| 22-budgetbar-incomplete.png | CalorieBudgetBar partial total | Total marked partial; macros with dashes where unknown. |
| 23-budgetbar-320-200.png | CalorieBudgetBar at 320 / 200 % | Macros one per row; figure wraps; no overflow. |
| 24-mealgroup-populated.png | MealGroup populated | Four sections, totals with the dot, entry rows, empty sections with Add. |
| 25-mealgroup-long-highlight.png | MealGroup long names + highlight | Long entry name wraps; highlighted row surface. |
| 26-mealgroup-unassigned.png | MealGroup unassigned guard | “Unassigned” section with Choose meal. |
| 27-watertracker-partial.png | WaterTracker partial | Icon, “Water”, figure, chevron, +250 ml, cyan track. |
| 28-watertracker-exceeded.png | WaterTracker over reference | Figure above 2 L; track full; no alarm colour. |
| 29-watertracker-quick-add-undo.png | WaterTracker quick add + Undo | Figure after the animated step (asserted). |
| 30-watersheet-preset.png | WaterSheet preset | 350 ml checked; Add water enabled. |
| 31-watersheet-custom-invalid.png | WaterSheet custom invalid | 6000 ml refused: Add water disabled and the range message beside the field (added in this pass). |
| 32-watersheet-edit-total.png | WaterSheet edit total → Back to adding | Ends in add mode after the story returns from edit-total (the O06-2 state capture shows edit-total itself). |
| 33-addtomeal-from-food.png | AddToMealSheet from food | As O05. |
| 34-addtomeal-from-recipe.png | AddToMealSheet from a recipe | 1.5 servings → 675 kcal (asserted). |
| 35-addtomeal-invalid.png | AddToMealSheet invalid | “0” refused; guidance beside the field; commit disabled. |
| 36-camerastage-tones.png | CameraStage tones | Scanning / paused / detected / permission chips and corner colours. |
| 37-camerastage-image.png | CameraStage with image | Chip on the on-image ground; no guide. |
| 38-toast-undo.png | Toast with Undo | Status region with action + Close above the navigation inset. |
| 39-goal-editor-targets.png | GoalSheet with targets | Calorie goal and three gram targets; Clear goal offered. |
| 40-review-existing-unassigned.png | FoodReview unassigned entry | Meal picker with nothing checked; Update entry disabled until a meal is chosen. |
| 41-recipecard-with-criteria.png | RecipeCard with criteria | Local photograph, evidence line under the title. |
| 42-recipecard-no-photo-320.png | RecipeCard no photo at 320 | No photo frame, wrapped title. |
| 43-mediaframe-failed-image.png | MediaFrame failed image | Same No photo fallback, no broken-image icon. |
| 44-nutritionmacros-partial.png | NutritionMacros partial | Dashes and “Not available” per constituent. |
| 48-navigationbar-home-390.png | NavigationBar Home at 390 | Three cells + circle; no top border; shadow only. |
| 50-navigationbar-320-200.png | NavigationBar at 320 / 200 % | Active label stacks; 56 px circle intact. |
| 51-navigationbar-keyboard-focus.png | NavigationBar keyboard focus | 3 px ring with separation. |
| 56-root-safe-areas.png | RootScreenLayout safe areas | Top inset on the header, bottom inset on the fixed bar. |
| 57-root-fixed-navigation-short.png | RootScreenLayout short content | Bar fixed at the bottom of a short page; content not stretched. |
| 60-search-barcode-shortcut.png | SearchScreen barcode shortcut | Barcode action inside the field. |
| 61-filter-action-states.png | FilterAction states | Plain and applied with the count badge on a canvas halo. |
| 62-barcode-camera-denied.png | BarcodeScreen denied | As S04-6. |
| 63-photo-permission-pending.png | PhotoScreen permission pending | Stage chip “Waiting for permission”. |
| 64-recipe-details-add.png | RecipeDetails Add | Add beside the title opens the sheet (asserted). |
| 65-viewtoggle.png | ViewToggle | Radio group of two 48 px targets in one 12-radius group: List (checked: selected surface, blue boundary and text, list glyph) and Grid (plain, four-squares glyph). |
| 66-foodcard.png | FoodCard with a photograph | 4:3 banana photo at the control radius, name, detail “Fruit”, “89 kcal per 100 g” on one line; the card is one bordered 12-radius object. |
| 67-foodcard-no-photo.png | FoodCard without a photograph | The shared No photo frame (surface + image glyph) in the photo slot; text unchanged. |
| 68-foodresultrow-thumbnail-320-200.png | FoodResultRow thumbnail at 320 / 200 % | Photo → identity → figure stacked under the 22 rem container query; “Oatmeal with blueberries and banana” wraps whole; “420 kcal” then “per serving (350 g)” beneath; the chevron centred beside the stack; the plain Sparkling water row stacks its figure too. |
| 69-food-filters-sheet.png | FoodFiltersSheet nothing applied | Title, description naming the item record as the basis, “Show” with All checked, Clear all / Apply filters in the footer; viewport capture. |
| 70-search-unified-results.png | SearchScreen unified results “oat” | “Results · 2 items found”: the recent Oatmeal first, then the catalogue's Oat drink — one deduplicated set across recents and catalogue; toolbar kept; no section headings. |
| 71-search-no-match-filter.png | SearchScreen no match with a filter | Badge “1” and chip “Drinks only” kept; “No drinks match “banana””, guidance, tinted “Change filters”, text “Enter manually”. |
| 72-icons-sizes-weights.png | Icons sizes and weights (sprite) | The six size roles and the three weights drawn from the exported sprite; identical geometry to the package glyphs. |
| 73-foodresultrow-thumbnail-long-name-390.png | FoodResultRow long name at 390 | “Oatmeal with / blueberries / and banana” — three whole-word lines; “420 kcal” on one line; “per serving” / “(350 g)” beneath it; “Scrambled / eggs on toast” likewise; Banana unchanged (D-41). |

## Observations kept as limitations

- Full-page captures place the fixed bar and sticky bars mid-image; the runtime keeps them at the viewport edges.
- The radio mark in photo suggestions keeps its 24 px size at 200 % text; the row target grows with the text.
- No real screen reader, device, native safe-area or live software keyboard was exercised.
- The midnight rollover was exercised with Playwright's mocked clock and the day boundary by rewriting the stored record's day key; a real overnight session was not observed.
- The lazy thumbnails of hidden mounted screens never load, so the runtime capture helper waits (bounded) only for the visible screen's images.
