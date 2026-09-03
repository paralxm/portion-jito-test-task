# Portion design system — repository guide

Portion is an **iOS-oriented web prototype** built with React 19, Vite 8, TypeScript 7 and Storybook 10.5. This guide records how the design system is implemented in this repository, where each capability lives, what has been verified and what remains. It does not claim production readiness, full accessibility conformance or completed usability validation.

Authority: `docs/ux/ui-contract.md` and `docs/ux/low-fidelity.md` own behaviour; `docs/design/visual-direction.md` owns visual rationale; `src/design-system/tokens/tokens.json` owns token values; source and stories own the component API and its states.

## 1. Architecture and placement map

| Layer | Path | What lives there | Storybook |
| --- | --- | --- | --- |
| Token source | `src/design-system/tokens/tokens.json` | DTCG 2025.10 `reference` and `semantic` families (217 tokens) | Foundations/Tokens |
| Token generator | `scripts/tokens/build.mjs` | Validation, alias resolution, deterministic `tokens.css` + `tokens.ts` | — |
| Generated tokens | `src/design-system/tokens/generated/` | `--portion-ref-*` and `--portion-*` custom properties; typed `tokens`, `tokenVars`, `cssVar` | Foundations |
| Global styles | `src/design-system/styles/` | Inter registration, generated tokens, reset, focus ring, `[hidden]`, reduced motion, safe areas, type classes | Foundations/Typography |
| Icons | `src/design-system/icons/` | `Icon` wrapper; Storybook-only `catalogue.ts` (134 verified Phosphor glyphs) | Foundations/Icons |
| Nutrition rules | `src/design-system/nutrition/` | Categories, ordering, formatting (`formatQuantity`), "Not available" wording | — (unit tests) |
| Primitives | `src/design-system/primitives/` | Text, Stack/Inline, Surface, Separator, Spinner, Button, IconButton, Input, Checkbox/Radio, Badge, VisuallyHidden | Primitives/* |
| Components | `src/design-system/components/` | FormField, TextField, AmountField, UnitControl, SearchField, chips, SegmentedControl, NutritionValue, NutrientRow, MatchCriteria, MediaFrame, ResultsHeading, InlineMessage, EmptyState, LoadingState, MethodRow, FoodResultRow | Components/* |
| Patterns | `src/design-system/patterns/` | NavigationBar, AppHeader, ModalSheet, ConfirmDialog, MethodSheet, UnitSheet, NutritionSummary, RecipeCard (composes MediaFrame) | Patterns/* |
| Templates | `src/design-system/templates/` | RootScreenLayout, FocusedFlowLayout | Templates/* |
| Public entry | `src/design-system/index.ts` | Supported exports only (no fixtures, catalogue or stories) | — |
| Calculator feature | `src/features/calorie-calculator/` | `domain/` (calculation, manual entry, fixtures, tests), `components/` (`FoodIdentityHeader`, shared by Home's current-calculation module and Food review), `screens/` (Home, Food review, Manual entry, Barcode, Photo) | Product compositions |
| Recipe feature | `src/features/recipe-discovery/` | `domain/` (matching, fixtures, tests), `components/` (filters sheet, criteria toolbar, list), `screens/` (Recipes, Recipe details, composes MediaFrame + ResultsHeading) | Product compositions |
| App shell | `src/app/` | `App.tsx` navigation, shared `SearchScreen` (composes `SegmentedControl` for the Food/Recipes scope switch), simulated `services.ts`, keyboard and scroll hooks | Product compositions/App |
| Storybook helpers | `src/design-system/storybook/` | Enlarged-text and text-spacing decorators, contrast helpers (not exported) | — |
| Verification | `scripts/verify/runtime-walkthrough.mjs` | Playwright walkthrough of both journeys with screenshots to `.verification/runtime/` (ignored) | — |

The app (`src/main.tsx`) and Storybook (`.storybook/preview.ts`) import the same `global.css`; there is one active preview file.

## 2. Token pipeline

- `npm run tokens:build` reads `tokens.json`, checks every `$type` (inherited for alias-only tokens), resolves aliases recursively (dangling references, cycles and incompatible types fail the build), validates units, colour alpha and composite members, and writes `src/design-system/tokens/generated/tokens.css` and `tokens.ts`. Both files carry a generated-file banner.
- `npm run tokens:check` regenerates in memory and fails when the committed output differs. Run it before committing token changes.
- Conversions: colours to lowercase hex or `rgb(r g b / a)`; dimensions keep their unit except font sizes, which are emitted in rem (root 16 px); line heights stay unitless ratios; durations in ms; easing as `cubic-bezier()`; shadows as CSS shadow lists; typography composites as five custom properties each (`-font-family`, `-font-size`, `-font-weight`, `-line-height`, `-letter-spacing`).
- Semantic aliases are emitted as `var()` references to their reference token, so a reference change flows through. Product and component styles use semantic roles; reference steps appear only in token definitions, the layout primitives (`Stack`/`Inline` gaps map to `reference.space`) and foundation specimens.
- `html { font-size: 100% }` keeps the user's browser text preference; everything in rem scales from it. All values in code, stories and this guide are CSS px.
- **em exception (wordmark tracking):** DTCG 2025.10's `dimension` type accepts only `px` or `rem` as `$value.unit` — `em` is not a valid dimension unit, and a `dimension` token declared with `unit: "em"` fails schema validation (the red squiggly VS Code shows against `tokens.json`'s `$schema`). The approved wordmark tracking is `-0.03em`, a font-size-relative value that `px`/`rem` cannot express. `reference.font.letter-spacing.wordmark` is therefore declared as a schema-valid `number` token (`$value: -0.03`, no unit), and the generator recognises it as the one `letterSpacing` composite member allowed to resolve to `number` instead of `dimension`; it is the only case where `fmtScalar`/`fmtTypographyMember` append `em` to a number. Every other `letter-spacing` token (`normal`, and every style's resolved `letterSpacing` member) stays a `dimension` and renders `0px`.

## 3. Foundations at a glance

**Spacing** — exactly 0/4/8/12/16/24/32 px (`reference.space`, 7 steps), per the accepted contract, finalized 2026-09-07 (§13). Semantic roles: page-inset, section, related, card-padding, card-gap, form-group, heading-to-description, section-title-to-content, title-to-secondary, label-to-control, control-to-helper, paragraph, instruction-item, icon-to-label, nav-icon-to-label. `full = 9999px` is a radius token, not a spacing step, and touch-target (`reference.size.target.*`) and icon (`reference.size.icon.*`) dimensions are separate token families, never expressed as spacing. `Stack`/`Inline`'s `gap` prop's type, `SpaceStep`, is this same seven-value union — an invalid gap is a compile error, not just a documented convention. A handful of components (`Chip`, `ModalSheet`, `FoodResultRow`, `MethodRow`, `AppHeader`) have their own fixed pixel dimension in this numeric neighbourhood (40 or 56); these are plain literals in the component's own CSS, not `reference.space` tokens, and were migrated off the former `36`–`64` steps when those steps were removed (§13).

**Selection controls** — five distinct controls cover "the user picks something," each for a different shape of choice; do not substitute one for another:

| Control | Selection shape | Exposed as | Production use |
| --- | --- | --- | --- |
| `SegmentedControl` | Exactly 2–4 peer modes of one task; picking one immediately changes visible content | `radiogroup` / `radio`, roving tabindex, arrow keys | Search's Food \| Recipes scope switch |
| `FilterChip` (`selectionRole="radio"`) | A longer or wrapping mutually-exclusive set | `radiogroup` / `radio` | Recipe filters' dietary preference (5 options, wraps) |
| `FilterChip` (`selectionRole="toggle"`) | An independent on/off filter, others unaffected | `aria-pressed` | (capability exists; no current multi-toggle-filter screen) |
| `Radio` / `Checkbox` | A single labelled option inside an ordinary form, not a compact control row | native `radio`/`checkbox` | `UnitSheet`'s unit list |
| `NavigationBar` | The app's three fixed root destinations, never a caller-supplied set | `aria-current="page"` | Home / Search / Recipes |
| `UnitControl` → `UnitSheet` | A choice that opens a separate modal draft rather than switching content immediately | `aria-haspopup="dialog"` | Amount field's unit selector |

`SegmentedControl` and the radio-mode `FilterChip` look similar (both are "pick one of several") but answer different questions: `SegmentedControl` is for a small, fixed, always-visible set of task-level modes where the surrounding content itself is what changes; `FilterChip` is for a longer or more open-ended set of values being narrowed, filtered or wrapped, where selection is one input among several rather than the entire visible context.

**Radius** — catalogue 0/4/8/12/16/20/24/28/32/36/40/44/48/52/56/60/64 + `full`; semantic `structure`, `control`, `card`, `sheet`, `round` (actual circles only).

**Typography** — Inter Variable (wght + opsz) registered by `@fontsource-variable/inter/opsz.css`; `reference.font.family.ui` = `['Inter Variable', 'Inter', 'system-ui', 'sans-serif']`, so the token names the registered `@font-face` family.

| Style | Size / line height | Weight | Use |
| --- | --- | --- | --- |
| main-result | 40 / 48 | 600 | The single calorie result |
| screen-heading | 28 / 36 | 600 | Root screen titles |
| detail-heading | 24 / 32 | 600 | Food or recipe title on a detail screen |
| section-title | 20 / 28 | 600 | Section and sheet titles |
| compact-title | 18 / 24 | 600 | Focused bar titles, card and empty-state titles |
| action | 16 / 24 | 600 | Button labels, unit selector |
| body | 16 / 24 | 400 | Paragraphs, inputs, list items |
| label | 14 / 20 | 500 | Field labels, chips, category labels |
| supporting | 14 / 20 | 400 | Helper, error, basis, secondary lines |
| compact-action | 14 / 20 | 600 | Compact standalone actions |
| caption | 12 / 16 | 500 | Navigation labels |
| caption-strong | 12 / 16 | 600 | Selected navigation labels, count badge |
| item-title, method-title, metric-inline | → action | | Row titles and inline values |
| metric-secondary | → detail-heading | | Secondary macro values |
| wordmark | 24 / 32, −0.03em | 600 | The lowercase wordmark only |

`font-variant-numeric: tabular-nums` is applied only through `Text numeric` / `.portion-numeric` on values that update or align. No all-caps, negative tracking (except the wordmark) or ellipsis on essential text.

**Icons** — `@phosphor-icons/react`, regular by default, bold only for the persistently selected navigation destination; there is no `medium` weight. The approved primitive icon-size catalogue is 16/20/24/28/32/40/48/56/64 px (`reference.size.icon`), preserved in full regardless of which sizes a semantic role currently aliases — the same "catalogue survives even where a step has no current consumer" rule already applied to radius and spacing. Six of the nine are aliased to `Icon`'s semantic roles (16→compact, 20→small-action, 24→default, 32→emphasis, 48→empty-state, 64→large-illustrative); 28 and 40 remain supported, unaliased reference sizes, and 56/64 are rare/exceptional sizes. A 24 px glyph sits inside a 48 × 48 target, 56 × 56 for Add food. Foundations/Icons → "Size catalogue (reference)" renders all nine.

**Colour** — semantic background, text, action, border, feedback, nutrition-category, state and overlay roles. Contrast for the pairs the product actually uses is recomputed in the browser in Foundations/Colors (all required pairs meet 4.5:1 text or 3:1 non-text; the decorative border is 1.23:1 and never a control's only boundary).

**Motion** — press/selection/validation use the feedback duration, disclosure/async-result the disclosure duration, sheet/navigation the overlay duration, one standard easing. `prefers-reduced-motion` and `[data-portion-motion="reduced"]` collapse every transition token to 0 ms.

## 4. Coverage register

Status labels: **Documented** (rule exists in a contract only), **Observed in current code** (implemented in this repository and exercised by the listed verification), **Proposed** (a decision made here that the owning contract now records), **Platform mapping** (behaviour that maps to a native iOS concept and can only be partly verified on the web), **Unverified** (implemented but not proven by an executed check), **Out of scope**.

| # | Requirement | Status | Decision | Owner | Component(s) | Story / test | Verification | Remaining action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Typography scale, Inter registration, rem sizing, numeric figures | Observed in current code | 12 base styles + 5 aliases; token family = registered face | `visual-direction.md` §4, `tokens.json` | `Text`, `typography.css` | Foundations/Typography (Catalogue, Stress ×7, Font loading); Primitives/Text | Storybook tests measure size/line-height/weight/family; walkthrough checks `document.fonts` | — |
| 2 | Layout primitives and spacing scale | Observed in current code | Gaps map 1:1 to `reference.space`; no margins between siblings | `tokens.json` | `Stack`, `Inline`, `Surface`, `Separator` | Primitives/Layout, Surface, Separator; Foundations/Spacing | Computed gap per step asserted | — |
| 3 | Buttons and icon buttons (variants, loading, disabled, 48/56 targets) | Observed in current code | `loading` only for async; label wraps, never truncates | `ui-contract.md` §3 | `Button`, `IconButton` | Primitives/Button, IconButton | Click, busy, disabled and target-size assertions | — |
| 4 | Icons: official Phosphor set, weights, sizes, catalogue ≥ 80 | Observed in current code | Catalogue is Storybook-only, 134 names verified against the installed package | `visual-direction.md` §5 | `Icon`, `catalogue.ts` | Foundations/Icons | Catalogue count and render assertions | — |
| 5 | Text and search fields (label, helper, error, clear, Enter) | Observed in current code | Persistent label; error replaces helper via `aria-describedby` + polite region | `ui-contract.md` §3 | `Input`, `FormField`, `TextField`, `SearchField` | Components/FormField and TextField, SearchField; Primitives/Input | Accessible description, clear target, submit assertions | — |
| 6 | Numeric entry and supported units (decimal keyboard, one separator, unit selector, unit sheet) | Observed in current code | Draft string parsed by the feature; switching units re-expresses a valid amount in the new unit (300 g → 1 serving) | `ui-contract.md` §4 (recorded), `calculation.ts` | `AmountField`, `UnitControl`, `UnitSheet` | Components/AmountField, UnitControl; Patterns/UnitSheet; Product/Home (Unit change) | Unit tests for `convertQuantity`; walkthrough check "switching g → serving keeps the portion" | — |
| 7 | Choice controls, chips, badges and mode selection | Observed in current code | Toggle chips use `aria-pressed`, scope/dietary chips are radios in a radiogroup; `SegmentedControl` adds a purpose-built peer-mode switch (also radiogroup semantics) distinct from filter chips — see §3's Selection controls table | `ui-contract.md` §3 | `Checkbox`, `Radio`, `FilterChip`, `AppliedCriterionChip`, `Badge`, `SegmentedControl` | Primitives/Choice, Badge; Components/Chip, SegmentedControl | State, keyboard and target assertions | — |
| 8 | Nutrition presentation (main result, macros, expanded list, unknown vs zero, precision) | Observed in current code | Unknown = "Not available"; known zero shown as 0; small mg values keep precision; fibre nested under carbohydrates | `ui-contract.md` §1, §4 | `NutritionValue`, `NutrientRow`, `NutritionSummary`, `nutrition.ts` | Components/NutritionValue, NutrientRow; Patterns/NutritionSummary | Unit tests (`nutrition.test.ts`, `calculation.test.ts`), story assertions, fixtures C/R in walkthrough | — |
| 9 | Recipe presentation (card 4:3, details 16:9, no photo, long titles, match evidence) | Observed in current code | Title is the single control with a stretched hit area; no match claim without active criteria | `ui-contract.md` §5 | `RecipeCard`, `MatchCriteria`, `RecipeList` | Patterns/RecipeCard; Components/MatchCriteria | Story assertions incl. 320 px long title | Real photography and licences remain out of scope |
| 10 | Feedback and status (inline messages, empty/no-match/failure, loading, spinner, reduced motion) | Observed in current code | Cause-specific copy and actions; failure uses `alert`, others `status`; no skeletons | `ui-contract.md` §5.6 | `InlineMessage`, `EmptyState`, `LoadingState`, `Spinner` | Components/InlineMessage, EmptyState, LoadingState; Primitives/Spinner | Role and reduced-motion assertions | — |
| 11 | Navigation bar and headers (3 + 1 row, current-page semantics, enlargement fallback, keyboard hiding) | Observed in current code — Hi-Fi (§15) | 2 × 2 fallback measured from natural label widths; software keyboard detected from `visualViewport` shrink + text focus; Home/Search/Recipes + Add food, non-colour selected state (2 px indicator + bold icon + label weight + `aria-current`) | `low-fidelity.md`, `ui-contract.md` §2 | `NavigationBar`, `AppHeader`, `useSoftwareKeyboard` | Patterns/NavigationBar (Home/Search/Recipes selected, Recipe Details origin ×2, interaction, Add food, Selection, Hidden, keyboard focus-visible, selected+focus-visible, 320/390/393/430, 320 + 200 %, 430 + 150 %), AppHeader | Story assertions (incl. real-Chromium focus-visible/tab-order/target-size checks); walkthrough "nav falls back to 2 × 2 at 320 + 200 %" | Keyboard hiding and safe-area behaviour are **Platform mapping / Unverified** on a real device (see §5); no browser-automation tool was available this session for a manual visual pass (see §15) |
| 12 | Overlays (bottom sheet, confirm dialog, method sheet; focus containment, Escape, backdrop, restore) | Observed in current code | Native `<dialog>`; Escape handled directly because browsers skip `cancel` without user activation; scrolling text-only body is focusable | `ui-contract.md` §3, §5 | `ModalSheet`, `ConfirmDialog`, `MethodSheet` | Patterns/ModalSheet, ConfirmDialog, MethodSheet | Focus, Tab containment, Escape, restore-focus assertions; a11y at error | — |
| 13 | Screen templates (root with bar, focused flow with sticky header/footer, safe areas) | Observed in current code | Footer stays in flow; measured header/footer heights become document scroll padding | `low-fidelity.md` | `RootScreenLayout`, `FocusedFlowLayout` | Templates/* (incl. short viewport) | Story assertions | Safe-area insets are **Platform mapping** (0 in desktop Chromium) |
| 14 | Calculation journey screens (S01 empty/result/stale, S07 review per source, S06 manual entry with dirty check) | Observed in current code | Review confirms once and replaces; invalid draft = stale result; manual macros optional | `ui-contract.md` §4, `low-fidelity.md` | `HomeScreen`, `FoodReviewScreen`, `ManualEntryScreen`, `manual-entry.ts` | Product compositions/Home, Food review, Manual entry | Unit tests; story play functions; walkthrough checks 3–14 | — |
| 15 | Acquisition screens (S04 barcode states, S05 photo capture/preview/analysis/suggestions) | Observed in current code | Camera and recognition are simulated and labelled as prototype controls; late responses ignored after Back/rescan/cancel | `ui-contract.md` §5.6 | `BarcodeScreen`, `PhotoScreen`, `services.ts` | Product compositions/Barcode, Photo | Story play functions (incl. cancel during analysis); walkthrough screenshots 12–27 | Real camera/recognition **Out of scope** |
| 16 | Recipe journey screens (S03 browse/filtered/no match/failure, O02 filters draft, S08 loading/loaded/unavailable/no photo) | Observed in current code | AND criteria, unknown never matches, Apply/Reset/Cancel semantics, chip removal commits | `ui-contract.md` §5 | `RecipesScreen`, `RecipeFiltersSheet`, `CriteriaToolbar`, `RecipeDetailsScreen`, `matching.ts` | Product compositions/Recipes, Recipe filters, Recipe details | Unit tests (`matching.test.ts`); story play functions; walkthrough checks 15–20 | — |
| 17 | Shared Search and app shell (scopes, query retention, criteria snapshot, origin tab, scroll memory, replacement) | Observed in current code | Roots stay mounted; focused steps stack and stay mounted for Back; `offline` in a query simulates failure; the Food/Recipes scope switch composes the shared `SegmentedControl` (§11), no screen-local selection UI | `low-fidelity.md`, `ui-contract.md` §2 | `SearchScreen`, `App.tsx`, `useScrollMemory`, `SegmentedControl` | Product compositions/Search, App (runtime); Components/SegmentedControl | Walkthrough checks 21–23 and scroll restore; App story | Reload persistence and account sync **Out of scope** |
| 18 | Accessibility, motion and platform foundations (focus ring, targets, reduced motion, contrast, iOS ledger) | Observed in current code / Platform mapping | Product baseline 48 px (stricter than WCAG 2.2 AA 24 px); all values CSS px; iOS column is a mapping | `visual-direction.md`, `ui-contract.md` §6 | `global.css`, tokens | Foundations/Borders, focus and layers; Colors; Motion; Accessibility and platform | axe at `error` on every story; focus-ring and contrast assertions | Manual screen-reader pass and real-device checks not performed (see §5) |

## 5. iOS platform ledger

| Concern | This prototype (CSS px) | iOS counterpart | Status |
| --- | --- | --- | --- |
| Root text size | 16 px (`html { font-size: 100% }`), rem tokens | Dynamic Type | Platform mapping — sizes are not converted to points |
| Minimum target | 48 × 48 | HIG 44 × 44 pt | Product baseline is stricter |
| Add food target | 56 × 56 | Custom | Action in the row, never a tab |
| Bottom bar | 3 destinations + 1 action, measured 2 × 2 fallback | `UITabBar` has no trailing action | A native build would need a custom bar |
| Modal sheet / dialog | Native `<dialog>`, focus contained | `UISheetPresentationController` / alerts | Detents not promised |
| Safe areas | `env(safe-area-inset-*)` added to bar and footers; `viewport-fit=cover` | `safeAreaInsets` | Unverified on a notched device |
| Software keyboard | `visualViewport` shrink + text focus hides the bar | Keyboard frame notifications | Unverified on a real device; desktop focus alone never hides it |
| Focus ring | 3 px ring, 2 px gap, outside the control | Full Keyboard Access | Verified in Chromium |
| Reduced motion | `prefers-reduced-motion` → 0 ms | `isReduceMotionEnabled` | Verified through the data attribute path |
| Typeface | Inter Variable | SF Pro | Inter is the approved brand face |

## 6. Verification status (last executed 2026-09-08, after §15's rebase onto current `main`)

| Check | Command | Result |
| --- | --- | --- |
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | exit 0 |
| Token validity and drift | `node scripts/tokens/build.mjs --check` | 213 tokens validated; generated output current |
| Unit tests (node) | `npx vitest run --project=unit` | 4 files, 38 tests passed |
| Storybook tests (headless Chromium, axe at `error`) | `npx vitest run --project=storybook` | 59 files, 257 tests passed |
| App build | `npm run build` | success (Inter opsz woff2 + CSS + JS bundles) |
| Storybook build | `npm run build-storybook` | success (`storybook-static/`, ignored) |
| Runtime walkthrough | `npm run build && npx vite preview --port 4173` then `node scripts/verify/runtime-walkthrough.mjs` | Not re-run this pass (unchanged since its last recorded execution) — 24/24 checks passed, 0 console/page errors, screenshots in `.verification/runtime/` |

Rendered inspection performed by reading the walkthrough screenshots (Calculate empty/result/stale/servings/expanded, method sheet, search results, review from search/barcode/photo/manual, manual errors, filters sheet, filtered browse, recipe details expanded, search failure, 320/393/430 widths, 320 px + 200 % and 390 px + 200 %); re-read after §10's refactor for Calculate result, Food review, Recipes filtered, Recipe details and Search results (no pixel changed); after §11, screenshotting Components/SegmentedControl, Foundations/Icons → Size catalogue and Search's Interactive story directly from `storybook-static`; and after §12, re-reading the manual-entry discard dialog and unit-sheet screenshots specifically to confirm Cancel/Confirm now render as a real equal-width side-by-side pair. The unit-change and 2 × 2 fallback defects found by the original inspection were fixed and re-verified; §10–§12 list what each pass found and fixed.

Not verified: manual screen-reader pass (NVDA/VoiceOver), real-device software keyboard and safe-area behaviour, deployed app/Storybook URLs, and synchronisation of the final screens into the Figma Design file (no code-to-canvas capture tool was exposed in this session). Passing axe on every story is not a WCAG conformance claim.

## 7. Skills and tools used

- `frontend-design` (installed skill) was loaded at the start of the implementation for craft guidance on typography, copy and restraint; where its defaults conflicted with the accepted contracts (Inter, the blue action colour, the fixed spacing scale) the contracts won.
- Playwright (already installed for the Storybook Vitest project) drives the runtime walkthrough; no new dependency was added.
- A code review pass (`feature-dev:code-reviewer` agent) was run at the end of the slice; its findings and outcomes are listed in §9.
- Figma MCP tools were not used in this slice; the Figma capture step remains open (see §8).

## 8. Resumable status

Done across this branch's history: tokens and generator, global styles, primitives, components, patterns, templates, both feature domains with fixtures and tests, all runtime screens, the app shell with simulated services, Storybook consolidation and 59 story files, the runtime walkthrough script, a pre-Hi-Fi audit pass (§10), a named-capability completion pass adding `SegmentedControl` and restoring the icon-size catalogue (§11) and this guide.

`feat/design-system` has already been merged into `main` twice (PR #1, PR #2 in the repository history) before this pass began; §11's work was committed on top of that same branch name, which has therefore diverged from `main` again and needs its own new pull request if it is to be merged.

Open:
1. Add the verified final screens to the existing Figma Design file for review and handoff (requires a capture or native-edit capability in the session; not attempted here).
2. Publish the app and Storybook, record real URLs in `README.md`, and check them in incognito.
3. Manual assistive-technology and real-device passes listed in §6.
4. Open a pull request for the commits added in §11 (not part of this pass — the branch was pushed, not merged).

## 9. Code review findings

A `feature-dev:code-reviewer` agent read the full branch diff against `main` (source, generator, walkthrough script, Storybook and Vitest configuration, tests) on 2026-09-03. It had no shell access, so it did not execute the commands in §6 itself; those results come from the runs recorded above.

- No high-confidence defects were found in nutrition scaling and fixtures, confirm-once/replace and stale-draft handling, AND criteria and filter-draft semantics, request-id guards against late responses, modal focus and dismissal routes, the navigation bar, TypeScript soundness or the token generator.
- Observation 1 (latent): `FocusedFlowLayout` wrote the document scroll padding from every mounted instance, including hidden earlier steps; correctness depended on observer ordering. Fixed: only a visible layout writes the padding.
- Observation 2 (latent): the generator's typography emission assumed every composite member is an alias; a literal member would have been emitted through the generic fallback. Fixed: literal members are formatted by their declared member type.

Both fixes were re-verified with the typecheck, the token drift check and the Storybook test run before the final push.

## 10. Pre-Hi-Fi design-system audit (2026-09-04)

A full audit of the design system as implemented in the repository — not of the earlier completion report — before any Hi-Fi visual work begins. Scope: foundations, token integrity and generated output, dependency architecture, primitives/components/patterns/templates, public exports, Storybook coverage and discoverability, component APIs and state ownership, accessibility and keyboard behaviour, 320–430 px layouts, 200 % text, long content, reduced motion, build/test integrity, and whether the system can compose both journeys without missing foundational controls. Two independent read-only passes (architecture/duplication; Storybook/accessibility/responsive) fed the fixes below; every command in §6 was re-run afterward, and the runtime walkthrough was re-inspected against screenshots to confirm the refactor changed no rendered pixel.

### Verified clean (no defect found)

- **Import boundaries** — nothing under `src/design-system/` imports `features/` or `app/`; `storybook/` helpers and the icon catalogue are imported only by `.stories.tsx` files.
- **Business logic placement** — every design-system component receives typed data and callbacks; nutrition scaling, unit conversion and criteria evaluation live only in `features/*/domain/`.
- **State ownership** — the one internal draft (`UnitSheet`'s pending unit) resets from its `value` prop on open and is a standard cancel-restores-previous pattern; no component owns state a parent can't observe when it affects a confirm/submit outcome.
- **Modal/dialog mechanics, read from source** — `ModalSheet` and `ConfirmDialog` use native `<dialog>` + `showModal()` (real focus containment, not custom JS); Escape, backdrop click (`ModalSheet` only) and the close control all route through the same callback; `ConfirmDialog` deliberately has no backdrop-dismiss route, and a new story now proves a click inside it never closes it, rather than that being assumed. Focus-return-to-opener on close is native `<dialog>` behaviour; a new `ConfirmDialog` story with an actual opener button now proves it, rather than inferring it from `ModalSheet`'s existing test.
- **No raw clickable non-button elements** anywhere in `src/design-system`.
- **Reduced motion** — every semantic motion token was already zeroed by both override blocks except `--portion-motion-duration-instant` (harmless — already 0 ms, unused by any rule; added for completeness). `ModalSheet`'s rise animation uses the token-backed duration, so it correctly collapses.
- **Token generator soundness, dependency architecture and TypeScript strictness** — no `any`/`@ts-ignore` in `src/`, no cross-boundary imports, alias/cycle/type-conflict detection all correct on inspection.

### Defects found and fixed

| Finding | Fix |
| --- | --- |
| `reference.size.icon.28/40/56` were declared, aliased by no semantic role, shown in no Foundations story and consumed by no component — dead catalogue entries (220 → 217 tokens) | Removed from `tokens.json`; regenerated |
| `CalculateScreen.module.css` and `FoodReviewScreen.module.css` were byte-identical files; both screens hand-rolled the same name/detail/basis/"Change food" block | Extracted `FoodIdentityHeader` (feature-local — it takes the calculator's `FoodCandidate` type) |
| `RecipeCard` and `RecipeDetailsScreen` each hand-rolled an identical 4:3/16:9 image-or-"No photo" region | Extracted `MediaFrame` (design-system, exported); preserved each screen's loading behaviour (cards lazy, details hero eager) |
| `RecipesScreen` and `SearchScreen` had byte-identical results-heading CSS, including a `:empty` hiding hack | Extracted `ResultsHeading` (design-system, exported); the empty-count case is now conditional rendering, not a CSS hack |
| Every sheet/dialog (ModalSheet, ConfirmDialog, MethodSheet, UnitSheet, RecipeFiltersSheet) had zero 320 px and zero enlarged-text Storybook coverage; RecipeCard and FoodResultRow had no enlarged-text story; Amount/TextField forms and both result-list screens had zero 320 px coverage; BarcodeScreen/PhotoScreen had neither; FoodReviewScreen had 320 px but no enlarged text | Added the missing stories (~20), plus a shared `expectNoHorizontalOverflow()` assertion in `storybook/decorators.tsx` so they check the same thing the same way |
| InlineMessage, EmptyState and NutritionSummary were never exercised with long/unbreakable content in any story | Added a long-content story to each |
| `TextField`, `CriteriaToolbar` and `RecipeList` had no story file of their own (only indirect coverage) | Added `TextField.stories.tsx`, `CriteriaToolbar.stories.tsx`, `RecipeList.stories.tsx` |

### Investigated and judged not a defect

- **`NutrientRow` vs `NutritionValue` category markers** (16 px vs 14 px tall, both `border-radius: 2px`) looked like accidental drift on first read. Each marker in fact sits beside a different adjacent text size in its own context (16/24 body text in nested rows vs. 14/20 label text above a value figure), so the difference is proportional scaling, not an untracked inconsistency. Left the values as designed; added a comment to each file explaining the relationship so a future reader doesn't "fix" it into a visual mismatch.
- **`Button.loading` and `InlineMessage tone="success"`** are documented, tested capabilities (required by the acceptance criteria in the coverage register) with no current call site in product code — the async flows that exist (barcode lookup, photo analysis) use a separate region-level `LoadingState` instead of a button spinner, and no screen currently has a "success" moment. Not dead code — reachable, tested, and part of the system's required surface — just unconsumed today. Wiring either into a screen would be product-screen behaviour, out of this audit's scope.
- **`Surface`, `Separator`, `Checkbox`** are exported but not yet composed by other design-system components (several patterns hand-roll their own bordered-box CSS instead of using `Surface`, for instance). This is a real architectural observation worth acting on eventually — consolidating box styling through `Surface` would reduce exactly the kind of drift this audit found elsewhere — but doing that sweep now, immediately before Hi-Fi work, risks visual regressions for a purely internal refactor. Left as a known follow-up rather than forced through under audit time pressure.
- **`ConfirmDialog` `max-inline-size: 360px` vs `ModalSheet` `max-inline-size: 640px`, `Choice` radio-dot `10px`, `Badge` count `padding-block: 2px`, the modal drag-handle and nav-indicator `1–2px` radii** — small, isolated, sub-token decorative constants (a dialog width ceiling, a radio dot, a badge inset, hairline corner rounding) rather than restyled use of a concept the token scale already names. Left untokenized, consistent with the hairline-border exception the system already makes elsewhere.
- **`Acquisition.module.css`'s viewfinder `max-inline-size: 240px` and `2px dashed` border** (Barcode/Photo) — a feature-screen-level decorative constant. Touching it would mean editing final product screens, which this audit was explicitly scoped not to do.

### Remaining gaps (not addressed by this audit; unchanged from §6/§8)

1. No manual assistive-technology pass (NVDA/VoiceOver) has been performed — every accessibility fact in this document comes from source reading, automated axe checks and scripted keyboard/focus assertions, not a human screen-reader session.
2. Real-device software-keyboard and safe-area behaviour is unverified — `.verification/runtime/` and Storybook both run in desktop Chromium, where `visualViewport` shrink and `env(safe-area-inset-*)` cannot be exercised.
3. `Surface`-consolidation across existing box-styled components (RecipeCard, InlineMessage, EmptyState and others), noted above, is a deliberate follow-up, not done here.
4. Figma capture of the final screens, deployment of the app/Storybook and the pull request for `feat/design-system` remain open, as recorded in §8.

This audit did not find any missing foundational control that would block composing either journey — both are already composed end to end in `src/app/App.tsx` and verified by the runtime walkthrough; the duplication findings were about implementations that existed twice, not capabilities that were missing.

## 11. Final completion pass before Hi-Fi (2026-09-05)

A named-capability reconciliation, not a repeat of §10's broad audit: every item below was checked against the actual current source tree, one by one, before deciding whether it needed a new file.

### What changed

- **`SegmentedControl`** (new) — `src/design-system/components/SegmentedControl/`. Fully controlled: `value`, `options: { value, label, disabled? }[]`, `onValueChange`, `ariaLabel` (required), `disabled`. Exposed as `radiogroup`/`radio` with roving tabindex and Arrow/Home/End keyboard support, matching the radio semantics this codebase already uses for other peer-option pickers rather than introducing tab/tabpanel semantics the component has no basis to claim (it never sees or owns the content its value switches). Replaced the hand-rolled `role="radiogroup"` of two `FilterChip`s that `SearchScreen` used for the Food/Recipes switch — same accessible names and `aria-checked` contract, so the existing `SearchScreen` story assertions passed unchanged. See the Selection controls table in §3 for how it relates to `FilterChip`, `Radio`, `NavigationBar` and `UnitControl`.
- **Icon-size catalogue restored** — `reference.size.icon.28/40/56`, removed in §10's audit on the reasoning that an unaliased reference token with no consumer is dead weight, are back (217 → 220 tokens). On reflection that reasoning was inconsistent with how this repository already treats the radius catalogue (all 18 steps kept regardless of semantic-alias count, because the catalogue itself — not just its aliased subset — is the documented, supported surface); icon sizes are now treated the same way. Foundations/Icons gained a "Size catalogue (reference)" story rendering all nine, mirroring Foundations/Radius.
- **Spacing scale — investigated, left unchanged at the time.** Asked to narrow the public scale to 0/4/8/12/16/24/32 (7 steps) and treat 36–64 as touch-target/icon/radius dimensions instead. Verified first: `reference.space` is a distinct token family from `reference.size.target.*` and `reference.size.icon.*` (already separate, not conflated), and every one of the 15 steps — including 36 through 64 — was consumed directly by real component CSS at the time (`--portion-ref-space-40` sized ModalSheet's drag handle, `--portion-ref-space-32` sized RecipeDetailsScreen's step-number circle and appeared in NavigationBar, etc. — grep-verified, not assumed). CLAUDE.md also stated the full 15-step scale as an explicit requirement in two places. Narrowing it would have broken real, currently-correct layout and contradicted the project's own accepted contract at that time, so it was left as-is rather than forced to match the instruction's premise. **Superseded by §13 (2026-09-07):** a later, explicit and specific instruction directed exactly this narrowing, migrating the non-spacing consumers to plain literals first; the scale is now 7 steps.
- **`scripts/tokens/build.mjs` `--check` false positive fixed.** Found while re-establishing state (§0): on this Windows checkout, `tokens:check` failed with "output is out of date" against a clean, unmodified tree, because it compared freshly-generated LF content against the CRLF the committed files are checked out as. Fixed by normalizing line endings before comparing; real content drift (verified by temporarily reintroducing a stale value) still fails correctly.

### Named-capability reconciliation

| Requirement | Owner | Export / composition | Storybook evidence | Verification |
| --- | --- | --- | --- | --- |
| SegmentedControl | `SegmentedControl.tsx` (new) | DS export; composed by `SearchScreen` | Components/SegmentedControl (10 stories: default, selected, click, keyboard, selected+focus, disabled, long labels, 320, enlarged text, illustrative shape) | Story tests; `SearchScreen.stories.tsx` unchanged and passing |
| DietaryControl | `FilterChip` (`selectionRole="radio"`) inside `RecipeFiltersSheet` | Feature composition, not a DS export (recipe-domain values) | Components/Chip; Product compositions/Recipe filters (O02) | Pre-existing; not converted to SegmentedControl — 5 options that wrap is the wrong shape for a fixed-row segmented control, and the instruction explicitly warns against a fake second consumer |
| AppliedCriterionChip | `AppliedCriterionChip` in `Chip.tsx` | DS export | Components/Chip | Pre-existing, unchanged |
| AppliedCriteriaSummary | `CriteriaToolbar` (Filters button + count `Badge` + chip row) | Feature composition (recipe-domain) | Product compositions/Recipe filters toolbar | Pre-existing, unchanged |
| NutrientBadge | `NutritionValue` (main/secondary/inline) + `NutrientRow` (list rows) | DS exports | Components/NutritionValue, NutrientRow | Pre-existing — "NutrientBadge" was the planning-stage name in `docs/project/ai-workflow.md`; the shipped names differ, the responsibility (known/partial/unavailable, never tappable, units+basis retained) is the same |
| IngredientList | Inline `<ul>` in `RecipeDetailsScreen` | Feature-local markup, one consumer | Product compositions/Recipe details | Not extracted: no state or interaction to encapsulate, single consumer — extracting it would be exactly the "component only to inflate the catalogue" the brief forbids |
| PreparationSteps | Inline `<ol>` (numbered circles) in `RecipeDetailsScreen` | Feature-local markup, one consumer | Product compositions/Recipe details | Same reasoning as IngredientList |
| Spinner | `Spinner` primitive | DS export | Primitives/Spinner | Pre-existing, unchanged |
| Skeleton | **Deliberately absent** | — | — | The contract explicitly rejects skeleton loaders (`ui-contract.md`, and `LoadingState`'s own doc comment: "no fake content; placeholder bars are never used as loading feedback") in favour of a real `Spinner` + readable text. Not a gap — a decision |
| AddFoodSheet | `MethodSheet` (O01) | DS export | Patterns/MethodSheet | Pre-existing — planning-stage name differs from the shipped one |
| RecipeFiltersSheet | `RecipeFiltersSheet` | Feature export (recipe-domain) | Product compositions/Recipe filters (O02) | Pre-existing, unchanged |
| ManualNutritionForm | `ManualEntryScreen` (S06) | Feature screen | Product compositions/Manual entry (S06) | Pre-existing — planning-stage name differs |
| FoodReviewPanel | `FoodReviewScreen` (S07) | Feature screen | Product compositions/Food review (S07) | Pre-existing — planning-stage name differs |
| CaptureFrame | Shared `Acquisition.module.css` viewfinder, used by `BarcodeScreen` and `PhotoScreen` | Feature-level shared stylesheet, no interactive behaviour | Product compositions/Barcode, Photo | Already deduplicated (one stylesheet, two consumers); no React component needed since the frame is purely decorative |
| PhotoPreview | `PhotoScreen`'s `preview` phase | Feature-local, one consumer | Product compositions/Photo (S05) | Not extracted: single consumer, no reuse case |
| RecognitionSuggestions | `PhotoScreen`'s `suggestions` phase, composed from `FoodResultRow` | Feature-local, reuses a DS export | Product compositions/Photo (S05) | Already correctly composed from an existing DS primitive rather than reimplemented |
| CameraRecovery | `EmptyState`/`InlineMessage`, reused across `BarcodeScreen` and `PhotoScreen`'s denied/unreadable/not-found/failed states | DS exports, feature-composed | Components/EmptyState, InlineMessage; Product compositions/Barcode, Photo | Already deduplicated via shared DS components, not hand-rolled per screen |
| BackAction | `AppHeader`'s `onBack` (renders `IconButton icon={ArrowLeft}`) | DS export (`AppHeader`) | Patterns/AppHeader | Pre-existing, single owner across every focused screen |
| NavigationItem | Internal to `NavigationBar`'s `DESTINATIONS` map | Not separately exported | Patterns/NavigationBar | Correctly not extracted: the set is fixed by the product contract (3 destinations + Add food, never caller-configured), so a separate exported sub-component would be speculative |
| RootScreenLayout | `RootScreenLayout` | DS export | Templates/RootScreenLayout | Pre-existing, unchanged |
| FocusedFlowLayout | `FocusedFlowLayout` | DS export | Templates/FocusedFlowLayout | Pre-existing, unchanged |
| RecipeDetailLayout | `RecipeDetailsScreen` composing `RootScreenLayout` directly | Feature screen | Templates/RootScreenLayout; Product compositions/Recipe details | Not a distinct template: S08 keeps the bottom bar (unlike S04–S07), so `RootScreenLayout` already is the correct, contract-mandated shell — a separate name would duplicate it for no structural difference |

Result: **one genuinely new component** (`SegmentedControl`); everything else in the list was already correctly implemented, under a shipped name that differs from the item's planning-stage or generic name.

### §5 (extractions) review

Re-checked `MediaFrame`, `ResultsHeading` and `FoodIdentityHeader`'s placement from §10 against the architecture rule (domain-agnostic → design system; takes a Portion domain type → feature-local). `MediaFrame` (aspect + image-or-fallback, no domain types) and `ResultsHeading` (heading + live summary + count, no domain types) are correctly design-system exports. `FoodIdentityHeader` takes `FoodCandidate` (the calculator's own domain type) and is correctly feature-local. No change.

### Documentation ownership

Storybook already carries purpose, API, states, accessibility and responsive behaviour for every existing component via its own description plus dedicated state/a11y/responsive stories (built across the original implementation and the §10 audit) — verified rather than rewritten wholesale, since redoing all 58 files against a rigid template would be exactly the "redesign from scratch" this pass was told not to do. `SegmentedControl`, being new, got the full documentation checklist (purpose, when to use, when not to use, anatomy, API, variants, states, accessibility, content guidance, token usage, responsive, examples) in its own component description. `docs/design-system/README.md` — this file — remains the single system-level guide (architecture, token pipeline, verification, coverage, known gaps); no second file was created at the `docs/design/design-system.md` path this pass was asked to update, since that path does not exist in this repository and this file already is the design-system guide the request describes — creating a second one would itself be the "competing design-system documentation file" that request explicitly forbids.

### Verification (2026-09-05)

Typecheck, `tokens:build`/`tokens:check` (220 tokens, generated output current, `--check` no longer false-positives), unit tests, the full Storybook suite, both builds and the runtime walkthrough were all re-run after these changes; results are folded into §6's table above (updated in place) rather than duplicated here.

### Remaining gaps

Unchanged from §10: no manual assistive-technology pass, no real-device software-keyboard/safe-area verification, Figma capture, deployment and the pull request remain open. This pass found no additional gap in the two Portion journeys' foundational-control coverage.

## 12. Layout-system refinement before Hi-Fi (2026-09-06)

A narrow, verify-then-fix pass over the layout contracts specifically — not a repeat of §10/§11. Full detail lives in Foundations/Spacing and layout and Primitives/Layout's own Storybook descriptions (now the canonical source for this); this section records only what changed and why.

**Verified already correct, no change:** page inset, card padding and section/major-section spacing all resolve through one consistent semantic role each (`page-inset`, `card-padding`, `section`), used identically by both root templates. Every semantic spacing role already stayed within 0/4/8/12/16/24/32 — now asserted as an executable Storybook check, not just documented. "Parent owns spacing between children" already held everywhere: every non-zero `margin` in the codebase was audited and is either an internal micro-adjustment inside one component's own fixed template, a documented full-bleed negative-margin breakout, or a hit-area expansion trick — none of it reaches out to size a component against an external sibling that's a parent `Stack`/`Inline`/template's job. Fields, `RecipeCard` and `SegmentedControl` already fill their parent through ordinary block-box/flex-stretch behaviour, with no width hack needed; chips and badges already hug via `inline-flex`. `Button` already supported hug (default `inline-flex`) and fill (`block` → `inline-size: 100%`) without any fixed width. No `Container` primitive exists or was added — see Primitives/Layout's description for why one has no real consumer on this mobile-only prototype.

**Found and fixed:**

| Inconsistency | Fix |
| --- | --- |
| `ConfirmDialog`'s Cancel/Confirm were two independently `block` (full-width) buttons stacked vertically — inconsistent with `UnitSheet`'s equivalent Cancel/Confirm pair, which was already side-by-side (via CSS Grid) | `Inline` gained a `distribute?: 'hug' \| 'fill'` prop (`fill` → `flex: 1 1 0%; min-inline-size: 0` on every direct child) — the flex-based "share a row equally" mechanism the brief asked for. Both `ConfirmDialog` and `UnitSheet` now compose `<Inline gap={8} distribute="fill" align="stretch">` around two plain (non-`block`) buttons, so the same pattern is implemented once and looks identical in both places. `Button`'s own `block` prop is untouched and still owns the *single* full-width-action case (Confirm and calculate, Continue to review, …). This is a visible layout change — screenshotted before/after (§6) — justified by the cross-component inconsistency it fixes, not a stylistic preference. |
| `RecipeFiltersSheet`'s outer field-group `Stack` used `gap={24}` (`spacing.section`'s value, meant for major screen-level regions) where `ManualEntryScreen`, the app's other multi-field form, correctly uses `spacing.form-group` (16) between its groups | Changed to `gap={16}`, matching `spacing.form-group` — both forms now space their field-groups the same way. |
| `RecipeList`'s card-to-card gap used a raw `--portion-ref-space-12` reference value with no semantic role, unlike every other spacing decision in product code | Added `semantic.spacing.card-gap` (12), distinct from `card-padding` (a card's own internal inset). `RecipeList` now consumes the role. |

**Not changed, considered and rejected at the time:** narrowing `Stack`/`Inline`'s `gap` prop type to only accept 0–32 (was an API change with no real defect behind it at that point — nothing in the codebase misused the wider range; the approved layout scale was established through the semantic roles and the Storybook assertion instead, without touching the primitive's permissive type). **Superseded by §13 (2026-09-07)** — see that section for the narrower `gap` type actually shipped. `RecipeFiltersSheet`'s Reset-all/Apply-filters footer stays an asymmetric grid (`auto` + `1fr`) — a different, correct shape (one hug-sized text action, one fill action), not the "two equal peers" case `distribute="fill"` addresses; unaffected by §13.

## 13. Spacing scale narrowed to 0–32 (2026-09-07)

A single, explicit follow-up instruction directed exactly the narrowing §11 and §12 had each investigated and declined: "the approved spacing primitive scale must be exactly 0/4/8/12/16/24/32," remove the steps above 32 after migrating their non-spacing consumers, and type `Stack`/`Inline`'s `gap` against that scale instead of leaving a permissive escape hatch. Unlike the earlier, more open-ended asks, this one named the exact scale and the exact mechanism (type-narrowing) to use, so it was executed as directed rather than re-investigated.

**What changed:**

- `tokens.json` → `reference.space` now has exactly 7 entries: `0`, `4`, `8`, `12`, `16`, `24`, `32`. The former `36`/`40`/`44`/`48`/`52`/`56`/`60`/`64` entries are gone. `tokens:build` regenerated `tokens.css`/`tokens.ts` (213 tokens, down from 220); `tokens:check` confirms no drift.
- The 5 real, non-gap consumers of the removed steps were migrated to plain pixel literals in their own component CSS, each with a short comment distinguishing "this component's own fixed dimension" from a spacing value: `Chip.module.css` (`min-block-size: 40px`), `ModalSheet.module.css`'s `.handle` (`inline-size: 40px`), `FoodResultRow.module.css` and `MethodRow.module.css` (`min-block-size: 56px` each), and `AppHeader.module.css`'s `.focused` (`min-block-size: calc(56px + var(--portion-safe-area-top))` — only the literal changed, the safe-area addition is untouched). Touch-target (`reference.size.target.*`), icon (`reference.size.icon.*`) and radius (`reference.radius.*`) families were not touched, per the instruction.
- `Stack`'s exported `SpaceStep` type (`src/design-system/primitives/layout/Stack.tsx`) narrowed from the 15-value union to `0 | 4 | 8 | 12 | 16 | 24 | 32`. `Inline`'s `gap` prop inherits this from the same `LayoutProps` type, so no separate edit was needed there — passing `gap={40}` (or any removed step) to either primitive is now a compile-time TypeScript error, not just a documented convention. `layout.module.css`'s `[data-gap='N']` selectors were pruned to match; a gap of `36` or above can no longer reach a CSS rule at all.
- Foundations/Spacing and Primitives/Layout's Storybook descriptions and `STEPS` arrays were narrowed to the 7 steps; the former "steps above 32 back a few components' fixed dimensions via `reference.space`" framing was corrected to state those are now plain literals, not tokens, and never reachable through `gap`.

**Verified:** `tokens:build`/`tokens:check` (213 tokens, generated output current), typecheck, unit tests, the full Storybook suite and both builds — see §6/updated verification note below. All prior layouts render unchanged: every step this scale still uses (0/4/8/12/16/24/32) is byte-identical to before, and the 5 migrated components' rendered dimensions (40 px / 56 px) are unchanged, only their source mechanism changed from a token reference to a literal.

## 14. Home dashboard, navigation and task-flow revision (2026-09-07)

Explicit product decision: Home / Search / Recipes + Add food replaces Calculate / Search / Recipes + Add food. This supersedes the earlier "no separate Home dashboard" instruction recorded in CLAUDE.md and the low-fidelity contract §2 — both now carry a superseding note pointing here and to `docs/ux/low-fidelity.md` §3a/§11, which own the full content rationale (module purposes, US01/US02/HMW mapping) and the Figma/FigJam change record. Calculation remains a capability of the product; only the destination name and its dashboard content changed.

**What changed in code:**

- `src/features/calorie-calculator/screens/CalculateScreen.tsx` (+ its stories) removed; `HomeScreen.tsx`/`HomeScreen.stories.tsx` added. Beyond the rename, `HomeScreen` adds two new modules absent from the old `CalculateScreen`: a food-calorie module with a primary **Add food** CTA for the empty state (`S01-1`), and a recipe-discovery module with a secondary **Find recipes** CTA present in both the empty and current-calculation states (`S01-1`/`S01-2`) — new props `onAddFood`/`onFindRecipes` alongside the existing `onChangeFood`/`onPortionChange`.
- `NavigationBar`'s `Destination` type changed from `'calculate' | 'search' | 'recipes'` to `'home' | 'search' | 'recipes'`; its `Calculator` icon and "Calculate" label became `House`/"Home". `Calculator` stays in the icon catalogue as a reference icon, its catalogue entry corrected to say so rather than claiming it as the (now nonexistent) Calculate destination.
- `App.tsx` renamed its root-destination state, screen key and `CalculateScreen` usage to `home`/`HomeScreen`, and wired `onFindRecipes` to the existing `switchRoot('recipes')` handler — the same clean, unfiltered browse entry `RecipesScreen`'s own "Search instead" affordance already used, so no new navigation primitive was needed.
- Every other Storybook story, doc comment and specimen that referenced "Calculate" as a destination name (not the calculation verb) was corrected: `App.stories.tsx`, `RootScreenLayout.stories.tsx`, `AppHeader.stories.tsx`, `Typography.stories.tsx`'s heading specimen, `UnitSheet.tsx`'s and `FoodIdentityHeader.tsx`'s doc comments. `docs/ux/low-fidelity.md`, `docs/ux/task-flows.md` (substantially rewritten — it still carried an older S06–S09 screen-ID scheme and "specify meal time"/"Save data?" steps the current contract had already dropped) and `docs/ux/ui-contract.md`'s navigation table were updated to match; §6's verification-command table in this file is unaffected by this change.

**What changed in Figma/FigJam:** recorded in full in `docs/ux/low-fidelity.md` §11, including exact node IDs, the before/after screenshots taken during the session, and the two live prototype reactions wired for the new CTAs (Add food → O01 overlay, Find recipes → S03-1 navigate) — not repeated here to avoid a second, potentially drifting copy of the same record.

**Verified:** typecheck, unit tests (38/38), the full Storybook suite (246/246, including two tests updated for the now-duplicate "Add food" accessible name shared by the body CTA and the nav's trailing action) and both builds. Runtime verification relied on this Storybook coverage (real DOM assertions in headless Chromium) rather than a manual browser session — no browser-automation tool was available in this session; this is a known limitation, not a claim of manual QA.

## 15. Hi-Fi NavigationBar, reconciled onto current main (`feat/navigation-hifi`)

The first component taken to explicit production-quality Hi-Fi sign-off. This branch was originally cut before §13/§14 (spacing narrowing, SegmentedControl, the dashboard-style `HomeScreen`, and the Home rename's doc reconciliation) landed on `main`; it was then rebased onto current `main` so that newer work is preserved intact and only the genuine NavigationBar-specific delta is retained — not a design-system rebuild or a product-architecture change.

**What `main` already had (preserved as-is by the rebase, not redone here):** the Home | Search | Recipes | + Add food destination model, the `House` icon, the dashboard-style `HomeScreen` (food-calorie + recipe-discovery modules, `onAddFood`/`onFindRecipes`), `SegmentedControl`, the narrowed 0–32 spacing scale, and every doc reconciliation already recorded in §13/§14. `NavigationBar.tsx`'s CSS Grid layout, 2 px selection indicator, bold/regular icon-weight switching, `caption`/`caption-strong` typography and `ResizeObserver`-driven 2×2 enlargement fallback were also already implemented to a high standard before this pass.

**What this pass actually adds, on top of that base:**

- `NavigationBar.tsx`: explicit `size="default"` (24 px) added to both the destination and Add food `Icon` usages — self-documentation only, behaviourally identical to the prior implicit default.
- `NavigationBar.module.css`: the enlargement-fallback comment's stale "(Calculate, Search / Recipes, Add food)" example corrected to "(Home, Search / Recipes, Add food)" — `main` had not yet touched this specific comment.
- `NavigationBar.stories.tsx` rewritten with the full required Hi-Fi story set (Home/Search/Recipes selected, Recipe Details origin ×2, dedicated Add food/interaction stories, keyboard focus-visible and selected+focus-visible stories, explicit 320/390/393/430 width stories) and a comprehensive component description covering anatomy, the destination/action distinction, the selected-state rationale, icon/typography/target rules, responsive behaviour, safe-area ownership, when the bar hides, state/origin preservation and the native-iOS limitation of this custom pattern, without duplicating the prop table Autodocs already generates — `main`'s version was still the original 6-story set.
- This section.

**Explicitly discarded during the rebase, not merged:** this branch's own now-superseded `CalculateScreen` → `HomeScreen` content-preserving rename, its `App.tsx`/`App.stories.tsx` wiring, and its doc edits to `CLAUDE.md`, `low-fidelity.md`, `ui-contract.md`, `visual-direction.md`, `FoodIdentityHeader.tsx`, `UnitSheet.tsx`, `AppHeader.stories.tsx`, `RootScreenLayout.stories.tsx` and `Typography.stories.tsx` — `main`'s versions of all of these were already equivalent or materially more complete (the dashboard `HomeScreen` in particular), so keeping this branch's older versions would have been a regression, not an improvement.

**Verification actually run after the rebase:** token JSON syntax + `tokens:build`/`--check`; `tsc --noEmit`; unit tests; the full Storybook suite; both builds — see §6 for the current pass/fail counts (folded in there rather than duplicated here).

**Not run this session:** a manual, eyes-on visual-quality pass (alignment, optical centering, whitespace, hierarchy) and any interactive/screenshot browser check — no browser-automation or screenshot tool resolved in this session (only Figma-related MCP tools were available). The real-Chromium Storybook assertions are genuine rendered-browser checks, not simulation, but they are not a substitute for eyes-on review; that remains open.
