# Portion — repository operating guide

## Start from the actual checkout

This is `paralxm/jito-calories-calculator`, the Jito UX/UI Engineer test assignment. **Portion** is the accepted product name; the wordmark is `portion`. Implement two journeys: calculate calories for a specific food/dish, and find a suitable recipe. The chosen direction is **Measured Clarity**: The repository's accepted delivery path is **code-first and implementation-led**.

Claude Code must build the actual design system and final product UI in the repository, not merely describe them or reproduce them in Figma. `src/design-system/tokens/tokens.json` owns canonical token values; `src/design-system/` implements foundations and reusable React components; colocated Storybook stories document and exercise those same components and their meaningful states; `src/features/calorie-calculator/` and `src/features/recipe-discovery/` implement the two product journeys; and `src/app/` composes the evaluator-facing runtime application.

The required execution order for final UI is:

`accepted UX/visual contracts → tokens → React design-system components → Storybook states/interactions → feature integration → runtime screens/flows → browser verification → final screens added to the existing Figma Design file`.

Do not treat Storybook as the final application and do not treat Figma as the implementation source. A design-system component is incomplete if it exists only as a Figma component or written specification. A key screen/flow is incomplete if it exists only as a Storybook composition or Figma frame.

After an implemented screen has passed the relevant runtime, responsive, interaction and accessibility checks, add that final screen to the existing Figma Design file for UI review, presentation and handoff. Preserve the existing Figma UX/branding artifacts: FigJam remains the research/task-flow surface, while Figma Design contains branding/stylescape, established low-fidelity/UX artifacts and the final high-fidelity UI screens.

The code and Figma versions must not evolve independently. If review in Figma produces an accepted change to an implemented screen, update the owning UX contract or token decision when necessary, apply the change to the React/component/feature source, reverify Storybook and runtime behavior, and then refresh the corresponding Figma screen. A Figma-only fix is not considered complete for UI that already exists in code.


The implementation baseline below was inspected at `dc0a706` on 2026-09-02. Recheck it before relying on an implementation claim: run `git status --short`, `git diff --stat`, `git diff --cached --stat`, and `git log -5 --oneline`; read affected files and their diff. An uncommitted change is not automatically an accepted convention.

- `src/app/App.tsx` renders only `Calories Calculator`; `src/main.tsx` mounts it in React StrictMode. Neither imports application styles or a font.
- Canonical tokens exist. `src/design-system/index.ts` is empty; primitives, components, patterns, icons and both feature directories contain placeholders. No implemented design system, screens, domain logic, stories or tests exist at this baseline.
- The stack is React 19, Vite 8, TypeScript 7 and Storybook 10.5.10. Vitest 4 and Playwright are installed. `package-lock.json` owns resolved versions; several declarations say `latest`, so use the lockfile rather than refreshing packages incidentally.
- No tracked `.claude/`, project skills, MCP configuration, lint/format configuration, CI, token generator or deployment configuration exists. Do not assume a named skill, service, browser binary or public deployment is available because a package or document mentions it.

Read the sources required for the task below, then make the smallest complete change. Resolve ordinary implementation choices autonomously. A task that changes product behavior must update its owning contract explicitly; a visual refactor must preserve that behavior.

## Code-first execution order

This project is code-first for the design system and final product UI.

Use this execution order unless the current task explicitly concerns an existing UX/Figma artifact:

accepted UX / visual contracts
→ design tokens
→ React design-system components
→ Storybook
→ runtime application screens and flows
→ browser/runtime verification
→ final UI screens added to Figma

Claude Code must actively implement the design system and key product screens in the repository. Do not stop at specifications, component inventories, Storybook-only compositions or Figma mockups when the requested output is part of the implemented product.

src/design-system/ is the implementation source for reusable UI. Storybook documents and exercises those same components. src/features/ implements product behavior. src/app/ composes the reviewer-facing runtime application.

The final UI must first be implemented and verified in code. After that, add the relevant final screens to the existing Figma Design file for UI review, presentation and handoff.

Figma remains an intentional project deliverable, not something to omit:

FigJam owns the research/task-flow artifacts already defined for this project.
Figma Design owns branding/stylescape, visual exploration, low-fidelity/UX artifacts where already established, and the final UI screens required for presentation/review.
The repository owns the implemented design system, runtime behavior and executable verification.

Do not maintain two independently evolving final implementations. If a final UI change is accepted in Figma after the coded screen exists, propagate that change back to the owning token/component/feature code, verify Storybook/runtime again, and then refresh the Figma screen if necessary.

## Read by responsibility

| Before changing | Read | Authority and boundary |
| --- | --- | --- |
| Scope or delivery | `docs/project/brief.md`, `docs/project/approach.md`, `README.md`, original assignment linked below | Assignment requirements govern delivery. `docs/project/scope.md` currently duplicates the brief; actual current exclusions are in `docs/ux/low-fidelity.md` §2. |
| Navigation, screens, recovery | `docs/ux/low-fidelity.md`, `docs/ux/ui-contract.md` | Low fidelity owns current screen IDs, navigation and transitions. UI contract owns interaction, data, fixtures and commit semantics. |
| A product rationale or research claim | `docs/ux/research/research-overview.md`, `docs/ux/research/synthesis.md`, relevant research file, `docs/ux/ux-synthesis-and-design-hypotheses.md` | This is secondary/competitive research and derived hypotheses, not completed interviews or usability validation. Competitor functionality is not automatically Portion scope. |
| Visual foundations or shared UI | `docs/design/visual-direction.md`, `src/design-system/tokens/tokens.json`, `docs/ux/ui-contract.md`, affected source and stories | Visual direction owns rationale and usage restrictions; token JSON owns exact machine values; UI contract owns behavior. Source owns the actual component API; stories demonstrate that same implementation. |
| Storybook or test setup | `package.json`, `package-lock.json`, `.storybook/main.ts`, both preview files, `vitest.config.ts`, `tsconfig.json` | Inspect installed-version behavior before applying an online setup example. Configuration and executed output establish what runs. |
| Figma or workflow documentation | `docs/project/ai-workflow.md`, relevant UX/visual contracts, actual target page | FigJam holds exploration/research; Figma holds branding, visual exploration and presentation artifacts. The repository holds accepted decisions, implementation and verification records. |

Use these conflict resolutions instead of restarting old decisions:

- `docs/ux/task-flows.md` preserves task intent; its older screen IDs, Meal time and mandatory Save steps are superseded by the current low-fidelity/UI contracts. The same applies to older two-destination stylescape specimens.
- `docs/ux/low-fidelity.md` marks the handoff finalized, but §1 still says corrected Figma changes were not re-inspected and other sections retain missing witnesses. Use its explicit corrected behavior as the implementation baseline; do not convert completion checkboxes into evidence of live Figma or runtime QA.
- Research lives under `docs/ux/research/`, not `docs/research/`. Tokens moved from `docs/design/tokens.json` to `src/design-system/tokens/tokens.json`; do not recreate the old file to satisfy stale links in `docs/README.md`.
- Earlier branding/implementation prompts are historical task briefs. Their Lucide icons, violet focus, large pill radii, fixed board inventories or component-count targets do not override current accepted documents and tokens. A planned generator or component inventory is not implemented infrastructure.
- If current sources still conflict after applying these boundaries, state the specific conflict and resolve it in the owning document before changing behavior. Do not silently make code, an attractive PDF or a newer filename suffix the authority for every domain.

## Product behavior that must survive implementation

### Navigation and scope

- **2026-09-07 decision, superseding the two bullets below where they conflict:** Home replaces Calculate as the initial-launch destination. Home is a dashboard for both user stories — see `docs/ux/low-fidelity.md` §3a/§11 for the accepted content hierarchy, module purposes and Figma/FigJam change record. Calculation remains a capability inside the product, not a destination name.
- Initial launch is the empty **Home** workspace (S01-1), or the current-calculation dashboard (S01-2) once a food is confirmed. Keep one bottom row: **Home | Search | Recipes | + Log food** (the plus's accessible name since 2026-09-04; the three destinations form one group of equal cells filling the width beside the plus, which is a separate circular action). These are three destinations and one trailing button; plus is never selected and never duplicated as a floating action. Use current-page semantics for navigation; selected-tab semantics only for an actual tab pattern.
- S01 = Home; S02 = shared Search with Food/Recipes scopes; S03 = query-free recipe browsing; S04 = Barcode; S05 = Photo; S06 = Manual entry; S07 = Food review; S08 = Recipe details. These are design IDs, not implemented URL routes.
- Roots show the bar. S08 retains it with the actual originating destination selected: Search remains selected for a recipe opened from Search. S04–S07 are focused steps without the bar. A modal covers and blocks the underlying bar.
- Allow one foreground modal, with inert background and a visible close action. Focus enters, stays within and returns to the opener. Anchored headers/footers must not cover fields, content or focus indicators; a gesture is never the only exit.
- Plus opens O01 with Search food, Scan barcode, Take a photo and Enter manually from every root and recipe details. Method selection does not commit data. Dismissal/cancellation restores the actual invoking surface, subject to the dirty-draft rule.
- First Search entry uses Food scope and no query; later visits restore scope/query. Switching scope retains the query. Recipe criteria never filter Food results. Browse-to-Search copies a criteria snapshot into Recipes scope; later Search edits do not mutate browse criteria.
- Preserve destination state during the active session. New queries reset result scroll; Back from details restores origin, query, criteria and scroll. Tab reselection must not duplicate navigation history. Reload persistence and account sync are not promised.
- When the software keyboard opens on a root, hide the whole bar and restore it on dismissal. Do not move only plus or equate desktop input focus with an open software keyboard. Keep the active field and relevant action reachable by scrolling.
- Do not add diary/history, daily goals, accounts/onboarding, saved collections, meal planning, recipe authoring, a multi-ingredient builder, social/payment/coaching features or a production recognition/nutrition backend. Broader research themes do not expand these two journeys.

### Calculation and data

- Identification produces a **candidate**. S07 confirms a valid candidate once, replaces the previous calculation and returns to S01. Preserve the previous calculation until confirmation; explain replacement within review without adding a second confirmation or accumulating foods.
- After confirmation, valid portion edits recalculate locally in place. No Save button, simulated network loading or save-failure journey belongs to synchronous arithmetic. Do not add a success toast when the changed result already communicates completion.
- Manual entry establishes name, calories and a positive reference quantity/unit; macros are optional. Review establishes the desired portion separately. Scale nutrition by `reference value × desired quantity / reference quantity` only for supported, compatible units. Never invent g↔ml, piece or serving conversions.
- Invalid quantity remains editable; the old result must not appear current for that invalid draft. Missing nutrition is `Not available`, not zero. A known nutrient value of zero is valid. Omit optional missing card metadata where allowed; required detail rows explicitly identify missing data.
- Use `docs/ux/ui-contract.md` §1 for all demo fixtures. Keep C and R independent: **C at 300 g = 540 kcal; R at 300 g = 450 kcal**. Do not derive either from a photograph or recompute declared energy from displayed macros. R's carbohydrate total already includes fibre.
- Keep calculation precision internally; display whole kcal and at most one decimal for macro grams without unnecessary trailing zeros. Preserve units and serving basis; small known micronutrient values must not become misleading zeroes through rounding.
- Photo analysis is a reviewable suggestion; barcode matches remain correctable. Clearly distinguish simulated data from implemented services. A meaningful dirty draft offers Keep editing/Discard; untouched entry exits directly. Discard removes the draft, not the prior confirmed calculation.

### Recipe selection and recovery

- Recipe criteria combine with AND: optional calories-per-serving minimum/maximum, protein minimum, preparation-time maximum and dietary preference. Blank means unrestricted; minimum cannot exceed maximum. Unknown values cannot establish a match. Never silently relax filters, infer dietary safety or show a match claim without active criteria.
- O02 edits are drafts. Apply validates and commits; Reset clears the draft until Apply; Cancel discards unapplied changes. Removing an applied criterion chip commits immediately; cancelling a later filter draft does not undo that removal. O04 unit selection likewise needs explicit confirmation/cancellation.
- A card from S02-5, S03-1 or S03-2 opens **S08-2 Loading → S08-1 Loaded or S08-3 Unavailable**. Retry reloads the same recipe. Back from any detail state restores the exact list; late responses after Back cannot reopen it. S02-6 No matches cannot open details. S08-4 is a loaded no-photo/long-title variant, not another request step.
- Cards use a compact suitability summary; details compare each active criterion with its known value. Finding and evaluating a recipe completes the task; Save/Cook is not required.
- Distinguish no matches from service failure, unreadable barcode from unknown product or failed lookup, and camera denial from analysis failure. Use the cause-specific recovery table in `ui-contract.md` §5.6. Preserve query, criteria, code or image as appropriate; never turn an operational failure into empty results or zero nutrition.
- Pause barcode capture after a read. Photo capture includes preview/retake before analysis, then suggestion/review. Ignore obsolete query/analysis responses and prevent repeated confirmation or lookup. Adjacent Figma frames are not a state machine.

## Design-system and implementation contract

- Keep the current structure: `src/app/` composes the application; `src/features/calorie-calculator/` and `src/features/recipe-discovery/` own their flows/data; `src/design-system/` contains tokens, primitives, components, patterns and icons. These directories are currently scaffolding. Do not introduce an Atomic Design rename, workspace packages or a second application.
- Shared UI takes typed data, state and callbacks. Feature orchestration owns calculation, filtering, requests and navigation. Do not hide product rules in a Storybook render function or import feature services into generic controls. Keep UI local until it represents a reusable semantic concept; check actual consumers before changing a shared API.
- `src/design-system/tokens/tokens.json` is the only canonical token file. It uses **DTCG 2025.10**, with `reference` and `semantic` families. Product and component styles consume appropriate semantic roles; raw reference values belong to token definitions, conversion and foundation specimens. A missing role calls for an explicit token decision, not an arbitrary value hidden in a feature stylesheet.
- Preserve aliases and effective types. Alias-only tokens can inherit the referenced token's type; do not reject them merely for lacking their own `$type`. Resolve aliases recursively, including composite members. Reject dangling references, cycles and incompatible types; never silently substitute zero, black or an empty value.
- Preserve structured sRGB colors and alpha, `{value, unit}` dimensions/durations, font-family arrays, numeric line-height ratios, and shadow/typography composites. Convert each by its type. Do not serialize objects into CSS, treat ratios as pixels or collapse a translucent scrim into an opaque color.
- The exact scales are already in JSON. Use semantic spacing/radius/size roles rather than creating another table here. `full` is for actual circles, not a return to pill-shaped chips/buttons. Ordinary surfaces use borders/space; overlay elevation belongs to sheets. Safe-area insets are additional to page spacing.
- Nutrition categories and operational feedback stay separate even when colors coincide. Nutrition numbers remain neutral; category markers carry labeled color. Do not alias protein/fat/etc. to success/error, make static nutrient rows appear interactive, or combine g, mg and µg in one proportional chart. Do not add food judgments, health scores or daily-value charts.
- Typography is Inter. Apply semantic roles such as `screen-heading`, `main-result`, `body` and `supporting`; do not promote every card calorie value to the main-result style. Use `font-variant-numeric: tabular-nums` for updating/aligned numbers, layout for alignment and wordmark-only negative tracking.
- **Font integration trap:** installed `@fontsource-variable/inter` CSS registers `Inter Variable`, while canonical tokens specify `Inter`. Neither runtime currently loads it. Register the loaded font under the canonical family or explicitly reconcile the naming across the approved source and consumers. Inspect the browser's rendered font and updating digits in both the app and Storybook; a computed family list alone does not prove that Inter rendered. Preserve `vite/client` in `tsconfig.json` when adding CSS imports.
- Icons come from installed `@phosphor-icons/react`: regular by default, bold only for persistent selected navigation. There is no official `medium` weight. Do not mix Lucide, thicken SVG paths or turn hover/press/focus/loading into selection. Check installed exports before importing an icon; use the semantic size roles, normally a 24 px glyph inside a target of at least 48 × 48 CSS px; Add food's target is 56 × 56.
- Recipe images are 4:3 on cards and 16:9 in details. Titles wrap and containers grow. No-photo is usable loaded content, not a skeleton or failed record. Keep nutrition/copy outside photography. Competitor screenshots belong to labeled references, not product image assets; retain asset attribution where required.
- No CSS framework is installed. Figma-generated Tailwind classes do not supply styling in this repository. There is no token-to-CSS/TypeScript generator yet; establish a deterministic derivation when implementing foundations instead of hand-maintaining parallel token values. Do not claim proposed output paths or `tokens:*` scripts already exist.

## Storybook is the same UI, exercised separately

- `.storybook/main.ts` discovers `../src/**/*.mdx` and `../src/**/*.stories.@(js|jsx|mjs|ts|tsx)`. Put stories beside the corresponding source. The empty `storybook/Introduction.mdx` is outside these globs; editing it alone will not publish documentation.
- **Two previews are not merged:** installed Storybook resolves `.storybook/preview.ts`; `.storybook/preview.tsx` is ignored. When touching setup, consolidate into one active preview, preserve the intended parameters and import the same font/theme used by the app. Verify the rendered preview after consolidation.
- Use typed CSF stories with the source component and meaningful args/states; enable `autodocs` tags where [component documentation](https://storybook.js.org/docs/writing-docs/autodocs) is needed. Add interaction assertions for behavior, not just a visual specimen. Use the installed `storybook/test` utilities; documentation, controls and play functions must not become an alternate component implementation.
- The configured Vitest project is named `storybook`, using `storybookTest` and headless Playwright Chromium. Installed addon-vitest 10.5.10 automatically supplies preview annotations. Absence of `.storybook/vitest.setup.ts` is not itself a defect; do not copy older manual `setProjectAnnotations` setup without checking installed behavior.
- `.storybook/preview.ts` currently sets `a11y.test: 'todo'`. This does **not** make violations fail the CLI. For components accepted as verified, use `a11y.test: 'error'` at the appropriate scope and resolve violations; document any deliberate exception narrowly. Review incomplete checks manually. See [Storybook's accessibility test behavior](https://storybook.js.org/docs/writing-tests/accessibility-testing).
- No unit-test project is configured. A new ordinary `.test.ts` file is not automatically covered by the Storybook project. If domain tests are needed for arithmetic/filter/state changes, wire a small appropriate Vitest project and record its real command before claiming coverage.
- Chromatic and the Storybook MCP addon are configured packages, not evidence of a connected service, uploaded snapshots or a visual baseline. Use only capabilities actually available in the session.

## Choose Figma operations deliberately

Known targets: [Figma Design — branding](https://www.figma.com/design/heuO3V1WlKG44CukQswCkw/jito-calories-calculator?node-id=92-1209), with low-fidelity work in the same Design file; [FigJam — research/task flows](https://www.figma.com/board/Np6ZrdnQKjVw7tZw8W51kT/jito-calories-calculator?node-id=4-334). Locate the actual page/node before editing; do not guess IDs or treat a FigJam URL as a Design target.

No live Figma tool was available during this baseline audit: canvas findings came from supplied exports/screenshots and repository history. Future sessions must inspect their own connected tools and permissions. An installed skill or an MCP setting does not prove that a particular operation can execute.

| Task | Appropriate surface and completion evidence |
| --- | --- |
| Read a reference, compare a flow, inspect variables/components | Figma context/metadata/variable tools plus a screenshot of the same node; FigJam tools for the research board. Compare against the owning repository contract. |
| Authorized native branding, annotations or structured canvas edits | Use an actually exposed write capability. Official remote `use_figma` can edit native content and requires a Full seat and edit permission. Preserve unrelated content and inspect the changed canvas. |
| Bulk variables, variants, Auto Layout, resizing or semantic renaming | Conditional: inspect consumers, make a small representative batch, inspect structure **and rendered output**, then expand. Preserve alias meaning, component/instance links and wrap/hug behavior. |
| Present implemented product screens in Figma | Render and verify code first; use remote `generate_figma_design` only when exposed by the connected client. Capture into the intended existing Design file. A wrong/non-Design target can create a new file. Verify native editability and actual bindings afterward. |
| Arithmetic, filters, navigation state, keyboard behavior, accessibility and responsive layout | React/CSS/feature code, Storybook and the actual browser. A Figma prototype cannot verify these runtime properties. |
| Final hierarchy, optical alignment, typography, crop, density and composition | Inspect screenshots at readable scale and representative sizes. These require visual judgment; structural success cannot replace it. Reserve evaluator/user approval for actual design decisions, not routine spacing questions. |
| Missing tool, inaccessible target, unsupported font/asset operation | State the exact unavailable operation and complete independent code/documentation work. Do not invent a function, claim an edit or silently replace an explicitly requested native deliverable with a screenshot. |

Figma's [tool catalog](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/), [write-to-canvas](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/) and [code-to-canvas](https://developers.figma.com/docs/figma-mcp-server/code-to-canvas/) describe different capabilities. Remote write/capture tools are not supplied by the desktop server; check which connection answered. Capture outside Drafts requires a Full seat and edit permission. Font and image support is operation-specific: use an exposed asset/capture capability when needed; do not treat `use_figma` as a general custom-font or image importer.

- The design-system deliverable is code-first: implement foundations and reusable components in repository source, and document/exercise those same components in Storybook. Figma design-system artifacts may support review or presentation, but they do not replace the implemented React design system.

- Build shared UI toward real product consumers. Storybook validates components in isolation; the runtime application validates their composition into the two required user journeys. Do not treat a completed component catalog as completion of the product UI.

For any automated canvas mutation, read back changed variable values/types/aliases and bindings; component variants and representative instances; widths, heights, gaps, padding, resizing and overflow; font family/weight/line height and text wrapping. Then inspect screenshots of the edited objects **and their consumers**, including long titles/no-photo and narrow layouts. Verify numeric features in actual text instead of assuming a font supports or applied them. Logs, layer counts and successful API responses are not visual acceptance.

Keep UI text, vectors and intended components editable; photographs and labeled external references may be raster. Code-to-canvas capture is a review artifact, not automatic React component synchronization. Code Connect maps existing design components to code when configured; this repository has no mapping setup. A Figma improvement feeds back through the owning contract/token source and React component, then Storybook/browser verification and a refreshed capture. Never maintain independent “final” implementations in Figma and code.

## Regression knowledge worth preserving

| Trigger and evidence | Prevention and proof |
| --- | --- |
| Reading obsolete paths after the token move (`0d99125`), reset (`f6bfa03`) and canonical replacement (`dc0a706`) | Edit only current token JSON; search old-path references during documentation changes. Confirm no duplicate source or hand-maintained generated palette was introduced. |
| Adding styles/decorators to the ignored preview after Storybook setup (`a75335c`) | Use one active preview; confirm the font/theme and affected story actually render. A successful empty Storybook build does not catch this mistake. |
| Assuming the Inter install (`d9d603a`) makes the token family render | Check imported font-face family against the token stack and browser-rendered font. Retain the Vite client types added in `702612b`; do not loosen TypeScript to hide CSS import problems. |
| Translating old PDF arrows literally: Search loading→no matches labeled as results; camera-denied→review labeled found; recipe Loaded→Loading labeled Back and Loading→Unavailable labeled loaded | Follow current state tables, not frame order. Exercise success, no matches, denial/failure, Retry and Back separately; inspect corrected connectors if editing Figma. Documentation corrections `a9b7027`/`0ea7884` are not proof that the live canvas was reverified. |
| Reusing older stylescape navigation or SaveFeedback | Check all roots and details against the 3+1 bar, actual origin and candidate-confirmation rules. Valid amount editing must update locally without mandatory Save. |
| Treating build/test infrastructure as completed UI verification | Require actual discovered stories and assertions. The baseline Storybook build succeeded with no stories; Vitest exited 1 with “No test files found.” Never hide that with a pass-with-no-tests option. |

## Commands and acceptance by change type

Run from the repository root. Use installed tools; do not invent npm scripts.

| Purpose | Command |
| --- | --- |
| Install locked dependencies | `npm ci` |
| Run app | `npm run dev` |
| Check TypeScript independently of Vite | `npm exec --no -- tsc --noEmit` |
| Build application | `npm run build` |
| Inspect built application locally | `npm run preview` |
| Run Storybook, configured port 6006 | `npm run storybook` |
| Build Storybook | `npm run build-storybook` |
| Run configured story tests | `npm exec --no -- vitest run --project=storybook` |
| Check token JSON syntax only | `node -e "JSON.parse(require('node:fs').readFileSync('src/design-system/tokens/tokens.json','utf8'))"` |
| Inspect final whitespace and scope | `git diff --check` and `git status --short` |

There are no `test`, `lint`, `typecheck` or token npm scripts. [Vite transpilation is not type checking](https://vite.dev/guide/features#typescript). The baseline typecheck and both builds passed on Node 24.19.0/npm 11.9.0 after a locked install with lifecycle scripts disabled. Story tests failed because no tests existed; no browser interaction or accessibility pass was established. Token inspection separately passed the declared DTCG schema and resolved 109 aliases across 168 tokens; this audit is not a checked-in validator.

| Changed area | Required evidence before calling that change complete |
| --- | --- |
| TypeScript/component/feature code | Typecheck and app build; execute the affected behavior. For shared UI also build Storybook and run relevant story tests. Check changed public props against real consumers. |
| Build, dependencies or configuration | Reproducible locked install, typecheck, app and Storybook builds; open affected app/story surfaces. If test configuration changed, prove stories were discovered and executed, not merely that the process exited. |
| Tokens or generation | JSON syntax **and** validation against the declared [DTCG 2025.10 schema](https://www.designtokens.org/schemas/2025.10/format.json); recursively resolve aliases/effective types and validate units, color alpha and composite members. Check deterministic generated output once a generator exists, unresolved CSS variables and computed consumer styles. Recalculate changed contrast pairs. If Figma is part of the task, compare its actual values/aliases/bindings after synchronization. No repository schema/generation command exists yet; add the smallest required check for a foundations task and record its real invocation, or report that verification unavailable. |
| Component or visual state | Render relevant default/selected/disabled/loading/invalid states, long content, partial data and no-photo where meaningful. Test actual actions and assertions, stable loading geometry/name, disabled activation and accessible state. Inspect the source component in Storybook and at least one actual product consumer when available. |
| Screen, navigation or flow | Exercise the changed branch plus entry/exit and cancellation. For shared navigation/completion changes, walk both stories and all four food-entry methods. Verify candidate replacement/cancellation, invalid→valid amount, filter Apply/Reset/Cancel/removal, recipe success/failure/Retry/Back and late-response handling against the contracts. |
| Responsive, overlay or anchored action | Inspect 320/390/430 CSS px widths and text enlarged to 200%. Use real long English text. Open the software keyboard where supported; inspect safe areas, body scrolling, last field/action, bottom-bar restoration and focus visibility. Check an actual modal's focus entry, Tab/Shift+Tab containment, close/Escape and opener restoration. |
| Accessibility or color | Run affected story checks with `a11y.test: 'error'`; inspect incomplete results. Manually verify names/roles/state, labels/errors, keyboard order, modal focus, non-color cues, reduced motion and status announcements. Recompute foreground/background contrast for changed actual uses, including focus and selected/invalid boundaries; alpha must be composited over its background. |
| Figma | Perform the structural and screenshot readback above; compare the actual changed nodes and consumers with the canonical contract. A supplied export or completion checkbox cannot stand in for a fresh read. |
| Documentation | Check paths, screen IDs, fixtures, commands and claims against current source. Update the owning document and stale cross-references; distinguish planned, implemented and executed verification. Do not run unrelated builds for prose-only changes. |
| Deployment or submission | Open the actual public app, Storybook and shared artifacts in incognito without owner credentials. Check asset/font loading, navigation and refresh for any routes actually implemented, both journeys and browser errors. Record real URLs in README; inspect the deployed revision rather than only local output. |

For contrast, apply [WCAG text thresholds](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): 4.5:1 for normal text, 3:1 for qualifying large text; necessary non-text boundaries/state information need [3:1 against adjacent colors](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). The current decorative border is only **1.23:1 on canvas** and must not become the sole essential control boundary. The product's 48 px target baseline is stricter than [WCAG 2.2 AA's 24 px minimum with exceptions](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html); do not mislabel 48 px as the standard. Preserve the specified 3 px focus ring and 2 px canvas gap without clipping.

Report verification as separate facts: commands/results, structural inspection, rendered visual inspection, manual interaction/accessibility and unavailable checks. Include the affected surface/state and remaining limitation; claim human review only when a person performed it. Passing a build, rendering a story or inspecting a Figma tree proves only that specific check. Do not claim WCAG conformance, live recognition or complete flows from fixtures and static images.

## Keep the work and handoff bounded

- Search existing source and contracts before adding abstractions. Complete the requested slice; do not expand a foundations task into the full component catalog or a component task into product routing. Add dependencies only for a concrete uncovered need, preserving the existing stack and lockfile.
- Update existing canonical documents rather than producing competing `final-v2` specifications. Keep rationale in UX/visual documents, component API/states beside source and stories, and reviewer-facing AI process in `docs/project/ai-workflow.md`. This file holds persistent operating rules; do not paste research, full token tables or session logs into it.
- Work in the current checkout unless another branch/worktree is requested. Do not commit, push, publish, deploy, rewrite history or discard unrelated changes without authorization covering that action; honor authorization already given. For requested repository delivery, follow README's short-lived branch/PR workflow and keep `main` working. Before a requested commit, inspect the diff and stage only intended paths. Never use cleanup/reset operations to erase unexplained user work.
- Keep disposable renders/logs outside tracked source and respect ignored `dist/`, `storybook-static/`, `node_modules/` and environment files. Do not commit credentials. Do not create project skills, rule directories, hooks or MCP configuration solely to make this small repository appear more elaborate. If instructions are later split, remove duplication and preserve explicit source ownership.

## Submission is an evaluator-facing deliverable

The [original assignment](https://github.com/jito-dev/trainee-designer-apr-2026-test-task/blob/develop/README.md) requires a paid Claude account and Claude Code, three deliverables—branding/stylescape, design system, and key screens/user flows—and an English video walkthrough showing all three. Branding may use Figma or another suitable tool; the design system and screens must be created using Claude Code. The repository's accepted delivery path uses React and Storybook.

All deliverables must be in English and accessible to the evaluator **in incognito**; inaccessible submissions can be discarded. Provide the deliverables through GitHub or a text file of links. The suggested timeframe is about a week, with no advantage for rushing at the expense of quality. No specific hosting vendor is mandated.

Before submission, replace README's Live App, Storybook and Figma Design placeholders with actual artifacts, add the English walkthrough link, and verify every shared link without owner access. Replace or remove the unused Case Study placeholder; a separate case study is not mandated by the assignment. The repository was public at the inspected baseline; public Figma/video/app access was not verified. A Figma link in another document does not make README complete. No live app, published Storybook or video URL is established in the current repository. Do not report these deliverables complete until the linked artifacts exist and their access and content have been checked.
