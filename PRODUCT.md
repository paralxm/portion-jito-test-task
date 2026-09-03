# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People deciding what to eat who want clarity before they eat, in two situations:

- **JTBD 01 (calculate):** When I need to understand the calorie content of a food or dish, I want to identify what I am eating, set the relevant portion, and correct the input if necessary, so I can understand a calorie result that reflects what I actually intend to consume.
- **JTBD 02 (find a recipe):** When I need to find a suitable recipe, I want to narrow the available options by relevant criteria and understand why each option matches them, so I can choose without evaluating every recipe in detail.

Governing HMW: *How might we help users understand the calorie content of a specific food or dish and quickly evaluate which recipes fit their needs, while keeping both experiences clear, efficient, and easy to control?*

## Product Purpose

**Portion** is a food decision tool for people who want clarity before they eat: understand the calories in an intended portion, and choose a recipe with a clear, explainable reason it matches their needs. Food identity and portion are always reviewable and correctable. Neither job requires an account, a daily goal, or logging.

## Positioning

Precise, correctable, neutral — every result carries its amount, unit and basis (a photo/barcode estimate is never presented as exact); identity and portion are corrected near the information they affect; the product describes uncertainty and system conditions without judging the food or the user (no praise, shame, or medical framing).

## Operating Context

- Mobile-first, iOS-oriented product conventions, delivered as a **React/Vite/TypeScript web prototype** — not a native SwiftUI/UIKit build, and never represented as one.
- English-language UI, light theme only (no dark mode).
- Responsive targets include 320 / 390 / 393 / 430 CSS px and content
  reflow at 200% text; software-keyboard and safe-area behavior must be
  verified in the rendered implementation.
software-keyboard and safe-area (`env(safe-area-inset-*)`) aware.
- Fixture/mock-backed behavior: no real recognition, barcode, or nutrition backend. Demo fixtures (`docs/ux/ui-contract.md` §1) are synthetic and must stay independent — e.g. fixture C at 300 g = 540 kcal, fixture R at 300 g = 450 kcal — never derived from one another or from an image.
- Code-first delivery: `src/design-system/` (tokens, primitives, components, patterns) → Storybook (documents/exercises the same components) → `src/features/` (product behavior) → `src/app/` (runtime composition). Figma/FigJam hold branding, research and presentation artifacts; the repository is the implementation source of truth. Code and Figma must not evolve independently.

## Capabilities and Constraints

**Navigation** — one bottom row, three destinations plus one action: **Home | Search | Recipes | + Add food**. Add food opens the single O01 method-choice overlay (Search food, Scan barcode, Take a photo, Enter manually) above the current surface and never becomes a selected destination. Search keeps Food/Recipes scopes; Recipes is query-free browse with optional criteria; Recipe Details retains its originating Search/Recipes selection. Focused acquisition/review steps (S04–S07) have no bottom bar. "Calculate" is a capability, not a destination name.

**Home states**

- **S01-1** — no committed food entries today.
- **S01-2** — one or more committed food entries today.

The earlier current-calculation-based definitions are superseded.

**Calculation** — food/barcode/photo/manual identification produces a reviewable, correctable candidate; portion calculation scales a reference value by desired quantity, only for supported compatible units (no invented g↔ml/piece/serving conversions); missing nutrition is "Not available," never a fabricated zero.

**Recipe discovery** — criteria (calories/protein per serving, preparation time, dietary preference) combine with AND; a match claim requires active criteria and known values; no inferred allergen/dietary safety guarantees.

**Home** — a bounded daily-overview surface supporting both core jobs.

Accepted supporting scope:
- a calorie-progress ring based on explicitly committed food entries;
- an optional user-entered daily calorie goal;
- consumed and remaining calories when a goal is defined;
- compact nutrition context;
- an optional list of today's explicitly committed food entries with edit/removal;
- Add food;
- recipe-discovery entry point.

These are optional, non-prerequisite supporting capabilities.
Neither calorie calculation nor recipe discovery requires a daily goal or logging.

The daily-overview Home is the authoritative product specification.
If the current runtime still renders the older current-calculation Home,
that is an implementation gap, not an unresolved product decision: a daily-overview ring (logged/goal), an optional user-entered daily calorie goal, and an optional list of explicitly logged food entries with edit/removal. These are explicitly **optional, non-prerequisite** supporting context for either job — not a diary, not automatic tracking, not a health score.

**Explicit non-goals** (do not add unless a current authoritative doc says otherwise): accounts/onboarding, a separate Diary/Profile destination, automatic nutrition-goal calculation, exercise adjustment, weight/water/streak tracking, weekly analytics, health scores or medical/diagnostic claims, saved recipe collections, meal planning, recipe authoring, a multi-ingredient builder, social/payment/coaching features, notifications, gamification, dark mode, settings screens, and a production recognition/nutrition backend.

## Brand Commitments

- Product name **Portion**; typographic wordmark **`portion`**, lowercase, Inter Semi Bold, −3% tracking (wordmark-only; no other negative tracking, no mascot/symbol).
- Visual direction: **Measured Clarity** — blue-led actions, white/light-neutral surfaces, neutral (non-tinted) numeric results, restrained geometry (minimal corner rounding, structured alignment), Inter as the sole typeface. Blue is a selected preference, not claimed as inherently more accessible or trustworthy than another hue.
- Icons: `@phosphor-icons/react` only — regular weight by default, bold reserved for persistent selected navigation (never hover/press/focus/loading).

## Evidence on Hand

- Demo fixtures C and R (`docs/ux/ui-contract.md` §1) — synthetic, kept independent of each other.
- Figma Design (branding/stylescape + low-fidelity): `https://www.figma.com/design/heuO3V1WlKG44CukQswCkw/jito-calories-calculator`. FigJam (research/task flows): `https://www.figma.com/board/Np6ZrdnQKjVw7tZw8W51kT/jito-calories-calculator`.
- No real user research/interviews exist — `docs/ux/research/` and `docs/ux/ux-synthesis-and-design-hypotheses.md` are secondary/competitive research and derived hypotheses, not completed usability validation. Do not treat competitor functionality as automatically in scope, and do not describe the Home daily-overview decision as a research finding — it is an explicit, later product decision layered on top of research that favored calculation without mandatory tracking.
- No trademark/domain clearance has been performed for the "Portion" name.

## Product Principles

1. **Correctability over automation.** Every identification (search, barcode, photo, manual) produces a reviewable candidate; the product never treats an estimate as a committed fact.
2. **Neutral numbers, judged nowhere.** Calorie/nutrition values stay visually neutral and are never colored, scored, or framed as praise/shame.
3. **Optional context, not mandatory tracking.** Daily overview, goals, and logging (where accepted) are supporting context — both core jobs complete fully without them.
4. **One destination, one truth.** Exactly one navigation destination is selected at a time; Add food is always an action, never a fourth destination.
5. **Code is the implementation source.** Figma/Storybook document and present the same product; they never substitute for the runtime implementation.

## Accessibility & Inclusion

Target **WCAG 2.2 AA where applicable to the web prototype** (do not claim full compliance from automated checks alone, and do not claim browser accessibility verification establishes native iOS accessibility). Required: semantic HTML, meaningful heading structure, accessible names/labels, full keyboard operability, visible focus (3 px ring, 2 px offset), logical focus order, sufficient contrast, state communicated beyond color alone, reduced-motion support, and content reflow at 200% text. Minimum interaction targets: 48 × 48 CSS px generally, 56 × 56 CSS px for Add food. No medical diagnosis, medical suitability, guaranteed health outcome, or allergen-safety claim may be implied anywhere, including in recipe-match copy.

---

## Resolved Product Decisions

## Resolved Product Decisions

### Home daily overview

The Home daily-overview model is accepted product scope.

It may include:
- optional user-entered daily calorie goal;
- consumed and remaining calorie context;
- calorie progress;
- compact nutrition context;
- today's explicitly committed food entries;
- Add food;
- recipe discovery.

Daily logging and goal-setting remain optional supporting capabilities.
Neither core user job depends on them.

This decision does not expand Portion into:
- a general diary/history product;
- weekly/monthly analytics;
- streak tracking;
- coaching;
- gamification;
- meal planning;
- automatic health judgments;
- a generic calorie-tracking dashboard.

If runtime or Storybook still represents the superseded
current-calculation Home, treat that as an implementation gap.

### Home state semantics

The authoritative state definitions are:

- **S01-1** — no committed food entries today.
- **S01-2** — one or more committed food entries today.

The previous definitions based on current-calculation presence are superseded.

Any current document that still uses the previous definitions should be
aligned before implementation work depending on those states proceeds.