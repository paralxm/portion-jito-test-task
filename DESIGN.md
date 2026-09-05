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
- Blue means action, selection, focus, or information—not calorie quality. The calorie budget fill is blue as *information about progress toward a user-set bound*; it never changes hue for reached or over-goal.
- Calories and nutrition values are neutral by default. Nutrient colors are supporting identifiers, never the only meaning.
- Water uses its own semantic family (`water.accent`, `water.surface`, `water.track`, `water.text`): an accessible cyan distinct from action blue and from the carbohydrate teal. Amount and reference are always stated in text.
- The camera stage (`camera.stage`, `camera.stage-text`, `camera.chip-surface`, `camera.frame`, `camera.detected`) is the only dark surface; it exists to show a viewfinder, never as a theme.
- Error, warning, success, and information describe system state, never food or user behavior.
- Use the canonical tokens and verify the actual rendered foreground/background pair.

### Brand lockup

- `PortionLogo` is the only brand rendering: the lowercase `portion` wordmark (Inter Semi Bold, −3 % tracking) followed by the blue portion dot, optically aligned to the x-height.
- Sizes: default (24/32) for root headers, compact (18/24) for tight rows. Tones: default (neutral wordmark, blue dot), monochrome (both neutral), inverse (both white on a dark or blue surface).
- Minimum height 18 px; clear space equal to the dot diameter on every side; never stretched, recoloured outside the three tones, or paired with a second mark.
- The lockup has one accessible name, `Portion`; the dot is decorative and produces no screen-reader output.

### Shape and depth

- Use the canonical radius scale: compact nested elements 4, controls 8, cards 12, grouped surfaces/sheets/navigation group 16, true circles full.
- Preserve concentric nested corners.
- A card must be one meaningful group or one tappable object. Avoid card-inside-card composition.
- Prefer spacing, border, and surface contrast. Use shadow only to explain overlay depth.
- Avoid default pills; reserve full rounding for circles or controls whose behavior requires it.

### Icons and imagery

- Use Phosphor regular; bold only for selected persistent navigation.
- Visible icon size and hit target are separate. Icon-only controls require accessible names.
- Recipe card images use 4:3; recipe detail uses 16:9. Every normal catalogue recipe has a licensed, locally stored photograph; `No photo` is the resilient fallback for an absent or failed image, never the principal state of a catalogue recipe.
- Photographs are optimised local WebP (1200 × 900, centre crop), registered with provider, creator, item URL, licence URL, access date, crop, and alt decision in `docs/design/hifi-decisions.md`. Decorative empty alt when the adjacent text already names the recipe. Reference UI screenshots are never production media.
- Photography is evidence of appearance only; it never proves nutrition, ingredients, or suitability.
- Product glyphs are served from `src/assets/icons/`, an export of the official Phosphor paths generated from the installed package (`npm run icons:build`); `Icon` keeps its API, weights and sizes.

### App icon

The app icon and favicon are the portion dot alone — the brand mark (action blue) centred on the canvas white — generated from `src/assets/favicon/make.mjs` into `public/`. No wordmark, gradient, second symbol or alternative colourway: the lockup stays the only brand rendering inside the product, and the dot is its only mark outside it.

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

Limit grouped surfaces. On Home the grouped surfaces are the calorie budget, the recommended recipe (one tappable object), the meal group, and the water tracker; each is one meaningful group. Nothing else on Home is a card.

### App header

- `AppHeader` has three variants and a screen shows exactly one: **root** (`PortionLogo`, a contextual line such as `Today · Sep 5` or `Thu · Sep 3`, and on Home the streak control as the trailing element — never a targets action; the screen name is a visually hidden h1), **section** (28/36 screen title with optional trailing action), **focused** (Back, 18/24 title, optional trailing action or status such as `Step 1 of 2`).
- Home uses root; Search and Recipes use section; barcode, photo, manual entry, and review use focused with the navigation hidden; Recipe Details uses focused (`Back`, `Recipe`) with the root navigation kept.
- The header owns the top safe area exactly once.

### Bottom navigation

- One row: `[ Home | Search | Recipes ]   (+)`.
- Three equal destinations fill one 16-radius group with 4 px inner padding; a 16 px gap separates the independent 56 px `Log food` circle.
- Active destination: bold icon, visible label, selected surface, `aria-current="page"`. Inactive destinations: regular icon with accessible name.
- `Log food` is the strongest filled action and never selected.
- At narrow or enlarged-text widths, stack the active label under its icon; do not hide or shrink it.
- The bar is fixed to the viewport bottom on Home, Search, Recipes, and Recipe Details, centred within the mobile shell, on the canvas surface with no top border and only the restrained `shadow.navigation` elevation. It owns the bottom safe area once; the root layout reserves matching bottom padding and scroll padding so content, dialogs, sheets, and the keyboard never collide with it.
- Hide the whole navigation unit when the software keyboard or focused flow requires it.

### Day strip and streak

- `DayStrip` (feature, after H-REF 1) is one compact row of 48 px day targets — weekday over date — exposed as a radio group: an unselected day is text on the canvas with no tile, border or shadow (a hover shows the light surface only); the selected day is the one filled tile, action blue with on-action text at the control radius; today is marked with a dot and named `today`; days after today are muted disabled text with no tile, named `not available yet`. The row itself is the navigation: it scrolls by touch, trackpad, mouse drag and keyboard (arrow keys, Home, End), bleeds to the shell's edges, and keeps the selected tile in view; there is no calendar container and no previous / next week button. A slim caption row above carries the selected month and, while another day is selected, the `Today` text action. Tiles never shrink below 3 rem or 48 px.
- `StreakIndicator` (feature) is a quiet 48 px control in the root header: a neutral `CalendarCheck` glyph, the count and its unit; its accessible name reads the full explanation and it opens a short `ModalSheet` with the rule. No flame, badge, colour change or pressure copy.

### Daily nutrition (calorie card and macro cards)

- `DailyNutrition` (feature, after H-REF 1) is one coordinated section: the calorie card and, one 8 px step beneath it, three macro cards — four separate containers on the same surface (canvas, decorative border, card radius) sharing the outer width. The calorie card leads through its 40/48 figure, never through a darker fill; no wrapper border, shadow or tinted panel is drawn around the group, and nothing else on Home carries a targets action.
- `ProgressBar` (primitive) owns the horizontal track, bounded fill, target marker, clamping, unavailable state, `meter` semantics with `aria-valuetext`, and reduced-motion behavior.
- `CalorieBudgetBar` (feature) owns the calorie card's wording and data: the 40/48 figure is remaining while below the target, `0 kcal remaining` at it, the excess above it (`150 kcal over target`, never a negative remainder); the one `Set targets` / `Edit targets` action sits at the top right; the track with its marker comes next, then `● 790 consumed · 40 %` and `Target 2,000 kcal` stated once beneath it. Without a target the logged amount is shown (`0 kcal logged` at first) with `Set targets` and no bar, percentage or remainder is drawn; a partial total is labelled and has no percentage; on an earlier day without a target in force the card says so and a new target applies from today. Nothing says "on track".
- `NutritionMacros` with `presentation="cards"` renders Protein, Carbs and Fat as three equal cards: the category marker and name, the logged grams, and — only when the person entered a target for that nutrient — `24 / 120 g` with the card's own compact track in the nutrient's accent (fill capped at 100 %, numbers always visible). Numbers plus indicators are required in the configured-target state; without a target the card shows the grams alone and never looks disabled. Unknown is `Not available`, never zero; partial subtotals say so. Three columns hold down to 17 rem, then the cards stack.
- Digits are tabular; formats are stable (`1,600`, `20 %`). Over the target the fill stops at the marker and the text states the excess—no red, green, glow, gradient, or ring imitation. `ProgressRing` is deprecated and has no product consumer.

### Targets sheet

- `TargetsSheet` (feature) is a `ModalSheet` whose title and footer follow its step. Entry (no targets): `Set daily goal` — "How would you like to set it?" — with two `MethodOption` rows, **Help me estimate** and **I know my goal**. Editor: `Daily calorie target` (`AmountField`, kcal), `Nutrition preference` as four radio `FilterChip`s, then either the **Suggested macros** list on the light surface (grams and shares, with the not-personalised caption) or three optional gram fields with an informational mismatch line; `Remove targets` and `Help me estimate instead` / `Recalculate estimate` as small text actions; footer `Back` or `Cancel` + `Save`.
- Estimate steps use the focused-form pattern inside the sheet: `About you` (Step 1 of 3: age, the sex the equation uses as native radios, height and weight with a `SegmentedControl` unit switch), `Lifestyle` and `Goal` (Step 2 and 3 of 3: native radio rows with descriptions), then `Estimated daily target` — the 40/48 figure on the light surface with its assumptions in words, an editable calorie field, the same preference controls, and `Save targets`. Warnings (a gain goal, a refused loss target) are `InlineMessage`s in the warning tone; nothing is red for food or people.
- Back inside the sheet keeps every draft; dismissing with unsaved edits opens the shared `DiscardChangesDialog`; Save is a single action.

### Meals

- `MealGroup` is one grouped surface titled `Today's meals` with a subtotal; `MealSection` rows for Breakfast, Lunch, Dinner, Snacks are always present, separated by hairlines, each with a filled (logged) or hollow (empty) indicator paired with text—the kcal subtotal or the `Add breakfast` action—never colour alone.
- `MealEntryRow` reuses the food-row anatomy (name, portion, kcal, chevron) and opens the entry for editing. A newly added entry is highlighted briefly with the disclosure motion token; the highlight never delays interaction.
- `MealPicker` is a radio group of four chips (check mark + selected surface + boundary) shared by the Add-to-meal sheet and existing-entry review.

### Water

- `WaterTracker` is one surface with two sibling controls: `Edit water, 1.25 of 2 litres` (label, figure, the `Adjustable reference` caption, track) and `Add 250 millilitres of water` (`+250 ml`). No clickable container wraps a button. The reference is labelled adjustable, never personalised.
- Quick add animates the figure and the fill from the previous to the new total over the `value-change` motion token (350 ms, standard easing), announces once (`250 ml added. 1.5 litres today.`), and shows a confirmation with `Undo`. Repeated taps accumulate from the latest total. Reduced motion updates instantly.
- `WaterSheet` offers presets 150 / 250 / 350 / 500 ml as radio chips, a labelled `Custom amount` in ml, `Add water` (disabled while nothing valid is chosen), a secondary `Edit today's total` mode with `Save total`, and a `Change the reference` mode (`Daily reference`, 500–5,000 ml, `Save reference`) whose copy says the reference is a default to adjust, not a requirement. It is a `ModalSheet`: focus contained and returned, Escape dismisses, the footer owns the bottom safe area.

### Portion form and the final action

- `PortionForm` (feature) is the one portion step every commit surface shares (manual step 2, every review, and — for servings — the recipe sheet's arithmetic): a − / + pair of outlined 48 px icon buttons flanking the `AmountField` (steps of 25 g or ml, ¼ serving, 1 piece), a wrapping row of preset chips that come only from the item's own units, the recalculated `NutritionSummary` on the light surface for exactly that amount, then `MealPicker` and, when the commit lands on another day, one informational line naming it.
- The final action is a single large primary `Add to {meal}` in the focused footer, unavailable while the amount is invalid or no meal is chosen, with a text `Cancel` beneath it. Duplicate activation is blocked. There is no second sheet after it.
- `DiscardChangesDialog` (feature) is the shared exit confirmation over `ConfirmDialog`: `Discard changes?`, the consequence in words, `Keep editing` (secondary, focused first) and `Discard changes` in the destructive treatment (the error tokens; never a new red, never a red dialog).

### Add to meal sheet (recipes)

- `AddToMealSheet` remains for Recipe Details only, which has collected no portion or meal: thumbnail, name and basis, `MealPicker`, servings, the recalculated preview, the target-day line when it is not today, and the single final action `Add to {meal}`; `Cancel` closes without mutation and never touches any other draft.
- No exact time picker. Disabled while the amount is invalid; duplicate activation is blocked.

### Camera stage

- `CameraStage` is the shared dark viewfinder for barcode and photo: stage surface, four focus corners, a text status chip, an optional moving scan line (barcode, while scanning only), an optional circular framing guide (photo), and the captured frame when one exists.
- Barcode: `Scanning` chip and scan line while scanning; on a read the corners and chip switch to the detected treatment (colour plus wording), the line stops, and `Looking up product` is announced; failures keep the read code visible.
- Photo: `Frame the food` chip, a 72 px circular shutter below the stage, and the review-before-anything note beneath it.
- Production shows no simulator, flash, zoom, or camera-mode chrome; the caption says the prototype uses fixture media. Reduced motion removes the scan line and detection transition.

### Search field actions

- One structure for both scopes (ledger §13): the query field → the Food / Recipes tabs → the results toolbar with `ViewToggle` (List / Grid, a radio group of 48 px targets with glyph and label) at the start and the scope's one filter action at the end → applied chips → the count → the results. There is no in-field filter action and no separate left-aligned Filters button.
- Food scope: the field keeps only the clear control; `Scan barcode` is an icon-only outlined `IconButton` beside the field (accessible name and tooltip "Scan barcode"), a sibling that starts a flow (never a submit or a toggle); the field takes the room it releases at every width. It preserves query, filters, view, meal and day context on return. The toolbar's filter action is `Food filters` (All / Foods / Drinks). The list uses `FoodResultRow` with a 4 rem thumbnail; the grid uses `FoodCard` in two columns, one under 20 rem.
- Recipes scope: no scanner; the toolbar's filter action is `Recipe filters` (badge and spoken count, `Recipe filters, 2 active`) opening the recipe filter sheet; `RecipeList` presents rows (`RecipeCard` row) or a two-column grid of tiles (`RecipeCard` tile; one column under 20 rem) with the same recipes, order, evidence and count. The discovery root has no search entry at all. In a row the name has priority: its column never drops under 7.5 rem (the width of the catalogue’s longest words), the calorie value stays on one line and the basis wraps only between `per serving` and its amount; under 18 rem (22 rem with a thumbnail) the figure moves beneath the identity instead.

### Log food sheet

- Title: `Log food`, one line saying the food is reviewed before anything is saved, Close at the top right.
- In this order and hierarchy (after R6): one prominent full-width `Search food` row (`MethodOption` row: tinted icon tile, title, subtitle, chevron); a restrained caption `With the camera` over two equal cards side by side — `Scan barcode` left, `Take a photo` right — sharing one height; a `Separator`; a quieter full-width `Enter manually` row (no tint, no fill). No PRIMARY badge, no drawn home indicator, no decorative frame.
- Under 17 rem of body width (200 % text on every supported viewport) the card pair stacks, keeping Search → Barcode → Photo → Manual; every supported width at 100 % text keeps the pair. Every option is one button with a 48 px target.
- Choosing a method starts acquisition; it does not commit food. Dismissal restores the exact origin and focus.

### Photo suggestions

- Suggested foods are radio rows (name, kcal per basis) inside one group; the selected row carries the mark, the selected surface and the action boundary — never colour alone.
- `Review selected match` is the single primary action and stays unavailable until a suggestion is marked; nothing is auto-accepted.
- `None of these` discloses Retake photo, Search by name and Enter manually in place; it never navigates on its own.
- The captured frame is a labelled sample photograph in this prototype; the copy says it is not the user's food and does not measure the portion.

### Food review

- One hierarchy for every source (after R5): identity — a 6 rem 4:3 image (the matched record's photograph for a barcode, the captured frame labelled `Sample photo` for a photo, the catalogue photo for search), a label badge stating the source in words (`Barcode match`, `Photo suggestion`, `From search`), the name, brand and detail when the record supplies them, the basis line with the read code for a barcode, then the correction actions the source supports as small secondary buttons — → the shared portion form → meal and day → the single final action.
- Barcode: `Change product` and `Edit label values`; the note says the values come from the matched record, not a checked label. Photo: `Change match`, `Retake photo` and `Edit nutrition values`; the note says the user checks the match and enters the portion, and that the photo does not measure it. Barcode metadata never appears on a photo result; nothing is called verified.
- New candidate: `Add to {meal}` commits; `Cancel` leaves the task through the shared exit policy; Back returns to the preceding step. Existing entry: a `MealPicker` above the form; `Update entry` commits meal and portion together; `Remove entry` confirms; changed content protects against accidental discard.
- Unknown data is explicit. Do not infer unsupported unit conversions.

### Manual entry

- Step 1 of 2, `Food details` (after R3): the step label as the focused header's trailing status; the name field; `PhotoField` (a secondary `Add a photo` button, then a 6 rem preview with `Change photo` / `Remove`); the `Reference amount` group; the `Nutrition for that amount` group with Calories required (`0 is a valid value`) and the optional macros carrying `Leave blank if unknown` beside them. Footer: large primary `Continue to portion`, text `Cancel`.
- Step 2 of 2, `Portion and meal` (after R4): the identity summary (the user's photo or the No photo frame at 5 rem, name, `Entered by you · nutrition basis …`) with a small secondary `Edit food details`; the shared portion form; the info line separating the actual portion from the reference basis; footer `Add to {meal}` and `Cancel`. Back and Edit keep the draft with no confirmation.

### Recipe discovery

- The Recipes root (after H-REF 2): section header → `FeaturedRecipeCard` (a 16:9 photograph with the `Featured recipe` label on its own canvas chip over the image, the facts — time, kcal, protein, basis — the 20/28 title as the single control, declared dietary tags) → `Quick preferences` (the 14/20 label with the active count, `Reset` while anything is active; a dietary row of multi-select `FilterChip` toggles; a preparation-time row of mutually exclusive toggles — each row scrolls when its chips do not fit) → the count as the page's status line → the collections. Each collection is a section with a 20/28 title stating its rule, one supporting line, a `View all N` text action that never wraps inside its label, and a rail of equal-height `RecipeCard` tiles (`presentation="tile"`: the 4:3 photo above the text) 16 rem wide, scrolling sideways within the page inset with the next tile peeking; the rail owns the overflow, never the page. A secondary `Browse all N recipes` closes the page. No search field, no in-page filter sheet.
- Order card content as identity -> why it matches -> relevant calories/protein/time -> supporting imagery/metadata. Use only known criteria and data. Avoid unexplained scores, decorative match percentages, badge clouds, popularity claims, and ratings presented as suitability. Cards show a real 4:3 photograph; the fallback frame appears only for an absent or failed image.

### Recipe details

- Order: hero (16:9, bleeding to the edges of the mobile shell only — the Container's page inset is cancelled, never the viewport — and starting directly under the focused header with no negative top offset) -> time chip and dietary badges -> title with `Add` beside it -> nutrition surface (calories with per-serving basis, macros, `Show all nutrition`) -> ingredients (count, bordered list) -> method (count, numbered steps each on a light surface).
- `Add` is the only primary action and opens the Add-to-meal sheet; there is no sticky action footer, bookmark, share, checklist, or rating. The root navigation stays fixed beneath.

## Interaction and motion

- Motion explains state change, navigation continuity, progress, or overlay position.
- Keep transitions short and interruptible. Respect reduced motion.
- No looping decoration, bouncing icons, comprehension-delaying counters, or animation on every card.
- Loading, empty, error, disabled, unavailable, destructive, and success states must be visually and semantically distinct.
- Approved motion and its tokens: water quick-add fill and figure (`value-change`, 350 ms), sheet enter/exit and scrim fade (`sheet`), toast enter/exit (`sheet`), barcode scan line (continuous only while scanning; `scan-sweep`, 1.6 s), code detection and the pending transition (`feedback`), new meal-entry highlight (`disclosure`). Every one collapses to an instant state under reduced motion, and none is the only feedback.

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

