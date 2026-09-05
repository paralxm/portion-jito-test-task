# Portion Hi-Fi decisions ledger

Updated: 2026-09-05 (Stage B close-out, §11.7; Stage A close-out, §10.9). Baseline pass: 2026-09-04. Branch: `feat/hifi-screens` (from `main` at `a7c76c4`). Owner of this file: the Hi-Fi product pass. It is the compact, resumable record of the state inventory (41 rows in the baseline pass, 46 after the §10 redesign, 51 after Stage B §11), the transition model, the reference synthesis, the content model, the asset register and every material interpretation. Product truth stays in `PRODUCT.md`; behaviour stays in `docs/ux/`; visual composition stays in `DESIGN.md`. This ledger records how those were applied, not a second specification.

## 0. Sources read for this pass (in the required order)

`CLAUDE.md`, `AGENTS.md`, `PRODUCT.md`, `DESIGN.md`; `docs/ux/low-fidelity.md`, `docs/ux/ui-contract.md`, `docs/ux/task-flows.md`, `docs/ux/research/*.md`, `docs/ux/audits/pre-hifi/ux-audit.md`; the two Portion skills; the Impeccable router (`context.mjs` run once with `--target src/app/App.tsx`); current tokens, screens, stories, `src/app/services.ts`, fixtures and `scripts/verify/*`.

Figma, read-only through the connected MCP:

- Low-fi section **175:2 “Low-fidelity — Complete Core Journeys”** (file `heuO3V1WlKG44CukQswCkw`): metadata of every child, the six lane titles, every label/caption text node, every connector arrow with its label, and a rendered view of every frame (18 through the repository’s Figma exports in `docs/ux/audits/pre-hifi/evidence/`, 25 through fresh MCP renders, plus the whole-section render).
- Stylescape **92:1209**: metadata text of sections 01–07 (brand direction, direction comparison, selected stylescape, palette, typography, iconography, shared patterns & references).
- FigJam **5:337** Product Research & Competitive Analysis (board `Np6ZrdnQKjVw7tZw8W51kT`): structure and sticky-note text of the Comparison, Learnings, Opportunities and User Needs sections.
- FigJam **4:333** UX Synthesis & Design Hypotheses: not needed — the approved docs, the low-fi captions and the research board resolved every decision below; `docs/ux/ux-synthesis-and-design-hypotheses.md` mirrors it in the repository.

Evidence limits: the low-fi interiors are text-free placeholder geometry (board header 175:5/175:6: “Placeholder bars mean omitted content; loading is drawn separately”), so wording, wrapping and semantics come from the contracts and this ledger, never from bar widths. Prototype reactions were not executed in Figma; the arrows are the connector evidence.

## 1. Inventory — the 41 baseline rows (count superseded: §10.3 holds the 46-row inventory)

Count: Lane A 4 + Lane B 7 + Lane C1 8 + Lane C2 7 + Lane D 6 + Lane E 9 = **41**. Excluded on purpose: 176:5 “Origin beneath — the invoking screen (board reference)” (a board aid behind O01, not a state) and every Label/Caption/Lane-title frame. **S01-3 (185:2)** sits outside section 175:2; the audit (F-03) records it as a superseded current-calculation composition, so it is not an inventory row. Its intent — a 320 px witness of S01-2 — is covered by the 320 px captures of S01-2.

Column key. **Entry** = prerequisite and entry condition. **Regions** = the intended information behind the placeholder bars (from captions + contracts). **Controls → outcome** = every visible interactive control and where it goes. **Data** = mutation/persistence. **Fixture** = the deterministic data the story uses (baseline time `2026-09-04T12:00:00Z`). **Mode** = verification mode: *runtime* (reachable through the real flow), *story* (deterministic Storybook fixture), or *both*. **Status** columns are updated in §8.

### 1.1 Lane A — Core navigation (175:7: “Three destinations and one trailing Add food action share a single bottom row. Exactly one destination is selected.”)

| # | Figma frame · node | Portion ID · surface | State / purpose | Entry | Regions | Controls → outcome | Data · async | Fixture | Risks | Mode |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | S01-1 — Home / Today — No food logged · **175:10** | `S01-1` · Home root, `HomeScreen` | Daily overview with no committed entries today | App launch; or Home with zero entries for today | Header (wordmark, Home); **Today** group: ring, Logged / Goal, Set/Edit daily goal; compact Protein · Carbs · Fat (0 g recorded); **Today’s food** empty guidance + `Log first food`; **Find a recipe** guidance + `Find recipes`; bottom navigation (Home active) | Set a daily goal → goal editor (sheet over Home); Log first food → O01; Find recipes → S03-1 (or restored S03 context); nav Search/Recipes → roots; + → O01 | No mutation; goal editor writes `goalKcal`; entries unchanged | No entries; goal 2,200 (low-fi §4.2 specimen); launch state has no goal (contract 3.2) — both are stories, launch is runtime | Ring text without colour; 320 px stacking of ring stats; 200 % text; safe-area top (header) and bottom (nav) each once | both |
| 2 | S01-2 — Home / Today — Food logged · **175:38** | `S01-2` · Home root | Daily overview with ≥ 1 committed entry today | After `Add to today` (from any S07 new-mode) | Same region order; entry rows (identity, portion, energy); `Log food`; recipe module (See matching recipes when browse criteria exist) | Entry row → S07-3 (existing-entry review); Edit daily goal → editor; Log food → O01; Find recipes / See matching recipes → S03; nav | Reads committed entries for the local day; totals are derived, never stored | Two entries: Oatmeal with mixed berries 300 g 550 kcal; Grilled chicken Caesar salad 350 g 800 kcal; goal 2,200 → 1,350 logged, 850 remaining, 61 %; macros 90/135/50 g | Long entry names wrap; figure/unit stay together; tabular figures on changing values | both |
| 3 | S02-1 — Search / Food scope · results · **175:93** | `S02-1` · Search root, `SearchScreen` | Food results for a query | Search root with Food scope and a non-empty query that returned ≥ 1 result | Header (wordmark, Search); search field with clear; Food \| Recipes tabs (Food selected); results heading + count; rows with identity, reference basis, kcal per basis; nav (Search active) | Row → S07-1; clear → idle; tab Recipes → S02-5/S02-6; nav; + → O01 | Query kept across scope; results are a request state (`ready`) | Query “rice” → Vegetable rice bowl (fixture C) | Long names wrap; kcal column alignment; keyboard hides the bar | both |
| 4 | S03-1 — Recipes / Browse · **175:158** | `S03-1` · Recipes root, `RecipesScreen` | Query-free browse without criteria | Recipes root, browse loaded, no criteria | Header (wordmark, Recipes); Search recipes entry; Filters (small); results heading “All recipes”; cards with image / no-photo, title (one long), kcal · protein, basis, time, dietary tags; nav (Recipes active) | Search recipes → S02 Recipes scope with criteria snapshot; Filters → O02; card → S08-2; nav; + → O01 | Browse owns its criteria (none here); list is `ready` | Full catalogue (5): lentil soup, traybake, long-title pasta (no photo), chicken salad, tofu (unknown protein) | 4:3 thumbnails, long title, no-photo fallback, 320 px card stacking | both |

### 1.2 Lane B — Home through search and review (176:2)

| # | Figma frame · node | Portion ID · surface | State / purpose | Entry | Regions | Controls → outcome | Data · async | Fixture | Risks | Mode |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 5 | O01 — Add food / Choose a method (overlay) · **176:20** | `O01` · `MethodSheet` over any root or S08 | Choose one of four methods | + Log food or Home’s Log food, from Home, Search, Recipes or Recipe Details | Sheet title **Log food**, one-line description, close; 2 × 2 tiles: Search food (Find a product or dish), Scan barcode (For packaged food), Take a photo (Review suggested matches), Enter manually (Use known label values); scrim blocks the page and the bar | Search food → S02 Food scope (S02-2 while loading if a query exists, else idle); Scan barcode → S04-1; Take a photo → S05-1; Enter manually → S06-1; close / backdrop / Escape → exact origin | No mutation (“nothing is written until…”); records the **task origin** (root + focused stack) so Done can return there | Opened over S01-1 | 2 × 2 at 320; rows only under 200 %; focus containment and return to the plus | both |
| 6 | S02-2 — Search / Food · loading · **176:43** | `S02-2` · Search root | Request in flight | Query typed in Food scope (debounced) | Field with query, tabs, results heading, real progress indicator (“Searching foods”) | Clear → idle; typing → new request (late responses ignored); nav | `loading` request state; obsolete responses dropped by request id | Query “rice”, service pending | Spinner announces once; reduced motion | both |
| 7 | S02-3 — Search / Food · no matches · **176:77** | `S02-3` · Search root | Query returned nothing | Food query with 0 results | Query kept; “No foods match ‘…’”; guidance; `Enter manually` | Enter manually → S06-1; edit query → new request; nav | `ready` with empty list — not a failure | Query “zzz” | Distinct from failure; wording names the query | both |
| 8 | S02-4 — Search / Food · request failure · **176:118** | `S02-4` · Search root | Service did not respond | Food query whose request failed | Query kept; failure title; `Try again`; `Enter manually` | Try again → S02-2 for the same query; Enter manually → S06-1 | `failure` request state; input never cleared | Query “offline rice” (the prototype’s existing failure trigger) | Failure vs no-match copy | both |
| 9 | S07-1 — Food review / From search · **176:157** | `S07-1` · focused, `FoodReviewScreen` mode new | Review identity, portion and result | Row chosen in S02-1 | Focused header (Back, Review food); identity + reference basis; `Change food`; Amount to calculate + unit control; result (kcal, basis line), macros; Show all nutrition; footer `Add to today` (large) + `Done` | Back → S02-1 with query intact; Change food → S02-1; unit → O04; Add to today → creates entry, Home S01-2; Done → task origin without logging | Preview only until Add to today; duplicate activation blocked | Fixture C at 300 g → 540 kcal, 18/63/24 g | No bottom bar; footer owns bottom safe area; 200 % footer still reachable | both |
| 10 | S07-2 — Food review / Invalid portion · **176:201** | `S07-2` · focused | Portion draft invalid | Amount cleared or ≤ 0 in any S07 | Field invalid with guidance beside it; result marked unavailable/stale; Add to today disabled | Fix amount → S07-1 preview; Done/Back unchanged | No mutation; old result never shown as current | Fixture C, draft “0” | Error text association; disabled button still readable | both |
| 11 | S07-3 — Food review / Replaces current calculation · **176:247** | `S07-3` · focused, `FoodReviewScreen` mode **existing** | **Repurposed: Edit logged entry** (see §6, D-1) | Entry row chosen on S01-2 | Header “Edit entry”; identity (no Change food); amount/unit draft from the committed portion; result; footer `Update entry` + `Remove entry` | Update entry → same entry ID updated, Home; Remove entry → confirmation, then removed, Home; Back with changed draft → Keep editing / Discard; unchanged → Home | Draft local; totals use the committed entry until Update | Oatmeal entry 300 g → draft 150 g | Discard protection; destructive confirmation names the food | both |

### 1.3 Lane C1 — Barcode acquisition (178:2)

| # | Figma frame · node | Portion ID · surface | State / purpose | Entry | Regions | Controls → outcome | Data · async | Fixture | Risks | Mode |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 12 | S04-1 — Barcode / Scanning · **178:5** | `S04-1` · focused, `BarcodeScreen` | Live scan region | Scan barcode from O01 (camera allowed) | Dark viewfinder with frame and guidance; exit (Back/Close); two alternate methods always reachable (Search by name, Enter manually); prototype controls (labelled) | Read → S04-2; alternates → S02 / S06-1; Back → origin | None | Scanning phase | Contrast on dark surface; 48 px targets; prototype controls never look like product UI | both |
| 13 | S04-2 — Barcode / Code read · lookup pending · **178:20** | `S04-2` · focused | Lookup in flight, capture paused | A code was read | Paused frame, code shown, progress indicator “Looking up product” | Back cancels (late response ignored) | Request id guards | Code 5012345678900 pending | Spinner + text; reduced motion | both |
| 14 | S04-3 — Barcode / Code not readable · **178:31** | `S04-3` · focused | Read failed, no lookup attempted | Unreadable read | Guidance grows (hold steady, whole code in frame); `Try again` (rescan); `Enter manually` | Try again → S04-1; Enter manually → S06-1 | None | Unreadable phase | Warning tone, not error | both |
| 15 | S04-4 — Barcode / Product not found · **178:47** | `S04-4` · focused | Code read, no product | Lookup returned not-found | Code shown; “Product not found”; `Search by name`, `Enter manually`, `Scan again` (lesser) | Search → S02 Food; Enter manually → S06-1; Scan again → S04-1 | None | Code 4009999999990 | Distinct from failure | both |
| 16 | S04-5 — Barcode / Lookup service failure · **178:65** | `S04-5` · focused | Service failed for a read code | Lookup failed | Code kept; “Lookup failed”; `Retry lookup`; `Enter manually` | Retry → S04-2 same code; Enter manually → S06-1 | None | Code 0000000000000 | Retry vs rescan wording | both |
| 17 | P01 — Conceptual system permission request · **178:81** | `P01` · focused (app side only) | The OS camera prompt, requested when the camera action needs it | First camera use in S04/S05 | System-owned dialog (not drawn); the app beneath waits with capture paused and an explanation | System Allow → S04-1/S05-1; Deny → S04-6 (or the photo denied state) | None | `permission-pending` phase | The web prototype has no camera and cannot show a real prompt; only the app’s waiting state is app UI | story |
| 18 | S04-6 — Barcode / Camera access denied · **178:94** | `S04-6` · focused | Denial keeps other methods | Permission denied | “Camera access is needed to scan”; settings hint; `Search by name`, `Enter manually` | Search → S02 Food; Enter manually → S06-1; Back → origin | None | Denied phase (prototype control) | No prompt loop | both |
| 19 | S07-4 — Food review / From barcode · **178:109** | `S07-4` · focused, mode new | Review the matched product | Lookup found | As S07-1 with “Matched from the barcode…” note and correction emphasised (`Change food` → search) | Change food → S02 Food; Add to today / Done / Back as S07-1 (Back → S04 paused) | As S07-1 | Oat drink 100 ml → 43 kcal | Basis per 100 ml; ml ↔ serving only | both |

### 1.4 Lane C2 — Photo acquisition (179:2)

| # | Figma frame · node | Portion ID · surface | State / purpose | Entry | Regions | Controls → outcome | Data · async | Fixture | Risks | Mode |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 20 | S05-1 — Photo / Capture · **179:5** | `S05-1` · focused, `PhotoScreen` | Framing guidance and a shutter | Take a photo from O01 | Dark viewfinder, frame, guidance, shutter (`Take photo`); exit; prototype controls | Take photo → S05-2; Back → origin | None | Capture phase | Shutter target ≥ 56 px; dark contrast | both |
| 21 | S05-2 — Photo / Preview · **179:12** | `S05-2` · focused | Captured frame with Retake and Analyse | After shutter | Image preview, sample note; `Analyse photo` (primary), `Retake` | Analyse → S05-3; Retake → S05-1 | Nothing analysed until asked | Sample image (see §5) | Image aspect; alt text states it is a sample | both |
| 22 | S05-3 — Photo / Analysing · **179:21** | `S05-3` · focused | Real progress with cancellation | Analyse pressed | Retained image, progress “Analysing photo”, note “does not measure the amount”, `Cancel` | Cancel → S05-2 (late response ignored); Back → origin | Request id guards | Analysing phase | Cancel reachable; reduced motion | both |
| 23 | S05-4 — Photo / Suggested matches · **179:31** | `S05-4` · focused | Several suggestions with an explicit selection mark | Analysis returned suggestions | Image; “Suggested foods”; selectable rows (radio semantics, none pre-selected); `Review selected match` (primary, disabled until a choice); `None of these` → reveals Retake / Search by name / Enter manually | Review selected match → S07-5; None of these → recovery actions; Back → origin | None | Three suggestions (lentil soup, rice bowl, pasta) | Radio group name; disabled primary readable; see D-3 | both |
| 24 | S05-5 — Photo / No usable match · **179:57** | `S05-5` · focused | Photo produced nothing usable | Analysis returned zero suggestions | Image; “No food was recognised”; `Retake photo`, `Search by name`, `Enter manually` | Retake → S05-1; others → S02 / S06-1 | None | Empty suggestions (story fixture; the runtime analyser returns fixed suggestions) | Never invents nutrition | story (runtime cannot produce zero suggestions honestly) |
| 25 | S05-6 — Photo / Analysis failure · **179:70** | `S05-6` · focused | Service failure keeps the image | Analysis failed | Image; “Analysis failed”; `Try again`, Search / Manual | Try again → S05-3 same image; Retake → S05-1 | None | Simulated failure (prototype control) | Failure vs no-match copy | both |
| 26 | S07-5 — Food review / From photo · estimate · **179:81** | `S07-5` · focused, mode new | Suggestion still needs review and a user-entered portion | Review selected match | As S07-1 with “Suggested from your photo…” note; unknown macros shown as not available (never zero) | Change food → S02 Food; Add to today / Done / Back (→ S05-4) | As S07-1 | Suggested lentil soup 100 g; a partial-nutrition suggestion for the unknown-macro case | Estimate wording; not-available styling | both |

### 1.5 Lane D — Manual entry and correction (180:2)

| # | Figma frame · node | Portion ID · surface | State / purpose | Entry | Regions | Controls → outcome | Data · async | Fixture | Risks | Mode |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 27 | S06-1 — Manual entry / Empty · **180:5** | `S06-1` · focused, `ManualEntryScreen` | Reference data form, empty | Enter manually from O01 or a recovery action | Intro sentence; Food or dish name; Reference amount (amount + unit control); Nutrition for that amount (Calories required; Protein/Carbs/Fat optional); footer `Continue to review` | Unit → O04; Continue → validation (S06-3) or S07-6; Back → origin (untouched form exits at once) | None | Empty draft | Optional labelled; blank = unknown | both |
| 28 | S06-2 — Manual entry / Filled · keyboard inset · **180:43** | `S06-2` · focused | Focused field and Continue stay above the keyboard | Typing in a field with the software keyboard open | Filled fields; focused calories field; footer above the keyboard region | As S06-1 | None | Filled draft; keyboard emulated by a reduced viewport (393 × 552) in the story | Scroll padding keeps the field visible; footer owns bottom | story (a real keyboard cannot be scripted; runtime behaviour is the layout’s scroll padding + `useSoftwareKeyboard`) |
| 29 | S06-3 — Manual entry / Field error · **180:71** | `S06-3` · focused | Validation beside the offending field | Continue with invalid data | Error under the field; other values kept; error summary; first invalid field focused | Fix → Continue → S07-6 | None | Reference amount “abc”, calories blank | Alert announcement once; error contrast | both |
| 30 | O03 — Discard unsaved entry · **180:111** | `O03` · `ConfirmDialog` over S06 (and over S07-3 for a changed draft) | Only asked for meaningful unsaved input | Back on a dirty draft | Title, one-line consequence, `Keep editing` (safe, focused), `Discard` (destructive) | Keep editing → stays; Discard → origin | Discard drops the draft only | Dirty S06 draft | Focus trap and return; Escape = Keep editing | both |
| 31 | O04 — Supported unit chooser · **180:134** | `O04` · `UnitSheet` over S06 or S07 | Only conversions the data supports | Unit control | Sheet title, options with a check mark on the selection, note; Cancel / Confirm | Confirm → applies (S07 re-expresses a valid amount); Cancel → prior unit | Draft until Confirm | Fixture C: g, serving (1 serving = 300 g) | Selection marked, not colour only | both |
| 32 | S07-6 — Food review / From manual entry · **180:162** | `S07-6` · focused, mode new | Entered reference basis and desired portion are separate groups | Continue with a valid draft | As S07-1 with “Entered by you…” note; reference basis line; blank macro shown as not available | Change food → S06 (Back to the form with input intact); Add to today / Done | As S07-1 | Manual “Lentil soup” 1 serving = 300 g, 450 kcal, carbs unknown | Basis vs portion clarity | both |

### 1.6 Lane E — Recipe browse, criteria, details and return (181:2)

| # | Figma frame · node | Portion ID · surface | State / purpose | Entry | Regions | Controls → outcome | Data · async | Fixture | Risks | Mode |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 33 | S03-2 — Recipes / Filtered results · **181:5** | `S03-2` · Recipes root | Applied criteria as removable chips; match evidence because criteria are active | Apply in O02 from browse | Search entry; Filters with count; applied chips; “Matching recipes” + count; cards with “Matches all N filters” evidence | Chip remove → list updates at once; Filters → O02; card → S08-2; nav | Browse owns criteria | Vegan, ≤ 500 kcal, ≥ 10 g protein → 1 match | Chips wrap; evidence never colour-only | both |
| 34 | O02 — Recipe filters / Applied values · **181:72** | `O02` · `RecipeFiltersSheet` over S03 or S02 Recipes | Draft of discrete options and numeric bounds | Filters | Title, close; dietary preference (radio chips); calories min–max; protein min; preparation max; footer `Reset all` / `Apply filters` never covering the last field | Apply → owning list; Reset all → clears the draft (needs Apply); Cancel/close → applied criteria unchanged | Draft until Apply | Draft equal to the S03-2 criteria | Focus containment; footer safe area | both |
| 35 | O02-2 — Recipe filters / Invalid range (crop) · **181:117** | `O02-2` · same sheet | Minimum above maximum refused; Apply unavailable | Min > max typed | Range fields with error beside them; Apply disabled | Fix → Apply enabled | None | 600–300 kcal | Error association | both |
| 36 | S02-5 — Search / Recipes scope · results · **181:133** | `S02-5` · Search root, Recipes tab | Query + scope-specific criteria | Recipes tab with a query (criteria snapshot from browse when arriving from Search recipes) | Field, tabs (Recipes selected), Filters + applied chips, results with evidence | Card → S08-2 (origin Search); chip remove; Filters → O02; tab Food | Search’s own criteria copy; later edits never overwrite browse | Query “lentil”, criterion ≤ 460 kcal | Search stays selected | both |
| 37 | S08-2 — Recipe details / Loading · **181:289** | `S08-2` · `RecipeDetailsScreen` (root bar kept) | Record loading; Back available | Open recipe from S02-5 / S03 | Focused header (Back to results), progress “Loading recipe”, origin bar | Back → exact list (late response ignored) | Request id guard | Loading state | Spinner; reduced motion | both |
| 38 | S08-1 — Recipe details / Loaded · **181:237** | `S08-1` | Serving basis, nutrition, ingredients, steps; origin tab stays selected | Load succeeded | 16:9 hero, title, time + dietary tags, **Your filters** evidence (only with active criteria), nutrition summary + Show all nutrition, Ingredients, Method | Back → origin list; Show all nutrition → expands; nav; + → O01 | None | Fixture R with criteria ≤ 500 kcal, ≥ 20 g protein, ≤ 30 min | Long ingredient lines wrap; hero aspect | both |
| 39 | S08-3 — Recipe details / Unavailable · **181:317** | `S08-3` | Failed record offers Retry and Back | Load failed | “This recipe could not be loaded”; `Try again`; `Back to results`; origin bar | Try again → S08-2 same recipe; Back → list | None | Unavailable state (story fixture) | Runtime catalogue loads always succeed; a fake failing recipe would be an invented path (D-5) | story |
| 40 | S08-4 — Recipe details / No photo · long title · partial nutrition (crop) · **181:350** | `S08-4` · loaded variant | Missing image does not block content; long title wraps; unknown nutrient named | Load succeeded for such a recipe | No-photo frame, wrapped long title, nutrition with a not-available value | As S08-1 | None | Long-title pasta with protein unknown (story fixture) | No broken-image UI | both (runtime: the long-title pasta recipe has no photo; the partial-nutrition combination is the story fixture) |
| 41 | S02-6 — Search / Recipes · no matches · **181:193** | `S02-6` · Search root, Recipes tab | Query and criteria retained; recovery = criteria adjustment | Recipes query with 0 matches | Field, tabs, chips, “No recipes match ‘…’ and your filters”; `Change filters` | Change filters → O02; edit query; chip remove | `ready` empty | Query “lentil” with ≤ 200 kcal | Not a retry | both |

## 2. Transition matrix

Every visible control from §1 and every lane arrow appears here. Lane arrows are sequence labels between adjacent frames (e.g. Lane B: Search food → results → edit query → manual → portion → confirm); they are mapped to real transitions below, and D-2 records where an arrow’s literal reading conflicts with the contracts.

| From | Event | Guard | Next / outcome | Data mutation | Nav / overlay mode | Back / origin result |
| --- | --- | --- | --- | --- | --- | --- |
| any root, S08 | + Log food / Home Log food | — | O01 | task origin recorded (root + focused stack) | overlay over the current screen | close, backdrop, Escape → exact origin, focus to the opener |
| O01 | Search food | — | Search root, Food scope (S02 idle or S02-2/S02-1 with the retained query) | none | root switch; sheet closes | Done from S07-1 → task origin (D-4); nav still switches roots normally |
| O01 | Scan barcode / Take a photo / Enter manually | — | S04-1 / S05-1 / S06-1 (P01 first on a real device) | none | focused push; sheet closes | Back → origin screen and state |
| S01-1/S01-2 | Set/Edit daily goal | — | goal editor sheet | Apply writes `goalKcal` (number or null); Cancel/Escape keep | overlay | focus returns to the action |
| S01-2 | entry row | — | S07-3 (existing) | none until Update | focused push | Back → Home; changed draft → O03-style confirm |
| S01 | Find recipes / See matching recipes | — | S03-1 or the restored S03 context with its criteria | none | root switch | — |
| S02 | type (debounced) | non-empty query | S02-2 then S02-1/S02-3/S02-4 (Food) or S02-5/S02-6/failure (Recipes) | request state; late responses ignored | — | query kept |
| S02 | clear | — | idle | request idle | — | — |
| S02 | tab Food ↔ Recipes | — | same query, other scope; recipe criteria stay Recipes-specific | none | — | — |
| S02-1 | row | — | S07-1 | none | focused push | Back → S02-1 with query intact |
| S02-3 / S02-4 | Enter manually | — | S06-1 | none | focused push | Back → S02 |
| S02-4 | Try again | — | S02-2 same query | new request | — | — |
| S02-5 | card | — | S08-2 (origin Search) | none | focused push, root bar kept | Back → S02-5 with scroll |
| S02-6 | Change filters | — | O02 | draft | overlay | Cancel keeps criteria |
| S03-1 / S03-2 | Filters | — | O02 | draft | overlay | — |
| O02 | Apply | valid bounds | owning list re-filtered (S03-2 / S02-5 / S02-6) | criteria written | sheet closes | — |
| O02 | Reset all | — | draft cleared, sheet stays (Apply still required) | none | — | — |
| O02 | Cancel / close / Escape | — | applied criteria unchanged | none | sheet closes | focus returns to Filters |
| O02 | min > max | — | O02-2: field errors, Apply disabled | none | — | — |
| S03-2 / S02-5 | chip remove | — | list updates immediately | criterion removed | — | not undone by a later Cancel |
| S03-2 | Clear all filters (no-match state) | — | S03-1 | criteria cleared | — | — |
| S03 | Search recipes | — | S02 Recipes scope with a criteria snapshot | Search criteria = copy | root switch | later Search edits never touch browse |
| S03-1/S03-2 | card | — | S08-2 (origin Recipes) | none | focused push, root bar kept | Back → same list, criteria, scroll |
| S08-2 | loaded / failed | request still current | S08-1 (or S08-4 variant) / S08-3 | none | — | Back during loading ignores the late response |
| S08-3 | Try again | — | S08-2 same recipe | none | — | — |
| S08-* | Back to results | — | exact originating list | none | pop | — |
| S04-1 | code read | not already looking up | S04-2 (capture paused) | none | — | — |
| S04-2 | found / not-found / failed | request current | S07-4 / S04-4 / S04-5 | none | — | Back → S04 paused |
| S04-3 | Try again | — | S04-1 | none | — | — |
| S04-4 | Scan again / Search by name / Enter manually | — | S04-1 / S02 Food / S06-1 | none | — | — |
| S04-5 | Retry lookup / Enter manually | — | S04-2 same code / S06-1 | none | — | — |
| P01 | Allow / Deny (system) | — | S04-1 or S05-1 / S04-6 or photo denied | none | system dialog | — |
| S04-6 | Search by name / Enter manually | — | S02 Food / S06-1 | none | — | never re-prompts |
| S05-1 | shutter | — | S05-2 | none | — | — |
| S05-2 | Analyse / Retake | — | S05-3 / S05-1 | none | — | — |
| S05-3 | Cancel | — | S05-2 (response ignored) | none | — | — |
| S05-3 | suggestions / none / failed | request current | S05-4 / S05-5 / S05-6 | none | — | — |
| S05-4 | select a suggestion | — | selection marked, Review enabled | none | — | — |
| S05-4 | Review selected match | one selected | S07-5 | none | focused push | Back → S05-4 with the selection kept |
| S05-4 | None of these | — | recovery actions revealed (Retake, Search by name, Enter manually) | none | — | — |
| S05-5 | Retake / Search / Manual | — | S05-1 / S02 Food / S06-1 | none | — | — |
| S05-6 | Try again / Retake / Search / Manual | — | S05-3 same image / … | none | — | — |
| S06-1/S06-2 | unit control | — | O04 | draft | overlay | Cancel keeps the unit |
| S06 | Continue | valid draft | S07-6 | none (candidate handed over) | focused push | Back → S06 with the draft intact |
| S06 | Continue | invalid | S06-3, first invalid field focused, summary announced | none | — | — |
| S06 | Back | dirty draft | O03 | none | dialog | Keep editing → S06; Discard → origin |
| S06 | Back | untouched | origin | none | pop | — |
| S07 new | amount / unit change | — | preview recalculated; invalid → S07-2 | none | — | — |
| S07 new | Add to today | valid portion, energy known, not yet submitted | entry created, Home S01-2 | one `FoodEntry` appended with day key | root switch, stack cleared | — |
| S07 new | Done | — | task origin (D-4) | none | stack cleared, origin restored | — |
| S07 new | Change food | — | S02-1 (search/barcode/photo sources) or S06 (manual) | none | pop / root switch | — |
| S07 new | Back | — | previous acquisition step | none | pop | — |
| S07-3 | Update entry | valid, energy known | same entry updated, Home | entry portion/nutrition snapshot replaced, ID and day kept | root switch | — |
| S07-3 | Remove entry → confirm | — | entry removed, Home | entry deleted | dialog then root switch | Keep entry → S07-3 |
| S07-3 | Back | changed draft | discard confirmation | none | dialog | Keep editing / Discard → Home |
| nav | Home / Search / Recipes | — | that root with its retained state; focused stack cleared | none | root switch | — |
| any root | software keyboard open | text control focused and viewport shrunk | whole bar hidden, restored on blur | none | — | — |

## 3. Reference synthesis

Three families are covered with traceable surfaces. Every source is either in the stylescape section 07 “Shared Patterns & References” (node **146:728**, six references inspected 2026-09-02 from official help centres / store listings) or the research board **5:337** (sticky-note IDs cited). No competitor identity, palette, copy, layout or claim is copied; only hierarchy, interaction, density, feedback and content structure were extracted.

| Reference surface (exact source) | Portion problem | Observed pattern | Supporting evidence | Decision | Portion-system adaptation | Accessibility / truth risk |
| --- | --- | --- | --- | --- | --- | --- |
| MyFitnessPal entry-method menu — official help-centre composite, iOS (stylescape 146:728, “Pattern 1”) | Home / logging: four methods must read as one choice before anything is committed | One add action opens a small closed set of labelled methods | Stylescape text: “the choice is visible before anything is committed”; low-fi O01 caption | **Adopt** (already O01) | 2 × 2 `MethodOption` tiles with icon, label, helper in `MethodSheet`; nothing commits on choice | Sheet focus containment and return; tiles ≥ 48 px |
| MyFitnessPal dashboard / diary model (same source, “what we do not copy”) | Home must stay a bounded overview | Daily budget dashboard with diary sections and percent-of-goal | Stylescape: “Portion defines no reference basis, so a percentage of a goal would be unsupported”; `PRODUCT.md` non-goals | **Reject** | Home keeps one grouped daily overview (ring, Logged/Goal, compact macros), entries list, recipe entry | Avoids implying targets the product does not define |
| Apple-Activity-style dominant ring vs figure-first ring (two plausible Home patterns compared) | Home: how prominent should progress be? | (a) large multi-ring hero; (b) neutral ring framing a figure with Logged/Goal beside it | `DESIGN.md` “no Activity-ring imitation”; low-fi S01 shows one ring with labelled values below; research 27:2925 “not a mandatory tracking workflow” | **Choose (b)** | `CalorieProgressRing`: one neutral indicator, figure + state text in the centre, Logged/Goal nearby, no colour meaning | Text carries the quantity; unknown is not 0 % |
| YAZIO Smart Adding / Lose It! mealtime history (research 17:1195, 21:2177, 21:1921) | Home / logging shortcuts | Recents, favourites, saved meals shorten repeat logging | Research board learnings 27:2912 (“faster input alone is not enough”) | **Reject** for scope | No recents/favourites; repeat logging is a separate acquisition | Avoids a diary feature the scope excludes |
| Etsy search entry with browsable suggestions — App Store composite (stylescape 146:728, “Pattern 2”) | Search: “no query yet” must be usable | Empty field with guidance/browsable content beneath | Stylescape: “no query yet is a usable starting state”; contract: Recipes works without a query | **Adapt** | S02 idle shows an `EmptyState` with guidance per scope; Recipes browse is query-free | Guidance is plain text, not a fake result list |
| Cal AI capture-before-catalog (research 17:1550, 17:1827) | Acquisition: should photo lead? | Photo-first entry, catalogue as fallback | Research: “speed versus verification… users still need a correction path”; `PRODUCT.md`: methods are equal | **Reject** as default, **adopt** the correction lesson | O01 keeps four equal methods; every photo/barcode result reaches S07 with a correction route | Prevents automation from being read as certainty |
| YAZIO editable AI estimates (research 17:1154, 17:1074) | Review: estimates must be checkable | AI results labelled rough and editable; corrections reusable | Sticky: “AI results are rough estimates and editable” | **Adopt** | S07-5 “Suggested from your photo… the photo does not measure it”; S05-4 explicit selection then review | Copy names uncertainty without alarm |
| MyFitnessPal serving-size selector (stylescape “Pattern 3”) | Review: edit amount and unit in context | Inline amount, unit opens a modal list with the current value marked | Stylescape: “selection is marked by a check… explicit cancel and confirm” | **Adopt** | `AmountField` + `UnitControl` → `UnitSheet` (O04) with Cancel/Confirm | Check mark + text, not colour only |
| Samsung Food applied-criteria chips — official help screenshot, Android (stylescape “Pattern 4/6”) | Recipes: keep what narrows the set visible | Applied categories as chips above results, with counts | Stylescape: “what is narrowing the set stays visible without opening the sheet” | **Adopt** | `CriteriaToolbar`: Filters (count badge) + removable `AppliedCriterionChip`s; no ratings | Chip remove targets ≥ 48 px |
| YAZIO recipe filter sheet — App Store composite (stylescape “Pattern 4”) | Recipes: draft/apply/reset/dismiss | Close + Reset in header, scrolling body, persistent primary | Stylescape; contract 6.3 | **Adopt** | `RecipeFiltersSheet`: close, Reset all, persistent Apply filters; Cancel discards | Footer never covers the last field |
| Booking.com attribute card check rows (stylescape “Pattern 5”, non-nutrition) | Recipes: explain suitability before details | Facts as icon + value; decisive condition separated with a check | Stylescape: “Portion never uses colour alone to signal that a criterion is met”; research 44:1385 | **Adapt** | `MatchCriteria`: “Matches all N filters” on cards; per-criterion evidence on details; check + text | No green-only emphasis, no scores |

## 4. Content model

Rules applied: English, concise, action-oriented; consistent nouns (food, entry, recipe, filter) and verbs (Log, Add to today, Update entry, Remove entry, Done, Try again, Change filters); labels predict results; fixture values only; unknown stays “Not available”; match language only with active criteria; announcements once, through `status`/`alert` roles.

| State / pattern | User question | Title | Body / supporting | Labels | Primary CTA | Secondary | Helper / error / empty / success | Announcement | Truth source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S01-1 | What has today got, and how do I start? | Home · Today | “Nothing logged today. Add a food or dish to review its portion and nutrition; adding it to today is optional.” | Logged, Goal, Protein, Carbs, Fat | Log first food | Set a daily goal; Find recipes | Ring: “0 kcal logged” (no goal) or “2,200 kcal remaining”; “No daily goal set, so there is no remaining amount.” | none (static) | contract §3 |
| S01-2 | Where am I today? | Home · Today | Entry rows: name, portion, energy; “2 entries · 1,350 kcal” | as above; Edit daily goal | Log food | Find recipes / See matching recipes | Over goal: “150 kcal over goal”; reached: “0 kcal remaining” | none | contract §3, fixtures §1 |
| Goal editor | What goal, and can I clear it? | Set a daily goal / Edit daily goal | “A goal is optional. It only changes the remaining amount shown on Home.” | Daily calorie goal (kcal) | Apply | Cancel; Clear goal | “Enter a whole number greater than zero.” | invalid draft: field error | contract 3.2 |
| O01 | How do I identify the food? | Log food | “Choose how to identify the food. You review it before anything is added to today.” | Search food · Find a product or dish; Scan barcode · For packaged food; Take a photo · Review suggested matches; Enter manually · Use known label values | (tiles) | Close | — | dialog name “Log food” | low-fi §5 |
| S02 idle | What can I search? | Search for a food or dish / Search for a recipe | “Type a name to see matching foods with their calories per reference amount.” / “Type a recipe name or an ingredient. Filters narrow the results further.” | Food · Recipes; Search foods / Search recipes | — | — | — | none | contract §5 |
| S02-2 | Is it working? | Results | “Searching foods” / “Searching recipes” | — | — | — | progress | status once | contract 6.5 |
| S02-1 / S02-5 | Which result is mine? | Results · “1 food found” / “3 recipes match your filters” | rows: name, detail, kcal per basis | — | (rows) | — | — | status with the count | fixtures |
| S02-3 | Why nothing, what now? | No foods match “rice cake” | “Check the spelling or try a shorter name. You can also enter the nutrition yourself.” | — | Enter manually | — | — | status | contract 6.5 |
| S02-4 | Is it my fault? | Search is not available right now | “The search service did not respond. Your query is kept.” | — | Try again | Enter manually | — | alert | contract 6.5 |
| S02-6 | Why no recipes? | No recipes match “lentil” and your filters | “Every recipe is compared with the query and all of your filters. Try another word or loosen a filter.” | — | Change filters | — | — | status | contract 6.3 |
| S07 new | Is this the food and amount I mean? | Review food | identity; “Nutrition basis: per 100 g”; source note (barcode / photo / manual) | Amount to calculate; Calories; Protein, Carbohydrates, Fat | Add to today | Done; Change food; Show all nutrition | “The result updates as you type a valid amount.”; invalid: “Enter an amount greater than zero”; “Calories are not available for this food” | none (live region avoided; the result is visible) | contract 2.2 |
| S07-3 | Can I fix or remove this entry? | Edit entry | committed portion as the draft | as S07 | Update entry | Remove entry | Remove: “Remove {food} from today? It leaves today’s food and totals. Nothing else changes.” Keep entry / Remove; changed draft on Back: “Discard the changed amount?” Keep editing / Discard | dialog names | contract 2.3 |
| S04-1 | What do I do? | Scan barcode | “Point the camera at the product barcode” · “Scanning stops on its own once a code is read.” | — | (camera) | Search by name; Enter manually | prototype controls are labelled “Prototype controls … no camera or product database” | none | contract 6.5 |
| S04-2 | Did it read? | Scan barcode | “Code 5012345678900 read. Scanning is paused.” + “Looking up product” | — | — | — | progress | status | — |
| S04-3 | Why didn’t it read? | The barcode could not be read | “Hold the phone steady and keep the whole code inside the frame.” | — | Try again | Enter manually | warning tone | status | — |
| S04-4 | It read, so why nothing? | Product not found | “Code … was read, but no product matches it. Search by name or enter the values yourself.” | — | Search by name | Enter manually; Scan again | error tone | alert | low-fi caption 178:167 |
| S04-5 | Can I retry? | Lookup failed | “The product service did not respond for code …. The code is kept so you can retry.” | — | Retry lookup | Enter manually | — | alert | — |
| P01 (app side) | Why is nothing happening? | Scan barcode / Take a photo | “Waiting for camera permission. Allow access in the system prompt to continue, or add the food another way.” | — | — | Search by name; Enter manually | — | none | low-fi caption 178:177; D-6 |
| S04-6 / photo denied | Now what? | Camera access is needed to scan / to take a photo | “Allow camera access in your browser or system settings, or add the food another way.” | — | Search by name | Enter manually | — | none | contract 6.5 |
| S05-1 | How do I take it? | Take a photo | “Frame the food, then take the photo” · “You will see a suggestion to check before anything is calculated.” | — | Take photo | — | prototype controls labelled | none | — |
| S05-2 | Is this the shot? | Take a photo | “Sample image used by this prototype. It is not a photo of your food and it does not measure the portion.” | — | Analyse photo | Retake | — | none | data truth |
| S05-3 | Can I stop it? | Analysing photo | “Looking for foods in the image. This does not measure the amount.” | — | Cancel | — | progress | status | — |
| S05-4 | Which one is it? | Suggested foods | “Pick the closest match. You set the amount next, and you can change the food at any point.” | rows (radio) | Review selected match | None of these → Retake photo; Search by name; Enter manually | primary disabled until a choice | radiogroup name | low-fi caption 179:142; D-3 |
| S05-5 | Why nothing? | No food was recognised | “Try a closer, well-lit photo, or add the food another way.” | — | Retake photo | Search by name; Enter manually | — | status | — |
| S05-6 | Is my photo lost? | Analysis failed | “The recognition service did not respond. Your photo is kept, so you can try again without retaking it.” | — | Try again | Retake photo; Search by name; Enter manually | — | alert | — |
| S06-1 | What do I type? | Enter manually | “Type the nutrition you know for a set amount. You choose the portion to calculate on the next screen.” | Food or dish name; Reference amount · Amount; Nutrition for that amount · Calories, Protein (optional), Carbohydrates (optional), Fat (optional) | Continue to review | — | “Leave a value blank if you do not know it. It will show as not available, not as zero.” | none | contract 6.2 |
| S06-3 | What is wrong? | Enter manually | field errors, e.g. “Enter a number greater than zero” | — | Continue to review | — | “Check the highlighted field before continuing.” | alert once | contract 6.5 |
| O03 | Will I lose my typing? | Discard this entry? | “The values you typed will be lost. Nothing already added to today changes.” | — | Keep editing (safe) | Discard | — | dialog | low-fi caption 180:219 |
| O04 | Which units are possible? | Change unit | options with “1 serving = 300 g”; “Only units this food’s data supports are offered.” | — | Confirm | Cancel | — | dialog | contract 6.2 |
| S03-1 | What is there? | Recipes · All recipes | cards: title; kcal · protein; “per serving (300 g)”; time; tags; “Protein not available” in words | Search recipes; Filters | (cards) | — | no-photo: “No photo” | count once | fixtures |
| S03-2 / S02-5 | Why these? | Matching recipes · “1 recipe matches your filters” | “Matches all 3 filters” under the title | chips: Vegan, 300–500 kcal, 10 g protein or more | (cards) | Filters; chip remove | — | count | contract 6.3 |
| O02 | How do I narrow? | Filters | “Every active filter is combined; a recipe must satisfy all of them. Dietary preference is not an allergen check.” | Dietary preference; Calories per serving (min, max); Protein per serving (min); Preparation time (max) | Apply filters | Reset all; Cancel | O02-2: “Minimum must not be above the maximum.” | dialog | contract 6.3 |
| S08-2 | Is it coming? | Recipe | “Loading recipe” | Back to results | — | — | progress | status | — |
| S08-1 / S08-4 | Does it suit me? | Recipe · title | time; tags; **Your filters** with per-criterion Met / Not met; nutrition per serving; Ingredients; Method | — | Show all nutrition | Back to results | unknown nutrient: “Not available” | none | contract 6.4 |
| S08-3 | Can I retry? | This recipe could not be loaded | “The recipe service did not respond. Your results and filters are unchanged.” | — | Try again | Back to results | — | alert | low-fi caption 181:402 |

Non-obvious copy decisions: the entry action is **Log food** everywhere (plus, sheet title, Home); **Add to today** is the only commit and **Done** the no-log exit (contract 2.2, audit F-06). “Review selected match” names the outcome of S05-4’s primary; “None of these” is the recovery disclosure rather than a navigation. P01’s app-side line says “system prompt” without drawing one. Match copy always counts filters (“Matches all 3 filters”) and never says “healthy” or “suitable”.

## 5. Photography and local asset register

Inventory of existing assets: `src/assets/images/` contains only `.gitkeep`; recipes use an inline SVG placeholder and the photo flow an inline SVG plate. The stylescape names Wikimedia Commons CC BY-SA photographs, which are not in the repository and are outside the allowed providers for this pass (Unsplash or Pexels), so they are not used.

Slot map (one fixture ↔ one asset across Recipes, Search Recipes scope, Details, Storybook, captures):

| Slot | Fixture | Ratio use | Decision |
| --- | --- | --- | --- |
| Recipe card + details hero | `recipe-lentil-soup` (fixture R) | 4:3 card, 16:9 hero (`object-fit: cover`, centred focal point) | licensed photo (see register) |
| Recipe card + hero | `recipe-traybake` | 4:3 / 16:9 | licensed photo |
| Recipe card + hero | `recipe-chicken-salad` | 4:3 / 16:9 | licensed photo |
| Recipe card + hero | `recipe-tofu` | 4:3 / 16:9 | licensed photo |
| Recipe card + hero | `recipe-pasta-long` | — | intentional **No photo** (S03-1 no-photo case; S08-4) |
| Photo flow captured frame | S05-2…S05-6 | 4:3 preview | licensed photo of a bowl, labelled as a sample |
| Food search rows, Home entries | — | — | no imagery (low-fi rows carry identity and basis only) |

Register (filled in §8 after acquisition; every row must have a verifiable item URL and licence URL or the slot falls back to No photo):

| asset ID | local source path | represented food/recipe | provider | photographer / creator | original item URL | licence URL | access date | crop / aspect use | alt-text decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| lentil-soup | `src/assets/images/recipes/lentil-soup.webp` | `recipe-lentil-soup` (fixture R, “Lentil soup”; the photo is a lentil dal) | Unsplash | VD Photography (`/@vdphotography`) | https://unsplash.com/photos/WM0qTXnH41Q | https://unsplash.com/license | 2026-09-04 | 1200 × 900 centre crop (4:3); 16:9 hero by `object-fit: cover` | empty alt beside the visible title |
| chicken-salad | `src/assets/images/recipes/chicken-salad.webp` | `recipe-chicken-salad` | Unsplash | Zayed Ahmed Zadu (`/@zayed_ahmed_zadu`) | https://unsplash.com/photos/grilled-chicken-salad-with-vegetables-and-nuts-top-view-bly5KOy6zNM | https://unsplash.com/license | 2026-09-04 | 1200 × 900 centre crop; 16:9 hero by cover | empty alt |
| tofu-stir-fry | `src/assets/images/recipes/tofu-stir-fry.webp` | `recipe-tofu` | Unsplash | tommao wang (`/@tommaomaoer`) | https://unsplash.com/photos/pan-fried-golden-tofu-with-green-vegetables-in-a-white-bowl-HUc9rHGfgM4 | https://unsplash.com/license | 2026-09-04 | 1200 × 900 centre crop; 16:9 hero by cover | empty alt |
| sample-capture | `src/assets/images/foods/sample-capture.webp` | the photo flow’s captured frame (S05-2…S05-6), a rice bowl | Unsplash | Shashi Chaturvedula (`/@thephotographermom`) | https://unsplash.com/photos/cooked-rice-with-green-peas-and-carrots-on-stainless-steel-bowl-oYvZ-stypr4 | https://unsplash.com/license | 2026-09-04 | 1200 × 900 centre crop (4:3 preview) | “Sample image standing in for your photo” — it carries the meaning that this is a sample, not the user’s food |
| vegetable-traybake | `src/assets/images/recipes/vegetable-traybake.webp` | `recipe-traybake` (“Roasted vegetable and chickpea traybake”; the photo shows roasted peppers, aubergine and cauliflower on a tray — chickpeas are not visible, so the image is appearance only) | Pexels | Anthony Rahayel (`/@anthony-rahayel-125801377`) | https://www.pexels.com/photo/36367576/ | https://www.pexels.com/license/ | 2026-09-05 | Pexels CDN centre crop 1200 × 900 (`auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop`), encoded to WebP q0.72 by Chromium (`.verification/to-webp.mjs`, no dependency added); 16:9 hero by `object-fit: cover` | empty alt beside the visible title |
| pasta-roasted-vegetables | `src/assets/images/recipes/pasta-roasted-vegetables.webp` | `recipe-pasta-long` (“Wholegrain pasta with roasted vegetables and tahini dressing”; penne with courgette and peppers on a plate) | Pexels | Ravi Sharma (`/@ravinepz`) | https://www.pexels.com/photo/penne-pasta-dish-in-a-plate-7458755/ | https://www.pexels.com/license/ | 2026-09-05 | as above | empty alt |
| greek-yoghurt | `src/assets/images/foods/greek-yoghurt.webp` | `food-yoghurt` (“Greek yoghurt, plain”; two bowls of plain yoghurt on a blue tray) | Pexels | elif tekkaya (`/@eliftekkaya`) | https://www.pexels.com/photo/white-ceramic-bowls-on-blue-tray-10809243/ | https://www.pexels.com/license/ | 2026-09-05 | 1200 × 900 centre crop (4:3 thumbnail and card) | empty alt |
| almond-butter | `src/assets/images/foods/almond-butter.webp` | `food-almond-butter` (a jar of almond butter with almonds and crackers; the crackers are not part of the item) | Pexels | cole yap (`/@cole-yap-2149136300`) | https://www.pexels.com/photo/delicious-almond-butter-with-crackers-on-plate-33657317/ | https://www.pexels.com/license/ | 2026-09-05 | as above | empty alt |
| salad-leaves | `src/assets/images/foods/salad-leaves.webp` | `food-salad-leaves` (“Mixed salad leaves”) | Pexels | Eleonora Vokueva (`/@eleonora-vokueva-2161345723`) | https://www.pexels.com/photo/fresh-mixed-green-salad-leaves-close-up-37416573/ | https://www.pexels.com/license/ | 2026-09-05 | as above | empty alt |
| oatmeal | `src/assets/images/foods/oatmeal.webp` | `food-oatmeal` (“Oatmeal with blueberries and banana”; the photo also shows walnuts, which the synthetic values do not include) | Pexels | Cup of Couple (`/@cup-of-couple`) | https://www.pexels.com/photo/an-oatmeal-with-fresh-fruits-topping-on-a-white-surface-7655878/ | https://www.pexels.com/license/ | 2026-09-05 | as above | empty alt |
| banana | `src/assets/images/foods/banana.webp` | `food-banana` | Pexels | Mr. Pugo (`/@mrpugo`) | https://www.pexels.com/photo/fresh-yellow-bananas-on-wooden-surface-33203199/ | https://www.pexels.com/license/ | 2026-09-05 | as above | empty alt |
| avocado-toast | `src/assets/images/foods/avocado-toast.webp` | `food-avocado-toast` (sliced avocado on wholegrain toast) | Pexels | Nicola Barts (`/@nicola-barts`) | https://www.pexels.com/photo/an-avocado-toast-on-a-plate-7936662/ | https://www.pexels.com/license/ | 2026-09-05 | as above | empty alt |
| hummus | `src/assets/images/foods/hummus.webp` | `food-hummus` (hummus with olive oil and chickpeas) | Pexels | Anthony Rahayel (`/@anthony-rahayel-125801377`) | https://www.pexels.com/photo/creamy-hummus-with-olive-oil-and-chickpeas-36367568/ | https://www.pexels.com/license/ | 2026-09-05 | as above | empty alt |
| scrambled-eggs | `src/assets/images/foods/scrambled-eggs.webp` | `food-scrambled-eggs` (“Scrambled eggs on toast”) | Pexels | juliane Monari (`/@julianemonarifotografia`) | https://www.pexels.com/photo/scrambled-egg-and-bread-on-plate-19842428/ | https://www.pexels.com/license/ | 2026-09-05 | as above | empty alt |
| sparkling-water | `src/assets/images/drinks/sparkling-water.webp` | `food-sparkling-water` (a glass of sparkling water) | Pexels | Sam Mai (`/@sam-mai-322739881`) | https://www.pexels.com/photo/a-close-up-shot-of-a-glass-of-sparkling-water-13723906/ | https://www.pexels.com/license/ | 2026-09-05 | as above | empty alt |
| orange-juice | `src/assets/images/drinks/orange-juice.webp` | `food-orange-juice` | Pexels | Anna Pyshniuk (`/@anna-pyshniuk-2453945`) | https://www.pexels.com/photo/orange-juice-in-a-glass-6414118/ | https://www.pexels.com/license/ | 2026-09-05 | as above | empty alt |
| oat-drink | `src/assets/images/drinks/oat-drink.webp` | `food-oat-drink` (“Oat drink, unsweetened”; the catalogue drink and the sample barcode share this identity) | Pexels | Polina Tankilevitch (`/@polina-tankilevitch`) | https://www.pexels.com/photo/milk-in-clear-glass-jar-4187717/ | https://www.pexels.com/license/ | 2026-09-05 | as above | empty alt |
| — (shared) | `src/assets/images/foods/sample-capture.webp`, `recipes/lentil-soup.webp`, `recipes/pasta-roasted-vegetables.webp`, `recipes/chicken-salad.webp` | `food-c`, `food-lentil-soup`, `food-pasta-long`, `food-chicken-salad` reuse the registered photographs above (Stage B, §11.2) | — | — | — | — | 2026-09-05 | as above | empty alt |
| — (baseline pass) | — | `recipe-traybake`, `recipe-pasta-long` | — | — | — | — | 2026-09-04 | were intentional **No photo** in the baseline pass (Unsplash candidates were paid or the wrong dish); superseded 2026-09-05 by the two Pexels rows above (D-28) | — |

Rejected candidates and why (so the search is not repeated): Jezebel Rose KGw62KtHzxA (butternut squash, not lentil); Monika Grabkowska VVPC-DEBi2I (pumpkin/sweet-potato soup); Max Griss xVgE_mCA8fk (sweet-potato soup); Zayed Ahmed Zadu VNYi27uNrxE (egg-drop soup); Kateryna Hliznitsova ZWKLCjeAdZ8 and Maryam Sicard KxUIupj29iU / ekoJ6j-0BEA (Unsplash+); Chefitt BKKZqbMShzo (roasted vegetables with bread in a skillet — no chickpeas, bread could read as part of the recipe); Christopher Stites aCfju9BMtP8 (breakfast platter). Files were fetched through the item’s Unsplash download endpoint and resized server-side to 1200 × 900 WebP (`fm=webp&w=1200&h=900&fit=crop&q=72`); no image-conversion dependency was added. Sizes: 65–210 KB (the chicken salad is the largest at 210 KB; it is the only slot rendered at the 16:9 hero size on a 2× display).

Alt-text rule applied: recipe and catalogue images sit beside the visible title, add no information the title lacks, and use empty alt; the photo-flow sample uses “Sample image standing in for your photo”.

Stage B search (2026-09-05, Pexels, per query the first page of results was shortlisted and the chosen item page checked for “Free to use” and the creator’s name): rejected the yoghurt bowls with granola and fruit (29516115, 4006347 — toppings the plain item does not have), the oat-milk bottle in oats (8681508 — the bottle, not a glass), the Perrier bottle (18212879 — a brand), the Pixabay-account orange juice (158053 — no named creator) and the almond-toast items (7167855, 20605006 — peanut butter on toast, not the spread).

## 6. Material interpretations and decisions

| ID | Question | Evidence | Decision | Reversibility |
| --- | --- | --- | --- | --- |
| D-1 | S07-3 “Replaces current calculation” contradicts the accepted daily-record model | low-fi §6/§7 (“Target S07-3 becomes existing-entry editing”), contract 2.3, audit F-02 | Row 11 is **Food review / Edit logged entry** (`FoodReviewScreen` mode `existing`); the Figma frame keeps its node ID | documented; no Figma writeback |
| D-2 | Lane arrows read literally would connect S02-4 → S07-1 (“manual”), S05-4 → S05-5 (“review”), O04 → S07-6 (“continue”) | Captions and contracts define the real transitions | Arrows are sequence labels; §2 maps them to the contract transitions (manual → S06 → S07-6; review → S07-5; continue from S06 → S07-6) | — |
| D-3 | Photo suggestions: Figma select-then-review vs code’s immediate row activation | low-fi S05-4 (explicit selection mark + primary) and caption 179:142; contract 6.5 “explicit selection from suggestions afterward”; audit F-05 | Adopt **select-then-review**: radio rows, `Review selected match` enabled after a choice, `None of these` reveals recovery actions | code + stories + task-flow note |
| D-4 | Search food from O01 loses the invoking surface (audit F-01) | contract 2.2 (“Done exits the food task to its invoking surface”), low-fi §5 (“preserve the overall invoking context”) | Record a **task origin** when O01 opens; Done from any S07 restores it (root + focused stack); Back still steps through the acquisition; Search itself keeps its query | behaviour aligned with contracts; no new route |
| D-5 | Browse failure and S08-3 are unreachable at runtime (audit F-09) | brief: no invented evaluator paths; `services.ts` always succeeds for catalogue IDs | Keep the services honest; verify S08-3 and browse failure as **deterministic stories**; record as `story` mode | — |
| D-6 | P01 is a system dialog | caption 178:177 (“System-owned and textless here — not an implemented OS behaviour”); DESIGN.md forbids drawing OS chrome | Represent the **app-side waiting state** (capture paused, explanation, alternatives) as a deterministic story; no OS dialog is drawn | — |
| D-7 | S06-2 needs a software keyboard | no scriptable keyboard in Playwright/Storybook | Story emulates the keyboard’s visible area by a 393 × 552 viewport with the calories field focused; runtime relies on the layout’s scroll padding and `useSoftwareKeyboard` | — |
| D-8 | S01-3 (185:2) is a superseded 320 px composition | audit F-03 | Not an inventory row; S01-2’s 320 px capture is the narrow witness | — |
| D-9 | S05-5 “no usable match” cannot occur with the fixed suggestion fixture | `analysePhotoService` returns three suggestions | Story-only deterministic reproduction; the screen’s state exists in production code | — |
| D-10 | Deterministic time | brief | Stories and fixtures use `2026-09-04T12:00:00Z`; the runtime keeps the real clock | — |
| D-11 | The review commit stayed enabled while the portion draft was invalid (the guard was only in the handler) | contract 2.2 “enabled only for valid … data with a calculable energy result”; low-fi caption 176:321 “confirm is unavailable” | `Add to today` / `Update entry` are disabled while the draft has no calculable result; the field keeps its guidance; the existing story was corrected accordingly | — |
| D-12 | Fixture detail lines repeated the basis (“Fixture C · per 100 g” beside “Nutrition basis: per 100 g” and the row’s basis column) | content rule: consistent nouns, no duplicated information | Detail strings carry source/quality only (“Fixture C”, “Homemade”, “Scanned”, “Suggested from your photo”); the basis is stated once by the row or the review header | — |
| D-13 | The stale-result sentence was repeated in every macro slot (four times on S07-2) | cognitive-load lens; low-fi caption 176:321 | The sentence appears once under the main result; subordinate values show the dash with hidden text | — |
| D-14 | Full-page captures of sticky bars and open sheets show what no user sees | evidence truthfulness | Runtime and Storybook captures are viewport-only while a dialog is open and for the keyboard-inset fixture; other tall pages are full-page and the manifest says so | — |
| D-15 | The recipes-scope count read “1 recipe match your filters” | content rule | Singular copy corrected to “1 recipe matches your filters” | — |

No product-changing conflict remains open. No hard blocker was found.

## 7. Verification plan

- Stories: one mapped story per row under `Product states/<lane>` named `<ID> · <node> — <Figma name>`; each renders the production screen with deterministic fixtures, carries a description (purpose, entry, fixture, primary action, next state, limitation) and, where a control sequence matters, a play function.
- Captures: every mapped story at 393 × 852; representative states at 320 and 430; 200 % text and the 59/34 safe-area fixture for the root, focused and sheet families; runtime walkthrough captures for every runtime-mode row.
- Commands: `npm run tokens:check`, `npm exec --no -- tsc --noEmit`, `npm run build`, `npm run build-storybook`, `npm exec --no -- vitest run`, `node scripts/verify/runtime-walkthrough.mjs`, `node scripts/verify/storybook-captures.mjs`, `node scripts/verify/contrast-matrix.mjs --check`, detector.

## 8. Status (baseline pass, final 2026-09-04 — superseded by §10.8 for reopened rows)

All 41 rows have production UI, a mapped deterministic story, a 393 × 852 capture and a recorded verification mode. Commands and results are in §9; the tracked evidence set and its inspection notes are `verification/manifest.md`.

| # | ID | Implementation | Test | Story (Product states / …) | Capture (393 × 852) | Verification |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | S01-1 | production screen, done | play + axe pass | Lane A → S01-1 | `verification/storybook/states/S01-1-175-10.png` | runtime + story · walkthrough 01-home-empty |
| 2 | S01-2 | production screen, done | play + axe pass | Lane A → S01-2 | `verification/storybook/states/S01-2-175-38.png` | runtime + story · walkthrough 07-home-populated / 50-home-320 / 50-home-430 |
| 3 | S02-1 | production screen, done | play + axe pass | Lane A → S02-1 | `verification/storybook/states/S02-1-175-93.png` | runtime + story · walkthrough 04-search-food-results |
| 4 | S03-1 | production screen, done | play + axe pass | Lane A → S03-1 | `verification/storybook/states/S03-1-175-158.png` | runtime + story · walkthrough 31-recipes-browse |
| 5 | O01 | production screen, done | play + axe pass | Lane B → O01 | `verification/storybook/states/O01-176-20.png` | runtime + story · walkthrough 02-method-sheet / 54 / 55 |
| 6 | S02-2 | production screen, done | play + axe pass | Lane B → S02-2 | `verification/storybook/states/S02-2-176-43.png` | runtime + story · walkthrough 03-search-loading |
| 7 | S02-3 | production screen, done | play + axe pass | Lane B → S02-3 | `verification/storybook/states/S02-3-176-77.png` | runtime + story · walkthrough 45-search-no-match |
| 8 | S02-4 | production screen, done | play + axe pass | Lane B → S02-4 | `verification/storybook/states/S02-4-176-118.png` | runtime + story · walkthrough 44-search-failure (query containing “offline”) |
| 9 | S07-1 | production screen, done | play + axe pass | Lane B → S07-1 | `verification/storybook/states/S07-1-176-157.png` | runtime + story · walkthrough 06-review-300 / 14b-review-from-home-origin |
| 10 | S07-2 | production screen, done | play + axe pass | Lane B → S07-2 | `verification/storybook/states/S07-2-176-201.png` | runtime + story · walkthrough 09-entry-invalid-stale |
| 11 | S07-3 | production screen, done | play + axe pass | Lane B → S07-3 | `verification/storybook/states/S07-3-176-247.png` | runtime + story · walkthrough 08-entry-edit |
| 12 | S04-1 | production screen, done | play + axe pass | Lane C1 → S04-1 | `verification/storybook/states/S04-1-178-5.png` | runtime + story · walkthrough 15-barcode-scanning |
| 13 | S04-2 | production screen, done | play + axe pass | Lane C1 → S04-2 | `verification/storybook/states/S04-2-178-20.png` | runtime + story · walkthrough 16-barcode-looking-up |
| 14 | S04-3 | production screen, done | play + axe pass | Lane C1 → S04-3 | `verification/storybook/states/S04-3-178-31.png` | runtime + story · prototype control (no walkthrough capture) |
| 15 | S04-4 | production screen, done | play + axe pass | Lane C1 → S04-4 | `verification/storybook/states/S04-4-178-47.png` | runtime + story · walkthrough 19-barcode-not-found |
| 16 | S04-5 | production screen, done | play + axe pass | Lane C1 → S04-5 | `verification/storybook/states/S04-5-178-65.png` | runtime + story · walkthrough 20-barcode-lookup-failed |
| 17 | P01 | production screen, done | play + axe pass | Lane C1 → P01 | `verification/storybook/states/P01-178-81.png` | story (deterministic) |
| 18 | S04-6 | production screen, done | play + axe pass | Lane C1 → S04-6 | `verification/storybook/states/S04-6-178-94.png` | runtime + story · prototype control (no walkthrough capture) |
| 19 | S07-4 | production screen, done | play + axe pass | Lane C1 → S07-4 | `verification/storybook/states/S07-4-178-109.png` | runtime + story · walkthrough 17-review-barcode |
| 20 | S05-1 | production screen, done | play + axe pass | Lane C2 → S05-1 | `verification/storybook/states/S05-1-179-5.png` | runtime + story · walkthrough 25-photo-capture |
| 21 | S05-2 | production screen, done | play + axe pass | Lane C2 → S05-2 | `verification/storybook/states/S05-2-179-12.png` | runtime + story · walkthrough 26-photo-preview |
| 22 | S05-3 | production screen, done | play + axe pass | Lane C2 → S05-3 | `verification/storybook/states/S05-3-179-21.png` | runtime + story · walkthrough 27-photo-analysing |
| 23 | S05-4 | production screen, done | play + axe pass | Lane C2 → S05-4 | `verification/storybook/states/S05-4-179-31.png` | runtime + story · walkthrough 28-photo-suggestions |
| 24 | S05-5 | production screen, done | play + axe pass | Lane C2 → S05-5 | `verification/storybook/states/S05-5-179-57.png` | story (deterministic) |
| 25 | S05-6 | production screen, done | play + axe pass | Lane C2 → S05-6 | `verification/storybook/states/S05-6-179-70.png` | runtime + story · walkthrough 30-photo-failed |
| 26 | S07-5 | production screen, done | play + axe pass | Lane C2 → S07-5 | `verification/storybook/states/S07-5-179-81.png` | runtime + story · walkthrough 29-review-photo |
| 27 | S06-1 | production screen, done | play + axe pass | Lane D → S06-1 | `verification/storybook/states/S06-1-180-5.png` | runtime + story · walkthrough 21-manual-empty |
| 28 | S06-2 | production screen, done | play + axe pass | Lane D → S06-2 | `verification/storybook/states/S06-2-180-43.png` | story (deterministic) |
| 29 | S06-3 | production screen, done | play + axe pass | Lane D → S06-3 | `verification/storybook/states/S06-3-180-71.png` | runtime + story · walkthrough 22-manual-errors |
| 30 | O03 | production screen, done | play + axe pass | Lane D → O03 | `verification/storybook/states/O03-180-111.png` | runtime + story · walkthrough 24-manual-discard-dialog |
| 31 | O04 | production screen, done | play + axe pass | Lane D → O04 | `verification/storybook/states/O04-180-134.png` | runtime + story · walkthrough 10-unit-sheet |
| 32 | S07-6 | production screen, done | play + axe pass | Lane D → S07-6 | `verification/storybook/states/S07-6-180-162.png` | runtime + story · walkthrough 23-review-manual |
| 33 | S03-2 | production screen, done | play + axe pass | Lane E → S03-2 | `verification/storybook/states/S03-2-181-5.png` | runtime + story · walkthrough 34-recipes-filtered |
| 34 | O02 | production screen, done | play + axe pass | Lane E → O02 | `verification/storybook/states/O02-181-72.png` | runtime + story · walkthrough 32-filters-sheet |
| 35 | O02-2 | production screen, done | play + axe pass | Lane E → O02-2 | `verification/storybook/states/O02-2-181-117.png` | runtime + story · walkthrough 33-filters-invalid-range |
| 36 | S02-5 | production screen, done | play + axe pass | Lane E → S02-5 | `verification/storybook/states/S02-5-181-133.png` | runtime + story · walkthrough 42-search-recipes-results |
| 37 | S08-2 | production screen, done | play + axe pass | Lane E → S08-2 | `verification/storybook/states/S08-2-181-289.png` | runtime + story · walkthrough 37-recipe-loading |
| 38 | S08-1 | production screen, done | play + axe pass | Lane E → S08-1 | `verification/storybook/states/S08-1-181-237.png` | runtime + story · walkthrough 38-recipe-loaded |
| 39 | S08-3 | production screen, done | play + axe pass | Lane E → S08-3 | `verification/storybook/states/S08-3-181-317.png` | story (deterministic) |
| 40 | S08-4 | production screen, done | play + axe pass | Lane E → S08-4 | `verification/storybook/states/S08-4-181-350.png` | runtime + story · runtime: the long-title pasta recipe (no photo); the partial-nutrition combination is the story fixture |
| 41 | S02-6 | production screen, done | play + axe pass | Lane E → S02-6 | `verification/storybook/states/S02-6-181-193.png` | runtime + story · runtime reachable; walkthrough covers browse no-match (36-recipes-no-match) |

Story-only rows and why they are not user-navigable routes: **P01** is the OS prompt (only the app’s waiting state is app UI; the prototype has no camera, D-6); **S05-5** needs an analyser that returns nothing, which the fixed-suggestion prototype cannot do honestly (D-9); **S06-2** needs a software keyboard, which cannot be scripted (D-7); **S08-3** needs a catalogue recipe that fails to load, and a deliberately failing recipe would be an invented evaluator path (D-5). Every other row occurs in the real runtime flow and is exercised by the walkthrough.

## 9. Verification record (baseline pass, final 2026-09-04 — see §10.9 for the redesign)

| Check | Command | Result |
| --- | --- | --- |
| Tokens | `npm run tokens:check` | 235 tokens validated; generated output current |
| Typecheck | `npm exec --no -- tsc --noEmit` | exit 0 |
| Unit tests | `npx vitest run --project unit` | 5 files, 50 passed |
| Storybook tests (play + axe at `error`) | `npx vitest run --project storybook` | 69 files, 378 tests passed (every mapped state story, its play function and axe) |
| App build | `npm run build` | success; photos emitted as hashed `dist/assets/*.webp` |
| Storybook build | `npm run build-storybook` | success |
| Runtime walkthrough | `node scripts/verify/runtime-walkthrough.mjs` | 40 checks passed, 0 failed, no console errors (includes the D-4 origin check and the select-then-review photo path) |
| Storybook captures | `node scripts/verify/storybook-captures.mjs` | 101 captures, 0 with problems: 42 component/foundation captures, the 41 mapped states at 393 × 852, 18 variants (320 / 430, 200 % text, safe-area fixture) |
| Contrast matrix | `node scripts/verify/contrast-matrix.mjs --check` | 58 pairs, 0 failing |
| Impeccable detector | `node .claude/skills/impeccable/scripts/detect.mjs --json src` | no findings |

Impeccable sequence applied (bounded, inline from the installed references): context once (`--target src/app/App.tsx`) → critique of the Home, Search/Review, Recipes and Details renders (findings D-11–D-15) → layout/typeset not needed (no shared cause found; tokens, Inter and roles untouched) → clarify done manually against §4 → adapt through the 320 / 430 / 200 % variants and the state stories’ overflow assertions → harden through the invalid, unknown, failure, keyboard-inset and safe-area states → animate not needed (no new transition) → audit through axe on every story plus manual keyboard checks in the play functions → one polish pass (D-12, D-13). Rendered inspection at 393 (all 41), 320 and 430 (representative rows) and 200 % is recorded in the manifest.

Not verified here: a real screen reader or device pass, native iOS safe-area behaviour, and a live software keyboard; these remain manual checks.

## 10. Redesign checkpoint — 2026-09-05

A controlled product/UI redesign of the completed 2026-09-04 pass, driven by the new brief (four attached UI references: a selected Home, a barcode scanner, a photo capture and a recipe-detail composition). This section is the resumable record for that pass; §§1–9 stay as the baseline history and are not rewritten. Where a §10 decision changes a §6 decision, §10 wins.

### 10.1 Baseline reconstructed from the repository (no chat history was available)

- Git: `feat/hifi-screens` at `e229cbe` = `origin/feat/hifi-screens`, clean worktree, upstream set; `origin/main` has since merged this branch as PR #8 (`fd11590`), which does not affect continuing here. Nothing after `e229cbe` exists locally or remotely on the branch. Remote: `paralxm/portion-jito-test-task`.
- Commits that produced the state: `97905ad` (41 states as production UI, Lane A–E state stories, photography, fixtures) and `e229cbe` (tracked captures: 41 states + 18 variants + runtime set, `verification/manifest.md`).
- Complete: all 41 rows of §1 (§8), verification record §9 (tokens 235, tsc 0, unit 50, storybook 378, walkthrough 40 checks, 101 captures, 58 contrast pairs, detector clean). Story-only by design: P01, S05-5, S06-2, S08-3 (D-5, D-6, D-7, D-9). Nothing uncommitted.
- What this brief reopens: Home (S01-1, S01-2, O01 as an overlay over the new Home), Search (S02-1…S02-6: field trailing actions and filter placement), Recipes (S03-1, S03-2: photos, filter placement), the barcode lane (P01, S04-1…S04-6, S07-4: dark stage, simulator removal, meal commit), the photo lane (S05-1…S05-6, S07-5), every review row (S07-1, S07-2, S07-3, S07-6: Add-to-meal commit, meal picker on an existing entry), recipe details (S08-1…S08-4: hero, Add, nutrition hierarchy) and O02/O02-2 (opened from the new trailing filter action). Not reopened: S06-1, S06-2, S06-3, O03, O04 (focused header unchanged, no navigation, no commit).
- Impeccable: `context.mjs --target src/app/App.tsx` was run once for this session. Its `AUTONOMY_DIRECTIVE_CHECK` asks for a structured interview; the repository contract (`CLAUDE.md`: Impeccable is a refinement/QA toolkit inside PRODUCT/DESIGN/UX authority, Operate mode) and the brief's "continue autonomously" rule take precedence, so no interview was held and the brief is the design authority. The router also reports no local image converter; photography is therefore fetched pre-sized from the provider again (§5 method).

### 10.2 The four attached references — adopt / adapt / reject

| Reference | Element | Decision | Reason |
| --- | --- | --- | --- |
| Home (selected) | Compact header: lowercase wordmark + blue dot, `Today · Sep 4`, trailing `Edit goal` | **Adopt** | Matches the brief's AppHeader root variant; the wordmark and dot become `PortionLogo`; the date is the real local day; the action is `Set goal` / `Edit goal` |
| Home | Horizontal calorie budget: large remaining figure, `consumed · %`, `Goal`, track with goal marker | **Adopt** | Replaces the ring (D-19); the marker gives the bar a visible bound so 0 % and unknown differ |
| Home | Blue fill on the budget track | **Adapt** | Blue is allowed as *information* by DESIGN.md; the fill never changes colour for reached/over; words carry the state (D-20) |
| Home | Macro rows `24 / 120 g` with coloured bars | **Adapt** | Targets appear only when the user entered them in the goal editor (D-18); tracks use the existing nutrient accents; unknown stays `Not available` |
| Home | Recipe card `FITS YOUR GOALS`, `High protein option` | **Reject** wording, **adapt** placement | Portion has no goal-fit criteria; the card reads `Recommended recipe`, or `Matches all N filters` only with active browse criteria (D-21). Uppercase label and green badges rejected (no health claims, no badge clouds) |
| Home | `Today's meals` grouped list with a filled/empty dot and `+ Add dinner` | **Adopt** | One grouped surface with row separation (D-16); the dot is paired with text (kcal or the add action), never colour alone |
| Home | Water row with drop icon, `1.25 / 2 L`, `+250 ml` | **Adopt** | `WaterTracker` with sibling controls (D-22); cyan family distinct from action blue |
| Home | Bottom bar with a fourth `Add` cell | **Reject** | Portion keeps three destinations plus the separate 56 px circular `Log food`; only the missing top border and the fixed position are adopted (D-26) |
| Home | Status bar / device frame | **Reject** | No OS chrome (DESIGN.md) |
| Barcode | Dark camera stage, focus corners, `Searching` chip, moving scan line, instruction hierarchy | **Adopt** | `CameraStage` component; the chip is text, the corners are drawn boxes, the line animates only while scanning and not under reduced motion |
| Barcode | Flash action | **Reject** | No runtime capability |
| Barcode | `PROTOTYPE · Simulate scanner responses` panel | **Reject** | Simulator controls leave production; deterministic phases are story-only (D-24) |
| Photo | Dark stage, grid, circular guide, `Center meal in frame` chip, `Frame the food` heading | **Adapt** | Same `CameraStage`; the circular guide and one chip are kept, the grid is dropped (decorative); copy stays Portion's (`Frame the food, then take the photo`) |
| Photo | `Review before saving` note | **Adapt** | Kept as Portion's existing sentence (`You will see a suggestion to check before anything is calculated`) in an info surface under the stage |
| Photo | Large circular shutter | **Adopt** | 72 px circular shutter (`Take photo`), above the 56 px action minimum |
| Photo | `AUTO · 1×`, `Food Scanner` chip, prototype footer | **Reject** | Fake camera chrome; the runtime is fixture-backed and says so under the stage |
| Recipe detail | Full-width 16:9 hero, time chip + dietary badge above the title, title + `Add` beside it | **Adopt** | `Add` opens `AddToMealSheet` (D-23); no sticky footer; the root bar stays |
| Recipe detail | Bookmark, share, ingredient checkboxes | **Reject** | Not in scope (PRODUCT.md non-goals) |
| Recipe detail | Nutrition surface: `CALORIES 610 kcal`, `Per serving (400 g)` badge, three macro tiles, `Show all nutrition` | **Adapt** | The existing `NutritionSummary` sits on one grouped surface with the basis kept as text beside the value (no badge, no card-in-card tiles) |
| Recipe detail | Ingredients list with `6 items`, numbered method step cards with `3 steps` | **Adapt** | Counts as plain supporting text; ingredients as a bordered list; steps numbered on a light surface each (one group per step) |
| All four | Sample food photography inside the references | **Reject** | Never copied; production photos come from the §5 register (Unsplash) |

### 10.3 Inventory — recomputed: exactly 46 rows

Count: the 41 baseline rows (IDs and Figma nodes preserved) + 5 new user-visible product states = **46**. The count changed because the brief adds two product capabilities with their own decisions and outcomes: Add-to-meal (a commit step with a meal decision) and water tracking (a quick-add outcome with Undo, and a sheet with two modes). Component microstates (invalid amounts in the sheet, preset selection, animation frames, the unassigned-meal guard) stay in component stories.

Reopened baseline rows (36): S01-1, S01-2, O01, S02-1, S02-2, S02-3, S02-4, S02-5, S02-6, S03-1, S03-2, S04-1, S04-2, S04-3, S04-4, S04-5, S04-6, P01, S07-1, S07-2, S07-3, S07-4, S07-5, S07-6, S05-1, S05-2, S05-3, S05-4, S05-5, S05-6, S08-1, S08-2, S08-3, S08-4, O02, O02-2. Preserved unchanged (5): S06-1, S06-2, S06-3, O03, O04.

New rows:

| # | Portion ID | Surface | State / purpose | Entry | Regions | Controls → outcome | Data | Fixture | Mode |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 42 | **O05** | `AddToMealSheet` over S07 (new mode) | Choose the meal and confirm the amount before one entry is created | `Add to today` on S07-1/4/5/6 with a valid portion | Item name + basis; Breakfast / Lunch / Dinner / Snacks (radio chips; preselected from the Home row that started the task, else the time-of-day suggestion); Amount with the review's unit; recalculated calories + macros; footer `Add to lunch` (+ Cancel) | Add to {meal} → one `FoodEntry` with `meal`, Home S01-2, status "Added to lunch"; Cancel / close / Escape → S07 unchanged | one entry appended | Fixture C 300 g, lunch suggested at the 12:00 baseline | both |
| 43 | **O05-2** | `AddToMealSheet` over S08-1 | The same sheet for a recipe: servings instead of grams, thumbnail when the recipe has a photo | `Add` beside the recipe title | Thumbnail, title, `Per serving (300 g)`; meal chips; Servings (1); preview per the servings; `Add to dinner` | Add → recipe entry (candidate built from the recipe, 1 serving = 300 g), Home; Cancel → S08-1 unchanged | one entry | Fixture R, dinner preselected (story fixture) | both |
| 44 | **S01-4** | Home / Water quick-add confirmation | The outcome of `+250 ml`: total and fill updated, confirmation with Undo | `Add 250 millilitres of water` on S01-1/S01-2 | Water tracker at the new total; status toast "250 ml added. 1.5 litres today." with `Undo` | Undo → previous total, toast closes; timeout/close → toast closes; repeated taps accumulate | water total for the day | 1,250 → 1,500 ml (story); runtime 0 → 250 | both |
| 45 | **O06** | `WaterSheet` · add | Add a chosen amount to today's water | `Edit water, … of 2 litres` on Home | Total / goal; presets 150 / 250 / 350 / 500 ml (radio chips); `Custom amount` (ml); `Add water` (disabled until a preset or valid custom); `Edit today's total` | Add water → total updated, sheet closes, status; Cancel → unchanged | water total | 1,250 ml, preset 250 selected in the story | both |
| 46 | **O06-2** | `WaterSheet` · edit total | Replace today's total directly | `Edit today's total` inside O06 | `Today's total` (ml) prefilled; `Save total` (disabled while invalid); `Back to adding` | Save total → total replaced; Back → O06 | water total | 1,250 ml, draft 1,000 | both |

### 10.4 Transition additions and changes

| From | Event | Guard | Next / outcome | Data | Notes |
| --- | --- | --- | --- | --- | --- |
| S01 meal row | `Add breakfast` / `Add to lunch` (per meal) | — | O01 with a **meal context** | task origin records `{ root, flow, meal }` | the meal preselects O05 later; the bar's Log food has no meal context |
| S07 new | `Add to today` | valid portion, energy known | **O05** | none until confirmed | replaces direct entry creation (D-23) |
| O05 | `Add to {meal}` | valid amount, meal chosen, not yet submitted | entry appended with `meal`, Home S01-2, toast "Added to lunch"; the new row is highlighted briefly | one entry | duplicate activation blocked |
| O05 | Cancel / close / Escape | — | S07 unchanged | none | focus returns to `Add to today` |
| S08-1 | `Add` | — | **O05-2** with servings = 1 | none | the recipe becomes a `FoodCandidate` (`source: 'recipe'`, units serving + g) only inside the sheet |
| O05-2 | `Add to {meal}` | as O05 | recipe entry appended, Home | one entry | the Home row reopens it in S07-3 with servings |
| S01 | recommended recipe card | — | S08-2 with origin Home (Home stays selected; Back → Home) | none | D-21 |
| S07-3 | Meal picker | — | draft meal; `Update entry` commits meal + portion together | entry `meal` replaced, id and day kept | new for existing entries |
| S01 | `+250 ml` | — | **S01-4** | water total += 250 | functional update, so rapid taps never drop an increment |
| S01-4 | Undo | toast open | previous total restored | water total | announced once |
| S01 | Water content (`Edit water…`) | — | **O06** | none | sibling control, not a nested button |
| O06 | Add water | preset or valid custom (1–5,000 ml) | total += amount, close, status | water total | — |
| O06 | Edit today's total | — | **O06-2** | none | mode inside the same dialog |
| O06-2 | Save total | 0–10,000 ml integer | total replaced, close, status | water total | — |
| S01 | `Set goal` / `Edit goal` (header) | — | goal editor (title `Set goal` / `Edit goal`) | goal kcal + optional macro targets | D-18 |
| S02 Food | barcode trailing action | — | S04-1 (task origin = Search) | none | one tap (D-27) |
| S02 Recipes / S03 | filter trailing action | — | O02 | draft | replaces the left `Filters` button (D-27) |
| S04-1 | (prototype camera) fixture read after 1.8 s | not already looking up | S04-2 → S07-4 | none | D-24: the runtime path; other outcomes are story phases |

### 10.5 Product and data-model decisions (new IDs continue §6)

| ID | Question | Decision | Reversibility |
| --- | --- | --- | --- |
| D-16 | Meal model | Every committed entry carries `meal: 'breakfast' \| 'lunch' \| 'dinner' \| 'snack'`. `createEntry` requires it. The stored type also admits `null` as an *unassigned* guard for a record that predates the field: no persisted store exists (session memory only, ui-contract 2.4), so no such record can occur at runtime; `MealGroup` renders an `Unassigned` section with a `Choose meal` action when one exists (component story only, never a ledger row). Home always shows all four meals, empty ones included | documented; schema is additive |
| D-17 | Meal suggestion | `suggestMeal(date)`: 05:00–10:59 breakfast, 11:00–15:59 lunch, 16:00–21:59 dinner, otherwise snack (local time). Used only to preselect O05 when the task has no meal context; the choice is always visible and editable; no eating time is asked or stored | — |
| D-18 | Goal wording and macro targets | `Set a daily goal` → `Set goal`; with a goal → `Edit goal` (header action and editor title). The editor also takes optional protein / carbohydrate / fat targets in grams; they are user-entered, never derived (PRODUCT.md non-goal: automatic goal calculation). Without a target a macro shows its logged grams alone | — |
| D-19 | Ring replaced | `CalorieBudgetBar` (feature) on the new `ProgressBar` primitive replaces `CalorieProgressRing` everywhere. `CalorieProgressRing` is removed (no consumer). `ProgressRing` stays exported as a deprecated primitive with no product consumer; its stories are kept but it leaves the curated capture set | reversible via git |
| D-20 | Budget colours | Fill = `progress.indicator` → action blue (information about progress toward a user-set bound, not calorie quality). Reached and over-goal keep the same fill; the excess is stated in words (`150 kcal over goal`) and the marker stays visible; no red/green | — |
| D-21 | Recommendation truth | Home shows one recipe: with active browse criteria and ≥ 1 match, the first match with `Matches all N filters`; otherwise the first catalogue recipe with a photo and complete calories/protein, labelled `Recommended recipe`. `Fits your goals` never appears (no goal-fit fixture criteria) | — |
| D-22 | Water | Per local day, in ml, session-only like entries. Default daily target 2,000 ml is a product default shown as the bound (`of 2 L`), not advice. Quick add 250; presets 150 / 250 / 350 / 500; custom 1–5,000 ml; edit total 0–10,000 ml; integers only. Over the target the excess is stated. Display in litres to two decimals (`1.25 / 2 L`), ml under 1 L (`250 ml / 2 L`) | — |
| D-23 | Commit through Add-to-meal | S07 new mode: `Add to today` opens O05; `Add to {meal}` is the single commit. Recipe Detail: `Add` opens O05-2. Existing mode keeps `Update entry` direct and gains a meal picker. `Done` is unchanged (task origin, D-4) | supersedes §2 row "S07 new · Add to today" |
| D-24 | Simulator controls removed | Production shows no prototype/debug controls. Barcode: `readBarcodeService` (services.ts) resolves the fixture code `5012345678900` 1,800 ms after scanning starts; the stage caption says a sample barcode is read by this prototype. Photo: `Take photo` yields the labelled sample; analysis returns fixed suggestions. Not-found, lookup-failed, unreadable, denied and analysis-failed phases are reached only through `initialPhase` in stories/tests → verification mode **story** for S04-3, S04-4, S04-5, S04-6, S05-6; runtime keeps S04-1, S04-2, S07-4, S05-1…S05-4, S07-5 | supersedes §8 modes for those rows |
| D-25 | P01 | Unchanged as a conceptual system layer; the mapped story renders the app-owned waiting state on the dark stage with the explanation that the real prompt is outside the app | — |
| D-26 | Fixed navigation | `NavigationBar` is `position: fixed` at the viewport bottom, owns the bottom safe area once, no top border, canvas surface with the restrained `shadow.navigation` token; `RootScreenLayout` measures the bar and reserves bottom padding + scroll padding; hidden as a unit for the keyboard. Recipe Detail keeps the root bar and has no second sticky footer | — |
| D-27 | Search trailing actions | `SearchField` gains an `action` slot: Food scope → `Scan barcode` icon button (opens S04-1 in one tap); Recipes scope and browse → `Filters` icon button with a count badge and the name `Filters, N active`; the left `Filters` button is removed; applied chips sit under the field | — |
| D-28 | Photography | Every catalogue recipe has a licensed local photo (traybake and pasta added, §10.6). `No photo` remains the resilient fallback for a failed or absent image; S08-4 keeps its no-photo fixture as a story state (`imageUrl` removed in the fixture), so the principal S03-1 state shows five photographs | — |
| D-29 | Recipe Detail composition | Hero 16:9 full width; time chip + dietary badges; title with `Add` (primary, one word) beside it; nutrition on one grouped surface; ingredients as a bordered list with a count; numbered steps each on a light surface; no bookmark/share/checkboxes/ratings | — |
| D-30 | Toast | New `Toast` pattern: bottom-anchored above the fixed bar (`--portion-navigation-inset`), `role="status"`, optional action (`Undo`), auto-dismiss after 6 s, sheet motion tokens, instant under reduced motion; used for water quick add and Add-to-meal success | — |
| D-31 | Home order | Header → budget bar + macros → recommended recipe → Today's meals → Water → fixed bar. The large in-body `Log food` button is removed; the bar's plus and the per-meal add actions are the entry points | — |

### 10.6 Photography (acquired 2026-09-05; register rows in §5)

Inventory before this pass: `lentil-soup`, `chicken-salad`, `tofu-stir-fry`, `sample-capture` (all Unsplash, 1200 × 900 WebP). Added: `vegetable-traybake` and `pasta-roasted-vegetables` from Pexels (free Pexels licence; the Unsplash candidates for both dishes were Unsplash+ paid items or the wrong dish, as in the baseline pass). Because no image converter is installed, the Pexels CDN delivered the 1200 × 900 centre crop as JPEG and Chromium (via Playwright) encoded it to WebP; the helper is `.verification/to-webp.mjs` (ignored, no dependency added). Every catalogue recipe now has a photo; the reference photographs were never used.

### 10.7 Implementation sequence (frozen)

1. Ledger, PRODUCT.md, DESIGN.md, skills (this checkpoint) — commit.
2. Shared tokens/components: `PortionLogo`, `AppHeader` variants, `ProgressBar` + `CalorieBudgetBar`, goal editor (`Set goal`, macro targets), meal domain + `MealGroup`/`MealSection`/`MealEntryRow`/`MealPicker`, water domain + `WaterTracker`/`WaterSheet`, `Toast`, `AddToMealSheet`, fixed `NavigationBar` + `RootScreenLayout`, Home, App wiring — commit.
3. `SearchField` action slot, Search/Recipes screens, `CameraStage`, Barcode/Photo without simulator, services — commit.
4. Recipe Detail + Add, `RecipeCard`, photography + register — commit.
5. Lane stories, index, captures/walkthrough/contrast scripts, manifest, docs, final verification — commit, push.

### 10.8 Status of reopened and new rows (2026-09-05)

Every row has production UI, a mapped deterministic story with a play function (axe at `error`), a 393 × 852 capture and a recorded verification mode. Rows verified as **story** are the prototype's unreachable phases: with the simulator controls gone (D-24) the not-found, lookup-failed, unreadable, denied and analysis-failed phases have no runtime trigger, so they join P01, S05-5, S06-2 and S08-3 as deterministic stories.

| # | ID | Row | Story (Product states / …) | Capture (393 × 852, `verification/storybook/`) | Verification |
| --- | --- | --- | --- | --- | --- |
| 1 | S01-1 | reopened | Lane A → S01-1 | `states/S01-1-175-10.png` | runtime + story · walkthrough 01-home-empty / 03-home-goal-empty |
| 2 | S01-2 | reopened | Lane A → S01-2 | `states/S01-2-175-38.png` | runtime + story · walkthrough 10-home-populated / 51-home-320/393/430 |
| 3 | S02-1 | reopened | Lane A → S02-1 | `states/S02-1-175-93.png` | runtime + story · walkthrough 06-search-food-results |
| 4 | S03-1 | reopened | Lane A → S03-1 | `states/S03-1-175-158.png` | runtime + story · walkthrough 32-recipes-browse (five photographs) |
| 5 | O01 | reopened (over the new Home) | Lane B → O01 | `states/O01-176-20.png` | runtime + story · walkthrough 04-method-sheet / 52 / 55 |
| 6 | S02-2 | reopened | Lane B → S02-2 | `states/S02-2-176-43.png` | runtime + story · walkthrough 05-search-loading |
| 7 | S02-3 | reopened | Lane B → S02-3 | `states/S02-3-176-77.png` | runtime + story · walkthrough 48-search-no-match |
| 8 | S02-4 | reopened | Lane B → S02-4 | `states/S02-4-176-118.png` | runtime + story · walkthrough 47-search-failure |
| 9 | S07-1 | reopened | Lane B → S07-1 | `states/S07-1-176-157.png` | runtime + story · walkthrough 08-review-300 / 18-review-from-home-origin |
| 10 | S07-2 | reopened | Lane B → S07-2 | `states/S07-2-176-201.png` | runtime + story · walkthrough 12-entry-invalid-stale |
| 11 | S07-3 | reopened (meal picker) | Lane B → S07-3 | `states/S07-3-176-247.png` | runtime + story · walkthrough 11-entry-edit (meal moved to Dinner) |
| 12 | S04-1 | reopened | Lane C1 → S04-1 | `states/S04-1-178-5.png` | runtime + story · walkthrough 19-barcode-scanning |
| 13 | S04-2 | reopened | Lane C1 → S04-2 | `states/S04-2-178-20.png` | runtime + story · walkthrough 20-barcode-looking-up |
| 14 | S04-3 | reopened | Lane C1 → S04-3 | `states/S04-3-178-31.png` | story (deterministic, D-24) |
| 15 | S04-4 | reopened | Lane C1 → S04-4 | `states/S04-4-178-47.png` | story (deterministic, D-24) |
| 16 | S04-5 | reopened | Lane C1 → S04-5 | `states/S04-5-178-65.png` | story (deterministic, D-24) |
| 17 | P01 | reopened | Lane C1 → P01 | `states/P01-178-81.png` | story (deterministic, D-6 / D-25) |
| 18 | S04-6 | reopened | Lane C1 → S04-6 | `states/S04-6-178-94.png` | story (deterministic, D-24) |
| 19 | S07-4 | reopened | Lane C1 → S07-4 | `states/S07-4-178-109.png` | runtime + story · walkthrough 21-review-barcode |
| 20 | S05-1 | reopened | Lane C2 → S05-1 | `states/S05-1-179-5.png` | runtime + story · walkthrough 27-photo-capture |
| 21 | S05-2 | reopened | Lane C2 → S05-2 | `states/S05-2-179-12.png` | runtime + story · walkthrough 28-photo-preview |
| 22 | S05-3 | reopened | Lane C2 → S05-3 | `states/S05-3-179-21.png` | runtime + story · walkthrough 29-photo-analysing |
| 23 | S05-4 | reopened | Lane C2 → S05-4 | `states/S05-4-179-31.png` | runtime + story · walkthrough 30-photo-suggestions |
| 24 | S05-5 | reopened | Lane C2 → S05-5 | `states/S05-5-179-57.png` | story (deterministic, D-9) |
| 25 | S05-6 | reopened | Lane C2 → S05-6 | `states/S05-6-179-70.png` | story (deterministic, D-24) |
| 26 | S07-5 | reopened | Lane C2 → S07-5 | `states/S07-5-179-81.png` | runtime + story · walkthrough 31-review-photo |
| 27 | S06-1 | preserved | Lane D → S06-1 | `states/S06-1-180-5.png` | runtime + story · walkthrough 23-manual-empty |
| 28 | S06-2 | preserved | Lane D → S06-2 | `states/S06-2-180-43.png` | story (deterministic, D-7) |
| 29 | S06-3 | preserved | Lane D → S06-3 | `states/S06-3-180-71.png` | runtime + story · walkthrough 24-manual-errors |
| 30 | O03 | preserved | Lane D → O03 | `states/O03-180-111.png` | runtime + story · walkthrough 26-manual-discard-dialog |
| 31 | O04 | preserved | Lane D → O04 | `states/O04-180-134.png` | runtime + story · walkthrough 13-unit-sheet |
| 32 | S07-6 | reopened | Lane D → S07-6 | `states/S07-6-180-162.png` | runtime + story · walkthrough 25-review-manual |
| 33 | S03-2 | reopened | Lane E → S03-2 | `states/S03-2-181-5.png` | runtime + story · walkthrough 35-recipes-filtered |
| 34 | O02 | reopened (opened from the filter action) | Lane E → O02 | `states/O02-181-72.png` | runtime + story · walkthrough 33-filters-sheet |
| 35 | O02-2 | reopened | Lane E → O02-2 | `states/O02-2-181-117.png` | runtime + story · walkthrough 34-filters-invalid-range |
| 36 | S02-5 | reopened | Lane E → S02-5 | `states/S02-5-181-133.png` | runtime + story · walkthrough 45-search-recipes-results |
| 37 | S08-2 | reopened | Lane E → S08-2 | `states/S08-2-181-289.png` | runtime + story · walkthrough 38-recipe-loading |
| 38 | S08-1 | reopened | Lane E → S08-1 | `states/S08-1-181-237.png` | runtime + story · walkthrough 39-recipe-loaded / 40-recipe-expanded |
| 39 | S08-3 | reopened | Lane E → S08-3 | `states/S08-3-181-317.png` | story (deterministic, D-5) |
| 40 | S08-4 | reopened | Lane E → S08-4 | `states/S08-4-181-350.png` | story (the catalogue recipe now has a photo, D-28) |
| 41 | S02-6 | reopened | Lane E → S02-6 | `states/S02-6-181-193.png` | runtime + story · walkthrough 37-recipes-no-match (browse) and 48 (search) |
| 42 | O05 | new | Lane B → O05 | `states/O05-add-to-meal-food.png` | runtime + story · walkthrough 09-add-to-meal-sheet |
| 43 | O05-2 | new | Lane E → O05-2 | `states/O05-2-add-to-meal-recipe.png` | runtime + story · walkthrough 41-recipe-add-sheet / 42-home-with-recipe |
| 44 | S01-4 | new | Lane A → S01-4 | `states/S01-4-water-quick-add.png` | runtime + story · walkthrough 15-home-water-quick-add (two taps, Undo) |
| 45 | O06 | new | Lane A → O06 | `states/O06-water-sheet.png` | runtime + story · walkthrough 16-water-sheet |
| 46 | O06-2 | new | Lane A → O06-2 | `states/O06-2-water-edit-total.png` | runtime + story · walkthrough 17-water-edit-total |

Component-level evidence (not rows): `PortionLogo`, `ProgressBar`, `AppHeader` variants, `CalorieBudgetBar` (no goal / partial / reached / over / partial total), `MealGroup` (empty / populated / long names / unassigned guard / picker), `WaterTracker` (zero / partial / reached / over / quick add + Undo / reduced motion / 320 / 430 / 200 % / safe area), `WaterSheet` (default / preset / custom valid / custom invalid / edit total / invalid total / cancel / keyboard / 320 / 430 / 200 % / safe area), `AddToMealSheet` (food / recipe / meal change / no meal / invalid / partial / cancel / keyboard / 320 / 200 % / safe area / reduced motion), `CameraStage` (scanning / detected / paused / circle / image / reduced motion), `Toast`, `FilterAction`, the Search barcode shortcut and Recipe Details' Add — all under Product compositions / Primitives / Components / Patterns.

### 10.9 Verification record (redesign, Stage A close-out 2026-09-05)

| Check | Command | Result |
| --- | --- | --- |
| Tokens | `npm run tokens:check` | 268 tokens validated; generated output current |
| Typecheck | `npm run typecheck` | exit 0 |
| Unit tests | `npm run test:unit` | 8 files, 59 passed |
| Storybook tests (play + axe at `error`) | `npm run test:storybook` | 77 files, 458 tests passed |
| App build | `npm run build` | success |
| Storybook build | `npm run build-storybook` | success |
| Runtime walkthrough | `node scripts/verify/runtime-walkthrough.mjs` | 62 checks passed, 0 failed, no console/page errors (goal with targets, meal row → O01 → search → review → Add-to-meal → Home under the chosen meal, entry edit and move, water quick add ×2 + Undo + sheet + edit total, task origin, barcode from the field and late-read guard, manual + discard, photo, recipes/filters/details/Add → 2 servings, recommendation with filters, search scopes and failure, remove; 320 / 393 / 430 with the fixed bar held, 320 + 200 %, 390 + 200 %, reduced motion) |
| Storybook captures | `node scripts/verify/storybook-captures.mjs` | 130 captures, 0 with problems: 64 component/foundation captures, the 46 mapped states at 393 × 852, 20 variants (320 / 430, 200 % text, safe-area fixture, reduced motion) |
| Contrast matrix | `node scripts/verify/contrast-matrix.mjs --check` | 71 pairs, 0 failing (water accent moved to cyan.700; the marker-on-indicator pair is informational and carries a 1 px canvas halo) |
| Impeccable detector | `node .claude/skills/impeccable/scripts/detect.mjs --json src` | no findings |

Rendered inspection: every one of the 46 state captures, the 20 variants, the curated component captures and the runtime subset were read at full resolution and recorded in `verification/manifest.md`. Defects found by that reading and fixed before the checkpoint: the recipe-details nutrition card crowded “Carbohydrates” against the Fat marker at 393 px (the secondary macro row now shows the short name between 20 rem and 22 rem, with the full name kept in the accessible label); the photo no-match state carried a “Suggestions ready” chip (now “No match”); the unreadable-barcode state offered Enter manually twice (the row below the message keeps only Search by name); the filter count badge sat on the glyph without separation (2 px inset and a canvas halo); the water sheet refused an out-of-range custom amount without saying why (the range message now shows while typing); the RecipeCard story used an artificial SVG placeholder although the repository ships licensed photographs (now the lentil soup photo).

Harness finding: in the production Storybook build, passive effects flush after a play function has started, so a sheet's reset-on-open effect could overwrite what the play had already typed (the two O05 stories). The three sheets (`AddToMealSheet`, `WaterSheet`, `GoalSheet`) now reset only on a closed → open transition; the state initialisers already reflect the props at mount.

Not verified here: a real screen reader or device pass, native iOS safe-area behaviour, a live software keyboard, and a real camera; these remain manual checks.

### 10.10 Next action (resumable)

Stage A (§10.7 steps 1–5) is implemented, verified (§10.9), committed and pushed at `a789d10`. Stage B followed; see §11.6 for the current next action and §11.7 for its verification record.

## 11. Stage B (2026-09-05) — populated Search, recents, food filters, list/grid, local assets, day rollover

11.1–11.5 were recorded before implementation so the checkpoint stayed resumable; 11.6–11.7 record the close-out. Stage A (§10) shipped first; Stage B reopened S02-1/S02-2/S02-3/S02-4 and added the five rows of 11.4.

### 11.1 Scope

- **Initial catalogue**: the Food tab with an empty query shows a browsable collection at once — 12 foods/dishes and 3 drinks, each with a local licensed photo, a name, calories with an explicit basis (per serving / per 100 g / per 100 ml), concise metadata and the existing review → Add-to-meal route. Existing entries are reused and enriched (fixture C, lentil soup, pasta, yoghurt, almond butter, salad leaves, sparkling water, the oat drink); no duplicates; nothing valid deleted. Drinks carry volume/serving units. Logging a drink never touches the water tracker.
- **Recently added**: derived from confirmed meal entries only (never viewed items, never seeded records), newest first, deduplicated by the candidate's stable id; adding again moves it to the top; cancelled drafts never appear. Shown above `Explore foods` (the remaining catalogue) when history exists; without history the catalogue shows immediately. History survives reload (see 11.3). Populated history is demonstrated with explicit Storybook fixtures.
- **Food filters**: All / Foods / Drinks (reliable item data only; no dietary inference from photographs) in the shared filter-sheet pattern with Apply, Clear all, applied chips; dismissing without Apply keeps the previous filters. The barcode shortcut stays inside the field; the Food filter action sits at the right of a compact toolbar under the field; Recipe filtering stays as agreed.
- **List / Grid**: an accessible toggle (List default) in that toolbar; both views share items, order, query, filters, basis and opening behaviour; the choice persists; grid = two columns, one column at narrow widths / 200 % text without shrinking type or targets.
- **Count**: an accurate unique-item count with singular/plural wording; a query or filter produces one unified collection across recents and catalogue; clearing restores the recent/catalogue presentation; switching views never resets search state; first-use, no-results, loading and failure states stay distinct.

### 11.2 Assets

- Photographs in `src/assets/images/foods/`, `src/assets/images/drinks/`, `src/assets/images/recipes/`; existing approved assets first (the rice-bowl sample, the lentil-soup, pasta and chicken-salad recipe photos double as food photos), then individually verified Unsplash/Pexels items; WebP through the Chromium encoder; registry rows in §5 (provider, creator, item URL, licence URL, local path, mapping).
- Icons: the SVGs the UI actually uses, exported faithfully from the installed Phosphor family (regular, plus bold where the UI uses bold) into `src/assets/icons/` as a generated sprite the shared `Icon` component renders through `<use>`; Phosphor's MIT licence retained; API, weights, sizes, colour and accessibility unchanged; no second family, no whole-library copy.
- App icon / favicon derived from the portion dot mark, documented in DESIGN.md without creating a second identity.

### 11.3 Data consistency

- Local-day basis: the device's local calendar day (`localDayKey`), re-evaluated at midnight while the app stays open; entries and water keep their own day keys; yesterday never reads as today, including after reload.
- Session persistence in `localStorage` with a versioned schema; a stored entry without a valid meal loads as unassigned (the D-16 guard), never reclassified; no history feature is added.
- Recalculation verified after add, edit, move (meal change) and delete; water additions must be positive, editing today's total allows zero; rapid taps and Undo neither lose increments nor overwrite later changes.

### 11.4 Inventory — recomputed: exactly 51 rows (2026-09-05, Stage B)

Count: the 46 rows of §10.3 + 5 new user-visible Search states = **51**. Reopened rows: S02-1 (results are now one unified set with a unique-item count: "1 item found"), S02-2, S02-3 (a no-match with a filter applied offers Change filters), S02-4. The catalogue, recents, filters and view are product states with their own entry conditions and outcomes, so they are rows; the List / Grid toggle's two values are one row (S02-9 is the non-default view).

| # | Portion ID | Surface | State / purpose | Entry | Regions | Controls → outcome | Data | Fixture | Mode |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 47 | **S02-7** | Search / Food · first use | The 15-item catalogue at once, list view, no history | Search root, Food scope, empty query, no confirmed entries | Field with the barcode action; Food / Recipes tabs; toolbar: List / Grid (List checked) + Food filters; "All foods · 15 items"; rows with thumbnail, name, detail, kcal per basis | Item → S07-1; Grid → S02-9; Food filters → O07; Scan barcode → S04-1 | catalogue | 12 foods, 3 drinks | runtime + story |
| 48 | **S02-8** | Search / Food · Recently added | Confirmed foods above the rest of the catalogue | As S02-7 with ≥ 1 confirmed entry (any day) | "Foods · 15 items"; "Recently added" (newest first, one row per identity); "Explore foods" (the rest) | Recent item → S07-1 (same route); a query → unified results | recents = entries; catalogue | 3 entries (banana yesterday, yoghurt this morning, oatmeal now) | runtime + story |
| 49 | **S02-9** | Search / Food · grid view | The same collection as two columns of cards | Grid in the toolbar (persisted on the device) | Cards: 4:3 photo, name, detail, kcal per basis; one column under 20 rem | Card → S07-1; List → list view; survives reload | view preference | recents + catalogue | runtime + story |
| 50 | **O07** | Food filters (overlay) | Narrow to foods or drinks from each item's record | Food filters in the toolbar | "Show" radio chips All / Foods / Drinks; Clear all; Apply filters | Apply → S02-10 (or S02-7/8 with All); Close / backdrop / Escape → previous filter kept | filter draft | All | runtime + story |
| 51 | **S02-10** | Search / Food · Drinks only applied | The applied filter as a chip and in the action's name | Apply with Drinks (or Foods) | "Food filters, 1 active" badge; chip "Drinks only" with remove; "All foods · 3 drinks"; three drink rows | Remove chip / Clear all → S02-7/8; a query combines with the filter; no match → "No drinks match …" + Change filters | filter | 3 drinks | runtime + story |

### 11.5 Decisions (continuing §10.5)

- **D-32 Catalogue and category.** `FoodCandidate.category` is `'food' | 'drink'` (absent = food) from the item's own record; the catalogue holds 12 foods or dishes and 3 drinks, each with a registered local photograph, a name, a detail line and calories with an explicit basis; positions 0–6 are frozen for stories and tests. The sample barcode and the catalogue's oat drink share one identity. Drinks carry ml and a serving in ml; logging a drink never changes the water record.
- **D-33 Recently added.** Derived from confirmed entries only (`recentCandidates`): newest first by `createdAt`, one row per candidate id, capped at 8; viewed items, cancelled drafts and seeded records never appear. Shown above "Explore foods" when history exists; a query dissolves the sections into one unified, deduplicated result set.
- **D-34 Food filters.** All / Foods / Drinks in the shared filter-sheet pattern (`FoodFiltersSheet`): a draft that Apply commits, Clear all resets to All, and dismissal keeps the previous filter. The action sits at the end of the compact toolbar under the field, named "Food filters" with the applied count; the barcode shortcut stays in the field. Recipe filtering is unchanged.
- **D-35 List / Grid.** `ViewToggle` (radio group, 48 px targets, glyph + label) in the toolbar; List is the default, the choice persists in the device record, and the grid is two columns of `FoodCard` falling to one column under 20 rem. Switching never changes items, order, query or filters.
- **D-36 Counts.** Unique items across every section; wording names what the filter shows: "15 items", "12 foods", "3 drinks", "2 items found", with singular forms. The former "N foods found" wording is superseded because the collection holds drinks too.
- **D-37 Device record.** `portion.record` (version 1) holds entries, goal, water per day and the Search view; fields are validated on load, unreadable entries are dropped rather than guessed, a missing meal loads as unassigned, and a candidate's photograph is re-resolved from the catalogue by id because built asset URLs are not durable. Entry ids include the creation instant so they stay unique across reloads.
- **D-38 Local day.** `useLocalDayKey` re-evaluates the local calendar day at midnight (timer to the next local midnight, refreshed on visibility and focus); entries and water keep their own day keys, so an earlier day never reads as today, with or without a reload.
- **D-39 Icon export.** `scripts/icons/export.mjs` exports only the glyphs the product renders, at the weights it renders them, verbatim from the installed `@phosphor-icons/react` into `src/assets/icons/` (sprite + one SVG each, MIT licence kept); `Icon` draws them through `<use>` and falls back to the React package for any other glyph, so the API, weights, sizes and accessibility are unchanged. `npm run icons:check` guards staleness.
- **D-40 App icon.** The portion dot alone on canvas white (`public/favicon.svg`, 180 / 192 / 512 PNGs, a maskable variant, `manifest.webmanifest`), generated by `src/assets/favicon/make.mjs`; no second identity.
- **D-41 Row column priority (found in the rendered review).** At 390 / 393 px the list rows broke long names inside a word (“blueberri-es”, “Scramble-d”) because the grid gave the single-line figure its full width and the name column whatever was left. `FoodResultRow` is now a flex row: the identity keeps a 7.5 rem basis (the catalogue’s longest whole words) and takes the spare width, the calorie value never breaks, and the basis is the part that gives way — wrapping only between “per serving” and its amount, which carries a no-break space (`describeCatalogueBasis`). Under 18 rem (22 rem with a thumbnail, i.e. 320 px at 100 % text and every viewport at 200 %) the figure stacks beneath the identity as before. Verified in the runtime at 320 / 390 / 393 (200 %) / 430 and by the story “Thumbnail with a long name at 390”.

### 11.6 Next action (resumable)

Stage B (11.1–11.3) is implemented, verified (11.7), committed and pushed; the inventory is the 51 rows of 11.4 and every row is captured and inspected in `verification/manifest.md`. Nothing of the agreed scope is open. If work resumes, the remaining items are outside the automated evidence and need a person and a device: a screen-reader pass (VoiceOver) over the Food toolbar, the filter sheet and the grid; the software keyboard over the Search field with the fixed bar; native safe areas; a real camera; and one overnight session to observe the midnight rollover without the mocked clock.

### 11.7 Verification record (Stage B close-out 2026-09-05)

| Check | Command | Result |
| --- | --- | --- |
| Tokens | `npm run tokens:check` | 268 tokens validated; generated output current |
| Icon export | `npm run icons:check` | 30 symbols from 24 glyphs; generated output current |
| Typecheck | `npm run typecheck` | exit 0 |
| Unit tests | `npm run test:unit` | 12 files, 80 passed (persistence, local day, recents, food search incl. the basis wording, daily log, calculation, recipes) |
| App build | `npm run build` | success |
| Runtime walkthrough | `node scripts/verify/runtime-walkthrough.mjs` | 75 checks passed, 0 failed, no console/page errors — the 62 Stage A checks plus journey 5: catalogue at first use (15 items, List checked), filter sheet → Drinks only (3 drinks, badge and chip), grid view, Orange juice 250 ml → Add to lunch (113 kcal; water stays 0 ml), Recently added above Explore foods, unified “oat” query (2 items found, recent first), reload keeping the grid and the recent drink with its photograph, an earlier day never reading as today, and the midnight rollover under Playwright's mocked clock |
| Storybook build | `npm run build-storybook` | success |
| Storybook tests (play + axe at `error`) | `npm run test:storybook` | 80 files, 488 tests passed |
| Storybook captures | `node scripts/verify/storybook-captures.mjs` | 146 captures, 0 with problems: 73 component/foundation captures (rows 65–73 new), the 51 mapped states at 393 × 852, 22 variants (320 / 430, 200 % text, safe-area fixture, reduced motion; V-S02-9-320 and V-S02-8-200 new) |
| Contrast matrix | `node scripts/verify/contrast-matrix.mjs --check` | 73 pairs, 0 failing (two ViewToggle pairs added) |
| Impeccable detector | `node .claude/skills/impeccable/scripts/detect.mjs --json src` | no findings |

Rendered inspection: the five new state captures, both new variants, the nine new component captures, the eight new runtime shots (57–64) and every Stage A capture that Stage B re-rendered were read at full resolution and recorded in `verification/manifest.md`. Runtime rows were also read at 320, 390, 393 + 200 % and 430 through an ad-hoc peek of the Food tab. Defects found by that reading and fixed before the checkpoint: long food names broke inside a word at 390 / 393 in list rows (D-41: the row is now a flex row with a 7.5 rem identity basis, a one-line calorie value and a basis that wraps only before its amount); the basis could break inside its parentheses at 430 (no-break space in `describeCatalogueBasis`); grid cards in one row had unequal heights (the list item is a flex container); the basis line of a per-serving dish read “per 1 serving” (now “per serving (320 g)”); the capture harnesses skipped lazily loaded thumbnails (they now scroll the page and wait, bounded, for the visible screen's images — the unbounded wait hung the runtime walkthrough on hidden mounted screens); the unified-results capture showed the browse state because the interactive story cleared its query (a static QueryResults story is captured instead).

Harness finding: Storybook's Lane B stories count list items, so an applied-filter chip (itself a list) was being counted with the results; the assertions are scoped to the named results list and check the drink identities, not just a count.

Not verified here: a real screen reader or device pass, native iOS safe-area behaviour, a live software keyboard, a real camera, and an unmocked midnight; these remain manual checks (11.6).

## 12. Revision R1–R6 (2026-09-05) — dates and streak, discovery, hero containment, two-step manual, source-specific review, method sheet

Branch `feat/redesign-r1-r6` from `main` at `30d54d9` (the integrated Stage A + B baseline; `feat/hifi-screens` `6732e5b` is merged and no longer ahead). Baseline recovered from git, the audited deployment notes in the brief and the current source; Stage A/B work is the starting point, not regenerated. Impeccable context loader run once for this session with `--target src/app/App.tsx` (PRODUCT.md and DESIGN.md loaded; no CONTEXT_STALE directive acted on).

### 12.1 Reference mapping (attachment order defines R1–R6; confirmed by visible content)

| Ref | Content seen | Adopt / adapt / reject |
| --- | --- | --- |
| R1 | Home: week strip (Mon 31 … Sun 6, Sat 5 selected with a dot), "1,600 kcal remaining", "Daily Target 2,000 kcal", "400 consumed (20%)", "Goal: 2,000", horizontal bar, three macro tiles with "24g / 120g" and a compact bar each | Adopt the strip, the remaining figure, the consumed line and the per-macro bars. Adapt: one goal figure (the duplicated "Daily Target" / "Goal" is rejected), Portion tokens and type, real data. |
| R2 | Recipes: "Recipes · 10 available", search field, quick chips All / Vegetarian / Vegan / Gluten-free, "Popular recipes · FEATURED · Swipe for more" photo cards, "All recipes · 10 recipes" list | Adopt the photographic discovery hierarchy, quick chips (as multi-select) and groups. Adapt: truthful group labels from real data ("Featured", "Ready in under 30 minutes", "30 g protein or more"), the full catalogue moves to Search / Recipes, counts derive from real unique items. Reject "Popular" without analytics, status bar, decorative badges. |
| R3 | Daily Log · Step 1 of 2: name with clear, photo attached (Change / Remove), Reference amount 100 grams, Nutrition for that amount (Energy required, core macronutrients optional), calculated macro energy split, Continue to review | Adopt the grouping and step label. Adapt: Portion fields, "blank means unknown" beside optional fields only, optional local photo. Reject the macro energy split bar (an inferred percentage), status bar. |
| R4 | Manual food record: photo + name + "Entered manually" + basis, Edit; Amount to calculate with − 100 g + and presets 50 g / 100 g / 150 g / 1 bowl (250 g); Energy value 130 kcal "For 100 g portion" with macro tiles and % kcal; info note; Show all nutrition; Add to today | Adopt identity summary with Edit, prominent editable amount with stepper and presets, live result, one final action. Adapt: presets from the item's own units only (no universal bowl), MealPicker and target day added, "Add to {meal}". Reject "% kcal" on macros (unsupported inference), the kebab menu. |
| R5 | Verified item (barcode): product image, name, brand, basis, Change product; "Matched 7394376616037 · Verified packaging specs"; amount with unit control and presets; 43 kcal "For 100 ml" with macros; Show all nutrition; Add to today; Done | Adopt identity → portion → nutrition → final action. Adapt: "Barcode match" not "Verified", real record fields only, Change product + Edit label values, and the same hierarchy for the photo result with its own wording and actions. Reject VERIFIED, Live sync, Done as an ambiguous exit. |
| R6 | Log food sheet: title, review-before-saving line, Close; full-width Search food row (PRIMARY badge); "INSTANT RECOGNITION" caption with Scan barcode / Take a photo cards; separator; Enter manually row | Adopt the order, grouping and hierarchy 1:1. Adapt: no PRIMARY badge, quieter caption wording, Portion tokens and icons, stack the pair under 20 rem. Reject the drawn home indicator and outer frame. |

### 12.2 Requirement map

| ID | Requirement | Screen / component | Data / domain | Story | Test / check | Doc |
| --- | --- | --- | --- | --- | --- | --- |
| A1 | Home order, streak in header, sole goal action on the calorie surface | `HomeScreen`, `AppHeader` root, `StreakIndicator`, `CalorieBudgetBar` | `streak.ts` | Lane A S01-1/S01-2/S01-5/S01-6 | walkthrough, unit | PRODUCT §Home, DESIGN §Home |
| A2 | Per-macro compact bars beside the values; no-target / below / at / over / unknown | `NutritionMacros` (existing), `CalorieBudgetBar` | `summarizeDay` | CalorieBudgetBar stories | storybook | DESIGN §Calorie budget |
| A3 | Date strip: today vs selected, prev/next week, Today action, future unavailable | `DayStrip` | `day-keys.ts` (`addDays`, `weekOf`, `formatDayLabel`) | Lane A S01-5 | unit, walkthrough | PRODUCT §Home |
| A4 | Selected day drives entries, totals, water; target day bound at task start; commit returns to that day | `App` (`selectedDay`, `taskOrigin.dayKey`) | `createEntry({dayKey})`, `water[dayKey]` | Lane A | walkthrough (midnight with mocked clock), unit | ui-contract §3 |
| A5 | Streak rule (confirmed food/recipe entries, consecutive local days ending today or yesterday) | `StreakIndicator` | `computeStreak` | Lane A S01-6 | unit (gaps, backfill, removal) | PRODUCT §Home |
| A6 | Record v2: goal history with effective dates, migration keeps entries/water/legacy goal (from the migration day) | `persistence.ts` | `goal-history.ts` (`goalForDay`, `setGoalFrom`) | — | unit (v1 → v2, invalid storage) | PRODUCT §Data truth |
| A7 | Water per selected day, Undo scoped to day | `HomeScreen`, `WaterSheet` | `water[dayKey]` | Lane A | walkthrough | — |
| B1 | Recipes root = curated discovery (groups, multi-select chips, featured label) | `RecipesScreen`, `RecipeTile`, `DietaryChips` | `discovery.ts` (groups from real data), `RecipeCriteria.dietary[]` | Lane E S03-1/S03-2 | unit, storybook | PRODUCT §Recipe discovery |
| B2 | Full catalogue + count + criteria in Search / Recipes; empty query shows the catalogue | `SearchScreen` | `filterRecipes` over the catalogue | Lane E S02-5/S02-11 | walkthrough | ui-contract |
| B3 | Multi-select dietary AND, vegan ⇒ vegetarian, unknown never matches, sheet draft/apply/reset/dismiss | `RecipeFiltersSheet`, `CriteriaToolbar` | `matching.ts` | O02 | unit | PRODUCT |
| B4 | 10 recipe records with licensed local photos | recipe fixtures, `src/assets/images/recipes/` | — | — | captures | §5 register |
| B5 | Barcode as a sibling action beside the Food field, below it at narrow widths | `SearchScreen` | — | Lane B S02-7 + 320 variant | storybook | DESIGN §Search field actions |
| C1 | Hero begins below the header; full bleed within the shell only | `RecipeDetailsScreen.module.css`, `RootScreenLayout` | — | Lane E S08-1 + variants | walkthrough geometry check | DESIGN §Recipe details |
| D1 | Manual Step 1 of 2 (R3) with optional local photo | `ManualEntryScreen`, `PhotoField` | `manual-entry.ts`, `photo-store.ts` | Lane D S06-1…S06-3 | storybook, unit | PRODUCT §Manual |
| D2 | Manual Step 2 of 2 (R4): identity + Edit, editable amount with stepper/presets, live result, MealPicker, Add to {meal} | `ManualPortionScreen`, shared `PortionForm` | `portion-presets.ts` | Lane D S06-5 | storybook, walkthrough | PRODUCT §Manual |
| D3 | Flow-level draft preserved across Back/Edit; shared exit + dirty policy (Discard changes? dialog) | `App` (`manualTask`), `DiscardChangesDialog` | `isManualTaskDirty` | Lane D O08 | storybook, walkthrough | ui-contract §exit policy |
| D4 | Browser Back / gesture uses the same guard; refresh limitation documented | `App` (`useHistoryGuard`) | — | — | walkthrough | PRODUCT §Data truth |
| E1 | Barcode review per R5 (image, name, brand when supplied, code, basis, Change product, Edit label values) | `FoodReviewScreen` | `FoodCandidate.barcode`, override provenance | Lane C1 S07-4 + correction | storybook | PRODUCT §Food calculation |
| E2 | Photo review (sample image labelled, Change match, Retake, Edit nutrition values) | `FoodReviewScreen` | — | Lane C2 S07-5 | storybook | PRODUCT |
| E3 | Review commits with one Add to {meal}; no second sheet; Cancel + dirty policy | `FoodReviewScreen`, `PortionForm` | `createEntry` | Lane B S07-1 | walkthrough | ui-contract |
| F1 | MethodSheet per R6 with responsive stacking | `MethodSheet`, `MethodOption` (row / card) | — | O01 + 320 / 200 % variants | storybook, walkthrough | DESIGN §Log food sheet |
| G1 | "Fixture C" never shown as product metadata | fixtures detail | — | — | storybook | — |

### 12.3 Impeccable use (recorded before each invocation)

- Session context: `node .claude/skills/impeccable/scripts/context.mjs --target src/app/App.tsx` → loaded PRODUCT.md / DESIGN.md; Operate mode confirmed; nothing stale acted on.
- Planned gates (recorded when invoked, with result): detector (`detect.mjs --json src`) after each stage's edits as the technical-integrity gate; `critique` reference once the redesigned families (Home, Recipes, Manual 1/2, Review, MethodSheet) render, to check composition against R1–R6; `adapt` reference only if the 320 / 200 % review finds reflow defects.

### 12.4 Checkpoint

- Branch `feat/redesign-r1-r6`, HEAD `30d54d9` (nothing committed yet for this revision). Working tree: this ledger section only.
- Next action: implement A6/A3/A5 domain modules with unit tests (`day-keys.ts`, `streak.ts`, `goal-history.ts`, persistence v2), then Home (A1–A4, A7).
