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

Home is a bounded daily overview, not a diary dashboard.

- `S01-1`: no committed food entries today.
- `S01-2`: one or more committed food entries today.
- It may show an optional daily goal, logged/remaining calories, neutral progress, compact nutrition, today's committed entries, `Log food`, and recipe discovery.
- Calculation and recipe discovery remain complete without a goal or log.

### Food calculation

- Search/barcode/photo/manual identification produces a reviewable candidate.
- Results always retain identity, amount, unit, and nutrition basis.
- Scale only compatible known units. Never invent g↔ml/piece/serving conversions.
- Missing nutrition is `Not available`, not zero.
- Adding to today is optional and requires an explicit commit.

### Recipe discovery

- Supported criteria: calories per serving, protein per serving, preparation time, and dietary preference.
- Active criteria combine with AND.
- Match claims require active criteria and known supporting values.
- Never infer medical, allergen, or dietary safety from an image or missing data.

## Data truth

Barcode, photo recognition, nutrition, and recipe content are deterministic fixtures. Different fixtures remain independent. Copy must identify estimates, unavailable values, and retryable system states without implying live recognition.

## Brand commitments

- Name: **Portion**. Wordmark: lowercase `portion`, Inter Semi Bold, −3% tracking only on the wordmark.
- Direction: **Measured Clarity**—blue-led interaction, white/cool-neutral surfaces, neutral numeric results, restrained geometry, structured alignment.
- Typeface: Inter only.
- Icons: Phosphor regular; bold only for the persistent selected navigation destination.
- Tone: factual, calm, concise, non-judgmental. No praise, shame, fear, diagnosis, or health scoring.

## Non-goals

Accounts/onboarding; a separate Diary/Profile destination; automatic goal calculation; exercise, weight, water, streak, or weekly tracking; health scores; medical claims; saved recipes; meal planning; recipe authoring; multi-ingredient building; social, payment, coaching, notification, or gamification features; dark mode; production recognition/nutrition services.

## Evidence limits

- Figma/FigJam and competitive material are design inputs, not proof of user validation.
- No completed primary usability research or trademark/domain clearance may be claimed.
- Figma does not override accepted product/UX behavior, and screenshots do not prove runtime behavior.

