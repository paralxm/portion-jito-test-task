# Portion — Code-to-Figma transfer contract

## Purpose and scope

Transfer the completed Portion app directly into Figma: the complete current UI kit, design tokens, final Hi-Fi screens, all implemented states, and supported prototype interactions. Deliver native, editable objects that preserve the approved implementation.

Include all current implemented components and variants, even when unused on final screens. Exclude deprecated, experimental and superseded items. Do not redesign, invent states or introduce automatic two-way synchronization.

Create no documentation boards, explanatory pages or usage guides in Figma. Include only design assets, visual specimens, components, screens and flows with concise names and values.

## Confirmed handoff inputs

* Repository: https://github.com/paralxm/portion-jito-test-task
* Source branch: `main`.
* Source version: on the first run, fetch origin and resolve the current origin/main commit. Record its full SHA in the transfer checkpoint as the pinned source. Use a clean checkout or worktree of that commit without overwriting local changes. Keep this version fixed throughout the transfer. On resume, reuse the recorded SHA rather than selecting a newer commit.
* Live app: https://portion-ochre.vercel.app — verify deployment-to-commit correspondence. If it differs, use the local app built from the pinned commit.
* Figma file key: `heuO3V1WlKG44CukQswCkw`.
* UI kit destination: https://www.figma.com/design/heuO3V1WlKG44CukQswCkw/jito-calories-calculator?node-id=28-2253 — target `28:2253`.
* Hi-Fi destination: https://www.figma.com/design/heuO3V1WlKG44CukQswCkw/jito-calories-calculator?node-id=3-2 — target `3:2`.
* Inspect both nodes and their containing pages before writing. Node IDs alone do not establish whether the target is a page, section or frame. Keep destinations separate and preserve unrelated content.
* Verify local app/Storybook addresses, remote Figma MCP write capability and target edit access during preflight.

## Sources and precedence

* Read current task instructions, `CLAUDE.md`, applicable `AGENTS.md`, `PRODUCT.md`, `DESIGN.md`, relevant project skills, `docs/design/hifi-decisions.md`, and current inventories/contracts where present.
* The pinned commit defines the UI being transferred. Current transfer instructions govern execution; do not replace them with older instructions from the pinned checkout.
* Use source code for tokens, component structure, behavior and assets; matching Storybook for variants and reproducible states; matching runtime renders for visual evidence.
* Derive coverage from implementation, Storybook and state inventories, not historical screen counts or screenshot totals. Include implemented Storybook-only states. Report specified but unimplemented states as gaps.
* Resolve source discrepancies before transferring affected items. Screenshots alone cannot establish component structure or semantic tokens.

## Tools and responsibilities

* Use `figma-use` for native operations, alongside `figma-generate-library` for foundations/components and `figma-generate-design` for screen composition. Check existing installation before adding anything; load relevant instructions at the required stage.
* This contract controls scope: skills must not introduce redesigns, generic palettes, extra components or documentation boards.
* Apply `portion-design-system` and `portion-visual-quality` to preserve Portion. Use Impeccable selectively for relevant checks; its code checks do not verify Figma structure.
* Reuse existing token/icon checks and capture/walkthrough scripts after confirming actual commands. Add transfer scripts only where needed. Live-UI capture alone does not prove a complete, correctly linked UI kit. Code Connect is optional.

## Construction rules

* Transfer all current primitive, semantic and component tokens where present: colors, typography, spacing, sizing, radii, borders, opacity, effects and motion. Preserve names, values, aliases and modes.
* Bind supported properties to the correct Variables; use text/effect styles where appropriate. Record unsupported mappings and existing untokenized exceptions in the transfer checkpoint. Invent no replacement values or scales.
* Create main components, component sets and implemented variants. Expose appropriate text, boolean, instance-swap and variant properties. Build repeated UI from linked instances, including nested components; do not detach them to fix layout.
* Keep text editable and source vector icons as vectors. Reuse actual photos, crops, fonts and font weights. Do not substitute or generate assets.
* Use Auto Layout with deliberate Hug/Fill/Fixed behavior. Preserve exact padding, gaps, alignment, dimensions, min/max sizing, radii, typography and text wrapping. Use absolute positioning where the source requires it.
* Preserve clipping, full scrollable content and supported fixed/sticky behavior. Match the chosen source viewport and safe-area configuration without duplicating insets or adding device chrome absent from the source.
* At the UI kit destination, group Foundations, Components, Patterns and interactive specimens. Variables/styles may be file-level resources; place their visual specimens here.
* At the Hi-Fi destination, group screen families with all implemented empty, loading, error, success, populated, validation, unavailable and overlay states, plus relevant responsive/edge layouts.
* Use existing flow/state IDs and readable labels. Keep component-only states, such as disabled or focus variants, in component sets unless they also represent a distinct screen state. Do not manufacture every possible combination.
* Reproduce supported triggers, destinations, back actions, overlay placement/dismissal and component interactions. Match transition type, duration and easing where supported. Record approximations and unsupported runtime behavior outside Figma; do not claim camera, persistence or arbitrary CSS animation parity.

## Execution and recovery

1. Record source identity and inventory tokens, components, variants, screens, states and transitions.
2. Pilot representative tokens, a button, an input, a composite component, Home, one complex screen/state, an asset and a prototype connection. Select actual current components and validate before scaling.
3. Complete foundations and main components; assemble screens by family and connect flows.
4. Compare browser and Figma renders at matching viewport, content, fonts and state. Check numeric layout values, bindings, instance relationships, resizing, scrolling and prototype links separately from appearance.
5. Verify that main-component and Variable changes propagate correctly to dependent instances/properties, then restore source values. Correct affected families and complete a final coverage review.

Use repeatable scripts and bounded batches. Persist a compact manifest/checkpoint under `docs/design/figma-transfer/`: source-to-Figma IDs, completed items, deviations, failed checks and the exact next action. Keep technical records outside both Figma destinations.

Resume from the first incomplete item; inspect and update existing objects instead of duplicating them. Continue between verified phases without routine approval pauses; report genuine blockers.

Preserve application code, Storybook and unrelated work. Create no documentation updates or duplicate stories solely for export. Local commits may contain coherent transfer artifacts only, on a dedicated transfer branch based on the pinned source. Do not push, merge, rebase, reset or delete branches.

## Done means

The complete inventoried UI kit and all implemented screens/states are transferred and verified. Text, vectors and component properties remain editable; supported token/style bindings and instance relationships work; layouts match the source; and supported prototype flows have valid destinations and behavior.

Do not claim completion while transferable items are missing or verification fails. Record native limitations and any visual tolerances in the compact checkpoint. Return direct links to the completed UI kit and Hi-Fi destinations with a brief completion status.
