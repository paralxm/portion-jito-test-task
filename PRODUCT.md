# Product

<!-- impeccable:product-schema 1 -->

## Platform

Mobile-first, iOS-oriented React/Vite/TypeScript web prototype. English UI, light theme.

## Users and jobs

People deciding what to eat who need to:

1. Identify a food or dish, set the intended portion, correct the input, and understand its calories/nutrition.
2. Narrow recipe options and understand why each result matches the active criteria.

Portion provides clarity before eating. It is precise, correctable, neutral, and honest about uncertainty. Neither job requires an account, a daily goal, or logging.

## Capabilities

### Navigation

- Root destinations: **Home**, **Search**, **Recipes**.
- Separate action: **Log food**, opening one method sheet over the current context.
- Methods, in this order and hierarchy: one prominent full-width **Search food** row; **Scan barcode** and **Take a photo** as two equal cards side by side under a restrained caption; a separator; a quieter **Enter manually** row. Choosing a method starts acquisition; it never commits food.
- Focused acquisition/review screens hide root navigation.
- Search has Food/Recipes scopes and holds the complete recipe catalogue with its count, text search and the numeric filters; Recipes is photographic discovery without a search field; Recipe Details preserves its origin.
- Browser Back and swipe-back follow the focused-step stack and obey the same exit guard as the header's Back; a refresh or tab closure only gets the browser's generic unload prompt.

### Home

Home is a bounded daily overview of one selected day, organised by meal — not a diary dashboard, a timeline or an analytics view. Any local day up to today can be selected; days after today are unavailable (no planning).

- `S01-1`: no committed food entries on the selected day. `S01-2`: one or more.
- Order: one root header → the compact day strip → daily nutrition (the calorie card and three macro cards) → one compact recipe recommendation → Breakfast / Lunch / Dinner / Snacks → Water.
- Header: the Portion logo, the selected day's context (`Today · Sep 5`, `Yesterday · Sep 4`, `Thu · Sep 3`) and the streak count with its explanation. The sole `Set targets` / `Edit targets` action sits on the calorie card, never in the header or the macro cards.
- Day strip: one compact row of day tiles, Monday-first whole weeks back to the earlier of three weeks before today and the selected day, scrolled by touch, drag, trackpad and keyboard (arrow keys, Home, End); today marked and named as such, the selected day distinguished, days after today unavailable (no planning); a `Today` action while another day is selected; no calendar container and no previous/next week buttons. Selecting the earliest tile reveals another week, so every past day stays reachable. Selecting a day shows that day's entries, meal totals, calorie/macro totals and water; empty past days show truthful empty states. The selection survives visits to Search, Recipes, details and acquisition flows. Today follows the local midnight while today is selected; an explicitly selected earlier day stays selected.
- Calorie card: with a calorie target — the remaining amount prominent, one horizontal bar with the target marked, the consumed amount and the target stated beneath it; `0 kcal remaining` at the target; above it the excess stated in words, never a negative remainder, with the fill stopped at the marker. Without a target — the logged amount alone (`0 kcal logged` at first), `Set targets`, and no bar, percentage or remainder; nothing infers "on track" from the amount logged so far. The target shown is the one in force on the selected day (target history below).
- Macro cards: Protein, Carbs and Fat, each its own card with the nutrient's semantic marker and the logged grams; when the person entered a target for that nutrient the card reads `24 / 120 g` with its own thin bar (fill capped at 100 %, numbers always visible). A calorie target does not imply macro targets; a card without one stays complete and never looks disabled; unknown or partial amounts keep their words and never become zero.
- Targets: optional, set or edited through the targets flow (docs/ux/targets-and-estimation.md) — one route-choice sheet, then focused full-screen steps: a manual editor with suggested macro presets, or a three-step estimate built on the 2023 Dietary Reference Intakes energy equations with a full-screen review before saving; targets start today or on a chosen later date, with at most one scheduled change. No mandatory first-use step, no automatic average target.
- Streak: a day qualifies when it holds at least one confirmed food or recipe entry; water, opening the app, reaching a goal or viewing a day never count. The streak is the run of consecutive local days ending today when today qualifies, otherwise the run ending yesterday while today is open, otherwise 0; it is recomputed from the entries (add, backfill, remove) and always describes the run relative to today, not the selected day. A neutral icon and count with a short explanation; no reward, pressure copy or fabricated number.
- One compact recipe recommendation above the meals, with a real photo, the recipe's own calories, serving basis and metadata: headed `Matches your preferences` (with `Matches all N filters` evidence) only when Recipes discovery has active preferences the recipe satisfies; otherwise the neutral `Recipe to try`. One factual line — `One serving fits in your remaining N kcal` — appears only when a calorie target exists, the total is complete and below it, and the recipe's per-serving calories are within the remainder. No health, suitability or preference claim; the card opens that recipe's existing detail screen by its stable id and never adds food.
- Meals: Breakfast, Lunch, Dinner, Snacks are always shown, empty ones included, with the selected day's committed entries under their meal and a per-meal add action that binds that meal and that day to the task.
- Water: the selected day's total against a daily reference (`1.25 / 2 L`, a 2 L product default labelled adjustable, never personalised), a `+250 ml` quick add with Undo bound to that day, and a sheet (named for the day) for other amounts, editing the day's total or changing the reference (500–5,000 ml, applies to every day). Adding an amount and replacing a total are distinct actions. Logging a drink as food never changes water.
- Calculation and recipe discovery remain complete without a goal, log, or water record.

### Meals and Add-to-meal

- Every committed food or recipe entry belongs to exactly one meal: `breakfast`, `lunch`, `dinner`, or `snack`, and to the local day bound when its task started. A record without a meal is presented as unassigned with a `Choose meal` resolution, never silently classified.
- Every food commits on its review screen (search, barcode, photo) or on manual entry's second step through one shared portion form: the identity and basis, the amount with steps and item-supported presets, the recalculated nutrition, the meal choice, the target day when it is not today, and one final action such as `Add to lunch`. No second sheet repeats what the screen already confirmed. Recipe Details, which has collected no portion or meal yet, uses the `Add to meal` sheet with servings.
- A task started from a Home meal row preselects that meal; otherwise a documented time-of-day rule suggests one. The choice is always visible and editable. No eating time is asked or stored.
- A confirmed add creates exactly one entry on the bound day and returns to Home showing that day; a midnight rollover during the task never moves the entry. A logged entry reopens for editing with its meal, portion, and unit; `Update entry` keeps its identity and day.
- One exit policy for every food task (manual, barcode review, photo review): `Cancel` is explicit and secondary to the final action; an untouched task exits at once; a task with entered or edited data opens the shared `Discard changes?` confirmation (Keep editing focused; only Discard changes clears the draft and returns to the recorded origin). Back between preserved steps and cancelling a nested sheet never discard the parent draft. There is no ambiguous `Done`.

### Food calculation

- Search/barcode/photo/manual identification produces a reviewable candidate.
- Results always retain identity, amount, unit, and nutrition basis.
- Scale only compatible known units. Never invent g↔ml/piece/serving conversions. Portion steps are documented increments (25 g or ml, ¼ serving, 1 piece); presets come only from the item's own units (its grams or millilitres and its serving), never a universal bowl.
- Missing nutrition is `Not available`, not zero.
- Adding is optional and requires the explicit final `Add to {meal}` on the review or portion step.
- Review after barcode or photo follows one hierarchy: identity → portion → nutrition → meal and day → the final action. A barcode result shows the matched record's image, name, brand when supplied, the read code and the basis, described as a match (never verified), with `Change product` and `Edit label values`. A photo result keeps the explicit suggestion-selection step, shows the captured frame (a labelled sample in this prototype, never presented as a catalogue photo), explains that the user checks the match and enters the portion, and offers `Change match`, `Retake photo` and `Edit nutrition values`. Barcode metadata never appears on a photo result.
- Corrections open manual entry prefilled from the record and create a manual override that keeps its provenance; the shared catalogue is never changed.
- Manual entry is two steps. Step 1 of 2, food details: name, an optional local photo, the reference amount and unit, calories (required; a known 0 is a value) and optional macros where a blank stays unknown. Step 2 of 2, portion and meal: the identity summary with `Edit food details`, the directly editable actual amount with steps and presets, the live result, the meal, the day and the final action. The task owns the whole draft, so Back and Edit between the steps keep every value; a reference-unit change that the retained portion cannot follow asks for the amount again rather than converting.
- A user photo is optional local data: validated by type and size, previewed, replaceable and removable, kept only as a small bounded preview once the entry is logged, never uploaded, never used to infer nutrition, never committed to the repository.
- Food search shows the scanner as a labelled sibling action beside the field (below it at narrow widths); recipe search offers the filter action in the field, with applied filters shown as chips beneath it.
- The Food tab is populated before anything is typed: a catalogue of 12 foods or dishes and 3 drinks, each with a local licensed photo, a name, calories with an explicit basis and one detail line, in a list (default) or a two-column grid chosen from a compact toolbar under the field; the choice persists on the device. `Recently added` — derived only from confirmed meal entries, newest first, one row per item — sits above `Explore foods` when history exists. Food filters (All / Foods / Drinks, from each item's own record) live in the shared filter sheet behind the toolbar's `Food filters` action; a query yields one unified, counted set across recents and catalogue.
- Drinks carry volume units and are logged like any food; logging a drink never changes the water record.

### Recipe discovery

- The Recipes root is discovery without a search field: one `Featured recipe` with prominent photography (the first editorially flagged recipe that satisfies the preferences; "Recipe of the day" is never claimed without daily selection logic), quick preferences (dietary toggles combined with AND; one mutually exclusive preparation-time bound — under 15 min, 30 min or 1 h; the active count and Reset), thematic collections derived from each recipe's own record — `Ready in under 30 minutes`, `30 g protein or more` — as photographic rails, and `Browse all recipes`. Empty collections are omitted; when the preferences remove every match one empty state offers Reset. `View all` opens Search's Recipes scope with the preferences plus the collection's rule; `Browse all` with the preferences alone; both are shown there as chips. Back restores the discovery state and scroll position. Search's Recipes scope holds the complete catalogue with its count, text search, the numeric filter sheet and a List / Grid presentation.
- Supported criteria: calories per serving (a range counts as one criterion), protein per serving, preparation time, and dietary constraints as a set; every selected constraint must hold (AND), and `All` means none. A recipe declared vegan also satisfies vegetarian; unspecified dietary data satisfies nothing.
- Match claims require active criteria and known supporting values. No ratings, user counts, popularity or suitability scores are shown or invented.
- Never infer medical, allergen, or dietary safety from an image or missing data.

### Recipe details

- Focused header (`Back`, `Recipe`) with the root navigation retained; full-width photo; preparation time and declared dietary tags; title with a one-word `Add` that opens `Add to meal` with servings; nutrition per serving; ingredients; numbered method.
- No bookmark, sharing, ingredient checklists, ratings, or cooking mode.

## Data truth

Entries of every day, an effective-dated target history (each period keeps its provenance — manual or estimated — the macro preset and, for an estimate, the inputs and assumptions it was produced from), water per day, the adjustable water reference and the Search views are kept on the device (`localStorage`) under one versioned record (version 2; a version-1 record migrates with its single goal starting on the migration day, so earlier days never receive a goal that was not in force) and restored on launch. Each entry keeps the local calendar day it was recorded for; day keys are never reinterpreted from UTC instants, so travelling does not move earlier entries. Goal edits apply from today onward and leave earlier periods intact; a day before the first period shows logged amounts with no invented denominator. User photos live in a separate bounded preview store, never in the JSON record. Barcode, photo recognition, nutrition, and recipe content are deterministic fixtures. Different fixtures remain independent. Copy must identify estimates, unavailable values, and retryable system states without implying live recognition. The scanner and camera steps are fixture-backed: the prototype reads a sample barcode and captures a labelled sample photograph, and the screens say so; no simulator or debug controls appear in the product.

## Brand commitments

- Name: **Portion**. Wordmark: lowercase `portion`, Inter Semi Bold, −3% tracking only on the wordmark.
- Direction: **Measured Clarity**—blue-led interaction, white/cool-neutral surfaces, neutral numeric results, restrained geometry, structured alignment.
- Typeface: Inter only.
- Icons: Phosphor regular; bold only for the persistent selected navigation destination.
- Tone: factual, calm, concise, non-judgmental. No praise, shame, fear, diagnosis, or health scoring.

## Non-goals

Accounts/onboarding; a separate Diary/Profile destination; a mandatory target or an automatically applied average target (the optional estimate path is reviewed and saved explicitly); a target weight, rate of change or completion date; exercise, weight, weekly or long-term analytics (Home shows one selected day at a time; the streak is a plain count of consecutive logged days, not a reward system); health scores; medical claims; saved recipes; meal planning or future days; recipe authoring; multi-ingredient building; exact eating times or a timeline; popularity, ratings or user counts; social, payment, coaching, notification, or gamification features; dark mode; production recognition/nutrition services.

## Evidence limits

- Figma/FigJam and competitive material are design inputs, not proof of user validation.
- No completed primary usability research or trademark/domain clearance may be claimed.
- Figma does not override accepted product/UX behavior, and screenshots do not prove runtime behavior.

