# Portion — Branding / Stylescape

**Direction:** Measured Clarity. **Language:** English. **Updated:** 2026-09-02.

This is the branding and visual-direction document. Do not create a second `branding.md` that repeats it.

## 1. Sources and document ownership

- [Branding / Stylescape in Figma](https://www.figma.com/design/heuO3V1WlKG44CukQswCkw/jito-calories-calculator?node-id=92-1209): visual examples and exploration.
- This document: selected visual decisions, rationale and usage rules.
- [tokens.json](./tokens.json): machine-readable values; reconcile with these tables before implementation. The actual JSON was not supplied for this review.
- [UI contract](../ux/ui-contract.md): component and shared-pattern behavior.
- [Low-fidelity](../ux/low-fidelity.md): current screen IDs, navigation and transitions.
- [Task flows](../ux/task-flows.md) and [research](../ux/research/): task intent and supporting evidence. Earlier screen IDs must not override the current low-fidelity mapping.

Reviewed inputs: the two supplied Markdown documents and all nine exported stylescape sections. The live repository, Figma node properties and implementation were not inspected. This document updates the specification; it does not claim the canvas or code has already been corrected.

| Figma section | What it defines |
| --- | --- |
| 01 — Brand Direction | Positioning, identity, attributes, voice and evidence-to-decision links |
| 02 — Direction Comparison | Alternative visual treatments and selection rationale |
| 03 — Selected Stylescape | The selected visual system shown together |
| 04 — Color Palette | Foundation, interaction, feedback and nutrition roles |
| 05 — Typography | Typeface, hierarchy, numeric treatment and scaling specimens |
| 06 — Iconography | Library, weights, size and state rules |
| 07 — Core UI Components | Starter anatomy and visual states, not a completed coded design system |
| 08 — Shared Patterns & References | Pattern examples, adaptations and reference limitations |
| 09 — Accessibility Principles | Contrast evidence and implementation requirements |

## 2. Product and brand foundation

Portion helps people calculate calories for a specific food or dish and find recipes that match criteria they choose, without requiring a diary or daily-goal workflow.

| Attribute | Visible consequence |
| --- | --- |
| Precise | Every result includes its amount, unit and nutrition basis. Precision does not imply that a photo estimate is exact. |
| Correctable | Identity and portion can be reviewed and changed near the information they affect. |
| Neutral | Describe uncertainty and system conditions without judging food or the user. |

**Voice:** name actions directly, keep quantities explicit, explain uncertainty calmly and avoid praise, shame or medical promises. Examples: `450 kcal for 250 g`; `Estimated from a photo. Review the food and amount.` Show a filter-match claim only when known values meet the actual active criteria.

**Naming:** product name `Portion`; typographic wordmark `portion`, lowercase, Inter Semi Bold, −3% tracking. Negative tracking applies only to the wordmark. Use the editable wordmark without inventing an additional symbol or mascot. Naming is selected for this project; trademark and domain clearance have not been performed.

## 3. Selected direction and rationale

**Measured Clarity:** blue-led, light neutral surfaces, neutral numbers, restrained geometry and supporting food photography.

The section 02 specimens compare Kitchen Counter and Measured Clarity with equivalent fixture content. This is a qualitative design comparison, not a preference test or evidence of measured usability improvement.

| Dimension | Kitchen Counter | Measured Clarity — selected |
| --- | --- | --- |
| Surfaces | Warm paper-like neutrals | White and cool light neutrals |
| Numeric treatment | Terracotta-tinted main result | Neutral ink keeps values separate from actions and feedback |
| Photography | Warm surfaces reinforce the food imagery | Cool controls provide a contrasting visual role alongside warm photography |
| Geometry | Softer editorial treatment | Minimal corner rounding and structured alignment |
| Token organization | Would require its own tested surface/color combinations | One chosen action family, with separate feedback and nutrition roles |

Blue is the user's selected preference and supports separation of actions from food imagery in this composition. It is not inherently more trustworthy, accessible or cheaper to implement than another hue. Neutral numbers and correctable inputs—not blue alone—support the product's intended clarity.

Both directions use Inter. Neither the equal-width specimens nor their photography prove equal task attention. Any claim about faster reading remains a hypothesis until tested. A green hue-only exploration is not carried forward.

**Trade-off:** blue alone is generic. Recognition must come from the combination of the lowercase wordmark, typography, alignment, proportions, imagery and consistent behavior.

## 4. Typography

**Inter**, one family throughout. It supports screen-oriented text and tabular numbers; its range of weights allows one coherent hierarchy. This is a project fit, not a ranking of typefaces. [Official Inter documentation](https://rsms.me/inter/).

Implementation: `@fontsource-variable/inter/opsz.css` registers the `@font-face` family **`Inter Variable`** (wght 100–900, opsz 14–32); the canonical family token is `['Inter Variable', 'Inter', 'system-ui', 'sans-serif']`, so the token names the registered face and falls back to the system stack. Loading is verified in the runtime walkthrough (`document.fonts.check`) and in Foundations/Typography → Font loading and fallback.

The accepted scale (2026-09-03) is the one implemented in `src/design-system/tokens/tokens.json` → `semantic.typography`; sizes are authored in px and emitted in rem, line heights are unitless ratios.

| Role | Size / line height, px | Weight | Use |
| --- | --- | --- | --- |
| main-result | 40 / 48 | 600 | The single calorie result |
| screen-heading | 28 / 36 | 600 | Root screen titles |
| detail-heading | 24 / 32 | 600 | Food or recipe title on a detail screen |
| section-title | 20 / 28 | 600 | Section and sheet titles |
| compact-title | 18 / 24 | 600 | Focused bar titles, card and empty-state titles |
| action | 16 / 24 | 600 | Button labels, unit selector |
| body | 16 / 24 | 400 | Paragraphs, inputs, list items |
| label | 14 / 20 | 500 | Field labels, chips, nutrient category labels |
| supporting | 14 / 20 | 400 | Helper, error, basis, secondary lines |
| compact-action | 14 / 20 | 600 | Compact standalone actions (Reset, Clear) |
| caption | 12 / 16 | 500 | Navigation labels |
| caption-strong | 12 / 16 | 600 | Selected navigation labels, count badge |
| item-title, method-title, metric-inline | → action | | Row titles and inline values |
| metric-secondary | → detail-heading | | Secondary macro values |
| wordmark | 24 / 32, −0.03em | 600 | The lowercase wordmark only |

- Reserve the 40 px main-result style for the single calculator/detail result; card and row values use metric-inline (16) and secondary metrics use 24.
- Keep interface tracking normal. Keep a number and its unit together where possible, without creating overflow.
- Use tabular figures on updating values and aligned numeric columns: `font-variant-numeric: tabular-nums` or the equivalent `"tnum"` feature. Align with layout, never inserted spaces.
- The board reports tabular figures were not enabled through its authoring workflow. Treat them as unverified in Figma and required in code; do not turn that report into a general claim that Figma cannot support them.
- Long titles wrap; containers grow. The PDF includes 100%, 150% and 200% specimens. These do not prove runtime scaling works.

## 5. Iconography

Use **Phosphor Icons** consistently; do not mix it with Lucide in the implemented scope. The family provides the required entry, search, filter and navigation concepts with official weight variants. This is a consistency choice, not a demonstrated recognition advantage.

Official weights are `thin`, `light`, `regular`, `bold`, `fill`, `duotone`. There is no `medium`; do not invent it or thicken paths to simulate it. [Official React documentation](https://github.com/phosphor-icons/react).

| Use | Rule |
| --- | --- |
| Default icon | `regular`, 24 px |
| Selected navigation destination | `bold` plus action color, 2 px indicator and visible label |
| Hover / pressed / focus | Retain regular unless already selected; change the control surface or focus ring |
| Loading | Progress feedback, not a weight change; prevent repeated activation |
| Static metadata | A documented 16 px icon may be used; not a smaller interactive target |
| Icon-only action | Accessible name belongs to the control; the glyph is decorative |

Use official SVGs or `@phosphor-icons/react` without applying Lucide-style stroke-width edits. Icon dimensions and target dimensions are independent. Default interactive targets are at least 48 × 48 CSS px; the trailing Add food action uses the existing 56 × 56 low-fidelity target.

Catalogue concepts: `plus`, `magnifying-glass`, `barcode`, `camera`, `pencil-simple`, `sliders-horizontal`, `x`, `arrow-left`, `check`, `info`, `clock`, `caret-down`, `calculator`, `cooking-pot`, `warning-circle`. Verify installed-package export names when implementing; catalogue names are not JavaScript import identifiers.

## 6. Color system

Keep foundation/interaction, operational feedback and nutrition categories separately addressable, even where values coincide. The values below are transcribed from the supplied visual specification and PDF, not read from `tokens.json`.

### Foundation and interaction

| Role | Value |
| --- | --- |
| `bg/canvas` | `#FFFFFF` |
| `bg/surface` | `#F7F8FA` |
| `bg/sunken` | `#F2F4F7` |
| `text/primary` | `#17212B` |
| `text/secondary` | `#52606D` |
| `border/control` | `#77818B` |
| `border/decorative` | `#E4E8EC` |
| `action/primary` | `#2855D9` |
| `action/hover` | `#2147B6` |
| `action/pressed` | `#19368F` |
| `action/surfaceSelected` | `#EAF0FF` |
| `focus/ring` | `#19368F` |
| `state/disabled/surface` | `#E5E7EB` |
| `state/disabled/text` | `#59636E` |
| `scrim/base` | `#17212B` at 40% opacity |

Blue is for actions, selection and focus—not the calorie value. Decorative borders may separate already-understandable regions, but cannot be the only essential control boundary.

### Operational feedback

| Role | Text / icon | Surface |
| --- | --- | --- |
| Error | `#B42318` | `#FFF1F0` |
| Warning | `#8A4B0C` | `#FFF5E7` |
| Success | `#166534` | `#EFF8F1` |
| Information | `#2147B6` | `#EAF0FF` |

These describe system conditions, never food quality. An informational message may share the blue family without looking like an interactive control. Missing optional nutrients do not automatically require a warning banner.

### Nutrition categories

| Category | Accent | Subtle surface |
| --- | --- | --- |
| Energy / calories | `#17212B` | `#F2F4F7` |
| Protein | `#7252A3` | `#F3EFF9` |
| Carbohydrates | `#087682` | `#EAF6F7` |
| Fat | `#955A0C` | `#FFF4E2` |
| Fibre | `#4E7029` | `#F1F5E8` |
| Vitamins | `#A04574` | `#F9EEF3` |
| Minerals | `#6B6259` | `#F3F0ED` |

- Values and units remain neutral. Use a small category marker or label accent, not a full colored card or a colored numeric result.
- Keep names, units, order and color mapping consistent across calculator, cards, details and Storybook.
- Vitamins and minerals use one group marker each; individual nutrients are neutral labelled rows. Never alias nutrient tokens to success/warning/error tokens.
- Energy is not a fourth macro. Fixture R defines fibre within its carbohydrate total: show `of which fibre`, without adding it again. For future sources, preserve their documented carbohydrate/fibre basis instead of assuming this convention universally.
- Do not combine grams, milligrams and micrograms in one proportional chart. No daily-value percentages, deficiency verdicts or nutrient goals are defined.
- Compact surfaces show energy and relevant macros. Expanded details disclose available fibre, vitamins and minerals; missing values are not zero.

All six non-energy category accents exceed 4.5:1 against their listed subtle surfaces; the lowest recalculated pair is carbohydrates at 4.85:1. Their similar grayscale brightness means color cannot be the sole identifier. The PDF's color-vision simulation is illustrative, not user testing or proof that the hues remain distinguishable.

## 7. Shape, spacing and elevation

| Token / rule | Value | Use |
| --- | --- | --- |
| `radius/structure` | 0 px | Structural regions and separators |
| `radius/control` | 4 px | Buttons, fields, chips, small callouts |
| `radius/card` | 8 px | Cards and grouped data |
| `radius/sheet` | 12 px | Sheet top corners |
| Spacing scale | 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px | Shared spacing values |
| Mobile page inset / typical card padding | 16 px | Baseline; safe-area padding is additional |
| Related items / form groups / major groups | 8 / 16 / 24 px | Visual hierarchy |

No pill-shaped controls or 20–32 px card corners. A circular glyph does not change its target's geometry. Controls grow with content and text scaling.

Ordinary surfaces use spacing and borders. The one overlay shadow is `0 -2px 24px 0 rgba(23, 33, 43, 0.16)`, for sheets only. Avoid decorative calorie rings, blobs, gradients, celebration graphics and unexplained gauges. Low-fidelity placeholder geometry does not override these visual tokens.

## 8. Photography and reference use

Recipe-card images: **4:3**. Recipe-detail images: **16:9**. Natural-looking light, recognizable texture, controlled saturation and quiet backgrounds. Do not place text over photos. Absent photos use a quiet neutral/tinted region, not a broken-image icon or loading skeleton.

A photograph never establishes ingredients, calories, dietary type or nutrient values. Fixture C and Fixture R are independent synthetic data sets; their values are defined in the UI contract.

| Board image | Credit reported in the export | Reported license |
| --- | --- | --- |
| Lentil soup | jules | CC BY 2.0 |
| Healthy Vegan Buddha Bowl | FitTasteTic | CC BY-SA 2.0 |
| Healthy Gnocchi Buddha Bowl | FitTasteTic | CC BY-SA 2.0 |

The export credits Wikimedia Commons and cropping to ratio, but does not supply exact file-page URLs. Before shipping these assets, record the exact source page, author, license link and modifications, and verify permitted reuse. These transcribed credits are not a completed asset-license review.

### Pattern references already present in section 08

| Ref | Reference shown | Adapt for Portion | Do not import |
| --- | --- | --- | --- |
| R1 | MyFitnessPal method menu; help-center composite | One explicit choice among four methods | Diary, daily budget or article annotations |
| R2 | MyFitnessPal serving selector; help-center image | Editable amount and a marked unit choice | Goal percentages and calorie rings |
| R3 | Samsung Food filtered results; help-center image | Visible applied criteria | Ratings as suitability scores; it is not a no-results example |
| R4 | YAZIO filters; promotional composite | Close, Reset, scrollable fields and Apply | Claims about unobserved dismissal or live counts |
| R5 | Booking.com attribute card; promotional composite | Concrete qualifying facts | Promotional framing or color-only meaning |
| R6 | Etsy query-free discovery; promotional composite | Useful recipe browsing without a query | Gift guides, invented personal history or a second search architecture |

These are reference types and adaptations documented in the supplied board, not fresh live-app tests. Exact capture URLs are missing from the exports and should be added to the reference log. Static/promotional images do not prove focus, persistence or dismissal behavior. Competitor screenshots are analysis references, not product imagery. The no-results layout is a Portion design proposal, not a verified external capture.

## 9. Applied navigation and component scope

Use one bottom row: **Calculate | Search | Recipes | + Add food**. There are **three destinations and one action**, not four destinations. The trailing plus opens the shared method sheet; it never becomes selected.

Selection uses the Phosphor bold glyph, action color, a 2 px indicator and label. Details retain the originating tab. Search remains selected in both Food and Recipes scopes. Detailed visibility, keyboard, modal and return rules belong in the UI contract and low-fidelity document.

Section 07 supplies a starter visual vocabulary: actions, inputs, selection, rows, nutrition, cards, overlays, feedback and navigation. It is not evidence that these components exist in code or have passed tests. Build one shared implementation for the product and Storybook; use tokens rather than duplicated literal values.

`Save result`, `Saving…` and `Result saved` in older specimens do not establish a required save feature. The current flow confirms reviewed data into the current calculation; no separate save or diary step is required. Keep the visual success style, but apply it only to a real defined outcome.

## 10. Accessibility evidence and handoff

All 24 color pairs printed in section 09 were independently recalculated from their stated hex values on 2026-09-02 and agree at two decimals. Examples: primary text/canvas **16.29:1**, secondary text/canvas **6.46:1**, white/primary blue **6.19:1**, control border/canvas **3.96:1**, decorative border/canvas **1.23:1**. This verifies those pairs, not every real placement or the entire interface.

Targets: normal text 4.5:1; large text and qualifying non-text information 3:1, with the applicable exceptions. [Text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum), [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

The product's 48 × 48 CSS px touch-target baseline is a design decision; WCAG 2.2 AA target size is 24 × 24 CSS px with exceptions. Do not equate CSS px, iOS points and Android dp. [Target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

Focus appearance: 3 px `focus/ring`, 2 px canvas gap, outside the control. Ancestor containers must not clip it. Color is supported by labels, markers, boundaries and accessible state.

Before freezing the design-system baseline:

- [ ] Update sections 01 and 06 from two destinations; relabel section 07 as three destinations plus Add food and distinguish the action visually.
- [ ] Replace obsolete S06–S09 route references in stylescape annotations with current low-fidelity IDs.
- [ ] Remove mandatory-save implications from action and feedback specimens; shorten list suitability evidence to a compact summary, leaving detailed comparisons in recipe details.
- [ ] Reconcile every value and role with the actual `tokens.json`, app styles and Storybook; check token aliases as well as hex values.
- [ ] Add exact reference and image-source URLs and verify attribution/reuse before shipping assets.
- [ ] Test real English text, keyboard and modal focus, screen-reader names, reduced motion, safe areas, 320/390/430 px widths and text resizing to 200%. [Resize text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html).

Brand direction is documented. Canvas consistency, component implementation and accessibility behavior remain separate checks—not claims of completed work.
