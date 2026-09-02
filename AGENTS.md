# AGENTS.md

> Repository-level operating contract for AI coding agents working on Portion.

## 1. Purpose

This repository contains the code-first implementation of **Portion**, an iOS-oriented mobile nutrition product prototype created for the Jito UX/UI Engineer test task.

The repository is the primary source of truth for the implemented design system, reusable UI, runtime product behavior, Storybook documentation, verification, and implementation status.

AI agents working in this repository must implement changes in the real codebase. Do not stop at plans, pseudo-code, screenshots, Figma-only output, component inventories, or documentation when the requested work belongs in the implementation.

---

## 2. Product scope

Portion currently supports two core user goals:

1. **Calculate calories and nutrition for a food, product, or dish portion.**
2. **Find and evaluate a recipe suitable for the user's current criteria.**

Current product characteristics:

- mobile-first
- iOS-oriented product conventions
- React DOM / Vite implementation
- TypeScript
- Storybook as the live design-system reference
- English-language UI
- light theme
- fixture/mock-backed behavior where real services are not part of the task
- code-first final UI implementation
- final reviewed screens may later be transferred to Figma for presentation and handoff

This repository is **not** a native SwiftUI/UIKit application unless the project is explicitly migrated in a separate approved task.

Do not claim that the browser implementation is a native iOS build.

---

## 3. Product boundaries

Do not expand product scope merely to make the demo appear more complete.

Unless a current authoritative project document or explicit task says otherwise, do not add:

- authentication or accounts
- diary/history systems
- daily calorie goals
- saved collections
- social features
- notifications
- payments
- recipe authoring
- coaching
- rewards/gamification
- meal planning
- health diagnosis
- medical recommendations
- allergen-safety guarantees
- a real nutrition backend
- a real barcode/photo recognition backend
- desktop-specific navigation
- dark mode
- charts
- settings screens
- unrelated preferences
- artificial design-system components that have no product use

A reusable design system is required, but it must serve the actual Portion product scope rather than become a generic UI catalogue.

---

## 4. Agent operating principle

For every task:

1. Inspect before editing.
2. Find the owning source of truth.
3. Understand the current implementation.
4. Make the smallest coherent complete change.
5. Reuse existing tokens, components, patterns, and conventions where appropriate.
6. Update implementation, Storybook, tests, exports, and documentation together when they are affected.
7. Run appropriate verification.
8. Report what was actually verified.
9. Never represent proposed, documented, or untested behavior as implemented.

Do not rewrite working architecture simply because another architecture is familiar.

Do not create parallel implementations of the same capability.

---

## 5. Mandatory initial inspection

Before making significant changes, inspect the repository root and relevant files.

At minimum, check the files that actually exist from this list:

- `AGENTS.md`
- `CLAUDE.md`
- `README.md`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `vite.config.ts`
- `vitest.config.ts`
- `.storybook/main.ts`
- `.storybook/preview.ts`
- `.storybook/preview.tsx`
- `docs/project/`
- `docs/ux/`
- `docs/design/`
- `src/design-system/`
- `src/features/`
- `src/app/`

Do not assume a directory, component, token, story, package, script, integration, test runner, browser binary, MCP server, or skill is available until it has been observed.

Do not create a duplicate configuration file because an online guide uses a different filename.

---

## 6. Source-of-truth hierarchy

When information conflicts, use this priority unless a current explicit task overrides it:

1. Current explicit task from the user/reviewer.
2. Original assignment/delivery requirements.
3. Current accepted product and UX contracts.
4. Current visual-direction and design-system contracts.
5. Canonical design tokens.
6. Actual component/feature implementation.
7. Current Storybook stories demonstrating that implementation.
8. Historical research, experiments, old prompts, screenshots, or archived artifacts.

Do not silently choose between meaningful conflicting requirements.

If a conflict affects implementation:

- identify it,
- determine which source has authority,
- update the owning contract if the product decision changes,
- keep dependent implementation synchronized.

---

## 7. Read by responsibility

Use targeted context rather than reading the entire repository for every small task.

### Scope or delivery

Read the relevant existing files under:

- `docs/project/`
- `README.md`
- original assignment references if present

### Navigation, flows, states, recovery, data semantics

Read the relevant current files under:

- `docs/ux/low-fidelity.md`
- `docs/ux/ui-contract.md`
- applicable task-flow documentation
- affected feature implementation

### Research rationale

Read only when a decision requires research evidence:

- `docs/ux/research/`
- UX synthesis / hypotheses documents
- competitor research that is directly relevant

Competitor functionality is evidence, not automatic Portion scope.

Do not convert an observed competitor pattern into a product requirement without an explicit rationale.

### Visual foundations

Read:

- `docs/design/visual-direction.md`
- canonical token source
- affected design-system components
- affected stories

### Design-system architecture

Read:

- current design-system documentation
- canonical tokens
- affected source
- public exports
- related Storybook stories

### Storybook / testing / tooling

Inspect:

- `package.json`
- installed dependency versions
- `.storybook/`
- test configuration
- existing scripts

Use APIs compatible with installed versions.

Do not paste setup instructions for a different Storybook/Vite/Vitest generation without checking compatibility.

---

## 8. Code-first execution order

This project is code-first for the design system and final product UI.

Default execution order:

```text
accepted UX / visual contracts
        ↓
canonical design tokens
        ↓
React design-system implementation
        ↓
Storybook documentation + interaction examples
        ↓
feature compositions and runtime screens
        ↓
browser / test / accessibility verification
        ↓
final reviewed screens transferred to Figma
```

Exceptions are allowed when the task specifically concerns an existing Figma/UX artifact.

Do not maintain two independently evolving final UIs.

If a final visual change is accepted in Figma after a coded screen exists:

1. propagate the decision back to its owning token/component/pattern/feature code;
2. update Storybook where relevant;
3. verify the runtime;
4. refresh the Figma representation if required.

---

## 9. Responsibility boundaries

### Repository

Owns:

- canonical implementation
- design tokens
- reusable components
- patterns
- feature behavior
- runtime flows
- Storybook
- tests
- executable verification
- implementation documentation

### Storybook

Owns the live reference for implemented UI:

- foundations
- components
- variants
- states
- interactions
- accessibility-sensitive behavior
- product compositions used for system validation

Storybook must consume the same implementation as the application.

Never build a visually separate Storybook-only copy of a component.

### Figma Design

May own:

- branding / stylescape
- visual exploration
- existing approved UX artifacts
- final screen presentation/review
- handoff representation

Figma is not the source of an independently maintained second production implementation.

### FigJam

May own:

- research artifacts
- task flows
- diagrams
- synthesis boards

Do not use FigJam as the implementation source for component APIs.

---

## 10. Design-system architecture

Use Atomic Design as a **composition model**, not as a reason to force every file into theoretical categories.

Preferred conceptual hierarchy:

```text
Foundations
→ Atoms / primitives
→ Molecules / focused components
→ Organisms / shared patterns
→ Templates / layout contracts
→ Product compositions / screens
```

If the repository already uses clearer practical names such as:

```text
tokens/
icons/
primitives/
components/
patterns/
features/
```

preserve that organization.

Do not rename the entire repository merely to match Atomic Design terminology.

### Foundations

Contain cross-cutting system rules:

- tokens
- colors
- typography
- spacing
- radius
- borders
- elevation
- focus
- iconography
- layout
- motion where justified
- accessibility/platform mapping

### Primitives

Small reusable building blocks with stable responsibilities.

Examples:

- `Text`
- `Heading`
- `Icon`
- `VisuallyHidden`
- `Separator`
- `Button`
- `IconButton`
- `Link`
- `Input`
- `Checkbox`
- `Radio`
- `Stack`
- `Inline`
- `Grid`
- `Container`
- `Surface`
- simple progress primitives

### Components

Focused reusable UI compositions.

Examples may include:

- `FormField`
- `SearchField`
- `AmountField`
- unit control
- chips
- method rows
- food result rows
- nutrient rows
- recipe cards

### Patterns

Reusable interface regions and behavioral compositions.

Examples may include:

- navigation
- modal/bottom sheet
- nutrition summary
- filter sheet
- confirmation/discard dialog
- food review panel
- layout shells

### Features

Own product behavior and orchestration.

Current primary domains:

- calorie / nutrition calculation
- recipe discovery

Feature code may compose design-system primitives/components/patterns but must not silently fork them.

### App layer

Owns application-wide composition such as:

- top-level navigation
- shared origin/return behavior
- runtime integration
- app shell
- coordination of capabilities shared across features

---

## 11. Preferred repository placement

Use the existing equivalent structure if it already exists. Do not create duplicate trees.

Expected responsibilities:

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

.storybook/
docs/
├── project/
├── ux/
└── design/

scripts/
```

Only create a directory when real code/documentation will live there.

Do not create empty architecture for appearance.

---

## 12. Canonical token policy

Maintain one authored canonical token source.

Do not maintain several hand-edited representations of the same values.

When generated CSS/TypeScript representations are needed:

```text
canonical authored tokens
        ↓
deterministic generation
        ↓
generated runtime consumers
```

Generated files must be clearly identifiable.

The application and Storybook must consume the same values.

### Token usage

Prefer tokens for repeatable system values including:

- foreground/background colors
- semantic states
- typography
- spacing
- radius
- borders
- focus
- elevation
- icon sizing
- motion where applicable
- reusable layout dimensions

Do not introduce arbitrary raw values when an appropriate semantic/system token exists.

Do not create a token for every single one-off measurement.

A new token must represent a reusable design decision.

### Current spacing contract

The approved implementation brief uses:

```text
0
4
8
12
16
24
32 px
```

Do not treat `9999px`/`full` radius as a spacing token.

If the actual canonical token file differs, inspect the current authoritative documentation before changing it.

---

## 13. Typography

Use the approved project typography.

Current project direction uses **Inter**.

Font family name, loaded font asset, token definitions, CSS registration, and rendered result must agree.

Do not assume that declaring `font-family: Inter` proves the font is actually loaded.

Verify available weights and rendered behavior when typography work is part of the task.

Do not replace the approved typography merely because another font is more common for native iOS.

---

## 14. Iconography

Use **Phosphor Icons** as the project icon system unless explicitly changed by an authoritative project decision.

Rules:

- prefer official Phosphor glyphs
- default states primarily use `regular`
- active/emphasized states may use `bold`
- use the project icon wrapper rather than scattering direct library assumptions through feature code
- interactive icon-only controls require accessible names
- decorative icons must not add redundant screen-reader output
- icon size must follow system rules/tokens
- do not mix unrelated icon libraries without a documented reason

The design system may expose a searchable catalogue of at least **80 relevant distinct Phosphor glyphs** for discovery/documentation.

Do not create 80 hand-written wrapper component files.

Keep large icon catalogue/manifest data out of the production public entry point when it is only needed by Storybook.

---

## 15. Component creation rule

Before creating a component:

1. Search for an existing equivalent.
2. Check whether an existing primitive can cover the requirement.
3. Check whether a composition/pattern is more appropriate than a new primitive.
4. Determine who owns state.
5. Determine whether the API is reusable beyond one screenshot.
6. Only then add a new public component.

Create a component when it provides at least one of:

- reusable responsibility
- stable semantic API
- repeated behavior
- interaction logic worth centralizing
- accessibility logic worth centralizing
- consistent visual/system behavior

Do not componentize every wrapper or decorative fragment.

Do not leave repeated product UI as one-off screen code when a stable shared responsibility clearly exists.

---

## 16. Component API rules

Prefer:

- explicit typed props
- narrow responsibilities
- semantic prop names
- controlled/uncontrolled behavior only where justified
- predictable state ownership
- composition through children/slots where appropriate
- native HTML semantics whenever possible
- forward-compatible content handling
- real product language and fixtures

Avoid:

- boolean-prop explosions
- styling props that bypass the token system
- APIs designed only to reproduce one screenshot
- giant “universal” components
- deeply coupled feature data structures in generic design-system components
- unnecessary generic abstractions
- hidden side effects
- duplicated state ownership

A design-system component should not know product business logic unless it is intentionally a feature component.

---

## 17. Component state coverage

Implement only states that the product actually needs.

Depending on the component, relevant coverage may include:

- default
- hover where applicable to browser review
- pressed/active
- focus-visible
- disabled
- loading
- selected
- error
- success
- empty
- pending/skeleton
- long content
- missing optional content
- narrow viewport behavior
- dynamic values
- validation/recovery states

Do not create fake production props solely so Storybook can display an arbitrary state.

Skeleton is a pending-data state, not a substitute for empty content or a missing image.

---

## 18. Layout rules

Use reusable layout primitives and clear composition.

Prefer:

- `Stack`
- `Inline`
- `Grid`
- `Container`
- `Surface`
- gap-based layouts
- logical composition
- predictable wrapping and shrink behavior

Avoid using random margins to construct structural relationships that belong to layout primitives.

### Mobile concerns

Account for:

- safe areas
- bottom navigation
- sticky/fixed actions
- scroll containers
- content underlays
- virtual keyboard behavior where applicable
- long content
- dynamic text
- touch target size

Primary reference viewport may be **393 × 852**, but components must not break simply because the viewport differs from that exact size.

The browser prototype should emulate required product behavior without pretending browser chrome/system surfaces are custom product UI.

---

## 19. iOS-oriented behavior

The target product direction is iOS, while the current runtime is web.

Respect iOS-oriented product conventions where documented, but keep platform ownership clear.

Distinguish:

1. Product-owned UI.
2. Browser simulation of native/platform behavior.
3. Actual OS-owned surfaces.

Examples of platform-owned concerns may include:

- camera permission
- system keyboard
- native picker behavior
- status/navigation system surfaces

Do not reproduce system UI as fake custom product components unless the prototype explicitly requires a simulation.

Do not claim native accessibility or native system behavior has been verified from a browser build.

---

## 20. Accessibility

Accessibility is a design and implementation requirement, not a final polish pass.

Target **WCAG 2.2 AA where applicable to the web prototype**.

Relevant checks include:

- semantic HTML
- meaningful heading structure
- labels
- accessible names
- keyboard interaction
- focus-visible behavior
- logical focus order
- sufficient contrast
- readable error messaging
- state communication beyond color
- touch target dimensions
- disabled semantics
- loading semantics
- screen-reader-friendly relationships
- reduced-motion behavior where motion exists
- content zoom/reflow where applicable

Do not claim complete WCAG compliance from automated tests alone.

Do not claim browser accessibility verification establishes native iOS accessibility compliance.

### Health/nutrition communication

Do not imply:

- medical diagnosis
- medical suitability
- guaranteed health outcomes
- allergen safety
- clinical nutritional advice

Recipe matching claims must be limited to known recipe data and explicitly selected criteria.

---

## 21. Forms and input behavior

Use semantic fields and explicit labeling.

Maintain one coherent numeric parsing/validation policy across related numeric fields.

Do not silently parse invalid mixed formats.

Preserve incomplete user drafts while typing when required by the current interaction contract rather than aggressively rewriting every keystroke.

Display:

- value
- unit
- reference basis

in an understandable relationship.

Do not make dense nutrition information announce every number on every keystroke.

When validation fails:

- explain the issue,
- preserve recoverable user input where appropriate,
- provide an obvious recovery path.

Behavioral details in the current UI contract override generic form conventions.

---

## 22. Product data and fixtures

Real backend services are outside the current implementation unless explicitly introduced.

Use realistic deterministic fixtures for:

- foods
- nutrition values
- search results
- barcode/photo simulations
- recipe results
- filters
- recipe details
- empty/error/loading scenarios

Keep fixture data separate from reusable design-system components.

Do not present mock service behavior as a real connected backend.

Do not fabricate nutrition accuracy claims.

---

## 23. Feature ownership

### Calorie / nutrition calculation

Feature code owns domain behavior such as:

- entered/selected food candidate
- portion/reference validation
- amount/unit handling
- nutrition calculation/formatting
- review/correction state
- committed result state
- service adapters and fixtures

Generic UI such as input, chips, rows, sheets, and buttons belongs in the design system when reusable.

### Recipe discovery

Feature code owns domain behavior such as:

- browse/search criteria
- draft vs applied filters
- result matching
- suitability evidence
- recipe presentation mapping
- recipe details
- service adapters and fixtures

Do not encode recipe matching rules inside a generic `RecipeCard`.

---

## 24. Navigation and flow integrity

Do not change navigation, entry points, state transitions, cancel/discard behavior, or recovery routes as a side effect of a visual refactor.

A behavior change requires updating the owning UX/UI contract.

Current product documentation establishes root destinations and entry methods. Read it before changing navigation.

Do not infer the current navigation model from one old screenshot.

Do not create competing search/navigation shells in separate features when the application owns one shared destination.

---

## 25. Storybook contract

Storybook is mandatory and must evolve alongside implementation.

A public reusable component is not complete when its real implementation changed but its Storybook representation is stale.

For each applicable public component, Storybook should concisely demonstrate:

1. purpose / usage
2. primary variants
3. meaningful states
4. typed props / controls
5. realistic content
6. token relationships where useful
7. accessibility-sensitive behavior
8. relevant interactions
9. important restrictions
10. edge cases that matter to Portion

Do not produce a Cartesian explosion of every prop combination.

### Recommended Storybook information architecture

```text
Start Here
Foundations
  Colors
  Typography
  Icons
  Spacing / Grid / Layout
  Radius
  Borders / Focus / Layers
  Motion / Transitions
  Accessibility / Platform Mapping
Primitives / Atoms
Components / Molecules
Patterns / Organisms
Templates
Product Compositions
```

Use the actual naming structure supported by the existing Storybook setup.

### Story behavior

Stories must import the real implementation.

Controlled interactive fields should actually update in the story harness.

An input whose `onChange` only logs an event while its value is frozen is not a valid interaction demonstration.

Use realistic Portion fixtures rather than `Lorem ipsum` when realistic content is relevant to behavior.

---

## 26. Storybook and source documentation boundaries

Avoid duplicating the same information in many places.

### Source code should own

- TypeScript types
- public interfaces
- implementation details
- concise non-obvious comments
- behavior that must remain adjacent to code

### Storybook should own

- live visual examples
- variants
- states
- interaction demonstrations
- component usage examples
- rendered foundations
- accessibility-sensitive examples

### Markdown design-system documentation should own

- architecture
- principles
- token philosophy
- placement map
- system-wide conventions
- cross-component rules
- major decisions
- verification status
- coverage mapping
- resumable implementation status

Do not rewrite the entire API documentation in Markdown if typed source and Storybook already communicate it.

---

## 27. Implementation slice rule

Do not build the entire component catalogue first and postpone Storybook/documentation until the end.

For each public capability:

1. identify requirement and owner;
2. inspect existing implementation;
3. implement/update source and styles;
4. update types;
5. update public export when appropriate;
6. update affected consumers;
7. create/update adjacent story;
8. add/update focused tests where useful;
9. update documentation if public/system behavior changed;
10. run focused verification;
11. only then move to the next coherent slice.

This keeps implementation, Storybook, documentation, and verification synchronized.

---

## 28. Public exports

Use deliberate public exports.

`src/design-system/index.ts` or the current equivalent should expose only supported public capabilities.

Do not export:

- stories
- fixtures
- test helpers
- internal style helpers
- Storybook-only icon catalogues
- internal feature adapters
- implementation-private utilities

Avoid barrel import cycles.

Internal design-system modules may use direct local imports when that keeps dependency direction clear.

---

## 29. Styling rules

Use the established project styling approach.

Do not add a new styling framework simply because it is familiar.

Do not mix multiple competing approaches without a concrete requirement.

Prefer:

- tokens
- reusable variants
- class/state composition
- predictable selectors
- semantic data attributes where useful
- minimal specificity

Avoid:

- unexplained magic numbers
- arbitrary hard-coded colors
- per-screen duplicated CSS for shared components
- excessive inline styles
- `!important` as a normal solution
- DOM selectors coupled to accidental structure

---

## 30. Dependency rules

Do not install a package before verifying that existing dependencies cannot reasonably satisfy the requirement.

Before adding a dependency:

1. inspect `package.json`;
2. confirm current framework/tool versions;
3. explain the implementation need;
4. prefer an existing dependency when appropriate;
5. avoid large packages for trivial behavior;
6. avoid redundant libraries serving the same purpose.

Never claim a dependency or plugin exists without observing it.

Do not install paid services or connect external accounts without explicit authorization.

---

## 31. Skills, MCPs, and agent tools

Use available tools only when they materially help the task.

Do not treat these concepts as interchangeable:

- Storybook = project tooling
- Figma MCP = integration
- Chrome/browser tooling = runtime inspection
- skill/plugin = procedural capability
- AI coding agent = executor

When a skill/plugin is used:

- verify it actually exists;
- follow its current instructions;
- do not let generic guidance override Portion's approved contracts;
- do not expand product scope because a design skill suggests decorative features.

Missing optional tools are not a reason to stop after producing a plan.

---

## 32. Figma usage

Figma is secondary to the implemented code for final product UI in this project.

Use Figma when the task requires:

- inspecting an approved design artifact
- branding/stylescape work
- existing UX artifact work
- final UI review/presentation
- transferring verified coded screens for review/handoff

Do not use Figma as an excuse to avoid implementing the requested React UI.

Do not overwrite approved UX artifacts merely to make them match an accidental implementation mistake.

When code and accepted design differ, determine which source owns the decision before changing either.

---

## 33. Testing strategy

Testing must be proportional to the behavior.

Potential layers include:

- token/schema validation
- TypeScript checks
- unit/domain tests
- component interaction tests
- Storybook interaction tests
- accessibility checks
- browser/runtime inspection
- build verification

Do not add tests merely to inflate coverage.

Prioritize behavior that can regress:

- parsing
- calculation
- filtering
- state transitions
- controlled form behavior
- accessibility interactions
- composition behavior

Visual inspection is still required for meaningful UI changes.

A passing build alone does not establish visual correctness, UX correctness, accessibility, or product completeness.

---

## 34. Verification commands

Never invent or document a command as available without checking `package.json`.

At the known project baseline, commands such as these may exist:

```bash
npm run dev
npm run build
npm run preview
npm run storybook
npm run build-storybook
```

Additional commands such as:

```bash
npm run typecheck
npm run lint
npm run test
npm run test-storybook
npm run tokens:check
```

may only be used/documented after they actually exist.

Before completing a task, run the strongest relevant available checks.

If a required check cannot run:

- state exactly which check failed or was unavailable;
- state why;
- do not mark it as passing.

---

## 35. Browser verification

For UI changes, inspect the real rendered implementation where tooling permits.

Check relevant widths and states, including the primary mobile reference.

Verify:

- layout
- overflow
- wrapping
- sticky/fixed positioning
- bottom safe-area behavior
- state transitions
- focus
- keyboard interaction where applicable
- loading/error/empty behavior
- long labels/data
- dynamic content

Do not infer browser availability solely from a package being installed.

Do not report a screenshot review as an automated test.

---

## 36. Definition of done for reusable UI

A reusable design-system capability is complete only when applicable items are satisfied:

- requirement is understood
- owner/layer is correct
- implementation exists in the real repository
- canonical tokens are used
- TypeScript API is coherent
- accessibility behavior is implemented
- public export is correct
- real consumers use it where appropriate
- Storybook demonstrates it
- meaningful states are covered
- focused tests exist where behavior warrants them
- rendered behavior has been inspected
- documentation is synchronized
- no duplicate component/pattern was introduced

---

## 37. Definition of done for a feature change

A feature change is complete only when applicable items are satisfied:

- accepted UX behavior is preserved or deliberately updated
- state ownership is clear
- design-system components are reused
- feature-specific logic remains outside generic components
- mock/fixture boundaries are honest
- important recovery routes work
- Storybook composition is updated if it is used as a validation witness
- runtime integration is updated
- relevant tests/checks pass
- mobile rendering is inspected
- documentation is updated when the product contract changed

---

## 38. Definition of done for token/foundation changes

A foundation change requires:

- canonical source updated
- no duplicate source of truth introduced
- generated artifacts updated deterministically if used
- application consumers updated
- Storybook foundation views updated
- affected component states reviewed
- contrast/accessibility consequences checked where relevant
- documentation updated if system rules changed

Do not change a semantic color/token just to fix one local screen if the issue belongs to component styling or composition.

---

## 39. Documentation integrity

Repository documentation must describe the real current project.

Use clear status language:

- **Documented**
- **Observed in current code**
- **Proposed**
- **Platform mapping**
- **Unverified**
- **Out of scope**

Do not write “implemented”, “verified”, “accessible”, “production-ready”, or “complete” unless the available evidence supports that claim.

Do not create documentation for folders/components that do not exist merely to make the repository look complete.

---

## 40. Repository hygiene

Place files in their owning directory immediately.

Do not leave finished work in:

- root-level scratch files
- temporary chat exports
- random `components2/` folders
- duplicate design-system trees
- orphaned stories
- unused test fixtures
- dead experimental routes

When adding or changing public behavior, check all affected areas:

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

Do not delete research/UX history just because it is not runtime code.

---

## 41. Naming rules

Use clear English names for code and repository documentation.

Prefer names that describe responsibility rather than visual appearance.

Good:

- `NutritionSummary`
- `FoodResultRow`
- `RecipeFiltersSheet`
- `AmountField`
- `FocusedFlowLayout`

Avoid vague names such as:

- `Box2`
- `CardNew`
- `WrapperFinal`
- `Component123`
- `GreenSection`

Do not rename accepted product terminology casually.

Current product identity is **Portion**, with lowercase `portion` where the approved wordmark is used.

---

## 42. Content rules

Use product-relevant realistic English content.

Do not introduce:

- lorem ipsum in behavior-sensitive stories
- unverifiable health claims
- fake endorsements
- misleading nutritional precision
- invented backend success claims
- unrelated marketing slogans

When copy is not specified and the exact wording affects UX, consult the current UI contract or product content decisions.

---

## 43. Performance and complexity

This is a focused prototype/product implementation.

Do not introduce production-scale architecture that has no current benefit.

Prefer simple local solutions when they are sufficient.

Avoid:

- global state libraries for trivial local state
- service abstractions with no alternate implementation
- excessive memoization
- premature virtualization
- micro-frontends
- unnecessary dependency injection
- generalized schema engines for a few static cases

At the same time, do not hard-code feature behavior into giant screen components.

Choose the smallest architecture that keeps responsibilities clear.

---

## 44. No silent UX changes

Visual work must preserve behavioral contracts.

Examples of changes that require UX-contract review:

- changing entry points
- removing a recovery path
- changing what “Apply” commits
- changing cancel/discard semantics
- changing unit/amount behavior
- changing what counts as a recipe match
- changing navigation ownership
- changing whether a bottom sheet is modal
- changing validation rules

Do not treat these as CSS refactors.

---

## 45. No screenshot-driven implementation

Screenshots/Figma frames are evidence of a visual state, not a complete behavioral specification.

When implementing from a visual reference:

1. identify existing UX behavior;
2. map the visual structure to existing design-system capabilities;
3. identify missing reusable responsibilities;
4. preserve state transitions and accessibility;
5. implement responsive behavior rather than fixed pixel tracing.

Do not optimize for a single screenshot while breaking dynamic content.

---

## 46. Git behavior

Preserve the existing repository history.

Before broad edits:

- inspect current branch;
- inspect working tree;
- avoid overwriting unrelated uncommitted work.

When commits are explicitly part of the task, make coherent commits that keep related source, stories, tests, exports, and documentation together.

Do not claim a commit or push succeeded unless the command actually succeeded and the expected remote/branch was verified.

Never force-push, rewrite history, delete branches, or discard unrelated changes without explicit authorization.

---

## 47. Security and secrets

Never commit:

- API keys
- tokens
- credentials
- private environment values
- personal access tokens
- session data

Do not fabricate secret values for examples.

Use safe mock values and project-supported environment patterns.

---

## 48. Failure handling

When something does not work:

1. inspect the error;
2. determine whether it is code, configuration, version, environment, or tooling;
3. make the smallest justified fix;
4. rerun the relevant check;
5. document unresolved blockers accurately.

Do not “fix” a tool failure by deleting meaningful verification.

Do not replace a failing test with a weaker test merely to obtain green output.

Do not mark inaccessible tooling as successful.

---

## 49. Anti-hallucination rules

Never state that any of the following exists or works without evidence:

- component
- token
- Storybook story
- test
- package
- script
- Figma node
- MCP connection
- browser binary
- skill/plugin
- backend
- API
- production deployment
- accessibility pass
- Git push

Search or inspect first.

If evidence is unavailable, use language such as:

- “not yet verified”
- “documented but not observed”
- “proposed”
- “not available in the current environment”

---

## 50. Agent completion report

When finishing a non-trivial implementation task, report concisely:

1. **Changed** — concrete files/capabilities changed.
2. **Behavior** — what user/system behavior now exists or changed.
3. **Storybook** — stories/docs updated.
4. **Verification** — exact checks actually run and results.
5. **Unverified / blocked** — anything not proven.
6. **Next action** — only when there is a concrete remaining step.

Do not return a vague “done”.

Do not claim completion based on file creation alone.

---

## 51. Project-specific non-goals for agents

Do not use this repository task as an opportunity to:

- rebrand Portion
- replace approved typography
- introduce an unrelated color system
- turn the app into a generic calorie tracker dashboard
- copy a competitor identity
- add gamification
- add landing-page visual effects
- add decorative motion without product need
- inflate the component catalogue
- create a second showcase application
- create production-visible debugging controls
- substitute Figma for code implementation
- substitute Storybook for runtime integration
- substitute documentation for implementation
- claim native iOS delivery from the React web prototype

---

## 52. Final rule

**Prefer evidence over assumption, reuse over duplication, product behavior over screenshot matching, and complete implementation slices over broad unfinished scaffolding.**

The desired outcome is not the largest repository.

The desired outcome is a coherent, documented, accessible, code-first Portion design system and product implementation in which:

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
