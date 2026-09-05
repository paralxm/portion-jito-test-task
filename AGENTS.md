# Repository contract

## Mission

Build Portion as a coherent, accessible, mobile-first React product. The repository is the implementation source of truth; Figma supplies product and visual evidence, Storybook documents reusable UI, and the runtime proves the integrated journeys.

## Authority

Resolve conflicts in this order:

1. The current user/task instruction.
2. `PRODUCT.md` for scope and product truth.
3. `docs/ux/` for states, navigation, data rules, and interaction behavior.
4. `DESIGN.md` for visual composition and quality.
5. Canonical tokens and current reusable component contracts.
6. Figma low-fi for the required screen/state inventory; the stylescape for visual intent.
7. Storybook and runtime as evidence of what is implemented.

Do not silently choose between authorities when the conflict changes product behavior. Record the conflict and stop only if it cannot be resolved from the sources above.

## Product boundaries

- Product: **Portion**; UI language: English; light theme only.
- Core jobs: calculate calories/nutrition for an intended portion, and find a recipe with explainable matching evidence.
- Identification is always reviewable. Logging and a daily goal are optional and never prerequisites.
- Fixture-backed barcode/photo/nutrition behavior must be presented honestly; do not imply a production backend.
- Do not add accounts, onboarding, a Profile or diary destination, weekly analytics (Home shows one selected past-or-present day at a time; the streak is a plain count of consecutive logged days), a mandatory or automatically applied calorie target (the optional estimate is reviewed and saved explicitly; no target weight, rate or date), health scores, medical or allergen guarantees, saved collections, meal planning or future days, recipe authoring, popularity or ratings, social/payment/coaching, gamification, notifications, dark mode, or a multi-ingredient builder.

## Architecture

```text
tokens -> primitives -> components -> patterns -> templates
       -> feature state/domain logic -> app composition
```

- Reuse or extend the nearest existing abstraction before creating a new one.
- Keep product data and navigation logic out of the design system.
- Keep reusable styling and behavior out of page-local one-offs.
- Use canonical tokens; do not duplicate token values in components without a documented technical reason.
- Prefer explicit component variants and semantic props over caller-supplied styling hacks.
- Preserve public contracts unless a deliberate migration updates every consumer and story.
- Use `@phosphor-icons/react`; do not paste arbitrary SVG paths for interface icons.

## Product invariants

- Bottom navigation is three destinations—Home, Search, Recipes—and a separate circular `Log food` action. `Log food` never becomes selected.
- Focused acquisition and review flows do not show the bottom navigation.
- Search retains Food/Recipes scopes. Recipe Details retains its origin.
- Food is added only after the explicit final `Add to {meal}` on the review or portion step, to the day bound when the task started; there is no second confirmation sheet for foods and no ambiguous `Done`.
- Every food task shares one exit policy: an untouched task exits at once; a task with entered or edited data opens the shared `Discard changes?` confirmation; Back between preserved steps never discards.
- `S01-1`: no committed food entries on the selected day. `S01-2`: one or more.
- Missing nutrition is unknown, never zero. Never invent conversions across incompatible units.
- A recipe match requires active criteria and known data; criteria combine with AND.
- Back, cancel, discard, update, remove, retry, empty, error, and unavailable states must preserve the UX contract.

## Layout and accessibility

- Use `RootScreenLayout` for root destinations, `FocusedFlowLayout` for focused flows, and `ModalSheet`/dialog patterns for overlays.
- Use `Container`, `Grid`, and `GridItem` for shared alignment. The four-column grid is a guide; ordinary cards, forms, and rows normally span all columns.
- Safe-area ownership is singular: root header owns top; bottom navigation, focused footer, or sheet footer owns bottom. Content does not add it again.
- At runtime use `env(safe-area-inset-*)`; the 393 x 852 Storybook reference uses 59 px top and 34 px bottom only to exercise ownership.
- Do not render a fake status bar or home indicator.
- Verify 320, 390/393, and 430 CSS px, keyboard behavior, and 200% text reflow.
- Minimum target: 48 x 48 CSS px; `Log food`: 56 x 56. Keep a visible, unclipped 3 px focus ring.
- Target WCAG 2.2 AA where applicable. Automated checks support—not prove—accessibility.

## Storybook boundary

Storybook documents foundations, reusable components, patterns, templates, interactions, and important responsive/accessibility states. It does not need a second copy of every final application screen. Final screens and the complete 42-state journey belong in the runtime; add screen-level stories only when they provide a stable test harness or reusable documentation value.

## Working method

1. Inspect the affected source and owning contracts.
2. Freeze the required state/transition inventory before broad implementation.
3. Prove representative compositions before scaling the system.
4. Implement shared changes at their owning layer, then compose features.
5. Exercise meaningful variants in Storybook and reachable states in the runtime.
6. Inspect rendered screenshots; fix causes, not screenshots.
7. Run the repository's actual type, build, story, unit, runtime, and capture checks.

Report verification separately: executed commands, structural inspection, rendered visual inspection, manual interaction/accessibility, and anything unavailable. Never claim more than the evidence proves.

## Repository safety

- Preserve user changes and inspect `git status` before editing.
- Do not edit generated output, dependencies, credentials, or unrelated files.
- Do not add packages unless the current implementation cannot meet the requirement with the locked stack.
- No push, merge, rebase, reset, force operation, or branch deletion without explicit permission.

