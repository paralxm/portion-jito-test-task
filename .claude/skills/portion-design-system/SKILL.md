---
name: portion-design-system
description: Implement or change Portion tokens, primitives, components, patterns, templates, or their Storybook contracts. Use for shared UI work; do not use for product-only state or route logic.
---

# Portion design system

Build the smallest reusable contract that lets runtime screens remain consistent, responsive, and accessible.

## Sources

Read `PRODUCT.md`, `DESIGN.md`, the affected UX contract, current tokens/source, and current stories. Source and executed behavior override old counts or status prose.

## Ownership

```text
tokens -> primitives -> components -> patterns -> templates
                                  -> feature composition
```

- Tokens own repeated design decisions.
- Primitives own low-level semantics/layout.
- Components own reusable controls/content units.
- Patterns own recurring multi-component behavior.
- Templates own screen regions and safe-area responsibility.
- Features own product data, navigation, copy decisions, and domain state.

Do not promote a one-off until at least two real consumers need the same contract or its semantics clearly belong in the system.

## Rules

- Inspect the nearest existing abstraction and all consumers before adding or changing an API.
- Reuse canonical tokens. Add a token only for a stable semantic decision, not to hide a one-off value.
- Prefer semantic props and explicit variants. Avoid caller class-name recipes that recreate internal states.
- Define relevant rest, hover, active, focus-visible, disabled, loading, invalid, selected, empty, error, and reduced-motion behavior.
- Use native semantics first. Preserve accessible name, role, state, keyboard behavior, and focus lifecycle.
- Public changes require updating every consumer, export, type, story, and test in the same change.
- Keep icons in `@phosphor-icons/react`; product glyphs are exported verbatim from the installed package into `src/assets/icons/` by `npm run icons:build` (the sprite `Icon` draws through `<use>`; `npm run icons:check` guards staleness) — never hand-edit or paste SVG paths; visible size never substitutes for target size.
- Collections of items get one presentation switch (`ViewToggle`, a radio group) and share data, order and open behaviour between `FoodResultRow` (list) and `FoodCard` (grid); filters live in the shared sheet pattern (`RecipeFiltersSheet`, `FoodFiltersSheet`) with a draft, Apply, Clear/Reset and dismissal that keeps the applied state.
- Do not add a dependency when the locked stack can implement the contract clearly.

## Layout contract

- Use `Container`, `Grid`, and `GridItem`; the four-column grid guides alignment rather than forcing ordinary content into columns.
- Use `RootScreenLayout`, `FocusedFlowLayout`, and overlay patterns for their intended families.
- Safe-area padding has one owner. Header owns top; navigation/focused footer/sheet footer owns bottom; content does not duplicate it. The root navigation is fixed to the viewport; `RootScreenLayout` measures it and reserves bottom padding and scroll padding — no screen adds its own.
- `AppHeader` variants are root (`PortionLogo` + context + trailing), section (title + trailing) and focused (Back + title + trailing). `PortionLogo` is the only brand rendering; the dot is decorative.
- Progress is `ProgressBar` (horizontal, goal marker, `meter` semantics); `ProgressRing` is deprecated with no product consumer.
- `Toast` is the confirmation pattern (status role, optional Undo, anchored above the fixed navigation). `CameraStage` is the shared dark viewfinder. Water tokens (`water.*`) and camera tokens (`camera.*`) are semantic families; never reuse action blue or nutrient accents for them.
- Sibling controls, never a clickable container around a button (the water tracker is the reference case).
- Keep target sizes at least 48 x 48 CSS px; `Log food` is 56 x 56; the photo shutter is 72 x 72.
- Design for 320–430 CSS px and 200% text through intrinsic layout, wrapping, and container queries where local width is what matters.

## Storybook contract

Add or update colocated stories for meaningful reusable states, keyboard behavior, focus visibility, responsive reflow, enlarged text, and safe-area ownership. Stories consume production components; they are not alternate implementations.

Document reusable UI, not every application frame. The mapped product-state stories (one per ledger row in `docs/design/hifi-decisions.md`) render production screens with deterministic fixtures and are the state-evidence layer; component microstates stay in component stories. Every motion story has a reduced-motion counterpart or assertion.

## Verification

Inspect the repository's actual scripts, then verify affected scope with typecheck, app build, Storybook build/tests, accessibility checks, runtime behavior, and screenshots. Exercise edge content, 320/393/430 widths, and 200% text. A build alone is not visual or accessibility verification.

Finish only when the runtime and Storybook use the same implementation and no page-local workaround duplicates the new contract.
