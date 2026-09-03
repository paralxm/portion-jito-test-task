# AGENTS.md

> Repository-level operating contract for AI coding agents working on Portion.

## 1. Purpose

This repository contains the code-first implementation of **Portion**, an iOS-oriented mobile nutrition product prototype for the Jito UX/UI Engineer test task.

The repository is the primary source of truth for implemented UI, design-system code, runtime behavior, Storybook, tests, verification, and implementation status.

When a task belongs in implementation, do not stop at a plan, screenshot, Figma artifact, component inventory, or documentation-only change.

Do not claim the React/browser prototype is a native iOS application.

---

## 2. Product Scope

Portion supports two core user goals:

1. **Calculate calories and nutrition for a food, product, or dish portion.**
2. **Find and evaluate a recipe suitable for the user's current criteria.**

Current characteristics:

- mobile-first;
- iOS-oriented conventions;
- React DOM / Vite / TypeScript;
- Storybook as the live design-system reference;
- English-language UI;
- light theme;
- mock/fixture-backed services where real services are out of scope;
- code-first final UI;
- Figma may be used later for final review/presentation/handoff.

### Accepted Home model

Home is a bounded daily-overview surface supporting the two primary user stories.

It may include:

- calorie progress;
- optional daily calorie target;
- consumed and remaining calories;
- compact nutrition summary;
- today's committed food entries;
- Add food;
- recipe-discovery entry point.

Authoritative states:

- **S01-1 — Home / no committed food entries today**
- **S01-2 — Home / one or more committed food entries today**

This supersedes the older definition based on current-calculation presence.

If runtime still shows the older Home, treat that as an **implementation gap**, not as product truth.

---

## 3. Product Boundaries

Do not expand scope merely to make the demo look more complete.

Unless an authoritative current source explicitly changes scope, do not add:

- authentication/accounts;
- general diary/history;
- historical nutrition analytics;
- weekly/monthly tracking dashboards;
- saved collections;
- social features;
- notifications;
- payments;
- recipe authoring;
- coaching;
- rewards/gamification;
- meal planning;
- health diagnosis;
- medical recommendations;
- allergen-safety guarantees;
- real nutrition backend;
- real barcode/photo-recognition backend;
- desktop-specific navigation;
- dark mode;
- unrelated charts;
- unrelated settings/preferences;
- speculative design-system components with no product use.

### Bounded Home exception

The accepted Home may show daily target/progress, consumed/remaining calories, compact nutrition, and today's entries.

This does **not** authorize historical diary browsing, streaks, coaching, gamification, meal planning, analytics-heavy tracking, automatic health judgments, or a generic calorie-tracker dashboard.

---

## 4. Source of Truth

When sources conflict, use this priority unless the current explicit task overrides it:

1. Current explicit user/reviewer task.
2. Original assignment/delivery requirements.
3. Current accepted product and UX contracts.
4. Current visual-direction and design-system contracts.
5. Canonical design tokens.
6. Actual component/feature implementation.
7. Current Storybook stories.
8. Historical research, old prompts, screenshots, experiments, or archived artifacts.

Do not silently resolve meaningful conflicts.

When a conflict affects implementation:

1. identify it;
2. determine authority;
3. update the owning contract if needed;
4. synchronize dependent code, Storybook, tests, and docs.

---

## 5. Read Only What the Task Needs

Use targeted context.

### Scope / delivery
Read relevant files under:

- `docs/project/`
- `README.md`
- original assignment references if present

### UX / navigation / states
Read:

- `docs/ux/low-fidelity.md`
- `docs/ux/ui-contract.md`
- relevant task-flow docs
- affected feature implementation

### Research rationale
Read only when a decision requires evidence:

- `docs/ux/research/`
- synthesis/hypotheses
- directly relevant competitor research

Competitor behavior is evidence, not automatic Portion scope.

### Visual work
Read:

- `docs/design/visual-direction.md`
- canonical tokens
- affected components/stories
- `.claude/skills/portion-visual-quality/SKILL.md`

### Design-system work
Read:

- current design-system docs
- canonical tokens
- affected source/exports/stories
- `.claude/skills/portion-design-system/SKILL.md`

### Tooling
Inspect:

- `package.json`
- installed versions
- `.storybook/`
- test configuration
- existing scripts

Never assume a tool, package, command, MCP, browser, skill, plugin, or integration exists until observed.

---

## 6. Code-First Workflow

Default order:

```text
accepted UX / visual contracts
        ↓
canonical design tokens
        ↓
React design-system implementation
        ↓
Storybook
        ↓
feature compositions / runtime
        ↓
browser + tests + accessibility verification
        ↓
final reviewed screens transferred to Figma
```

Do not maintain two independently evolving final UIs.

If a visual change is accepted in Figma after code exists:

1. propagate it to owning tokens/components/patterns/features;
2. update Storybook if affected;
3. verify runtime;
4. refresh Figma representation if required.

---

## 7. Ownership

### Repository owns

- canonical implementation;
- tokens;
- reusable components/patterns;
- feature behavior;
- runtime flows;
- Storybook;
- tests;
- executable verification;
- implementation documentation.

### Storybook owns

- live foundations;
- implemented components;
- variants/states;
- interactions;
- accessibility-sensitive examples;
- product compositions used for validation.

Storybook must import the same implementation as the application.

### Figma may own

- branding/stylescape;
- visual exploration;
- UX artifacts;
- final presentation/review;
- handoff representation.

### FigJam may own

- research artifacts;
- task flows;
- diagrams;
- synthesis boards.

Do not substitute Figma, Storybook, or documentation for runtime implementation.

---

## 8. Design-System Architecture

Use Atomic Design as a composition model, not as mandatory folder naming.

Preferred hierarchy:

```text
Foundations
→ Primitives
→ Components
→ Patterns
→ Templates
→ Feature compositions / screens
```

Preserve the existing practical structure where appropriate:

```text
src/
├── app/
├── assets/
├── design-system/
│   ├── tokens/
│   ├── icons/
│   ├── primitives/
│   ├── components/
│   ├── patterns/
│   ├── styles/
│   └── index.ts
└── features/
    ├── calorie-calculator/
    └── recipe-discovery/
```

Only create directories when real content belongs there.

Do not restructure the repository merely to match theoretical taxonomy.

---

## 9. Component Rules

Before adding a component:

1. search for an equivalent;
2. check whether a primitive already covers it;
3. decide whether a pattern/composition is more appropriate;
4. determine state ownership;
5. decide whether the API expresses a stable responsibility;
6. only then add a public component.

A shared component is justified by one or more of:

- reusable responsibility;
- stable semantic API;
- repeated behavior;
- interaction logic worth centralizing;
- accessibility logic worth centralizing;
- shared visual/system behavior.

Do not componentize every wrapper.

Do not leave clearly reusable UI duplicated across screens.

### Generic vs feature-specific

Generic design-system components must not own business logic.

Example:

```text
ProgressRing
→ design system

CalorieProgressRing
→ Home / feature composition
```

`ProgressRing` owns geometry, normalized progress, states, accessibility, and rendering.

`CalorieProgressRing` owns calorie-specific values, labels, semantics, and Home composition.

---

## 10. Component APIs and States

Prefer:

- explicit typed props;
- narrow responsibilities;
- semantic prop names;
- predictable state ownership;
- native HTML semantics where possible;
- children/slots where appropriate;
- realistic content.

Avoid:

- boolean-prop explosions;
- styling props that bypass tokens;
- screenshot-specific APIs;
- giant universal components;
- feature-domain structures inside generic components;
- duplicated state ownership;
- unnecessary abstraction.

Implement only states the product needs.

Relevant examples may include:

- default;
- pressed/active;
- focus-visible;
- disabled;
- loading;
- selected;
- error;
- success;
- empty;
- pending/skeleton;
- long content;
- missing optional content;
- narrow viewport;
- enlarged text;
- dynamic values;
- validation/recovery.

Do not add fake production props only to display arbitrary Storybook states.

---

## 11. Tokens

Maintain one authored canonical token source.

Use deterministic generation when runtime CSS/TypeScript outputs are needed:

```text
canonical tokens
      ↓
generated outputs
      ↓
app + Storybook
```

Prefer tokens for repeatable system decisions:

- colors;
- semantic states;
- typography;
- spacing;
- radius;
- borders;
- focus;
- elevation;
- icon sizing;
- motion where justified;
- reusable layout dimensions.

Use semantic roles in product components where appropriate.

Do not use arbitrary raw values when a suitable token exists.

Do not create a token for every one-off measurement.

A new token must represent a reusable design decision.

---

## 12. Typography and Icons

### Typography

Approved typeface: **Inter**.

Font asset, family name, tokens, CSS registration, and rendered result must agree.

Do not replace Inter because another font is more typical for native iOS.

Verify actual loaded family/weights when typography changes.

Detailed visual rules:

`.claude/skills/portion-visual-quality/SKILL.md`

### Icons

Use **Phosphor Icons**.

Rules:

- prefer official glyphs;
- default primarily uses `regular`;
- persistent selected navigation may use `bold`;
- use the project icon wrapper;
- icon-only controls require accessible names;
- decorative icons must not duplicate screen-reader output;
- sizes follow system rules/tokens;
- do not mix icon libraries without a documented reason.

---

## 13. Layout, Mobile, and iOS Orientation

Prefer reusable layout primitives and gap-based composition.

Use appropriate equivalents of:

- `Stack`;
- `Inline`;
- `Grid`;
- `Container`;
- `Surface`.

Avoid random margins for structural layout.

Account for:

- safe areas;
- bottom navigation;
- sticky/fixed actions;
- scroll containers;
- software keyboard behavior;
- long/dynamic content;
- touch targets.

Primary reference viewport may be **393 × 852**, but the UI must not depend on one exact size.

Representative widths:

- 320;
- 390;
- 393;
- 430 px.

The runtime is web, visually oriented toward iOS.

Distinguish:

1. product-owned UI;
2. browser simulation of platform behavior;
3. actual OS-owned surfaces.

Do not build fake system chrome unless explicitly required.

Do not claim native iOS behavior/accessibility from the web prototype.

Project touch-target baseline: **48 × 48 CSS px**.

Detailed visual/iOS guidance:

`.claude/skills/portion-visual-quality/SKILL.md`

---

## 14. Accessibility

Accessibility is part of design and implementation, not a final polish pass.

Target **WCAG 2.2 AA where applicable to the web prototype**.

Check as relevant:

- semantic HTML;
- headings;
- labels;
- accessible names;
- keyboard operation;
- focus-visible;
- logical focus order;
- contrast;
- readable errors;
- state communication beyond color;
- touch targets;
- disabled/loading semantics;
- screen-reader relationships;
- reduced motion;
- zoom/reflow.

Do not claim full accessibility from automated checks alone.

Do not claim browser verification proves native iOS accessibility.

For contrast, visual hierarchy, enlarged text, and iOS-aware visual QA:

`.claude/skills/portion-visual-quality/SKILL.md`

---

## 15. Nutrition and Data Semantics

Do not imply:

- medical diagnosis;
- medical suitability;
- guaranteed health outcomes;
- allergen safety;
- clinical nutritional advice.

Recipe suitability claims must be based on known recipe data and selected criteria.

Do not fabricate nutrition accuracy.

Never treat:

```text
missing
```

as:

```text
0
```

Do not invent equivalence between grams, milliliters, pieces, or servings.

Forms must use explicit labels and coherent validation.

When validation fails:

- explain the issue;
- preserve recoverable input where appropriate;
- provide an obvious recovery path.

Behavioral details in current UX/UI contracts override generic form conventions.

---

## 16. Fixtures and Feature Ownership

Real backend services remain outside scope unless explicitly introduced.

Use deterministic realistic fixtures for:

- foods;
- nutrition;
- search;
- barcode/photo simulations;
- recipes;
- filters;
- details;
- empty/error/loading states.

Keep fixture data outside generic design-system components.

Do not present simulated services as real integrations.

### Calorie/nutrition feature owns

- food candidate;
- portion/reference validation;
- amount/unit handling;
- nutrition calculation/formatting;
- review/correction;
- committed result;
- service adapters/fixtures;
- calorie-specific feature composition.

### Recipe feature owns

- browse/search criteria;
- draft vs applied filters;
- result matching;
- suitability evidence;
- recipe mapping/details;
- service adapters/fixtures.

Generic controls belong in the design system when reusable.

Do not encode recipe matching inside a generic `RecipeCard`.

---

## 17. Navigation and Flow Integrity

Do not change navigation, entry points, cancel/discard behavior, recovery routes, or state transitions as a side effect of visual work.

Behavior changes require updating the owning UX/UI contract.

Current authoritative Home states:

- **S01-1 — no committed food entries today**
- **S01-2 — one or more committed food entries today**

The older current-calculation-based definition is superseded.

If runtime still implements the older Home:

1. treat it as an implementation gap;
2. preserve accepted UX contracts;
3. update runtime, Storybook, tests, and affected docs together when implementation is authorized.

Do not infer navigation from an old screenshot.

Do not create duplicate navigation/search shells when the app already owns one shared destination.

---

## 18. Storybook

Storybook is mandatory and evolves with implementation.

A changed public component is not complete if Storybook is stale.

Where applicable, stories should demonstrate:

- purpose;
- primary variants;
- meaningful states;
- typed props/controls;
- realistic content;
- accessibility-sensitive behavior;
- relevant interactions;
- important restrictions;
- meaningful edge cases.

Do not create a Cartesian explosion of every prop combination.

Stories must import the real implementation.

Interactive controls must actually update in the story harness.

Use realistic Portion fixtures where content affects behavior.

Recommended high-level hierarchy:

```text
Start Here
Foundations
Primitives
Components
Patterns
Templates
Product Compositions
```

Use the actual existing Storybook naming structure.

---

## 19. Documentation

Avoid duplicate truth owners.

### Source code owns

- TypeScript types/interfaces;
- implementation details;
- concise non-obvious comments.

### Storybook owns

- live examples;
- variants/states;
- interactions;
- rendered foundations;
- accessibility-sensitive examples.

### Markdown docs own

- rationale;
- architecture;
- token philosophy;
- system-wide conventions;
- major decisions;
- verification status;
- resumable implementation status.

Use this rule:

```text
Markdown explains why.
Code defines what exists.
Storybook shows how it behaves.
```

Keep useful documentation.

Remove, reconcile, or mark:

- obsolete instructions;
- superseded behavior;
- contradictions;
- duplicate truth owners.

README should be reviewer-oriented and link to deeper documentation instead of duplicating it.

Use accurate status language:

- **Documented**
- **Observed in current code**
- **Proposed**
- **Platform mapping**
- **Unverified**
- **Out of scope**

Do not write `implemented`, `verified`, `accessible`, `production-ready`, or `complete` without evidence.

---

## 20. Styling, Dependencies, and Tools

### Styling

Use the established project styling approach.

Prefer:

- tokens;
- reusable variants;
- class/state composition;
- predictable selectors;
- minimal specificity.

Avoid:

- unexplained magic numbers;
- arbitrary hard-coded colors;
- duplicated shared CSS;
- excessive inline styles;
- routine `!important`;
- selectors coupled to accidental DOM structure.

### Dependencies

Before adding one:

1. inspect `package.json`;
2. confirm versions;
3. explain the need;
4. prefer existing dependencies where appropriate;
5. avoid heavy packages for trivial behavior;
6. avoid redundant libraries.

### Skills and tools

Treat these concepts separately:

- Storybook = project tooling;
- Figma MCP = integration;
- browser tooling = runtime inspection;
- skill/plugin = procedural capability;
- AI agent = executor.

Project-specific skills:

- `.claude/skills/portion-design-system/SKILL.md`
- `.claude/skills/portion-visual-quality/SKILL.md`

Generic tools such as Impeccable/frontend-design are advisory and must not override Portion's scope, typography, palette, navigation, semantic token logic, accessibility constraints, or UX contracts.

---

## 21. Figma

Figma is secondary to code for final product UI.

Use it for:

- branding/stylescape;
- visual exploration;
- UX artifacts;
- final UI review/presentation;
- transfer of verified coded screens for handoff.

Do not use Figma to avoid requested React implementation.

Do not overwrite accepted UX artifacts to match accidental implementation mistakes.

When code and accepted design differ, determine which source owns the decision before changing either.

---

## 22. Testing and Verification

Testing must be proportional to behavior.

Possible layers:

- token/schema validation;
- TypeScript checks;
- unit/domain tests;
- Storybook interaction tests;
- accessibility checks;
- browser/runtime verification;
- build verification;
- visual inspection.

Do not add tests merely to inflate counts.

Prioritize behavior that can regress:

- parsing;
- calculation;
- filtering;
- state transitions;
- controlled forms;
- accessibility interactions;
- composition behavior.

Never invent commands. Inspect `package.json` first.

Run the strongest relevant available checks.

If a check cannot run:

- state which one;
- state why;
- do not mark it passing.

A passing build does not establish visual correctness, UX correctness, accessibility, or product completeness.

---

## 23. Browser and Visual Verification

For meaningful UI changes, inspect the rendered implementation.

Verify where relevant:

- layout;
- overflow;
- wrapping;
- sticky/fixed positioning;
- safe areas;
- state transitions;
- focus;
- keyboard behavior;
- loading/error/empty states;
- long labels/data;
- dynamic content;
- enlarged text;
- 320/390/393/430 widths.

Visual inspection remains required even when automated checks pass.

For detailed visual QA:

`.claude/skills/portion-visual-quality/SKILL.md`

Do not report screenshot review as an automated test.

---

## 24. Implementation Slices

For each meaningful public capability:

1. identify requirement and owner;
2. inspect existing implementation;
3. update source/styles;
4. update types;
5. update public export when appropriate;
6. update consumers;
7. update Storybook;
8. add/update focused tests where useful;
9. update docs if behavior/system rules changed;
10. run focused verification;
11. only then move to the next slice.

Keep source, Storybook, docs, and verification synchronized.

Public design-system exports must not expose stories, fixtures, test helpers, Storybook-only catalogues, internal adapters, or private utilities.

---

## 25. Repository Hygiene

Place files in their owning directory immediately.

Do not leave:

- root scratch files;
- temporary chat exports;
- duplicate component trees;
- orphaned stories;
- unused fixtures;
- dead routes.

When public behavior changes, check affected:

```text
source
types
styles
tokens
exports
stories
tests
fixtures
consumers
documentation
```

Remove obsolete code when replacement is complete and safe.

Do not delete research/UX history merely because it is not runtime code.

Use clear English responsibility-based names.

Good examples:

- `NutritionSummary`
- `FoodResultRow`
- `RecipeFiltersSheet`
- `AmountField`
- `FocusedFlowLayout`
- `ProgressRing`
- `CalorieProgressRing`

Avoid names such as `CardNew`, `Box2`, `WrapperFinal`, or `Component123`.

---

## 26. Complexity, UX Integrity, and Security

Choose the smallest architecture that keeps responsibilities clear.

Avoid production-scale complexity without current benefit, including:

- global state libraries for trivial local state;
- unnecessary service abstraction;
- premature virtualization;
- micro-frontends;
- unnecessary dependency injection;
- generalized schema engines for a few static cases;
- excessive memoization.

Do not hard-code feature behavior into giant screen components.

Visual work must not silently change:

- entry points;
- recovery paths;
- Apply behavior;
- cancel/discard semantics;
- amount/unit behavior;
- recipe-match definition;
- navigation ownership;
- modal semantics;
- validation rules.

Screenshots/Figma frames are visual evidence, not complete behavioral specifications.

Never commit secrets, credentials, API keys, private environment values, or session data.

---

## 27. Git and Failure Handling

Before broad edits:

- inspect current branch;
- inspect working tree;
- avoid overwriting unrelated work.

When commits are part of the task, keep related source, stories, tests, exports, and docs together.

Never claim commit/push success unless verified.

Never force-push, rewrite history, delete branches, or discard unrelated work without explicit authorization.

When something fails:

1. inspect the error;
2. determine whether it is code/config/version/environment/tooling;
3. make the smallest justified fix;
4. rerun the relevant check;
5. report unresolved blockers accurately.

Do not weaken meaningful verification merely to obtain green output.

---

## 28. Definition of Done

### Reusable design-system capability

Complete when applicable:

- owner/layer is correct;
- implementation exists;
- canonical tokens are used;
- API is coherent;
- accessibility behavior is addressed;
- public export is correct;
- real consumers use it;
- Storybook demonstrates it;
- meaningful states are covered;
- focused tests exist where warranted;
- rendered behavior has been inspected;
- docs are synchronized;
- no duplicate implementation was introduced.

### Feature change

Complete when applicable:

- accepted UX is preserved or deliberately updated;
- state ownership is clear;
- design-system reuse is appropriate;
- feature logic remains outside generic components;
- mock boundaries are honest;
- important recovery routes work;
- Storybook/runtime are updated;
- relevant checks pass;
- mobile rendering is inspected;
- docs are updated when contracts changed.

### Token/foundation change

Requires:

- canonical source updated;
- no duplicate source of truth;
- generated artifacts updated deterministically;
- app/Storybook consumers updated;
- affected states reviewed;
- contrast/accessibility consequences checked;
- docs updated if system rules changed.

---

## 29. Project-Specific Non-Goals

Do not use this project as an opportunity to:

- rebrand Portion;
- replace approved typography;
- introduce unrelated color systems;
- turn the app into a generic calorie-tracker dashboard;
- expand bounded Home daily context into diary/history/coaching;
- copy competitor identity;
- add gamification;
- add landing-page visual effects;
- add decorative motion without product need;
- inflate the component catalogue;
- create a second showcase app;
- create production-visible debug controls;
- substitute Figma for code;
- substitute Storybook for runtime;
- substitute documentation for implementation;
- claim native iOS delivery from the React web prototype.

The approved calorie-progress ring and bounded Home daily context are allowed. The prohibition applies to unjustified scope expansion.

---

## 30. Completion Report

For non-trivial tasks, report concisely:

1. **Changed** — files/capabilities changed.
2. **Behavior** — user/system behavior changed.
3. **Storybook** — stories/docs updated.
4. **Verification** — exact checks run and results.
5. **Unverified / blocked** — anything not proven.
6. **Next action** — only when a concrete remaining step exists.

Do not return a vague `done`.

---

## 31. Final Rule

**Prefer evidence over assumption, reuse over duplication, product behavior over screenshot matching, and complete implementation slices over broad unfinished scaffolding.**

The desired outcome is not the largest repository.

The desired outcome is a coherent, documented, accessible, code-first Portion system in which:

```text
UX contracts
→ tokens
→ components
→ Storybook
→ feature compositions
→ runtime
→ verification
```

remain synchronized.
