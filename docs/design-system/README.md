# Portion design system — repository guide

Portion is an **iOS-oriented web prototype** built with React 19, Vite 8, TypeScript 7 and Storybook 10.5. This guide records how the design system is implemented in this repository, where each capability lives, what has been verified and what remains. It does not claim production readiness, full accessibility conformance or completed usability validation.

Authority: `docs/ux/ui-contract.md` and `docs/ux/low-fidelity.md` own behaviour; `docs/design/visual-direction.md` owns visual rationale; `src/design-system/tokens/tokens.json` owns token values; source and stories own the component API and its states.

## 1. Architecture and placement map

| Layer | Path | What lives there | Storybook |
| --- | --- | --- | --- |
| Token source | `src/design-system/tokens/tokens.json` | DTCG 2025.10 `reference` and `semantic` families (220 tokens) | Foundations/Tokens |
| Token generator | `scripts/tokens/build.mjs` | Validation, alias resolution, deterministic `tokens.css` + `tokens.ts` | — |
| Generated tokens | `src/design-system/tokens/generated/` | `--portion-ref-*` and `--portion-*` custom properties; typed `tokens`, `tokenVars`, `cssVar` | Foundations |
| Global styles | `src/design-system/styles/` | Inter registration, generated tokens, reset, focus ring, `[hidden]`, reduced motion, safe areas, type classes | Foundations/Typography |
| Icons | `src/design-system/icons/` | `Icon` wrapper; Storybook-only `catalogue.ts` (134 verified Phosphor glyphs) | Foundations/Icons |
| Nutrition rules | `src/design-system/nutrition/` | Categories, ordering, formatting (`formatQuantity`), "Not available" wording | — (unit tests) |
| Primitives | `src/design-system/primitives/` | Text, Stack/Inline, Surface, Separator, Spinner, Button, IconButton, Input, Checkbox/Radio, Badge, VisuallyHidden | Primitives/* |
| Components | `src/design-system/components/` | FormField, TextField, AmountField, UnitControl, SearchField, chips, NutritionValue, NutrientRow, MatchCriteria, InlineMessage, EmptyState, LoadingState, MethodRow, FoodResultRow | Components/* |
| Patterns | `src/design-system/patterns/` | NavigationBar, AppHeader, ModalSheet, ConfirmDialog, MethodSheet, UnitSheet, NutritionSummary, RecipeCard | Patterns/* |
| Templates | `src/design-system/templates/` | RootScreenLayout, FocusedFlowLayout | Templates/* |
| Public entry | `src/design-system/index.ts` | Supported exports only (no fixtures, catalogue or stories) | — |
| Calculator feature | `src/features/calorie-calculator/` | `domain/` (calculation, manual entry, fixtures, tests), `screens/` (Calculate, Food review, Manual entry, Barcode, Photo) | Product compositions |
| Recipe feature | `src/features/recipe-discovery/` | `domain/` (matching, fixtures, tests), `components/` (filters sheet, criteria toolbar, list), `screens/` (Recipes, Recipe details) | Product compositions |
| App shell | `src/app/` | `App.tsx` navigation, shared `SearchScreen`, simulated `services.ts`, keyboard and scroll hooks | Product compositions/App |
| Storybook helpers | `src/design-system/storybook/` | Enlarged-text and text-spacing decorators, contrast helpers (not exported) | — |
| Verification | `scripts/verify/runtime-walkthrough.mjs` | Playwright walkthrough of both journeys with screenshots to `.verification/runtime/` (ignored) | — |

The app (`src/main.tsx`) and Storybook (`.storybook/preview.ts`) import the same `global.css`; there is one active preview file.

## 2. Token pipeline

- `npm run tokens:build` reads `tokens.json`, checks every `$type` (inherited for alias-only tokens), resolves aliases recursively (dangling references, cycles and incompatible types fail the build), validates units, colour alpha and composite members, and writes `src/design-system/tokens/generated/tokens.css` and `tokens.ts`. Both files carry a generated-file banner.
- `npm run tokens:check` regenerates in memory and fails when the committed output differs. Run it before committing token changes.
- Conversions: colours to lowercase hex or `rgb(r g b / a)`; dimensions keep their unit except font sizes, which are emitted in rem (root 16 px); line heights stay unitless ratios; durations in ms; easing as `cubic-bezier()`; shadows as CSS shadow lists; typography composites as five custom properties each (`-font-family`, `-font-size`, `-font-weight`, `-line-height`, `-letter-spacing`).
- Semantic aliases are emitted as `var()` references to their reference token, so a reference change flows through. Product and component styles use semantic roles; reference steps appear only in token definitions, the layout primitives (`Stack`/`Inline` gaps map to `reference.space`) and foundation specimens.
- `html { font-size: 100% }` keeps the user's browser text preference; everything in rem scales from it. All values in code, stories and this guide are CSS px.

## 3. Foundations at a glance

**Spacing** — exactly 0/4/8/12/16/24/32/36/40/44/48/52/56/60/64 px (`reference.space`). Semantic roles: page-inset, section, related, card-padding, form-group, heading-to-description, section-title-to-content, title-to-secondary, label-to-control, control-to-helper, paragraph, instruction-item, icon-to-label, nav-icon-to-label. `full = 9999px` is a radius token, not a spacing step.

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

**Icons** — `@phosphor-icons/react`, regular by default, bold only for the persistently selected navigation destination; there is no `medium` weight. Sizes are the semantic size roles (16/20/24/32/48/64); a 24 px glyph sits inside a 48 × 48 target, 56 × 56 for Add food.

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
| 6 | Numeric entry and supported units (decimal keyboard, one separator, unit selector, unit sheet) | Observed in current code | Draft string parsed by the feature; switching units re-expresses a valid amount in the new unit (300 g → 1 serving) | `ui-contract.md` §4 (recorded), `calculation.ts` | `AmountField`, `UnitControl`, `UnitSheet` | Components/AmountField, UnitControl; Patterns/UnitSheet; Product/Calculate (Unit change) | Unit tests for `convertQuantity`; walkthrough check "switching g → serving keeps the portion" | — |
| 7 | Choice controls, chips and badges | Observed in current code | Toggle chips use `aria-pressed`, scope chips are radios in a radiogroup; remove action has a 48 px hit area via `::before` | `ui-contract.md` §3 | `Checkbox`, `Radio`, `FilterChip`, `AppliedCriterionChip`, `Badge` | Primitives/Choice, Badge; Components/Chip | State and target assertions | — |
| 8 | Nutrition presentation (main result, macros, expanded list, unknown vs zero, precision) | Observed in current code | Unknown = "Not available"; known zero shown as 0; small mg values keep precision; fibre nested under carbohydrates | `ui-contract.md` §1, §4 | `NutritionValue`, `NutrientRow`, `NutritionSummary`, `nutrition.ts` | Components/NutritionValue, NutrientRow; Patterns/NutritionSummary | Unit tests (`nutrition.test.ts`, `calculation.test.ts`), story assertions, fixtures C/R in walkthrough | — |
| 9 | Recipe presentation (card 4:3, details 16:9, no photo, long titles, match evidence) | Observed in current code | Title is the single control with a stretched hit area; no match claim without active criteria | `ui-contract.md` §5 | `RecipeCard`, `MatchCriteria`, `RecipeList` | Patterns/RecipeCard; Components/MatchCriteria | Story assertions incl. 320 px long title | Real photography and licences remain out of scope |
| 10 | Feedback and status (inline messages, empty/no-match/failure, loading, spinner, reduced motion) | Observed in current code | Cause-specific copy and actions; failure uses `alert`, others `status`; no skeletons | `ui-contract.md` §5.6 | `InlineMessage`, `EmptyState`, `LoadingState`, `Spinner` | Components/InlineMessage, EmptyState, LoadingState; Primitives/Spinner | Role and reduced-motion assertions | — |
| 11 | Navigation bar and headers (3 + 1 row, current-page semantics, enlargement fallback, keyboard hiding) | Observed in current code | 2 × 2 fallback measured from natural label widths; software keyboard detected from `visualViewport` shrink + text focus | `low-fidelity.md`, `ui-contract.md` §2 | `NavigationBar`, `AppHeader`, `useSoftwareKeyboard` | Patterns/NavigationBar (Default, Selection, Hidden, 320, 320 + 200 %, 430 + 150 %), AppHeader | Story assertions; walkthrough "nav falls back to 2 × 2 at 320 + 200 %" | Keyboard hiding is **Platform mapping / Unverified** on a real device (see §5) |
| 12 | Overlays (bottom sheet, confirm dialog, method sheet; focus containment, Escape, backdrop, restore) | Observed in current code | Native `<dialog>`; Escape handled directly because browsers skip `cancel` without user activation; scrolling text-only body is focusable | `ui-contract.md` §3, §5 | `ModalSheet`, `ConfirmDialog`, `MethodSheet` | Patterns/ModalSheet, ConfirmDialog, MethodSheet | Focus, Tab containment, Escape, restore-focus assertions; a11y at error | — |
| 13 | Screen templates (root with bar, focused flow with sticky header/footer, safe areas) | Observed in current code | Footer stays in flow; measured header/footer heights become document scroll padding | `low-fidelity.md` | `RootScreenLayout`, `FocusedFlowLayout` | Templates/* (incl. short viewport) | Story assertions | Safe-area insets are **Platform mapping** (0 in desktop Chromium) |
| 14 | Calculation journey screens (S01 empty/result/stale, S07 review per source, S06 manual entry with dirty check) | Observed in current code | Review confirms once and replaces; invalid draft = stale result; manual macros optional | `ui-contract.md` §4, `low-fidelity.md` | `CalculateScreen`, `FoodReviewScreen`, `ManualEntryScreen`, `manual-entry.ts` | Product compositions/Calculate, Food review, Manual entry | Unit tests; story play functions; walkthrough checks 3–14 | — |
| 15 | Acquisition screens (S04 barcode states, S05 photo capture/preview/analysis/suggestions) | Observed in current code | Camera and recognition are simulated and labelled as prototype controls; late responses ignored after Back/rescan/cancel | `ui-contract.md` §5.6 | `BarcodeScreen`, `PhotoScreen`, `services.ts` | Product compositions/Barcode, Photo | Story play functions (incl. cancel during analysis); walkthrough screenshots 12–27 | Real camera/recognition **Out of scope** |
| 16 | Recipe journey screens (S03 browse/filtered/no match/failure, O02 filters draft, S08 loading/loaded/unavailable/no photo) | Observed in current code | AND criteria, unknown never matches, Apply/Reset/Cancel semantics, chip removal commits | `ui-contract.md` §5 | `RecipesScreen`, `RecipeFiltersSheet`, `CriteriaToolbar`, `RecipeDetailsScreen`, `matching.ts` | Product compositions/Recipes, Recipe filters, Recipe details | Unit tests (`matching.test.ts`); story play functions; walkthrough checks 15–20 | — |
| 17 | Shared Search and app shell (scopes, query retention, criteria snapshot, origin tab, scroll memory, replacement) | Observed in current code | Roots stay mounted; focused steps stack and stay mounted for Back; `offline` in a query simulates failure | `low-fidelity.md`, `ui-contract.md` §2 | `SearchScreen`, `App.tsx`, `useScrollMemory` | Product compositions/Search, App (runtime) | Walkthrough checks 21–23 and scroll restore; App story | Reload persistence and account sync **Out of scope** |
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

## 6. Verification status (executed on 2026-09-03)

| Check | Command | Result |
| --- | --- | --- |
| Typecheck | `npm run typecheck` | exit 0 |
| Token validity and drift | `npm run tokens:check` | 220 tokens validated; generated output current |
| Unit tests (node) | `npm run test:unit` | 4 files, 38 tests passed |
| Storybook tests (headless Chromium, axe at `error`) | `npm run test:storybook` | 53 files, 184 tests passed |
| App build | `npm run build` | success (Inter opsz woff2 + CSS + JS bundles) |
| Storybook build | `npm run build-storybook` | success (`storybook-static/`, ignored) |
| Runtime walkthrough | `npm run build && npx vite preview --port 4173` then `node scripts/verify/runtime-walkthrough.mjs` | 24/24 checks passed, 0 console/page errors, 47 screenshots in `.verification/runtime/` |

Rendered inspection performed by reading the walkthrough screenshots (Calculate empty/result/stale/servings/expanded, method sheet, search results, review from search/barcode/photo/manual, manual errors, filters sheet, filtered browse, recipe details expanded, search failure, 320/393/430 widths, 320 px + 200 % and 390 px + 200 %). The unit-change and 2 × 2 fallback defects found by that inspection were fixed and re-verified.

Not verified in this slice: manual screen-reader pass (NVDA/VoiceOver), real-device software keyboard and safe-area behaviour, deployed app/Storybook URLs, and synchronisation of the final screens into the Figma Design file (no code-to-canvas capture tool was exposed in this session). Passing axe on every story is not a WCAG conformance claim.

## 7. Skills and tools used

- `frontend-design` (installed skill) was loaded at the start of the implementation for craft guidance on typography, copy and restraint; where its defaults conflicted with the accepted contracts (Inter, the blue action colour, the fixed spacing scale) the contracts won.
- Playwright (already installed for the Storybook Vitest project) drives the runtime walkthrough; no new dependency was added.
- A code review pass (`feature-dev:code-reviewer` agent) was run at the end of the slice; its findings and outcomes are listed in §9.
- Figma MCP tools were not used in this slice; the Figma capture step remains open (see §8).

## 8. Resumable status

Done in this slice (branch `feat/design-system`): tokens and generator, global styles, primitives, components, patterns, templates, both feature domains with fixtures and tests, all runtime screens, the app shell with simulated services, Storybook consolidation and 53 story files, the runtime walkthrough script, and this guide.

Open:
1. Add the verified final screens to the existing Figma Design file for review and handoff (requires a capture or native-edit capability in the session; not attempted here).
2. Publish the app and Storybook, record real URLs in `README.md`, and check them in incognito.
3. Manual assistive-technology and real-device passes listed in §6.
4. Merge `feat/design-system` through a pull request (not part of this slice).

## 9. Code review findings

Recorded after the review pass at the end of the slice; see the commit history for the fixes applied.
