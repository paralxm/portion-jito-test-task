# Verification evidence — manifest

Curated, tracked captures of the implemented product after the Hi-Fi product pass (`docs/design/hifi-decisions.md`). Every image was rendered by a script from the committed source and then read at full resolution; the “Inspection” column is that reading, not an automated result. The complete local sets (56 runtime + 101 Storybook images) are regenerated into the ignored `.verification/` directory by the same scripts.

- Source state: commit `97905ad` on `feat/hifi-screens`; every image below was rendered from that tree.
- Renderer: Playwright’s bundled Chromium (headless), `deviceScaleFactor: 2`, mobile emulation with touch. Enlarged text is injected as `html { font-size: 200% }`, the same mechanism the Storybook decorator uses. Safe-area variants use the Storybook fixture (59 px top / 34 px bottom at 393 × 852); the runtime reads `env(safe-area-inset-*)`.
- Capture rule (ledger D-14): while a dialog is open, and for the keyboard-inset fixture, the capture is the viewport; every other capture is full-page. A full-page capture of a page taller than the viewport shows sticky bars (focused header, footer) at their scroll-0 position, i.e. mid-image — a screenshot artefact, not a layout defect; the runtime keeps them anchored to the real viewport and the scroll padding keeps fields clear of them.
- Regenerate: `npm run build && npx vite preview --port 4173`, then `node scripts/verify/runtime-walkthrough.mjs`; `npm run build-storybook`, then `node scripts/verify/storybook-captures.mjs`. Both scripts fail on console/page errors; the Storybook script also fails when a story’s play function throws.
- Superseded evidence: the previous curated set (rendered from `0994614` on `feat/navigation-hifi`) was replaced file-for-file once each replacement had been inspected; git history holds it at `56fc9e6`.

## The 41 mapped low-fi states (`verification/storybook/states/`, 393 × 852)

| # | ID · Figma node | Frame | Mode | File | Inspection |
| --- | --- | --- | --- | --- | --- |
| 1 | S01-1 · 175:10 | Home / Today — No food logged | runtime + story | `S01-1-175-10.png` | Ring track only with “2,200 kcal remaining”, Logged 0 / Goal 2,200, 0 g macros, large “Log first food”, tinted “Find recipes”; bar: three equal cells, Home active, 16 px gap, blue Log food circle. |
| 2 | S01-2 · 175:38 | Home / Today — Food logged | runtime + story | `S01-2-175-38.png` | Arc at 61 %, “850 kcal remaining”, 1,350 / 2,200, 90 / 135 / 50 g, two entry rows with portion and energy, “2 entries · 1,350 kcal”, large “Log food”. |
| 3 | S02-1 · 175:93 | Search / Food scope · results | runtime + story | `S02-1-175-93.png` | Food tab filled, query “rice”, “1 food found”, one row: name, “Fixture C”, 180 kcal / per 100 g; Search active in the bar. |
| 4 | S03-1 · 175:158 | Recipes / Browse | runtime + story | `S03-1-175-158.png` | Five cards: three photographs (dal, chicken salad, tofu), two No photo frames (traybake, long-title pasta), “Protein not available” in words on the tofu card; no match claims; Recipes active. |
| 5 | O01 · 176:20 | Log food / Choose a method (overlay) | runtime + story | `O01-176-20.png` | Sheet over the dimmed Home: title “Log food”, description, close, four equal tiles in contract order; viewport capture, scrim covers the bar. |
| 6 | S02-2 · 176:43 | Search / Food · loading | runtime + story | `S02-2-176-43.png` | Query and Food tab visible, “Results” heading, spinner with “Searching foods”. |
| 7 | S02-3 · 176:77 | Search / Food · no matches | runtime + story | `S02-3-176-77.png` | Query “rice cake” kept; “No foods match ‘rice cake’” with guidance; tinted “Enter manually”; no retry. |
| 8 | S02-4 · 176:118 | Search / Food · request failure | runtime + story | `S02-4-176-118.png` | Query kept; “Search is not available right now”; primary “Try again”, text “Enter manually”. |
| 9 | S07-1 · 176:157 | Food review / From search | runtime + story | `S07-1-176-157.png` | Identity “Vegetable rice bowl · Fixture C”, basis line, small tinted “Change food”, amount 300 g with unit control, 40/48 result 540 kcal, macros 18 / 63 / 24 g, large “Add to today”, text “Done”; no bar. |
| 10 | S07-2 · 176:201 | Food review / Invalid portion | runtime + story | `S07-2-176-201.png` | Amount “0” with the error boundary and “Enter an amount greater than zero”; result shows the dash and one stale sentence; macros show dashes only; “Add to today” disabled. |
| 11 | S07-3 · 176:247 | Food review / Edit logged entry (repurposed) | runtime + story | `S07-3-176-247.png` | “Edit entry”, no Change food, basis per 300 g, draft 150 g → 275 kcal, 15 / 37.5 / 7.5 g; footer “Update entry” + destructive-tinted “Remove entry”. |
| 12 | S04-1 · 178:5 | Barcode / Scanning | runtime + story | `S04-1-178-5.png` | Sunken viewfinder with dashed frame and guidance; prototype controls in the dashed box, visibly separate from product UI. |
| 13 | S04-2 · 178:20 | Barcode / Code read · lookup pending | runtime + story | `S04-2-178-20.png` | Solid blue paused frame, “Code 5012345678900 read. Scanning is paused.”, spinner “Looking up product”. |
| 14 | S04-3 · 178:31 | Barcode / Code not readable | runtime + story | `S04-3-178-31.png` | Warning message “The barcode could not be read” with steadying guidance; “Try again” primary, “Enter manually”. |
| 15 | S04-4 · 178:47 | Barcode / Product not found | runtime + story | `S04-4-178-47.png` | Error message names the read code; Scan again / Search by name / Enter manually. |
| 16 | S04-5 · 178:65 | Barcode / Lookup service failure | runtime + story | `S04-5-178-65.png` | “Lookup failed” keeps code 0000000000000; “Retry lookup” primary, “Enter manually”. |
| 17 | P01 · 178:81 | Conceptual system permission request (app side) | story | `P01-178-81.png` | Paused frame with “Waiting for camera permission” and the system-prompt explanation; Search by name / Enter manually; no OS chrome drawn. |
| 18 | S04-6 · 178:94 | Barcode / Camera access denied | runtime + story | `S04-6-178-94.png` | “Camera access is needed to scan” with the settings hint; primary “Search by name”, tinted “Enter manually”. |
| 19 | S07-4 · 178:109 | Food review / From barcode | runtime + story | `S07-4-178-109.png` | “Oat drink, unsweetened · Scanned”, basis per 100 ml, info note about the match, 43 kcal for 100 ml, 1 / 6.6 / 1.5 g. |
| 20 | S05-1 · 179:5 | Photo / Capture | runtime + story | `S05-1-179-5.png` | Viewfinder with framing guidance, large “Take photo”, prototype controls box. |
| 21 | S05-2 · 179:12 | Photo / Preview | runtime + story | `S05-2-179-12.png` | Sample photograph (rice bowl) at 4:3, sample note, “Analyse photo” + “Retake”. |
| 22 | S05-3 · 179:21 | Photo / Analysing | runtime + story | `S05-3-179-21.png` | Image retained, spinner “Analysing photo”, “does not measure the amount”, text “Cancel”. |
| 23 | S05-4 · 179:31 | Photo / Suggested matches | runtime + story | `S05-4-179-31.png` | Three radio rows with kcal · basis; Lentil soup marked (mark + selected surface + boundary); “Review selected match” enabled; “None of these”. |
| 24 | S05-5 · 179:57 | Photo / No usable match | story | `S05-5-179-57.png` | Image retained, “No food was recognised”, Retake photo primary, Search by name / Enter manually. |
| 25 | S05-6 · 179:70 | Photo / Analysis failure | runtime + story | `S05-6-179-70.png` | Error message keeps the image; Try again / Retake photo / Search by name / Enter manually. |
| 26 | S07-5 · 179:81 | Food review / From photo · estimate | runtime + story | `S07-5-179-81.png` | “Mixed salad leaves · Suggested from your photo · partial nutrition”, photo note, 17 kcal, protein 1.4 g, carbohydrates and fat “Not available” with dashes, partial-data note. |
| 27 | S06-1 · 180:5 | Manual entry / Empty | runtime + story | `S06-1-180-5.png` | Intro, name field, Reference amount group (100 g), Nutrition group with Calories required and optional macros; sticky footer “Continue to review” (full-page capture shows it mid-page: a sticky-bar artefact, see notes). |
| 28 | S06-2 · 180:43 | Manual entry / Filled · keyboard inset | story | `S06-2-180-43.png` | Viewport capture at 393 × 552: the focused Calories field (450) sits above the footer, the header stays at the top. |
| 29 | S06-3 · 180:71 | Manual entry / Field error | runtime + story | `S06-3-180-71.png` | Reference amount “abc” and empty Calories with red boundaries and messages; other values kept; summary “Check the 2 highlighted fields before continuing.” |
| 30 | O03 · 180:111 | Discard unsaved entry | runtime + story | `O03-180-111.png` | Centred dialog over the dimmed form: “Discard this entry?”, consequence line, Keep editing (focused) beside destructive-tinted Discard; viewport capture. |
| 31 | O04 · 180:134 | Supported unit chooser | runtime + story | `O04-180-134.png` | Sheet “Choose a unit” with g (checked) and serving (“1 serving = 300 g”), Cancel / Confirm; viewport capture. |
| 32 | S07-6 · 180:162 | Food review / From manual entry | runtime + story | `S07-6-180-162.png` | “Lentil soup · Entered manually”, basis per 1 serving, “Entered by you…” note, 450 kcal for 1 serving, carbohydrates “Not available”. |
| 33 | S03-2 · 181:5 | Recipes / Filtered results | runtime + story | `S03-2-181-5.png` | Filters 3 with three removable chips, “Matching recipes · 1 recipe matches your filters”, the traybake card with “Matches all 3 filters”. |
| 34 | O02 · 181:72 | Recipe filters / Applied values | runtime + story | `O02-181-72.png` | Sheet with dietary chips (Vegan selected with check), Minimum / Maximum (500), protein 10, preparation Any; Reset all + Apply filters footer; viewport capture. |
| 35 | O02-2 · 181:117 | Recipe filters / Invalid range | runtime + story | `O02-2-181-117.png` | Maximum 300 below minimum 600 with the error boundary and “The maximum must be at least the minimum”; sheet stays open; viewport capture. |
| 36 | S02-5 · 181:133 | Search / Recipes scope · results | runtime + story | `S02-5-181-133.png` | Recipes tab filled, Filters 1 with “Under 460 kcal”, “1 recipe matches your filters”, lentil soup card with photo and “Matches all 1 filter”; Search active. |
| 37 | S08-2 · 181:289 | Recipe details / Loading | runtime + story | `S08-2-181-289.png` | Focused header “Recipe” with Back to results, spinner “Loading recipe”, Recipes active in the retained bar. |
| 38 | S08-1 · 181:237 | Recipe details / Loaded | runtime + story | `S08-1-181-237.png` | 16:9 dal photograph, title, 25 min, “Your filters” with two met rows, 450 kcal per serving (300 g), macros, Show all nutrition, Ingredients, numbered Method; Recipes active. |
| 39 | S08-3 · 181:317 | Recipe details / Unavailable | story | `S08-3-181-317.png` | “This recipe could not be loaded”, primary Try again, text Back to results, bar retained. |
| 40 | S08-4 · 181:350 | Recipe details / No photo · long title · partial nutrition | runtime + story | `S08-4-181-350.png` | No photo frame, three-line title, “Your filters” with the not-met protein row in words, 610 kcal, protein dash + “Not available”. |
| 41 | S02-6 · 181:193 | Search / Recipes · no matches | runtime + story | `S02-6-181-193.png` | Query “lentil” and chip “Under 200 kcal” kept; “No recipes match ‘lentil’ and your filters”; tinted “Change filters”; no retry. |

## Representative and risk-bearing variants (`verification/storybook/states/`)

| File | Story | Inspection |
| --- | --- | --- |
| `V-S01-2-320.png` | S01-2 at 320 | Ring stats stack, macros in three compact columns, entry names wrap, active Home label stacks under its glyph; no overflow. |
| `V-S01-2-430.png` | S01-2 at 430 | Same composition with more room; cells widen; nothing stretches awkwardly. |
| `V-S01-2-320-200.png` | S01-2 at 320 and 200 % text | Figure under a medium ring, macros one per row, entry energy under the name, stacked nav label; no overflow. |
| `V-S01-2-safe-areas.png` | S01-2 with the 59 / 34 safe-area fixture | Header carries the 59 px top inset above the wordmark; the bar adds the 34 px bottom inset to its own padding (asserted in the play function). |
| `V-O01-320.png` | O01 at 320 | Two columns of tiles with wrapped titles; scrim covers the page; viewport capture. |
| `V-S07-1-320.png` | S07-1 at 320 | Title wraps, macros in three columns, footer intact. |
| `V-S07-1-200.png` | S07-1 at 200 % text | Everything wraps; the sticky footer appears mid-page in the full-page capture (artefact) and remains reachable (asserted). |
| `V-S07-1-safe-areas.png` | S07-1 with the safe-area fixture | Focused header owns the 59 px top inset; the footer owns the 34 px bottom inset once. |
| `V-S04-1-320.png` | S04-1 at 320 | Viewfinder and prototype controls wrap without overflow. |
| `V-S04-4-200.png` | S04-4 at 200 % text | Recovery actions wrap onto several lines and stay reachable. |
| `V-S05-4-320.png` | S05-4 at 320 | Radio rows wrap the long pasta name; buttons full width. |
| `V-S05-4-200.png` | S05-4 at 200 % text | Rows grow; Review selected match still visible. |
| `V-S06-1-320.png` | S06-1 at 320 | Fields full width; unit control keeps its 48 px target. |
| `V-S06-3-200.png` | S06-3 at 200 % text | Errors wrap beside their fields; the alert is visible. |
| `V-S03-2-320.png` | S03-2 at 320 | Chips wrap to three rows; the card keeps a 6 rem thumbnail with a four-line title. |
| `V-S08-1-430.png` | S08-1 at 430 | Hero at 16:9, content centred inside the 430 px container. |
| `V-S03-2-320-200.png` | S03-2 at 320 and 200 % text | Card stacks the thumbnail above the text; “Matches all 3 filters” visible. |
| `V-O02-safe-areas.png` | O02 with the safe-area fixture | Sheet footer owns the 34 px bottom inset; Apply filters reachable; viewport capture. |

## Runtime walkthrough (`verification/runtime/`, 390 × 844 unless stated)

| File | Surface / step | Viewport | Inspection |
| --- | --- | --- | --- |
| 01-home-empty.png | S01-1 at launch (no goal) | 390 × 844 | Track only with “0 kcal logged”, Goal “Not set”, large “Log first food”; fill-width navigation group. |
| 02-method-sheet.png | O01 over Home | 390 × 844 | “Log food” sheet, four tiles, scrim covers the bar (viewport capture). |
| 04-search-food-results.png | S02-1 | 390 × 844 | Food tab filled, one row “Vegetable rice bowl · Fixture C · 180 kcal per 100 g”. |
| 06-review-300.png | S07-1 at 300 g | 390 × 844 | 540 kcal, macros, large Add to today, Done. |
| 07-home-populated.png | S01-2 after Add to today | 390 × 844 | “1 entry · 540 kcal”, entry row, ring shows the logged amount without a goal. |
| 09-entry-invalid-stale.png | S07-3 with “abc” | 390 × 844 | Field invalid; result stale (dash + one sentence); Update entry disabled. |
| 13-goal-sheet.png | Goal editor | 390 × 844 | Sheet with kcal field, Cancel / Apply (viewport capture). |
| 14-home-goal.png | S01-2 with goal 2,200 | 390 × 844 | Arc at 25 %, “1,660 kcal remaining”. |
| 14b-review-from-home-origin.png | S07-1 reached from Home → Log food → Search food | 390 × 844 | Review of the search result; the walkthrough then asserts Done returns to Home (ledger D-4). |
| 22-manual-errors.png | S06-3 | 390 × 844 | Two field errors, summary; sticky footer mid-image (artefact). |
| 28-photo-suggestions.png | S05-4 | 390 × 844 | Sample photograph, three radio rows, disabled “Review selected match”, “None of these”. |
| 29-review-photo.png | S07-5 | 390 × 844 | Suggested lentil soup with the photo note. |
| 31-recipes-browse.png | S03-1 | 390 × 844 | Photographs on three cards, No photo on two. |
| 34-recipes-filtered.png | S03-2 | 390 × 844 | Three chips, one matching card with evidence. |
| 38-recipe-loaded.png | S08-1 from browse | 390 × 844 | Dal hero, “Your filters”, nutrition, ingredients, method; Recipes stays current. |
| 46-remove-entry-dialog.png | Remove confirmation over S07-3 | 390 × 844 | Dialog names the food; Keep entry focused (viewport capture). |
| 50-home-320.png | S01-2 | 320 × 800 | Stacked nav label, compact macros; no overflow. |
| 50-home-430.png | S01-2 | 430 × 800 | Wider cells; nothing stretches. |
| 51-home-320-200pct.png | S01-2 | 320 × 800, 200 % | Ring figure stacked, macros one per row, bar intact. |
| 54-method-sheet-320.png | O01 | 320 × 800 | Two columns of tiles (viewport capture). |
| 55-method-sheet-390-200pct.png | O01 | 390 × 844, 200 % | One column of rows (viewport capture). |

## Component and foundation captures (`verification/storybook/`)

The 22 component and foundation captures curated in the previous pass (button treatments, segmented control, method sheet, progress ring, calorie ring, recipe card, media frame, goal editor, radius roles, navigation bar) were re-rendered from the same tree and re-inspected: unchanged apart from the photographs now appearing on recipe cards and the single stale sentence on nutrition summaries.
