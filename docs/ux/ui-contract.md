# Portion — UI Contract

**Updated:** 2026-09-02. **Status:** Behavior specification aligned with current navigation; implementation unverified.

This document defines component and pattern behavior. Visual decisions belong in [visual-direction.md](../design/visual-direction.md); current screen IDs and transitions belong in [low-fidelity.md](./low-fidelity.md). [Task flows](./task-flows.md) provide task intent, not authority for superseded screen IDs.

The supplied [Branding / Stylescape](https://www.figma.com/design/heuO3V1WlKG44CukQswCkw/jito-calories-calculator?node-id=92-1209) sections 07–09 are visual references. Older two-tab, S06–S09 recipe routing and mandatory-save examples are superseded by the rules below. Neither the live repository nor the prototype was tested during this documentation update.

## 1. Demonstration fixtures

These are synthetic UI-test data, not database records, photo-derived values or nutritional advice.

| Fixture C amount | Energy | Protein | Carbohydrates | Fat |
| --- | --- | --- | --- | --- |
| 100 g | 180 kcal | 6 g | 21 g | 8 g |
| 250 g | 450 kcal | 15 g | 52.5 g | 20 g |
| 300 g | 540 kcal | 18 g | 63 g | 24 g |

Fixture C scales from its per-100-g basis: `reference value × amount / 100`.

**Fixture R:** Lentil soup; 1 serving = 300 g; 450 kcal, 24 g protein, 48 g carbohydrates, 18 g fat, 25 minutes; dietary type not specified. Expanded specimen only: fibre 8 g, calcium 120 mg, iron 3 mg, vitamin C 12 mg; vitamin D unavailable. For this fixture, carbohydrate total includes fibre; do not add fibre again.

C and R are separate: C at 300 g is 540 kcal, whereas R at 300 g is 450 kcal. Do not derive one from the other, from an image or by recomputing declared energy from displayed macros.

Retain precision internally. Display whole kcal and up to one decimal for macro grams, without unnecessary trailing zeros. Define units/precision for individual micronutrients so a known small value does not become a misleading zero.

## 2. Data, completion and session state

- Amount and reference quantity must be valid and positive. Nutrient values may legitimately be zero. Keep invalid input for correction; an old result must not appear current for a new invalid amount.
- A missing value is `Not available`, never zero or inferred from another field. Optional missing card metadata may be omitted; required detail rows identify missing data explicitly.
- Offer only supported conversions. Never assume equivalence between grams, milliliters, pieces or servings. Preserve each source's documented reference and carbohydrate/fibre basis.
- Photo output is a suggestion requiring identity/portion review; wrong barcode matches must also be correctable. No working AI or verified-recognition claim is permitted for fixtures.
- Recipe criteria combine with AND. Known values must meet every active criterion; unknown dietary/nutrient data cannot establish a match. No active criteria means no match claim.
- A blank threshold means no constraint. The current low-fidelity specification allows a calorie range per serving, a protein minimum, a preparation-time maximum and dietary preference. The stylescape example uses only a calorie maximum; it does not remove the optional lower bound from the interaction contract. Validate the supplied bounds; these are user constraints, not nutrition recommendations.

### Completion, not a separate Save step

Food identification creates a **candidate**, not a committed calculation. Review confirmation commits the valid candidate once and opens Calculate. Existing valid portion edits recalculate locally without a Save button or fake loading state.

Keep the previous calculation until confirmation. Explain replacement before confirming; do not accumulate items, add a second confirmation dialog or create diary/history records. Finding and evaluating a suitable recipe completes the recipe task without a Save or Cook requirement.

Preserve calculation, search context and applied criteria during the active app session and internal navigation. Reload persistence, account sync and durable storage are not promised by this specification. Do not introduce a save-failure journey for an undefined storage operation.

`SaveFeedback` and saved-result copy in older specimens are not required product features. Reuse the general success-message treatment only when a defined outcome needs confirmation; do not add a redundant toast when the updated result already makes completion clear.

## 3. Component contracts

| Group | Required components | Variants, states and behavior |
| --- | --- | --- |
| Actions | Button, IconButton | Primary/secondary/text; default, pressed, focus-visible, disabled, loading; hover only for pointer input. Prevent duplicate activation. IconButton target at least 48 × 48 CSS px. |
| Inputs | TextField, AmountField, SearchField | Empty, filled, focused, invalid, disabled; visible label, helper/error and relevant clear action. Retain other input on error. |
| Unit selection | UnitControl | Supported-unit list, marked selection and explicit confirmation/cancellation; no unsupported conversion. |
| Selection | DietaryControl, FilterChip, AppliedCriterionChip | Selectable versus removable are separate behaviors. Prevent contradictory dietary selections. Selected chips use boundary, fill and check, plus accessible state. |
| Static data | NutrientBadge, NutritionSummary, NutrientRow, MatchCriteria | Known/partial/unavailable; compact/expanded; never styled as tappable. Values always retain units and basis. |
| Lists | MethodRow, FoodResultRow | Default, pressed, focus; long identity and incomplete data; one clear selection action. |
| Recipes | RecipeCard | Photo/no photo, long title, active criteria/no criteria; one predictable route to details. |
| Overlays | ModalSheet | Methods, filters, units; short/scrollable; visible close; background blocked; focus managed. |
| Feedback | InlineMessage, EmptyState, LoadingState | Operational error, explanation, no results, progress and defined success; cause-specific recovery. |
| Navigation | AppHeader, BackAction, NavigationBar | Three selected-destination variants plus a separate Add food action; return preserves context. |

### Shared control rules

- A placeholder is not the only label. Invalid fields use explanatory text and a visible state, not color alone.
- Loading may replace visible button content, but retains an accessible name/status, stable dimensions and protection against repeated activation. Do not show loading on static data or synchronous arithmetic.
- Focus ring: 3 px outside the control with a 2 px canvas gap. Ensure both the control and ancestor containers leave it visible.
- Icon-only controls have an accessible name; hide decorative glyphs from assistive technology. Phosphor regular is default; bold is reserved for persistent selected navigation, not hover/press/focus.
- Use real navigation semantics: current-page state for navigation links, selected state only where an actual tab pattern is implemented. Add food is a button, never a selected destination.

### Recipe and nutrition presentation

- Recipe cards use 4:3 images; details use 16:9. An absent/failed image retains valid content and is not a failed recipe record.
- Titles wrap. No active criteria: omit suitability claims. Active criteria: use a compact list summary such as `Matches all 3 filters`; details show each criterion against its known value.
- Energy and relevant macros are immediately visible. Use one consistent disclosure for additional nutrition on calculator results and recipe details, not an expanded nutrient table on every card.
- Vitamins and minerals use group markers with neutral named rows. No health score, daily-value percentages, nutrient-goal charts or inferred dietary guarantees.

## 4. Navigation and state ownership

Exactly one bottom row: **Calculate | Search | Recipes | + Add food**.

| Surface | Selected destination | Bar behavior |
| --- | --- | --- |
| Calculate, S01 | Calculate | Present; initial launch is the empty calculation workspace |
| Search Food or Recipes scope, S02 | Search | Present; scope selector belongs near the search field |
| Recipe discovery, S03 | Recipes | Present; useful browsing without a query |
| Recipe details, S08 | Actual origin: Search or Recipes | Same bar; Back restores the originating list |
| Add-method/filter/unit sheet | Underlying selection retained | Overlay covers and blocks the underlying bar |
| Barcode, photo, manual, review: S04–S07 | No root-tab selection shown | Focused step; no bottom bar; explicit back/close |

- Plus is the distinct trailing action inside the bar, not a floating button or fourth tab; retain the 56 × 56 target from the low-fidelity contract.
- Plus opens the same method sheet from every root and recipe details. Dismissal restores the exact invoking screen. Cancel after choosing a method returns to the invoking surface unless a meaningful dirty draft needs confirmation.
- First Search entry uses Food scope with no query; later visits restore scope/query. Scope changes retain the query. Recipe criteria remain stored with Recipes scope and never constrain Food results.
- Browse-to-Search opens Recipes scope with a snapshot of relevant criteria. Later Search edits do not silently mutate browse state.
- New queries reset result scroll; Back from details restores it. Tab switches preserve each destination's state without duplicating history entries.
- Keyboard-focused roots hide the entire bar and restore it after dismissal. Do not move only the plus. Keep the active field and relevant action reachable above the keyboard, with scrolling as needed.

## 5. Shared interaction patterns

### 5.1 Choose an entry method — O01

Plus opens four labelled choices: Search food, Scan barcode, Take a photo, Enter manually. Selecting a method starts that journey; **it does not commit food data**. Close, backdrop or supported Escape/swipe dismissal changes no calculation. A visible close control is always available; never require a gesture alone.

### 5.2 Search and review — S02 → S07

Keep query and scope visible. Food selection opens review; Back restores the preceding results/input. Distinguish no matches from request failure. Recipe scope uses the same search architecture and opens recipe details, not food review. Do not fabricate recent searches or favourites for a fresh session.

### 5.3 Manual entry, amount and units — S06, S07, S01, O04

Manual entry establishes name, calories and a positive reference quantity/unit; macros are optional. Review establishes the desired portion. These quantities must be separately identifiable.

Unit choice is a modal draft: mark the selection, Confirm applies it, Cancel preserves the prior unit. Calculate locally only when conversion and quantity are valid. After a current result exists, valid edits update it in place without a separate submit step. Dirty manual cancellation offers Keep editing/Discard; untouched forms exit directly.

### 5.4 Filters — O02 from S02 Recipes or S03

Draft edits do not change the list. Apply validates and commits. Reset all clears the draft and takes effect only on Apply. Close/cancel discards unapplied edits. Applied-criterion chips remove a committed criterion immediately; cancelling a later draft does not undo that removal.

Blank bounds are unrestricted. Where both minimum and maximum are offered, minimum must not exceed maximum. Keep query and applied criteria available during empty/error recovery. Do not silently relax hard filters or assert a match with unknown values.

### 5.5 Recipe details — results → S08

| From | Event | To |
| --- | --- | --- |
| S02-5 Search results, S03-1 Browse or S03-2 Filtered results | Open card | S08-2 Loading, retaining origin |
| S08-2 Loading | Success | S08-1 Loaded |
| S08-2 Loading | Request failure | S08-3 Unavailable |
| S08-3 Unavailable | Retry | S08-2 for the same recipe |
| S08-1, S08-2 or S08-3 | Back | Exact originating list with query, criteria and scroll |

S02-6 No matches cannot open details: edit query/criteria and obtain results first. S08-4 No photo/long title is a Loaded-state variant, not a step after Retry. Back during loading ignores later responses for the closed detail. A failed image alone does not trigger S08-3.

### 5.6 Recover according to the cause

| Cause | Appropriate recovery |
| --- | --- |
| Food no matches | Change query or enter manually; no generic network Retry |
| Recipe no matches | Change query or adjust/remove criteria |
| Search/browse service failure | Retry while preserving input; food also offers manual entry |
| Barcode unreadable | Continue/rescan or switch method; no lookup has succeeded yet |
| Barcode product missing | Search/manual; optionally rescan |
| Barcode lookup failed | Retry lookup with the read code or switch method |
| Camera denied/unavailable | Search/manual; platform settings only where appropriate; no prompt loop |
| Photo no usable match | Retake/search/manual; no invented nutrition |
| Photo analysis failed | Retain image; retry analysis, retake or exit |
| Invalid input | Keep values, identify the affected field and prevent invalid submission |

Pause capture after reading a barcode to avoid repeated lookup. Photo capture has preview/retake before analysis and a reviewable suggestion afterward. Cancelled analysis and obsolete query responses cannot navigate or overwrite newer state. Operational failure never appears as zero nutrition or a no-results state.

## 6. Modal, accessibility and responsive requirements

- One foreground modal only; background inert and noninteractive. Initial focus goes inside; keyboard navigation stays inside; dismissal restores focus to the opener where it still exists.
- Method sheets preserve origin; filter/unit sheets discard unapplied drafts on cancellation. A dismissal gesture must respect the same dirty-entry rule as an explicit close.
- Sheets have 12 px top corners, the documented shadow and a 40% scrim. Support scrolling; anchored header/footer must not cover fields, content or focus indicators.
- Controls are keyboard operable with visible focus. Communicate loading, validation and changed results accessibly without excessively announcing every keystroke.
- Minimum product touch targets are 48 × 48 CSS px, independent of glyph size. The low-fidelity plus is 56 × 56. Platform units must be checked in the actual target implementation.
- Verify 320/390/430 px layouts, real English titles, safe areas and text resizing to 200%. Font specimens are not proof of runtime reflow. [WCAG resize text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html).
- Reduced motion removes translation/counting effects without removing progress or state information. Verify screen-reader names, focus order and modal return in implementation.

The 24 color-pair ratios printed in **section 09** were recalculated and matched. This validates the listed foreground/background pairs, not all live uses or overall conformance. The 1.23:1 decorative border remains decorative; essential boundaries use the control-border role. Full visual values and contrast references are in `visual-direction.md`.

## 7. Implementation handoff

Status recorded on 2026-09-03 against branch `feat/design-system`; evidence and commands are in `docs/design-system/README.md` §6.

- [ ] Reconcile this contract with the current low-fidelity document; remove superseded two-tab, recipe-ID and mandatory-save rules elsewhere. (Documentation task; still open.)
- [x] Use the same token-backed components in Storybook and product screens; do not duplicate implementations. — `src/main.tsx` and `.storybook/preview.ts` import the same `global.css`; product screens are composed from `src/design-system/` and rendered as Product compositions stories.
- [x] Cover default/selected/disabled/loading/error, long content, no photo, partial data, keyboard and modal states in representative stories/tests. — 53 story files / 184 tests, axe at `error`.
- [x] Exercise both user stories and all four entry methods, including wrong matches, no matches, failures, cancellation and replacement. — `scripts/verify/runtime-walkthrough.mjs`, 24 checks with screenshots.
- [x] Verify recipe origin, selected tab, Retry/Back and query/filter/scroll restoration. — walkthrough checks and Product compositions/Recipe details stories.
- [x] Confirm fixture-only boundaries and report unimplemented behavior explicitly. — camera, recognition, product lookup and recipe loading are simulated by `src/app/services.ts` and labelled as prototype controls in the UI; the query word `offline` simulates a search failure.

Decision recorded during implementation (§4 amount and units): when the user switches between two units the food's data supports, the current valid amount is re-expressed in the new unit so the portion — and the result — stay the same (300 g → 1 serving when 1 serving = 300 g; 100 g → 0.333 serving). An invalid draft only changes the unit and stays stale. No conversion is ever invented between g, ml, piece or serving.

Still not implied by this update: a GitHub merge, deployment, Figma synchronisation of the final screens, or any accessibility certification.
