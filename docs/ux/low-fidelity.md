# Portion — Low-Fidelity Specification

**Status:** Finalized for Design System and high-fidelity implementation.  

**Reviewed:** 2026-09-02. **Product language:** English.  

**Suggested repository location:** `docs/ux/low-fidelity.md`.

## 1. Purpose and evidence

Define the core screen structure, transitions, state ownership and recovery rules before detailed UI design. This is a design contract, not an implementation report.

- [Figma source](https://www.figma.com/design/heuO3V1WlKG44CukQswCkw/jito-calories-calculator?node-id=0-1): `Low-fidelity — Complete Core Journeys`.

- Reviewed export: `59985e47-01dd-4181-95ac-8d7b47abf02e.pdf`, one-page board.

- Scope grounding: `Product Scope(4).pdf`, `UX Requirements(9).pdf`, the supplied task flows and the latest agreed navigation decisions.

- **Observed** means visible in the PDF. **Required** means intended behavior, not a verified interaction. The board's “clickable prototype” claims have not been independently tested.

The reviewed export is the pre-correction baseline. This document now defines the corrected recipe transitions in section 5; these rules supersede the earlier recipe arrows. The Figma changes have not been re-inspected. Other findings remain open until verified.

## 2. Product boundaries

| User goal | Completion condition |
| --- | --- |
| Calculate calories for a food or dish | Identify the item, review/correct it, set a valid portion and see corresponding calories and available nutrition. |
| Find a suitable recipe | Browse or search, optionally narrow results, inspect suitability and read recipe details. No forced save or cook action. |

In scope: four entry methods, review, portion editing, recipe discovery/search, supported criteria, details and recoverable states.

Out of scope: diary/history, daily goals, accounts/onboarding, saved collections, meal planning, recipe authoring, multi-ingredient building, social features, payments, coaching, wearables and production recognition/database services. Calculate is the task workspace, not a diary or a separate Home dashboard. Prior meal-time/save steps are not mandatory.

## 3. Navigation contract

Exactly one bottom bar contains **Calculate | Search | Recipes | +**, in that order.

| Control | Role | Required behavior |
| --- | --- | --- |
| Calculate | Destination; initial launch | Open the empty workspace or restore the current calculation. |
| Search | Destination | One search surface with Food/Recipes scope; first entry has no query and Food selected. |
| Recipes | Destination | Query-free discovery with optional criteria; search entry opens Search in Recipes scope. |
| + | Trailing action, not a destination | Open O01 over the actual current surface. Never acquire a selected-tab state. |

- One destination remains selected. Search stays selected when its scope is Recipes.

- Keep the same bar on recipe details; select the originating destination. No floating or duplicate plus.

- Camera, manual entry and food review are focused steps without this bar.

- Sheets cover and block the bar. Close/backdrop/swipe cancellation restores the actual origin, including recipe details; dirty input uses the discard rule.

- Tab switches preserve each destination's context. Re-selecting the current tab does not create another stack entry.

- During root search input, hide the whole bar behind the keyboard and restore it afterward; never relocate only the plus.

## 4. Observed screen inventory

IDs below come from the export. A listed frame proves a layout exists, not that its actions work.

| Family | Exported states | Review |
| --- | --- | --- |
| Calculate | S01-1 empty; S01-2 result; S01-3 narrow-width check | Correct three-tab-plus structure. Local invalid edit and expanded nutrition need explicit witnesses. |
| Shared Search | S02-1 Food results; S02-2 loading; S02-3 no matches; S02-4 failure; S02-5 Recipes results; S02-6 Recipes no matches | Main states drawn. No-query/keyboard states and recipe request-failure mapping are missing. |
| Recipes | S03-1 browse; S03-2 filtered results | Discovery covered; loading, no matches and failure need origin-specific examples or explicit reuse mapping. |
| Add food | O01 method sheet | Four-method overlay drawn; actual origin restoration remains unverified. |
| Barcode | S04-1 scanning; S04-2 lookup; S04-3 unreadable; S04-4 not found; S04-5 service failure; S04-6 denied; P01 permission | Causes are distinguished; branch connections need correction. |
| Photo | S05-1 capture; S05-2 preview; S05-3 analysis; S05-4 suggestions; S05-5 no match; S05-6 failure | Core acquisition states drawn; permission/unavailable-camera reuse must be mapped. |
| Manual entry | S06-1 empty; S06-2 filled/keyboard; S06-3 field error; O03 discard; O04 units | Reference entry and recovery layouts drawn. Keyboard/inset behavior is not verified. |
| Food review | S07-1 search; S07-2 invalid portion; S07-3 replacement; S07-4 barcode; S07-5 photo; S07-6 manual | Shared review is present; correction destinations and confirmation routes need explicit connections. |
| Filters | O02 applied values; O02-2 invalid range | Sheet and validation crop drawn; edited/reset drafts and keyboard/scroll need witnesses. |
| Recipe details | S08-1 loaded; S08-2 loading; S08-3 unavailable; S08-4 no-photo/long-title crop | S08-4 is a loaded-state variant, not a step after Retry. Correct transitions are specified below; both origins and Figma links await verification. |

## 5. Required journeys

These sequences correct the intended logic; they are not assertions that the existing prototype implements it. Permission steps are skipped when access is already available.

1. **Search:** O01 Search food, or Search tab → query/loading → S02-1 result selection → S07-1 review → valid confirmation → S01-2. No matches and request failure are alternative outcomes, not consecutive steps.

2. **Barcode:** O01 Scan barcode → P01 if needed → S04-1 scanning → S04-2 lookup → S07-4 review → confirmation → S01-2. Unreadable code branches from scanning; missing product/service failure branch from lookup; denial branches from permission.

3. **Photo:** O01 Take a photo → permission if needed → S05-1 capture → S05-2 preview → S05-3 analysis → S05-4 suggestions → explicit selection → S07-5 review → confirmation → S01-2. Retake returns to capture; no match and service failure branch from analysis.

4. **Manual:** O01 or a recovery action → S06-1/S06-2 reference-data entry → validation → S07-6 desired-portion review → confirmation → S01-2. Invalid fields stay in the form; they do not require discarding it.

5. **Recipe discovery:** Select a card from S03-1, or optionally edit O02 and Apply to obtain S03-2 filtered results. A selected card opens S08-2, which resolves to S08-1 on success or S08-3 on failure. No matching recipes is a separate list outcome: adjust criteria and request results again before any card can be selected. Back from details restores the actual browse state.

6. **Recipe search:** Enter a query and optional criteria in Search, Recipes scope. A successful request yields S02-5 results or S02-6 no matches; a request failure is a separate recovery state. Only a card in S02-5 can open S08-2, then S08-1 on success or S08-3 on failure. Back restores Search with its query, criteria and list position.

Each recovery action must connect to its actual destination. A generic arrow between neighboring frames does not represent a valid transition.

### Recipe transition contract

| From | Trigger / outcome | To |
| --- | --- | --- |
| S02-5 Search results | Open recipe | S08-2 Loading; origin = Search |
| S03-1 Browse or S03-2 Filtered results | Open recipe | S08-2 Loading; origin = Recipes |
| S08-2 Loading | Loaded | S08-1 Loaded, including its S08-4 variant where applicable |
| S08-2 Loading | Request failed | S08-3 Unavailable |
| S08-3 Unavailable | Retry | S08-2 Loading for the same recipe |
| S08-1, S08-2 or S08-3 | Back | Exact originating result list, preserving query, criteria and scroll |
| S02-6 No matches | Edit query / adjust criteria | Search input or filter draft, then a new request; results, no matches or request failure |
| Recipe browse with no matches | Adjust criteria | Filter draft, then Apply and a new list request |

- **S08-4 is a variant of Loaded:** missing photo and/or a long title do not make the recipe unavailable. Place the example beside S08-1 with the caption `Loaded-state variant`, not an action arrow. Apply the same Back and navigation rules.
- **Origin controls tab selection:** keep Search selected for recipes opened from Search; keep Recipes selected for those opened from browse. Do not switch tabs merely because the content is a recipe.
- **Back during loading:** return immediately to the origin and ignore any later response for the closed detail. Back never opens another loading screen.
- **Board arrangement:** Results → Loading → Loaded; Unavailable below Loading, with failure and Retry branches. Keep No matches on the search/browse branch, outside the detail-opening path.
- Do not connect No matches directly to details, Loaded to Loading with `Back`, or Unavailable to the no-photo variant with `Retry`.

## 6. State and data rules

### Context and cancellation

- Keep current calculation separate from the unconfirmed candidate. Confirmation commits once and opens Calculate; cancellation leaves the previous result unchanged.

- Explain replacement before confirmation (S07-3); do not silently accumulate foods or add a second confirmation dialog.

- Review Back returns to the actual preceding search, photo, barcode or manual step with useful input retained. Identity correction must lead to an explicit change/search/manual route.

- Cancelling a method opened from O01 returns to O01's invoking surface. Cancelling manual entry opened from an error returns to that error context.

- Ask Keep editing/Discard only for meaningful unsaved entry. An untouched form exits immediately. Discard removes the draft, not the existing calculation.

- Preserve search query when changing scope, but keep recipe criteria scope-specific. A new query resets result scroll; returning from details restores it.

- Moving from recipe browse into Search copies applicable criteria. Subsequent search edits must not silently mutate the separate browse state.

### Portions and nutrition

- Manual entry requires identity, calories and a positive reference amount/unit. Optional macros left blank remain unknown.

- Reference basis and desired portion are different values. Calculate only from a supported conversion: `portion nutrition = reference nutrition × desired quantity / reference quantity` after compatible-unit conversion.

- Quantity/reference amount must be positive; known nutrient values may be zero. Reject negative, malformed and unsupported values without erasing other fields.

- Never assume grams equal milliliters, pieces or servings without conversion data. Offer only supported units in O04; retain source precision until display rounding.

- Valid local portion edits update the matching result without a fake network delay. Invalid edits must not display an old result as if it belongs to the new amount.

- Show calories with the portion basis, then available protein/carbohydrate/fat. Additional nutrients, including fiber where supplied, use secondary disclosure. Missing data is not zero.

- Photo output is a suggestion, not proof of identity, weight or ingredients. Require review and a user-confirmed portion; allow correction of barcode matches too.

### Criteria and details

- Supported criteria: dietary preference, calorie/protein bounds and preparation constraints. Avoid invented universal health scores or personalized recommendations.

- Sheet changes remain drafts until Apply. Cancel discards draft edits; Reset clears the draft and still requires Apply. Removed applied chips update results immediately and are not undone by cancelling a later sheet.

- Blank numeric bounds mean unrestricted. Minimum cannot exceed maximum; invalid drafts cannot apply.

- Match evidence explains active criteria only. Unknown data cannot be asserted to meet a hard nutrient filter; do not silently relax criteria. Dietary preference is not an allergy guarantee.

- Details group identity, serving basis, available nutrition, ingredients and preparation. Long content scrolls clear of navigation. A failed image does not remove otherwise valid details.

## 7. Error and recovery contract

| Condition | Response and recovery | Retain |
| --- | --- | --- |
| Food/recipe no matches | Edit query; adjust recipe criteria; food may use manual entry. No generic network Retry. | Query and applicable criteria |
| Search/browse request failure | Retry the request; food also offers manual entry. | Query, scope and criteria |
| Unreadable barcode | Continue/rescan or use another method; no lookup retry before a code exists. | Relevant acquisition context |
| Read code, product missing | Search/manual; optional rescan. | Read code where useful |
| Barcode service failure | Retry lookup or switch method. | Read code |
| Camera denied/unavailable | Search/manual; settings only when appropriate. No permission loop. | Invoking context |
| Photo no usable match | Retake/search/manual; never invent nutrition. | Photo while useful |
| Photo service failure | Retry analysis, retake or leave. | Captured image |
| Invalid form/portion/filter | Identify the affected field and correction; prevent invalid submission. | Other entered values |
| Recipe detail failure (S08-3) | Retry → S08-2 for the same recipe; Back → originating list. | Recipe identity, origin, query, criteria and scroll |

Keep one foreground modal. Loading has a distinct progress indicator and an escape where needed. Ignore obsolete responses after query changes/cancellation, pause duplicate barcode reads and prevent duplicate commits. These are required behaviors, not PDF-verified functionality.

## 8. Validation status

The previously identified connector, branching, navigation-origin, and state-coverage issues have been corrected in the current Figma low-fidelity flow.

The current Figma flow and this specification are aligned for Design System and high-fidelity implementation.

The following UX structure has been resolved:

- Search loading branches correctly into results, no matches, or request failure.
- Barcode permission denial routes to the appropriate recovery path; successful lookup routes to Food Review.
- Recipe Details follows Results → Loading → Loaded / Unavailable, with Retry → Loading.
- Back from Recipe Details restores the actual originating Search or Recipes state.
- The no-photo / long-title recipe example is treated as a Loaded-state variant, not a separate recovery state.
- Review confirmation routes to the current Calculate result.
- Search, recipe discovery, filters, calculation, photo acquisition, and recovery states required by the current specification are represented or explicitly mapped.
- Navigation consistently follows Calculate | Search | Recipes | + Add food, with the trailing plus treated as an action rather than a destination.

Remaining validation belongs to implementation rather than low-fidelity structure:

- responsive behavior at implementation widths;
- software-keyboard and viewport behavior;
- keyboard interaction;
- focus management and focus restoration;
- accessibility semantics and screen-reader behavior;
- runtime state preservation;
- asynchronous stale-response and duplicate-action handling;
- browser/device behavior;
- text resizing and long-content behavior.

## 9. Fidelity and verification limits

- The reviewed export uses grayscale shapes, omitted-text bars, essential vectors and external captions. These bars are not loading skeletons.

- Keep this board structural: no final copy, icon library, photography or branded component system. Add final English labels in the next fidelity stage.

- Text-free layouts cannot validate comprehension, actual text wrapping, accessible names or numeric readability. The long-title crop reserves space; it does not prove real text fits.

- The board contains a 320 px example and manual keyboard example. Their presence does not prove every screen reflows, scrolls or avoids keyboard overlap.

- PDF review cannot verify native editability, component usage, actual hit areas, overlays, links, focus, gestures, state persistence or scrolling.

- Recognition, search and nutrition outcomes are fixtures, not working services. Runtime permissions, stale responses and duplicate-action protection need separate verification.

- Nielsen heuristics inform the rules above; this is not proof of compliance with all ten heuristics or accessibility standards. Task comprehension and accessibility require later testing with meaningful content.

## 10. Exit criteria and handoff

The low-fidelity structure and current specification are ready to hand off into Design System and high-fidelity implementation.

Completed at the low-fidelity level:

- [x] Core navigation and all six required journeys are structurally defined.
- [x] Search, barcode, photo, manual-entry, review, filtering, and recipe-detail branching are aligned with the current interaction contract.
- [x] Recipe Details preserves its actual Search or Recipes origin.
- [x] No matches, request failure, loading, unavailable, and loaded variants are treated as distinct states.
- [x] Add food remains a shared trailing action rather than a fourth destination.
- [x] Required recovery paths and cancellation behavior are represented or explicitly mapped.
- [x] The current Figma low-fidelity flow and this specification are aligned for the next design phase.

Implementation validation remains intentionally open:

- [ ] Verify responsive behavior at 320 / 390 / 430 CSS px.
- [ ] Verify software-keyboard and safe-area behavior.
- [ ] Verify keyboard navigation, focus containment, and focus restoration.
- [ ] Verify accessible names, semantics, contrast, and screen-reader behavior.
- [ ] Verify runtime state preservation and scroll restoration.
- [ ] Verify stale-response handling and duplicate-action protection.
- [ ] Verify 200% text resizing and long-content behavior.

**Handoff:** Design System and high-fidelity implementation may proceed using this document, `ui-contract.md`, and `visual-direction.md` as the current implementation baseline.
