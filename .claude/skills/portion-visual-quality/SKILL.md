---
name: portion-visual-quality
description: Compose, refine, or review Portion screens for hierarchy, responsive behavior, iOS-aware safe areas, accessibility, and product-specific visual quality. Use for Hi-Fi screens and visual QA; do not change product behavior or rebrand the accepted system.
---

# Portion visual quality

Operate inside `PRODUCT.md`, `DESIGN.md`, current UX contracts, tokens, and reusable component APIs. Default to refinement, not redesign.

## Before editing

1. Identify the exact screen/state and its incoming/outgoing transitions.
2. Inspect the rendered current implementation at 393 px plus the affected component stories.
3. Separate structural defects from polish: product/UX, shared component, screen composition, content, or responsive/accessibility.
4. Fix the owning layer, then inspect the runtime again.

## Composition

- Establish one primary outcome/task and one primary action.
- Use clear type, alignment, grouping, and whitespace before adding surfaces or accent color.
- Keep numbers with unit, amount, and basis. Use tabular figures where values align or change.
- Limit grouped surfaces; a card must be a real group or one tappable object.
- Keep blue for interaction/selection/focus/information. Keep calorie and nutrient values neutral unless a semantic state requires otherwise.
- Use the accepted radius hierarchy; avoid default pills, nested cards, and decorative depth.
- Use approved local imagery or an intentional fallback. Never hotlink or invent evidentiary food claims from a photo.

## Product-specific checks

- Bottom navigation remains three destinations plus the separate 56 px `Log food` action.
- Root, focused, and overlay layouts each own safe areas exactly once; never draw OS chrome.
- Home progress states remaining/logged/over-goal/unavailable truthfully and without judgmental color.
- Log food choices are equal methods and never imply a commit.
- Food Review keeps identity, portion, unit, basis, result, and correction visible.
- Recipe results explain matching with active criteria and known values; avoid fake scores or badge clouds.

## Responsive and accessibility checks

At minimum inspect 320, 393, and 430 CSS px, software-keyboard states where relevant, and 200% text.

- No horizontal overflow, clipped focus, hidden essential labels, or reduced touch targets.
- Long titles, values, validation, and unavailable content wrap and preserve hierarchy.
- Names, roles, state, headings, labels, keyboard order, focus containment/return, and announcements remain correct.
- Contrast and non-color meaning are checked on the actual rendered background.
- Motion is short, purposeful, interruptible, and removed or simplified for reduced motion.

## Impeccable use

Use Impeccable as bounded convergence:

1. `critique` after representative screen families exist.
2. `layout` or `typeset` only for diagnosed hierarchy/composition issues.
3. `adapt` for responsive defects; `harden` for edge states.
4. `audit`, then `polish` for final consistency.
5. `animate` only for transitions already approved by the UX/design contract.

Do not run rebranding or novelty commands (`init`, `document`, `shape`, `craft`, `extract`, `bolder`, `colorize`, `delight`, `overdrive`, `quieter`, `distill`, `onboard`) unless the user explicitly changes the scope.

## Acceptance

Compare screenshots by screen family, not isolated pixels. Fix repeated drift in tokens/components; fix local hierarchy in the composition. Reject generic AI styling, competitor imitation, decorative metrics, and polish that obscures state truth.

Finish only after the intended state is reachable in the runtime and the rendered result passes the acceptance gate in `DESIGN.md`.
