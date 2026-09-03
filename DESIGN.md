# DESIGN.md

> Concise implementation-oriented visual map for Portion.  
> Product scope lives in `PRODUCT.md`; agent workflow in `AGENTS.md`; behavioral details in `docs/ux/`; visual rationale in `docs/design/visual-direction.md`; exact values in canonical tokens; live component behavior in Storybook.

## 1. Direction

**Measured Clarity**

Portion should feel precise, correctable, neutral, calm, clear, lightweight, modern, and trustworthy without becoming clinical.

Visual language:
- blue-led interaction and selection;
- white/cool neutral surfaces;
- neutral calorie and numeric presentation;
- restrained geometry;
- structured alignment;
- supporting food photography;
- minimal decorative effects.

Distinctiveness comes from typography, proportions, spacing, composition, imagery, the lowercase `portion` wordmark, and consistent behavior — not novelty effects.

Avoid turning Portion into a fitness dashboard, aggressive weight-loss tracker, clinical nutrition UI, gamified tracker, generic AI dashboard, or marketing landing page.

---

## 2. Platform

Portion is mobile-first and iOS-oriented, implemented as a React/Vite web prototype.

Primary reference viewport: `393 × 852`.

Verify important screens at:
- `320 px`
- `390 px`
- `393 px`
- `430 px`

Project touch-target baseline: `48 × 48 CSS px`.

Follow familiar iOS-oriented interaction principles where useful, but do not imitate native system chrome or claim native SwiftUI/UIKit behavior.

Do not equate `CSS px`, iOS points, and Android dp.

---

## 3. Hierarchy

Every screen must have a deliberate reading order.

Use hierarchy through type scale, weight, position, whitespace, grouping, contrast, surface separation, and restrained accent color.

Default order:

```text
Primary outcome / task context
→ Primary action
→ Supporting information
→ Secondary actions
→ Metadata
```

Do not give every section equal visual weight. Neutral information should remain visually neutral unless semantic emphasis is required.

---

## 4. Typography

Use **Inter** only. Do not add a display font.

Approved hierarchy:

| Role | Size / line height | Weight |
| --- | --- | --- |
| `main-result` | 40 / 48 | 600 |
| `screen-heading` | 28 / 36 | 600 |
| `detail-heading` | 24 / 32 | 600 |
| `section-title` | 20 / 28 | 600 |
| `compact-title` | 18 / 24 | 600 |
| `action` | 16 / 24 | 600 |
| `body` | 16 / 24 | 400 |
| `label` | 14 / 20 | 500 |
| `supporting` | 14 / 20 | 400 |
| `compact-action` | 14 / 20 | 600 |
| `caption` | 12 / 16 | 500 |
| `caption-strong` | 12 / 16 | 600 |
| `wordmark` | 24 / 32 | 600 |

Use one `main-result` value per screen where a primary calorie result exists.

Use tabular figures for changing/aligned numeric values. Keep values and units visually connected. Long text wraps and containers grow.

Negative tracking is reserved for the lowercase `portion` wordmark.

---

## 5. Color

Canonical tokens own exact values. This document owns role relationships.

Foundation:
- white canvas;
- cool light surfaces;
- neutral primary/secondary text;
- subtle structural borders;
- blue interaction family;
- explicit focus treatment.

Blue is primarily for actions, selection, focus, and information where clearly differentiated from controls. Do not color the primary calorie value blue merely for emphasis.

Operational feedback roles remain distinct:
- error;
- warning;
- success;
- information.

These communicate system state, never food quality.

Nutrition categories remain stable across the product:
- energy / calories;
- protein;
- carbohydrates;
- fat;
- fibre;
- vitamins;
- minerals.

Values and units remain primarily neutral. Category color is supporting identification, never the sole carrier of meaning. Do not reuse success/error semantics for nutrients.

---

## 6. Shape, Spacing, Elevation

Use current canonical tokens.

Visual-direction reference:
- structure radius: `0`
- control radius: `4`
- card radius: `8`
- sheet radius: `12`

Typical mobile inset: `16 px`, plus safe-area accommodation where needed.

Spacing should communicate relationship:

```text
related items → closer
component groups → medium gap
major sections → larger gap
```

Do not make every gap identical.

Prefer spacing, borders, and surface contrast over shadows. Use elevation only when it communicates layering, especially overlays/sheets.

Avoid pill geometry by default, large rounded cards everywhere, glassmorphism, decorative blur, and card-inside-card compositions.

---

## 7. Surface Model

Keep surface hierarchy limited:

```text
Canvas
→ Content surface
→ Interactive surface
→ Overlay / modal
```

A card must represent real grouping or a distinct interactive object.

Do not convert every section into a card or create depth without interaction meaning.

---

## 8. Iconography

Use **Phosphor Icons** consistently.

- default: `regular`;
- persistent selected navigation: `bold`;
- typical visible size: `24 px`;
- smaller static metadata icons only where documented.

Visible glyph size and interaction target size are separate.

Icon-only actions require accessible names.

Do not mix unrelated icon libraries, invent unsupported weights, modify glyph paths to imitate another library, or decorate every heading with an icon.

---

## 9. Photography

Recipe-card imagery: `4:3`.  
Recipe-detail imagery: `16:9`.

Prefer natural light, recognizable texture, controlled saturation, and quiet backgrounds.

Do not put important text directly over uncontrolled photography.

Absent media uses a deliberate neutral/tinted fallback, not a broken-image icon.

Photography never proves ingredients, calories, dietary type, nutrition, or suitability.

---

## 10. Home

Home is an approved **daily-overview surface** supporting the two primary product jobs, not a full diary or analytics dashboard.

Authoritative states:
- **S01-1 — no committed food entries today**
- **S01-2 — one or more committed food entries today**

The older current-calculation-based state model is superseded.

Intended hierarchy:

```text
1. Daily calorie state
2. Supporting nutrition context
3. Today's food
4. Primary food-entry action
5. Recipe discovery
6. Tertiary metadata
```

Home may include:
- optional user-set daily calorie target;
- consumed and remaining calories;
- calorie progress;
- compact nutrition/macros;
- today's committed entries;
- Add food;
- recipe discovery.

Logging and goal setup are optional. Neither is required to calculate a food result or evaluate a recipe.

If runtime still renders the older Home, treat it as an implementation gap, not accepted product truth.

---

## 11. Progress Ring

Use layered ownership:

```text
ProgressRing
→ generic design-system primitive/component

CalorieProgressRing
→ calorie/Home-specific composition
```

`ProgressRing` owns geometry, normalized progress, visual states, accessible value semantics, and rendering.

`CalorieProgressRing` owns consumed/remaining/target semantics, calorie labels, center content, and Home data.

The ring must communicate meaning without color alone.

Keep calorie value/progress visually neutral unless the current semantic token model explicitly defines otherwise.

Avoid decorative gradients, glow, neon, confetti, alarm-red over-target treatment, Apple Activity imitation, and unexplained gauges.

Verify zero, partial, near target, target, supported over-target/no-goal states, and enlarged text.

---

## 12. Navigation

Use one bottom row:

```text
Home | Search | Recipes | + Add food
```

This is **three destinations and one action**.

Home is initial. `+ Add food` opens the shared entry sheet over the current screen and never becomes selected.

Selected destinations use the current selected-state system: Phosphor bold, action color, visible label, and indicator.

Navigation must remain visually subordinate to content and respect safe areas, keyboard behavior, readable labels, and current UX return/origin rules.

---

## 13. Add Food

The shared Add food sheet offers:
- Search food;
- Scan barcode;
- Take a photo;
- Enter manually.

Methods are equal entry choices. Choosing one starts that path; it does not log food.

Food becomes part of today's committed entries only after the explicit current commit action succeeds.

The sheet preserves context, has clear dismissal, respects bottom safe area, supports content growth, and avoids nested-modal complexity.

---

## 14. Food Review

Food review owns the focused calculation experience.

The user must be able to understand:
- identified food;
- amount;
- unit;
- nutrition basis;
- calorie result;
- available nutrition context.

Food identity and portion remain reviewable/correctable.

A calorie number without portion context is insufficient.

Missing nutrition is unknown, not zero.

Do not invent conversions between grams, milliliters, pieces, and servings.

The calorie task is complete when the intended portion result is available. Adding it to today is optional and explicit.

---

## 15. Recipe Discovery

Recipe discovery supports browsing, search/refinement, visible criteria, result evaluation, details, and no-results recovery.

Result hierarchy:

```text
Recipe identity
→ Suitability evidence
→ Relevant nutrition / preparation facts
→ Supporting imagery / metadata
```

Suitability must be explained using known data and active criteria.

Do not add generic health scores, unexplained match percentages, ratings as suitability, color-only matching, or invented personalization.

Recipe cards prioritize:
1. identity;
2. why it qualifies;
3. relevant calorie/protein/time facts;
4. imagery.

Avoid excessive badges and decorative pills.

---

## 16. Accessibility

Target **WCAG 2.2 AA where applicable to the web prototype**.

Baseline targets:
- normal text: `4.5:1`;
- large text: `3:1`;
- qualifying meaningful non-text UI: `3:1`.

Verify actual rendered foreground/background pairs. A token passing in one context does not make every placement accessible.

Focus must remain visible and unclipped. Color must be supported by labels, markers, structure, or accessible state.

The ring requires readable equivalent text. Icon-only actions require accessible names. Modal/sheet focus behavior must remain logical.

Do not claim complete accessibility from automated checks or native iOS compliance from browser validation.

---

## 17. Responsive and Enlarged Text

Verify important screens with text enlargement up to `200%`.

Check:
- navigation;
- buttons;
- form labels;
- helper/error copy;
- nutrition values;
- chips;
- modal headers;
- ring center content;
- recipe titles/metadata.

Prefer reflow and vertical expansion.

Do not solve text growth by hiding labels, shrinking below the approved scale, clipping essential content, or breaking touch targets.

---

## 18. Motion

Motion must explain change: state transition, navigation continuity, progress update, modal entry/exit, or spatial relationship.

Avoid animation on every card, bouncing icons, looping decoration, excessive spring effects, and number-count animations that delay comprehension.

Respect reduced-motion preferences.

---

## 19. Anti-AI-Slop

Do not introduce:
- generic AI gradients;
- gradient text;
- aurora/mesh backgrounds;
- glassmorphism everywhere;
- neon/glow;
- decorative floating blobs;
- huge marketing headlines;
- oversized rounded cards everywhere;
- card-inside-card layouts;
- arbitrary badges;
- pill-shaped metadata everywhere;
- fake AI insight panels;
- sparkle/magic-wand decoration;
- unnecessary charts;
- progress graphics for every metric;
- fake health scores;
- fake personalization;
- excessive shadows;
- tiny low-contrast grey text;
- competing accent colors;
- decorative gradients without semantic reason;
- ornamental motion.

Do not copy the visual identity of Apple Activity, MyFitnessPal, YAZIO, Lifesum, Cal AI, or other nutrition/fitness dashboards.

Category familiarity is acceptable; category imitation is not differentiation.

---

## 20. Visual Quality Gate

Before accepting a screen, verify:

**Hierarchy**
- primary content/action are obvious;
- supporting elements are quieter;
- nothing competes unnecessarily.

**Typography**
- roles are clear;
- values/units are easy to parse;
- long/enlarged text works.

**Spacing**
- related elements are grouped;
- sections are separated;
- rhythm is deliberate.

**Color**
- accents have semantic purpose;
- nutrition mapping is stable;
- color is never the sole carrier.

**Surfaces**
- every card/container earns its place;
- radius/shadows are restrained;
- depth reflects interaction.

**Mobile**
- targets are sufficient;
- safe areas work;
- sheets/navigation are predictable;
- keyboard does not break layout.

**Accessibility**
- real contrast pairs pass;
- focus is visible;
- 200% text works;
- equivalent non-color meaning exists.

**Anti-slop**
- no effect exists only because it is trendy;
- the screen does not resemble a generic generated dashboard.

---

## 21. Implementation and Status

For meaningful visual changes:

```text
Inspect implementation
→ Check product / UX / design constraints
→ Update tokens/components/composition
→ Update Storybook
→ Render runtime
→ Check responsive + accessibility states
→ Inspect screenshots
→ Refine
```

A successful build does not prove visual quality, UX correctness, accessibility, or responsive robustness.

Storybook and runtime must consume the same implementation.

Use explicit status terms:
- **Accepted** — current contract;
- **Implemented** — observed in current code;
- **Verified** — checked by stated method;
- **Proposed** — not accepted;
- **Unverified** — documented but not proven;
- **Superseded** — replaced by newer authority.

Do not describe accepted-but-unimplemented behavior as implemented.

---

## 22. Source Ownership

| Concern | Source of truth |
| --- | --- |
| Product purpose / scope | `PRODUCT.md` |
| Agent workflow | `AGENTS.md` |
| UX behavior / navigation / states | `docs/ux/` |
| Visual direction / rationale | `docs/design/visual-direction.md` |
| Exact token values | canonical token source |
| DS procedure | `.claude/skills/portion-design-system/SKILL.md` |
| Visual QA / iOS / anti-slop | `.claude/skills/portion-visual-quality/SKILL.md` |
| Implemented API / behavior | source code |
| Live reusable examples | Storybook |
| Integrated behavior | runtime app |

Principle:

```text
PRODUCT.md defines what Portion is.
DESIGN.md maps how it should look and compose.
UX contracts define how it behaves.
Tokens/code define what exists.
Storybook demonstrates reusable behavior.
Runtime proves integration.
```

---

## 23. Design Change Rule

Visual refinement may improve hierarchy, spacing, composition, typography application, density, alignment, state differentiation, component proportions, responsiveness, accessibility, and finish.

It must not silently change:
- product scope;
- user stories;
- navigation architecture;
- amount/unit semantics;
- commit/save behavior;
- cancel/discard behavior;
- recipe-match logic;
- modal ownership;
- validation.

Generic tools such as Impeccable or frontend-design are advisory. They may improve execution inside Portion's approved system; they do not have authority to rebrand or redefine the UX.

---

## 24. Final Standard

The target is not maximum decoration.

The target is **clear, coherent, accessible, product-specific, iOS-aware, restrained, and visually intentional**.

A successful screen feels designed because hierarchy is strong, numbers are readable, grouping is intentional, color is disciplined, surfaces have purpose, spacing is controlled, states are complete, accessibility survives implementation, and nothing exists merely to imitate a trend.
