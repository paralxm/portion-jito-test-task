# Portion — Code-to-Figma transfer contract

## Purpose and scope

Transfer the implemented Portion app directly into the target Figma Design file: the complete current UI kit, design tokens, final Hi-Fi screens, all implemented states, and supported prototype interactions. Deliver native, editable Figma objects that preserve the approved design and support editing through shared components.

Include current UI-kit components and implemented variants even when unused on final screens. Exclude deprecated, experimental and superseded items. Do not redesign, invent missing states or set up automatic two-way synchronization.

Create no documentation boards, explanatory pages, usage guides or verification sections in Figma. Keep only design assets, component specimens, screens and flows with concise names and labels.

Before execution, record the source branch and commit SHA, target Figma file/page URL, matching deployment URL if available, and local app/Storybook addresses. Do not assume an older branch is current.

## Sources and precedence

* Read `CLAUDE.md`, applicable `AGENTS.md`, relevant project skills, `DESIGN.md`, `docs/design/hifi-decisions.md`, and current inventories/contracts where present. Read additional documents only when relevant.
* Use the pinned repository for token definitions, component structure, behavior and assets; matching Storybook for variants and reproducible states; and the matching local app or Vercel deployment for rendered evidence.
* Resolve source conflicts before transferring affected items. Screenshots alone cannot establish component structure or semantic tokens.
* Derive coverage from current code, Storybook and inventories. Include implemented Storybook-only states; do not rely on historical screen counts or screenshot totals. Report specified but unimplemented states as gaps.

## Tools and responsibilities

* Verify remote Figma MCP write capability and target edit access.
* Use `figma-use` for native operations, alongside `figma-generate-library` for foundations/components and `figma-generate-design` for screen composition. Check installed skills before adding anything.
* This contract controls scope: skills must not introduce generic palettes, extra components, redesigns or documentation boards.
* Apply `portion-design-system` and `portion-visual-quality` to preserve Portion. Use Impeccable only for relevant checks; code checks do not verify Figma structure.
* Reuse existing token/icon checks and capture/walkthrough scripts after confirming actual commands. Add transfer scripts only where needed. Live-UI capture alone does not establish a complete component library.

## Construction rules

* Transfer all current design tokens, including primitive, semantic and component tokens where present. Preserve names, values, aliases and modes for colors, typography, spacing, sizing, radii, borders, opacity, effects and motion.
* Bind supported properties to the correct Variables; use text/effect styles where appropriate. Record unsupported mappings and existing untokenized values in the transfer checkpoint. Invent no replacements.
* Create main components, component sets and implemented variants. Expose appropriate text, boolean, instance-swap and variant properties. Build repeated UI from linked instances, including nested components; do not detach instances to fix layout.
* Keep text editable and source vector icons as vectors. Reuse actual photos, crops, fonts and font weights. Do not substitute or generate assets.
* Use Auto Layout with deliberate Hug/Fill/Fixed sizing. Preserve exact padding, gaps, alignment, dimensions, min/max constraints, radii, typography, wrapping, clipping, safe areas and fixed/sticky behavior where supported. Use absolute positioning only where the source requires it.
* Organize the requested page into Foundations, Components, Patterns, and Screens & Flows. Preserve unrelated existing content.
* Name frames with existing state IDs and readable labels. Group implemented empty, loading, error, success, populated, validation and overlay states with their flow. Keep component-only states in component sets; avoid unnecessary full-screen duplicates.
* Include implemented responsive and edge layouts beside their screen families. Preserve full scrollable content, not only the initial viewport.
* Reproduce supported triggers, destinations, back actions, overlay placement/dismissal and component interactions. Match transition type, duration and easing where supported. Record approximations and unsupported behavior outside the Figma canvas.

## Execution and recovery

1. Pin source identity and inventory tokens, components, variants, screens, states and transitions.
2. Pilot representative tokens, a button, an input, a composite component, Home, one complex screen/state, an asset and a prototype connection. Select actual current components and validate before scaling.
3. Complete foundations and main components; assemble screens by family and connect flows.
4. Compare browser and Figma renders at matching viewport, content, fonts and state. Check numeric layout values, bindings, instance relationships, resizing, scrolling and prototype links separately from visual appearance.
5. Verify that changing a main component or Variable updates its dependent instances or properties. Correct affected families and complete a final coverage check.

Use bounded batches and repeatable scripts. Keep only a compact technical manifest/checkpoint under `docs/design/figma-transfer/`: source-to-Figma IDs, completion, deviations, failed checks and the exact next action. Inspect and update existing objects instead of duplicating them when resuming.

Continue between verified phases without routine approval pauses; report genuine blockers. Preserve the application and Storybook; create no documentation updates or duplicate stories solely for export. Commit transfer artifacts to the agreed feature branch and push if authorized. Do not rewrite history or merge `main`.

## Done means

Every inventoried item is transferred and verified, or explicitly identified as an unresolved gap. The complete current UI kit is editable; supported token/style bindings and component relationships work; screens preserve source layout and content; all implemented states are represented; and supported flows work.

Do not claim completion while transferable items are missing or checks fail. Report native limitations and visual tolerances briefly outside Figma, and return direct links to the completed UI kit and screen sections.
