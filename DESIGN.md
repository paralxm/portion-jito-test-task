# Design

<!-- impeccable:design-schema 1 -->

## Direction

**Measured Clarity**: calm, precise, lightweight, trustworthy, and correctable without looking clinical. Distinctiveness comes from hierarchy, proportions, spacing, the lowercase wordmark, disciplined color, and credible food imagery—not decorative effects.

Default Impeccable mode: **Operate**. Refine the accepted system; do not rebrand or replace the UX.

## Visual hierarchy

Each screen must make this reading order obvious:

```text
task context or primary result
-> primary action
-> supporting information
-> secondary actions
-> metadata
```

- One dominant result or decision per screen.
- Numbers and their amount/unit/basis remain visually connected.
- Use whitespace, alignment, type, and surface contrast before adding color or containers.
- Supporting content must not compete with the task or primary action.

## Foundations

### Type

- Inter only. Use canonical typography tokens.
- Key roles: 40/48 primary result, 28/36 screen heading, 20/28 section title or secondary metric, 16/24 body/action, 14/20 label/supporting, 12/16 caption.
- Content text does not go below 12 px. The sole exception is the active bottom-nav label at 10/14 with a bold icon and verified contrast.
- Semi-bold is enough for hierarchy. Use tabular figures for changing or aligned values.
- Negative tracking is exclusive to the lowercase `portion` wordmark.

### Color

- Canvas is white; use cool-neutral surfaces and neutral primary/secondary text.
- Blue means action, selection, focus, or information—not calorie quality.
- Calories and nutrition values are neutral by default. Nutrient colors are supporting identifiers, never the only meaning.
- Error, warning, success, and information describe system state, never food or user behavior.
- Use the canonical tokens and verify the actual rendered foreground/background pair.

### Shape and depth

- Use the canonical radius scale: compact nested elements 4, controls 8, cards 12, grouped surfaces/sheets/navigation group 16, true circles full.
- Preserve concentric nested corners.
- A card must be one meaningful group or one tappable object. Avoid card-inside-card composition.
- Prefer spacing, border, and surface contrast. Use shadow only to explain overlay depth.
- Avoid default pills; reserve full rounding for circles or controls whose behavior requires it.

### Icons and imagery

- Use Phosphor regular; bold only for selected persistent navigation.
- Visible icon size and hit target are separate. Icon-only controls require accessible names.
- Recipe card images use 4:3; recipe detail uses 16:9. Use a deliberate `No photo` fallback when no approved local asset exists.
- Photography is evidence of appearance only; it never proves nutrition, ingredients, or suitability.

## Composition contracts

### Layout and safe areas

- Primary viewport: 393 x 852. Verify 320, 390/393, and 430 CSS px plus 200% text.
- Use the shared layout primitives. The four-column grid is an alignment guide; normal cards, forms, results, and rows usually span all columns.
- Root header owns top safe area once. Bottom navigation, focused footer, or sheet footer owns bottom safe area once. Scroll content owns neither.
- Runtime uses `env(safe-area-inset-*)`. Storybook may emulate 59 px top / 34 px bottom at 393 x 852.
- Never draw fake status-bar content or a home indicator.
- Prefer reflow and vertical growth over truncation, hidden labels, reduced type, or smaller targets.

### Surfaces

Use a restrained hierarchy:

```text
canvas -> content surface -> interactive surface -> overlay
```

Limit grouped surfaces. On Home, one grouped daily-overview surface is appropriate; other content should remain plain sections unless a card represents a distinct object.

### Bottom navigation

- One row: `[ Home | Search | Recipes ]   (+)`.
- Three equal destinations fill one 16-radius group with 4 px inner padding; a 16 px gap separates the independent 56 px `Log food` circle.
- Active destination: bold icon, visible label, selected surface, `aria-current="page"`. Inactive destinations: regular icon with accessible name.
- `Log food` is the strongest filled action and never selected.
- At narrow or enlarged-text widths, stack the active label under its icon; do not hide or shrink it.
- Hide the whole navigation unit when the software keyboard or focused flow requires it.

### Home progress

- `ProgressRing` owns generic SVG geometry, clamping, unavailable state, accessible name, and reduced-motion behavior.
- `CalorieProgressRing` owns Home wording and data.
- With a complete goal, center content shows remaining; over goal, it states the excess; without a goal or with a partial total, it shows logged.
- Always state Logged and Goal nearby. Unknown is not 0% or 100%.
- Use a neutral indicator—no alarm red, success green, glow, gradient, or Activity-ring imitation.

### Log food sheet

- Title: `Log food`.
- Four equal choices: Search food, Scan barcode, Take a photo, Enter manually.
- Use a 2 x 2 grid when space permits and one-column rows at narrow/200% text through the shared responsive pattern.
- Choosing a method starts acquisition; it does not commit food.

### Food review

- Keep food identity, amount, unit, basis, calorie result, and available nutrition understandable and correctable.
- New candidate: `Add to today` primary, `Done` exits without logging.
- Existing entry: `Update entry`; `Remove entry` confirms; changed content protects against accidental discard.
- Unknown data is explicit. Do not infer unsupported unit conversions.

### Recipe discovery

Order content as identity -> why it matches -> relevant calories/protein/time -> supporting imagery/metadata. Use only known criteria and data. Avoid unexplained scores, decorative match percentages, badge clouds, and ratings presented as suitability.

## Interaction and motion

- Motion explains state change, navigation continuity, progress, or overlay position.
- Keep transitions short and interruptible. Respect reduced motion.
- No looping decoration, bouncing icons, comprehension-delaying counters, or animation on every card.
- Loading, empty, error, disabled, unavailable, destructive, and success states must be visually and semantically distinct.

## Accessibility

- Target WCAG 2.2 AA where applicable: 4.5:1 normal text, 3:1 large text, and 3:1 for qualifying meaningful non-text UI.
- Minimum target 48 x 48 CSS px; `Log food` 56 x 56. Focus ring: visible, unclipped, 3 px with separation from the control.
- Preserve semantic headings, labels, roles, state, keyboard order, focus return/containment, live feedback, non-color cues, and readable text alternatives for charts/rings.
- Test real rendered pairs and behavior. Automation does not prove complete conformance.

## Anti-slop

Do not add generic gradients, gradient text, glassmorphism, neon/glow, floating blobs, fake AI insight panels, sparkle icons, huge marketing headings, oversized rounded cards, arbitrary badges, pill-shaped metadata everywhere, decorative charts, excessive shadows, competing accents, tiny gray text, ornamental motion, or copied competitor identity.

## Acceptance gate

A screen is complete only when:

- its state and transition match the low-fi/UX inventory;
- hierarchy and primary action are obvious;
- spacing and alignment follow the shared system;
- every surface earns its role;
- responsive, keyboard, safe-area, and 200% text behavior work;
- empty/error/loading/unavailable and correction paths are honest;
- focus, contrast, names, roles, and non-color meaning are verified;
- it has been inspected in the runtime at target widths, not only in code or Storybook.

Exact token values and component APIs live in tokens/source. Reusable examples and interaction assertions live in Storybook. Product behavior lives in `docs/ux/`. This file owns visual composition and quality only.

