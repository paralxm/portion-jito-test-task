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
- Methods: Search food, Scan barcode, Take a photo, Enter manually.
- Focused acquisition/review screens hide root navigation.
- Search has Food/Recipes scopes; Recipes is query-free browse; Recipe Details preserves its origin.

### Home

Home is a bounded daily overview for one day, organised by meal, not a diary dashboard or a timeline.

- `S01-1`: no committed food entries today.
- `S01-2`: one or more committed food entries today.
- Header: the Portion logo, the local date (`Today · Sep 4`), and `Set goal` (no goal) or `Edit goal` (goal set).
- Calorie budget: a horizontal bar with the goal marked; remaining while below the goal, `0 kcal remaining` at it, the excess stated above it; without a goal the logged amount alone and no bar. Macro targets are optional, user-entered in the same goal editor, never derived.
- One recommended recipe with a real photo: `Matches all N filters` only when Recipes browse has active criteria a recipe satisfies; otherwise the neutral `Recommended recipe`. No goal-fit, health, or preference claim.
- `Today's meals`: Breakfast, Lunch, Dinner, Snacks are always shown, empty ones included, with today's committed entries under their meal and a per-meal add action.
- Water: today's total against a default 2 L reference (`1.25 / 2 L`), a `+250 ml` quick add with Undo, and a sheet for other amounts or editing the total. The reference amount is a product default, not advice.
- Calculation and recipe discovery remain complete without a goal, log, or water record.

### Meals and Add-to-meal

- Every committed food or recipe entry belongs to exactly one meal: `breakfast`, `lunch`, `dinner`, or `snack`. A record without a meal is presented as unassigned with a `Choose meal` resolution, never silently classified.
- Committing goes through one shared `Add to meal` sheet from every acquisition path (search, barcode, photo, manual) and from Recipe Details: it shows the item, its basis, the meal choice, the amount or servings, the recalculated nutrition, and one final action such as `Add to lunch`. Cancel changes nothing.
- Opening the sheet from a Home meal row preselects that meal; otherwise a documented time-of-day rule suggests one. The choice is always visible and editable. No eating time is asked or stored.
- A logged entry reopens for editing with its meal, portion, and unit; `Update entry` keeps its identity and day.

### Food calculation

- Search/barcode/photo/manual identification produces a reviewable candidate.
- Results always retain identity, amount, unit, and nutrition basis.
- Scale only compatible known units. Never invent g↔ml/piece/serving conversions.
- Missing nutrition is `Not available`, not zero.
- Adding to today is optional and requires an explicit commit through `Add to meal`.
- Food search offers a one-tap barcode action in the field; recipe search and browse offer the filter action in the field, with applied filters shown as chips beneath it.
- The Food tab is populated before anything is typed: a catalogue of 12 foods or dishes and 3 drinks, each with a local licensed photo, a name, calories with an explicit basis and one detail line, in a list (default) or a two-column grid chosen from a compact toolbar under the field; the choice persists on the device. `Recently added` — derived only from confirmed meal entries, newest first, one row per item — sits above `Explore foods` when history exists. Food filters (All / Foods / Drinks, from each item's own record) live in the shared filter sheet behind the toolbar's `Food filters` action; a query yields one unified, counted set across recents and catalogue.
- Drinks carry volume units and are logged like any food; logging a drink never changes the water record.

### Recipe discovery

- Supported criteria: calories per serving, protein per serving, preparation time, and dietary preference.
- Active criteria combine with AND.
- Match claims require active criteria and known supporting values.
- Never infer medical, allergen, or dietary safety from an image or missing data.

### Recipe details

- Focused header (`Back`, `Recipe`) with the root navigation retained; full-width photo; preparation time and declared dietary tags; title with a one-word `Add` that opens `Add to meal` with servings; nutrition per serving; ingredients; numbered method.
- No bookmark, sharing, ingredient checklists, ratings, or cooking mode.

## Data truth

Today's and earlier entries, the goal, water per day and the Search view are kept on the device (`localStorage`) under one versioned record and restored on launch; each entry keeps its own local calendar day, and the current day is re-evaluated at local midnight. Barcode, photo recognition, nutrition, and recipe content are deterministic fixtures. Different fixtures remain independent. Copy must identify estimates, unavailable values, and retryable system states without implying live recognition. The scanner and camera steps are fixture-backed: the prototype reads a sample barcode and captures a labelled sample photograph, and the screens say so; no simulator or debug controls appear in the product.

## Brand commitments

- Name: **Portion**. Wordmark: lowercase `portion`, Inter Semi Bold, −3% tracking only on the wordmark.
- Direction: **Measured Clarity**—blue-led interaction, white/cool-neutral surfaces, neutral numeric results, restrained geometry, structured alignment.
- Typeface: Inter only.
- Icons: Phosphor regular; bold only for the persistent selected navigation destination.
- Tone: factual, calm, concise, non-judgmental. No praise, shame, fear, diagnosis, or health scoring.

## Non-goals

Accounts/onboarding; a separate Diary/Profile destination; automatic goal or macro-target calculation; exercise, weight, streak, weekly, or long-term tracking (water and meals are same-day records only); health scores; medical claims; saved recipes; meal planning; recipe authoring; multi-ingredient building; exact eating times or a timeline; social, payment, coaching, notification, or gamification features; dark mode; production recognition/nutrition services.

## Evidence limits

- Figma/FigJam and competitive material are design inputs, not proof of user validation.
- No completed primary usability research or trademark/domain clearance may be claimed.
- Figma does not override accepted product/UX behavior, and screenshots do not prove runtime behavior.

