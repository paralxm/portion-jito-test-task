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

- Bottom navigation remains three destinations plus the separate 56 px `Log food` action; it is fixed, borderless, on the canvas surface, and never overlaps content, sheets, dialogs, or the keyboard.
- Root, focused, and overlay layouts each own safe areas exactly once; never draw OS chrome.
- Home reads header (logo, the selected day's context, the streak) → the compact day strip (no week buttons) → daily nutrition (the calorie card with the only `Set targets`/`Edit targets`, then three macro cards) → the compact recipe recommendation → the four meals → water. The calorie card states remaining/logged/reached/over/partial truthfully, with a blue information fill and no judgmental colour; a macro card carries its own bar only when the user entered that target, and never looks disabled without one.
- Recommendation wording is `Recipe to try` or `Matches your preferences` with `Matches all N filters` evidence; the only other line is the factual `One serving fits in your remaining N kcal` — never health or suitability claims.
- Targets come from the targets sheet: the entry choice, the manual path with *suggested* preset grams, or the three-step estimate with its reviewed, explained figure; nothing is called personalised or medical.
- Water shows amount and reference in text, uses the water tokens, and its quick add gives a visible, announced, undoable confirmation.
- Log food follows the R6 hierarchy (prominent Search food row, the camera card pair under a caption, a separator, the quiet Enter manually row) and never implies a commit; foods commit with the single `Add to {meal}` on their review or portion step, recipes through the Add-to-meal sheet from Recipe Details' `Add`.
- Food Review keeps identity (image, source stated plainly, record fields only), the shared portion form (steps, item presets, live result), meal, day and the source's own correction actions visible; nothing is called verified.
- Manual entry is two labelled steps whose draft survives Back and Edit; every food task's exit goes through the shared `Discard changes?` policy.
- Barcode and photo use the shared dark camera stage with text status chips; no simulator, flash, or camera chrome in production; the copy says the media is a fixture.
- Search shares one structure in both scopes: the field (with the icon-only scanner beside it in Food only), the tabs, the toolbar with List / Grid at the start and the scope's filter action at the end, applied chips beneath. Recipes discovery has no search field: a featured recipe, quick preferences, photographic collection rails, Browse all.
- Recipe results explain matching with active criteria and known values; avoid fake scores or badge clouds. Every catalogue recipe shows a licensed local photo; `No photo` is the fallback only.
- Attached UI references are composition evidence: adopt hierarchy and spacing, reject unsupported controls (bookmark, share, checklists, ratings, device chrome), and never copy their photography. Record adopt/adapt/reject in the ledger.

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
