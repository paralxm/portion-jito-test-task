# Portion Design System

## Purpose

Use this skill when auditing, rebuilding, extending, refactoring, documenting, or visually refining the **Portion** design system.

Portion is a mobile-first calorie-calculation and recipe-discovery product.

The goal is not to create a universal component library.

The goal is to maintain a coherent, reusable, accessible system that directly supports the product's approved user stories, final high-fidelity screens, Storybook documentation, and working React implementation.

This skill is authoritative for design-system decisions unless a more specific, newer project document explicitly supersedes it.

---

## 1. Product Context

Portion supports two primary user stories:

1. Calculate calories for a specific food or dish.
2. Find a recipe that is suitable for the user's selected criteria.

The product should remain focused on these tasks.

Do not expand the product into a generic calorie tracker, fitness dashboard, coaching platform, social product, meal-planning system, or full food diary unless explicitly requested.

The current product direction is:

**Portion — Measured Clarity**

Core qualities:

- precise;
- calm;
- correctable;
- neutral;
- understandable;
- trustworthy;
- mobile-first.

Nutrition information must support decisions without judging the user or labelling food as inherently good or bad.

---

## 2. Source of Truth

Before changing the system, inspect the current repository and relevant project documentation.

Use this priority order:

1. Current product behavior and approved UX contracts.
2. Current design-system source code.
3. Canonical design-token source.
4. Storybook implementation.
5. Current visual-direction / branding documentation.
6. Current approved Figma artifacts.
7. Historical documentation only when still applicable.

Do not allow an older document, screenshot, prototype, or previous navigation model to override a newer approved decision.

When sources conflict:

- identify the conflict;
- determine the latest authoritative decision;
- preserve current working behavior until the conflict is resolved;
- update stale documentation when the task scope allows;
- never silently preserve contradictory rules.

Do not invent missing requirements.

---

## 3. Design-System Principle

Build only abstractions justified by:

- actual reuse;
- repeated behavior;
- semantic consistency;
- independent state logic;
- accessibility requirements;
- meaningful visual-system responsibility.

A component does **not** need to appear on multiple screens to justify extraction if it owns significant behavior, geometry, accessibility semantics, or independent testing.

However, do not promote product-specific composition into the global design system simply because it is visually complex.

Use this hierarchy:

```text
Foundations
    ↓
Primitives
    ↓
Reusable Components
    ↓
Shared Patterns
    ↓
Feature Components
    ↓
Screen Compositions
```

Prefer the lowest appropriate abstraction level.

Do not optimize for component count.

Do not create abstractions only to make the repository look more mature.

---

## 4. Component Placement Rules

### Design-system component

Place a component in the shared design system when it is:

- domain-agnostic;
- reusable across features;
- semantically stable;
- independently testable;
- responsible for shared interaction or visual behavior.

Examples:

- Button
- IconButton
- TextField
- SearchField
- Badge
- FilterChip
- Surface
- ModalSheet
- ProgressRing
- NutritionValue
- NutrientRow
- LoadingState
- EmptyState

### Feature component

Keep a component inside a feature when it contains:

- Portion-specific domain data;
- feature-specific business rules;
- screen-specific composition;
- product semantics not meaningful outside that feature.

Example:

```text
ProgressRing
→ Design System

CalorieProgressRing
→ Home / nutrition feature
```

The generic `ProgressRing` owns circular progress geometry and accessibility.

`CalorieProgressRing` owns calorie-specific content, labels, calorie semantic tokens, remaining/consumed logic, and Home composition.

Do not move a feature component into the design system only to increase reuse metrics.

---

## 5. Approved Visual Foundations

Do not rebrand Portion during design-system work.

### Typography

Primary typeface:

**Inter**

Inter is already approved and must remain the primary product typeface.

Do not:

- introduce a second display font;
- replace Inter because a generic design skill recommends more expressive typography;
- change the approved typography direction without explicit instruction.

Improve typography through:

- hierarchy;
- weight;
- size;
- line-height;
- letter-spacing;
- numeric treatment;
- spacing;
- responsive behavior.

### Icons

Use **Phosphor Icons**.

Default icon weight:

```text
Regular
```

Persistent selected navigation may use:

```text
Bold
```

Use stronger weights only when semantically justified.

Do not use icon-weight changes as decoration.

Icon-only controls require accessible names.

The visible glyph size and interactive touch target are separate concerns.

### Touch targets

Primary interactive target baseline:

```text
48 × 48 CSS px
```

Larger targets may be used where justified.

Do not reduce the hit area merely because the visible icon is 16–24 px.

---

## 6. Tokens

The canonical token source is authoritative.

Use a predictable hierarchy:

```text
reference / primitive
        ↓
semantic
        ↓
component consumption
```

Components should consume semantic tokens wherever possible.

Avoid hard-coded values when an appropriate semantic token already exists.

Do not create a token merely because one literal appears once.

Promote a value into a token when it represents:

- reusable system meaning;
- a repeated foundation;
- a semantic role;
- an intentional system constraint.

Examples:

```text
reference.color.*
semantic.text.*
semantic.surface.*
semantic.border.*
semantic.feedback.*
semantic.progress.*
```

Do not expose raw primitive colors directly inside product components when an appropriate semantic role exists.

Preserve the existing canonical DTCG-based pipeline.

Do not replace the existing token architecture with Style Dictionary or another token framework unless explicitly requested and technically justified by the project.

After token changes:

- validate the token source;
- regenerate outputs;
- run token drift checks;
- verify affected components visually;
- update documentation only where behavior or public contracts changed.

---

## 7. Calorie Progress System

A calorie progress visualization is part of the current product direction.

Implement it in two layers.

### Shared: `ProgressRing`

Responsibilities:

- progress geometry;
- track;
- indicator;
- value normalization;
- clipping;
- 0% state;
- partial state;
- 100% state;
- over-target behavior only if the product contract supports it;
- reduced-motion behavior;
- accessibility semantics;
- responsive rendering.

It must not understand:

- calories;
- macros;
- meals;
- diary data;
- nutrition goals;
- Home-specific copy.

Suggested API direction:

```tsx
<ProgressRing
  value={1350}
  max={2200}
  size="lg"
  aria-label="1350 of 2200 calories consumed"
/>
```

Keep the API minimal.

Do not add circular/linear/radial/segmented variants unless the product actually needs them.

### Feature-specific: `CalorieProgressRing`

Responsibilities:

- calorie-specific semantic tokens;
- consumed / remaining / target content;
- central metric composition;
- product labels;
- Home dashboard composition;
- calorie-specific state mapping.

Use the existing calorie color roles.

Do not pass arbitrary hex values through screen-level props.

If multiple calorie states exist, map them through semantic tokens rather than directly through reference colors.

---

## 8. Color and Accessibility

Color must never be the only carrier of meaning.

Nutrition/progress information should also provide:

- labels;
- values;
- units;
- state text where necessary;
- shape or structural differences where relevant.

Check real foreground/background combinations.

Do not claim accessibility from token values alone.

Verify:

- text contrast;
- meaningful non-text contrast;
- focus appearance;
- disabled states;
- text resizing;
- keyboard interaction;
- modal focus;
- responsive layouts;
- reduced motion.

Automated accessibility tests are evidence, not certification.

Do not use a visual treatment merely because it passes an automated audit if it reduces clarity or usability.

---

## 9. Responsive Rules

Portion is mobile-first.

Representative widths must include:

```text
320 px
390 px
393 px
430 px
```

Check at minimum:

- horizontal overflow;
- text wrapping;
- long titles;
- long labels;
- controls near screen edges;
- safe areas;
- bottom navigation;
- sheets;
- sticky/fixed actions;
- nutrition layouts;
- progress visualizations.

Also test representative enlarged-text scenarios.

Do not assume a successful 393 px screen proves narrow-width resilience.

---

## 10. Storybook Contract

Storybook is the live evidence of the implemented system.

Do not treat Storybook as a static screenshot catalogue.

The hierarchy should reflect actual responsibility.

Example:

```text
Introduction

Foundations
├── Colors
├── Typography
├── Spacing
├── Radius
├── Elevation
├── Icons
└── Accessibility

Components
├── Actions
├── Inputs
├── Selection
├── Navigation
├── Data Display
└── Feedback

Patterns

Features
├── Calorie Calculator
├── Home
└── Recipe Discovery

Screens
```

Only create categories that have actual content.

For every newly created or materially changed shared component, add Storybook evidence appropriate to its behavior.

Possible stories include:

- Default
- Interactive
- Selected
- Disabled
- Loading
- Invalid
- Error
- Empty
- Long Content
- No Image
- Partial Data
- Narrow 320
- Enlarged Text

Do not create every state mechanically.

Only include states that meaningfully apply to the component.

Storybook and the application must consume the same implementation.

Do not duplicate components or visual values solely for Storybook.

---

## 11. Visual Refinement

When using a generic visual-design or frontend-design skill, this skill remains authoritative.

Visual refinement may improve:

- hierarchy;
- spacing;
- composition;
- surface treatment;
- component proportions;
- visual rhythm;
- state clarity;
- micro-polish;
- perceived quality.

Do **not** allow generic visual-design guidance to:

- replace Inter;
- add a second typeface;
- rebrand Portion;
- replace the approved palette;
- introduce arbitrary gradients;
- add decorative effects without product value;
- create a generic fitness-dashboard aesthetic;
- change navigation architecture;
- expand product scope;
- introduce new product concepts merely to make the UI look more sophisticated.

Distinctiveness should come from disciplined composition and a coherent system, not decorative excess.

---

## 12. Component Refactoring

Before extracting or merging components:

1. Inspect current implementations.
2. Identify actual repeated structure or behavior.
3. Check whether differences are intentional.
4. Determine whether the shared concept is domain-agnostic.
5. Preserve feature-level semantics where necessary.
6. Refactor only when the abstraction reduces drift or clarifies ownership.
7. Add or update Storybook coverage.
8. Run visual and behavioral verification.

Do not deduplicate code blindly.

Two similar-looking components may intentionally have different semantics.

Do not promote feature-specific types into the global design system.

---

## 13. States and Data Integrity

Design-system work must preserve product semantics.

Never treat:

```text
missing
```

as equivalent to:

```text
0
```

Do not invent nutrition values.

Do not invent unit conversions.

Do not infer equivalence between:

- grams;
- milliliters;
- pieces;
- servings.

Do not present simulated camera, barcode, recognition, food lookup, or recipe loading as real backend capability.

Operational failures must not appear as nutrition results or no-result states.

---

## 14. Interaction Rules

Preserve current interaction contracts unless the task explicitly changes them.

Important principles:

- visible actions must have meaningful outcomes;
- do not introduce redundant confirmation steps;
- preserve context on Back where the product contract requires it;
- do not make Add food a persistent selected navigation destination;
- modal/sheet cancellation must not silently commit draft state;
- keyboard-focused layouts must remain usable;
- loading must correspond to real asynchronous behavior;
- synchronous calculation should not fake loading;
- prevent duplicate activation where relevant.

---

## 15. Verification Workflow

For a significant design-system change, use this sequence:

```text
Inspect current implementation
        ↓
Define scope and ownership
        ↓
Update tokens if required
        ↓
Implement/refactor component
        ↓
Update Storybook
        ↓
Run token checks
        ↓
Run typecheck
        ↓
Run unit tests
        ↓
Run Storybook tests
        ↓
Run app build
        ↓
Run runtime/browser verification
        ↓
Inspect screenshots visually
        ↓
Fix regressions
        ↓
Update documentation
        ↓
Commit coherently
```

Do not stop after a successful build.

A structurally valid implementation can still be visually broken.

Always inspect affected screens/components after significant layout, token, typography, progress, modal, navigation, or responsive changes.

---

## 16. Browser and Visual QA

Verify the real implementation, not only component source.

Inspect representative:

- Home states;
- search;
- food review;
- manual entry;
- barcode/photo prototype states;
- recipes;
- filtered recipe results;
- recipe details;
- sheets/dialogs;
- ProgressRing / CalorieProgressRing.

Look for:

- clipping;
- overflow;
- spacing collapse;
- unreadable labels;
- incorrect hierarchy;
- contrast regressions;
- focus clipping;
- broken safe-area spacing;
- misaligned fixed/sticky elements;
- state inconsistencies;
- incorrect icon weights;
- unexpected typography fallback;
- layout breakage at enlarged text.

Screenshots are evidence only if they are actually reviewed.

---

## 17. Documentation

Documentation should explain **why**, not duplicate everything that already exists in code or Storybook.

Use this principle:

```text
Markdown explains why.
Code defines what exists.
Storybook shows how it behaves.
```

Keep detailed documentation.

Do not remove useful evidence merely to make the repository appear simpler.

However:

- remove obsolete instructions;
- mark historical decisions as superseded where needed;
- reconcile contradictions;
- avoid duplicate truth owners;
- keep README reviewer-oriented rather than exhaustive.

README should guide reviewers to deeper documentation rather than copy it.

---

## 18. Scope Discipline

Do not add components simply because they exist in mature design systems.

Do not add, unless explicitly required:

- dark mode;
- desktop navigation;
- date picker;
- charts unrelated to current flows;
- sliders;
- data tables;
- pagination;
- notifications;
- authentication;
- account settings;
- social features;
- rewards;
- streaks;
- coaching;
- payment components;
- generic dashboard widgets;
- speculative enterprise components.

Every component must be justified by Portion's current product scope.

---

## 19. AI-Native Working Rules

Use AI to improve speed, analysis, verification, and implementation quality.

Do not use AI as justification for unnecessary output volume.

Prefer:

```text
inspect
→ reason
→ implement
→ verify
→ refine
```

over:

```text
generate many components
→ document them
→ declare completion
```

When a tool, skill, or automated audit conflicts with a visible usability problem, fix the usability problem first.

Metrics such as:

- token-binding percentage;
- component count;
- story count;
- test count;

are supporting evidence, not product goals.

---

## 20. Completion Criteria

A design-system change is complete when:

- component ownership is correct;
- token usage is intentional;
- existing project constraints are preserved;
- relevant states are implemented;
- Storybook evidence exists;
- accessibility behavior is addressed;
- responsive behavior is verified;
- real screens still work;
- visual regressions are resolved;
- code and documentation agree;
- no obsolete duplicate implementation remains;
- no unjustified scope was added.

Do not claim:

- production readiness;
- full accessibility compliance;
- real nutrition accuracy;
- real AI recognition;
- backend completeness;

unless those claims are independently established.

---

## 21. Priority for the Current Rebuild

For the current Portion design-system rebuild, prioritize:

1. Preserve approved product and brand direction.
2. Audit current abstractions before creating new ones.
3. Add the missing `ProgressRing` shared component.
4. Implement `CalorieProgressRing` as a feature composition.
5. Improve visual hierarchy and component polish without rebranding.
6. Ensure calorie-specific semantic colors are used intentionally.
7. Keep Storybook and product screens on the same implementation.
8. Verify mobile widths and enlarged text.
9. Run browser-based visual QA.
10. Resolve stale or contradictory documentation.
11. Avoid adding components that do not serve the actual product.
12. Optimize reviewer-facing quality, not component/test count.
