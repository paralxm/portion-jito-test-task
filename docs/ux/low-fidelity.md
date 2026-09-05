Portion — Low-Fidelity Specification

Updated: 2026-09-03.
Status: Current design specification; targeted Figma and implementation alignment pending.
Repository location: docs/ux/low-fidelity.md.
Product language: English.

1. Purpose, sources and evidence

This document defines screen structure, navigation, state mapping and design coverage. Task flows define the two user tasks. UI contract defines detailed behavior and data rules. Visual direction owns branding and visual tokens.

Sources used for this revision:

Supplied LF specification, UI contract and latest task-flow text.

Supplied Home/O01 screenshots and the original Low-fidelity — Complete Core Journeys export.

Latest supplied TF01 and TF02 PDF exports.

User-approved Home/daily-overview direction and the two JTBD below.

Previously supplied research synthesis and user-needs findings; the daily overview is an additional product decision, not a newly demonstrated research finding.

Figma — Low-fidelity board. The live board and runtime were not accessible for independent interaction verification during this documentation revision. Existing editing/test reports are historical evidence for their stated scope, not proof that the new requirements are implemented.

2. Goals and product boundaries

HMW: How might we help users understand the calorie content of a specific food or dish and quickly evaluate which recipes fit their needs, while keeping both experiences clear, efficient, and easy to control?

JTBD 01: When I need to understand the calorie content of a food or dish, I want to identify what I am eating, set the relevant portion, and correct the input if necessary, so I can understand a calorie result that reflects what I actually intend to consume.

JTBD 02: When I need to find a suitable recipe, I want to narrow the available options by relevant criteria and understand why each option matches them, so I can choose without evaluating every recipe in detail.

Task

Completion

Calculate calories for a food or dish

Understand the calorie result for the identified, reviewable food and intended portion in S07. Logging is optional.

Find a suitable recipe

Identify a suitable recipe using criteria and available evidence. No mandatory Save, Cook or logging action.

Core scope: four food-entry methods, shared review and correction, portion calculation, recipe browse/search, criteria, details and appropriate recovery.

Accepted supporting scope: a Home daily overview, an optional user-entered daily calorie goal, and an optional list of explicitly logged food portions with editing/removal. These support daily context; they are not prerequisites for either job. A daily list is a limited tracking capability even though there is no separate Diary destination.

Out of scope: accounts/onboarding, Profile/Diary destinations, automatic nutrition-goal calculation, exercise adjustment, weight, water, streaks, weekly analytics, health scores, coaching, saved recipe collections, meal planning, recipe authoring, multi-ingredient dish building, social features, payments, wearables and production recognition/database services.

The research emphasis on calculation without mandatory tracking remains valid. Do not rewrite research or claim that a goal/ring was required by either JTBD. Neutral, correctable results and explainable recipe matches remain core requirements.

3. Navigation contract

One bottom row: Home | Search | Recipes | + Log food. There are three destinations, shown as one group of equal cells filling the width beside the plus, and one separate circular action. Implemented 2026-09-04: the plus's accessible name, the O01 title and Home's body action are Log food (superseding Add food); Add to today remains the commit. Calculate is a capability, not a navigation destination.

Surface/action

Behavior

Home, S01

Initial destination. S01-1 when today's entry count is zero; S01-2 when at least one entry exists. A portion preview does not change this state.

Search, S02

Food and Recipes scopes. First entry uses Food with no query; later visits restore context.

Recipes, S03

Query-free browse with optional criteria. Restore its own existing criteria/list context on return.

Recipe details, S08

Retain the originating Search or Recipes selection. Back returns to that list.

+ Log food

Open the single O01 overlay above the current surface. Never become selected. Inactive destinations show their glyph only with an accessible name; the active one shows glyph, label and a contained selected surface.

S04–S07 focused steps

No bottom navigation; provide clear Back/Close behavior.

Foreground overlays

Cover and block the underlying bar and content.

Tab switches retain each destination's state. Search remains selected in Recipes scope. During keyboard-focused root search, hide the whole bar behind the keyboard and restore it afterward. Do not move the plus independently or introduce duplicate navigation.

4. Home — daily overview

4.1 Names and shared structure

ID

Current target name

Existing node

S01-1

Home / Today — No food logged

175:10

S01-2

Home / Today — Food logged

175:38

S01-3

Home / Today — Food logged · 320 px width check

185:2; target name/composition pending alignment

The names above include the existing ID prefix when applied to Figma frames. Preserve the node IDs and update visible captions as well as layer names. S01-3 is a responsive specimen of S01-2, not another navigation destination.

Use the same region order in both main states:

Region

Content and purpose

Header

Home, Today, and a contextual Set/Edit daily goal action. No Profile dependency. Implementation note (2026-09-04): the app header carries the wordmark and the Home title; "Today" is the heading of the daily-calories group and the Set/Edit daily goal action sits in that group's header row, next to the goal it edits, rather than in the app header (same region order, one row lower).

Daily calories

One ring; arc represents logged energy / goal, center names Remaining. Logged and Goal are labeled below. Supporting daily context, not the calorie result for a single food.

Nutrition summary

Compact Protein / Carbs / Fat aggregate row, with units and partial-data handling. No additional rings or undefined macro targets.

Today's food

Empty guidance plus Add first food, or compact logged-entry rows with identity, portion and energy. Entry points into the food task or review of explicitly recorded portions.

Recipe discovery

Find a recipe, relevant criterion cues, and Find recipes. With actual applied Recipes criteria, show their summary and See matching recipes. Supports JTBD 02.

Bottom navigation

Home selected; the trailing plus remains an action.

Home has no food-reference form, editable grams/unit control or inline single-food calculator. Identify, correct and calculate a portion in S07.

4.2 Empty and populated specimens

The following are synthetic demonstration values, not default goals assigned to users or nutrition recommendations.

Value

S01-1

S01-2

Today's entry count

0

2

Goal

2,200 kcal

2,200 kcal

Logged

0 kcal

1,350 kcal

Remaining

2,200 kcal

850 kcal

Progress

0%

Approximately 61%

Protein / Carbs / Fat

0 / 0 / 0 g recorded

90 / 135 / 50 g

S01-1: No food logged today; supporting text explains adding a food or dish to review its portion and nutrition. Add first food opens the same O01 instance as the plus.

S01-2: example rows are Oatmeal with mixed berries — 300 g, 550 kcal; and Grilled chicken Caesar salad — 350 g, 800 kcal. These synthetic entries sum to 1,350 kcal. Their displayed portion energy does not establish real-world nutrition values. Inspect/edit opens the existing-entry review mode; the current screenshot rows are static examples and those interactions still need implementation.

Empty/populated state depends on entry count, not energy sum: a valid zero-kcal entry still produces a populated list. An empty list means nothing is recorded, not that the person ate nothing.

4.3 Ring, goal and dependent states

The UI contract owns the detailed arithmetic and data handling. Required presentation:

State

Home presentation

Valid goal, complete energy

Remaining = goal − today's logged energy. Arc = logged/goal, visually capped at 100%.

No goal

Show logged information; remaining is unavailable. Offer optional Set a daily goal. Do not use a fabricated goal or a 0/0 ratio.

Invalid/zero goal draft

Explain the invalid value inside the contextual editor; preserve the last committed goal until a valid change is applied.

Goal reached

Full ring, 0 kcal remaining; neutral wording.

Goal exceeded

Full ring and X kcal over your set goal; no hidden negative value, shame or success/error coloring based on food intake.

Incomplete energy

Label the total partial and the exact remainder unavailable. Do not treat unknown entries as zero.

Missing macros

Show known/partial/unavailable values for each nutrient independently.

The contextual goal editor allows entering, changing or clearing the optional goal, with explicit Apply and Cancel. It has no permanently assigned new screen/overlay ID in this revision; locate existing reusable patterns before allocating one. Goal changes never modify entries or recipe filters.

The displayed recipes and their criteria are independent of logging state. A remainder is not automatically a meal budget or suitability filter.

4.4 Recipe action contract

Use Find recipes when opening Recipes browse. On first use this leads to S03-1; otherwise restore the user's existing Recipes state. Criteria cues are informational, not preselected chips or buttons unless a real action is defined.

When Recipes already has applied criteria, See matching recipes restores that filtered context. Home summarizes Recipes-owned criteria, not whichever Search query was used last.

The supplied prototype report says the current Home button is labeled Choose criteria while navigating to S03-1. Relabel it Find recipes to match the existing browse destination. Opening filters is a separate explicit action in Recipes/Search. This document does not claim the Figma label has already been updated.

5. O01 — Log food / Choose a method (overlay)

Existing node: 176:20. Use one shared bottom sheet.

Position at reference width

Button

Supporting copy

Destination

Top left

Search food

Find a product or dish

S02 Food

Top right

Scan barcode

For packaged food

S04

Bottom left

Take a photo

Review suggested matches

S05

Bottom right

Enter manually

Use known label values

S06

At the 393 px reference width, use four equal neutral outlined tiles in a 2×2 grid, approximately 16 px side insets, 12 px gaps and 108 px tile height. Each has icon, label and helper regions. Selecting a tile immediately enters that method: no radio state or extra Continue. Grid versus rows is a design hypothesis, not proven superior usability.

At 320 px or enlarged text, increase height or reflow to full-width rows. Maintain readable content and at least 48×48 target areas. Verified in code 2026-09-04 (revised the same day): the 2 × 2 grid holds at every supported width at 100 % text, including 320 px, with titles wrapping; only under 17 rem of available width (200 % text) does the grid become one column of rows through a named container query. Storybook and the runtime walkthrough assert the column count at 320, 390, 430 and 200 %.

Opening O01 leaves the underlying screen, query, filters, input and scroll intact. Close, backdrop and supported Escape dismiss only the sheet. Swipe is optional. The background is inactive. Method selection does not log food; camera permission is requested only when a camera method needs it.

Origins are Home, Search, Recipes and Recipe Details where Add food is available. Focused camera/manual/review steps have no extra O01 trigger. Preserve both the overall invoking context and each acquisition step's Back context.

6. Optional daily record scenarios

These supporting scenarios do not change either JTBD completion condition.

Scenario

Intended behavior

Design status

Obtain result without logging

Review/correct identity and portion in S07, read the result, then close to the invoking surface. Entries remain unchanged.

Aligned in code 2026-09-04: Done closes to the invoking surface; nothing is logged.

Add a new entry

After reviewing a valid result, explicitly activate Add to today once. Append one entry and return to Home with updated totals.

Implemented 2026-09-04: Add to today replaced the old replacement confirmation; one activation creates one entry.

Inspect/edit a logged entry

Open from its Home row into S07 existing-entry mode. Preview edits locally; Update entry commits to the same ID and returns Home.

Supporting mode and row interactions pending.

Cancel editing

Discard the edit draft and retain the committed entry and totals; confirm discard only for meaningful unsaved changes.

Pending alignment.

Remove an entry

Explicit Remove entry in existing-entry mode opens a concise confirmation; confirm removes that entry and returns Home, Cancel changes nothing.

Supporting confirmation pending; allocate/reuse an appropriate state, not the unrelated discard semantics.

Set/change/clear goal

Contextual Home editor; Apply commits a valid positive value or explicit clearing; Cancel preserves the prior value.

Supporting editor pending.

Calculation previews and logged entries are different objects. S07's preview updates without Save. Updating an existing logged record is explicit so cancellation remains meaningful. A new selection never replaces previously logged food.

S07-3 formerly described replacement of a single calculation. Its proposed new use is Food review / Edit logged food. Preserve the source node if repurposing it, update its caption/links, and do not report this as already drawn. Other S07 variants retain their acquisition-source distinctions.

7. Screen inventory and state mapping

The supplied baseline contains 42 named specimens: 36 S-states, five overlay specimens and P01. This inventory preserves their identities; it is not a claim that all states are aligned or verified.

Family

Existing specimens

Alignment notes

Home

S01-1 empty; S01-2 populated; S01-3 320 px

First two redesigned in supplied screenshots; narrow specimen still uses the previous composition in the supplied report.

Search

S02-1 Food results; S02-2 loading; S02-3 no matches; S02-4 failure; S02-5 Recipes results; S02-6 Recipes no matches

Preserve scopes and recovery. Map no-query/keyboard and recipe-failure witnesses where needed.

Recipes

S03-1 browse; S03-2 filtered

Origin-specific loading/empty/failure must be mapped; do not invent completed frames.

Barcode

S04-1 scan; S04-2 lookup; S04-3 unreadable; S04-4 missing product; S04-5 service failure; S04-6 denied

Keep different causes distinct.

Photo

S05-1 capture; S05-2 preview; S05-3 analysing; S05-4 suggestions; S05-5 no usable match; S05-6 failure

Explicit suggestion selection; map camera permission/unavailability. Implemented 2026-09-04: select-then-review (D-3); the system permission prompt P01 is represented by the app-side waiting state only (D-6); S05-5 is a deterministic Storybook state because the prototype analyser always returns suggestions (D-9).

Manual

S06-1 empty; S06-2 filled/keyboard; S06-3 validation error

All valid manual entries continue to S07-6.

Review

S07-1 Search; S07-2 invalid portion; S07-3 former replacement; S07-4 Barcode; S07-5 Photo; S07-6 Manual

Target S07-3 becomes existing-entry editing; add/close/correction semantics pending in the canvas. Implemented 2026-09-04: code and Storybook render S07-3 as existing-entry editing (docs/design/hifi-decisions.md D-1, story “Product states / Lane B → S07-3”); the Figma frame keeps its node ID.

Details

S08-1 loaded; S08-2 loading; S08-3 unavailable; S08-4 no photo/long title

S08-4 is a loaded-state variant.

Overlays

O01 methods; O02 applied-filter specimen; O02-2 invalid-range fragment; O03 discard; O04 units

O02-2 is a supporting specimen, not another main flow step.

System

P01 permission

Conceptual system surface, not branded application UI. Implemented 2026-09-04 as the app-side “Waiting for camera permission” state in the barcode and photo steps; no OS chrome is drawn.

Goal editing, removal confirmation and additional daily-data witnesses need explicit coverage. Do not imply their existence merely because their requirements are documented.

8. Required journeys and transitions

8.1 Food acquisition

Method

Main sequence

Search

S02 query → S02-2 → S02-1 → explicit result selection → S07-1. No matches/failure are alternative branches.

Barcode

Permission if needed → S04-1 → S04-2 → S07-4 on a match.

Photo

Permission if needed → S05-1 → S05-2 → S05-3 → S05-4 → explicit suggestion selection → S07-5.

Manual

S06-1/S06-2 → valid reference data → S07-6. Invalid fields stay in S06.

Every path includes reviewable identity, a distinct desired portion, a calorie result and an explicit correction route. Barcode/search correction opens the appropriate search/change route; photo correction returns to suggestions/retake/search; manual correction returns to editable reference data. Retain origin and useful input, and recompute only against the corrected basis.

The calorie result is available in S07 before optional Add to today. Invalid input remains there for correction. A new candidate or preview never changes Home totals.

8.2 Recipe transitions

From

Trigger/outcome

To

S02-5 or S03-1/S03-2

Open recipe

S08-2, retaining Search or Recipes origin

S08-2

Loaded

S08-1, including S08-4 where applicable

S08-2

Request failed

S08-3

S08-3

Retry

S08-2 for the same recipe

Any S08 state

Back

Exact originating list and context

No matching recipes

Change query/criteria

Same discovery context and a new list request

Keep no matches outside the details branch. Do not connect no matches to details, Back to Loading, or Retry to the no-photo specimen. Returning during loading ignores later responses for the abandoned detail.

Cards expose enough known nutrition/preparation and active-criteria evidence for initial comparison. Details expand the criterion-to-value comparison. No criteria means no match claim. Recipes remain usable without daily tracking.

9. Recovery, data and fidelity rules

Condition

Recovery

Food no matches

Change query, manual entry or another method.

Recipe no matches

Adjust query/criteria while retaining discovery context.

Request failure

Retry with relevant input retained; food may use manual entry.

Unreadable barcode

Continue/rescan or switch method.

Read code, product missing

Search/manual or optional rescan.

Barcode service failure

Retry lookup with the code retained or switch method.

Camera denied/unavailable

Search/manual; settings where appropriate, no prompt loop.

Photo no usable match

Retake/search/manual; never invent nutrition.

Photo analysis failure

Retain image, retry, retake or leave.

Invalid form/portion/filters

Identify the field, preserve other input and prevent invalid submission.

Details unavailable

Retry same recipe or Back to origin.

The UI contract owns reference/portion conversions, unknown data, draft/commit rules, daily aggregation, persistence boundaries and criteria ownership. Preserve all these behaviors when rendering the LF.

Use the established neutral, structural LF style at 393×852, with responsive witnesses at 320 px. Placeholder bars indicate omitted text, not loading; actual loading needs distinct feedback. Keep future English labels and behavioral notes in readable external captions. Preserve the established navigation selection marker; color alone must not carry selection.

Text-free LF cannot validate wording comprehension, real text wrapping, screen-reader semantics or numeric readability. Screenshots cannot verify focus, gestures, persistence, asynchronous behavior or functioning prototype reactions.

10. Alignment and verification checklist

The specification is ready to guide bounded design changes; the whole product is not declared finalized.

Align S01 frame names and visible captions; use Find recipes for the Browse action.

Adapt S01-3 to the daily overview and verify the narrow O01 layout.

Align all S07 source variants with result-first review, correction and optional Add to today.

Replace S07-3's old replacement semantics with explicit existing-entry editing.

Add inspect/edit/remove and optional goal-editor witnesses and transitions.

Connect S06 to S07 in TF01; align both FigJam flows with task-flows.md.

Verify every changed prototype reaction and cancellation origin, separately from screenshots.

Align runtime/Storybook and use one reusable ring implementation; component existence is not established here.

Verify 320/393/430 px, software keyboard, safe areas, long text and 200% text resizing.

Verify focus, keyboard operation, accessible naming, contrast and screen-reader output in runtime.

Verify no preview logging, duplicate activation, edit identity, removal, day rollover and incomplete-data handling.

Usability checks not yet conducted: obtain a portion result without logging; correct a wrong identity; dismiss O01 from a recipe; explain Logged/Goal/Remaining; compare recipes using two criteria; complete either core task without a daily goal. Record actual observations when tested, not assumed success rates.

11. Decision history and known implementation gap

The earlier design used Calculate as the destination and later Home with a single replaceable current calculation. The supplied redesign report and screenshots show S01-1/S01-2 as daily-overview layouts and O01 as a 2×2 grid. The existing report identifies nodes 175:10, 175:38 and 176:20, and reports preserved IDs and edited reactions. This revision does not independently verify that report.

Previous runtime reports describe replacement semantics, in-place portion editing on Home and a list-based method sheet. Those are historical behaviors to migrate, not current requirements. Prior test/build counts apply only to the revision they tested and do not validate daily logging or the redesigned sheet.

Earlier supplied documents label these revisions 2026-09-07 and 2026-09-08, dates later than this update. Those event dates cannot be used as verified history; their exact dates remain unconfirmed. This document records its actual revision date without inventing earlier dates.

This update changes documentation only. Figma, FigJam, runtime, Storybook, tokens, git history and deployment were not modified. Keep stable design IDs when performing the pending edits.

Downstream documentation: align the existing visual-direction rules for a functional labeled ring, the product-scope description for optional daily records, and any stale navigation instructions. Preserve research findings and established visual tokens; do not duplicate them into new competing documents.

Implemented 2026-09-05 (Hi-Fi redesign, docs/design/hifi-decisions.md §10): the water and meal-grouping exclusions in §2 are superseded for same-day records only (no history, streaks or analytics); Home's region order is header (lockup, date, Set/Edit goal) → calorie budget bar and macros → recommended recipe → Today's meals (all four, always) → Water → fixed navigation (D-31); the inventory is 46 rows (41 preserved frames + O05, O05-2, S01-4, O06, O06-2).

Implemented 2026-09-05 (Stage B, docs/design/hifi-decisions.md §11): the Food scope's "no query" frame is no longer an empty prompt — it shows the catalogue at once, with `Recently added` above `Explore foods` once entries exist; the low-fi inventory gains five rows (S02-7 catalogue, S02-8 recents, S02-9 grid view, O07 food filters, S02-10 filter applied) for a total of 51; nothing in the original 41 frames is removed.

Implemented 2026-09-05 (revision R1–R6, docs/design/hifi-decisions.md §12): the inventory gains S01-5 (a selected earlier day), S01-6 (the streak), S02-11 (the recipe catalogue in Search's Recipes scope), S06-4 (a correction draft prefilled from a barcode or photo match), S06-5 (manual entry step 2, portion and meal) and O08 (the shared Discard changes? confirmation); O05 (the food Add-to-meal sheet) is retired because foods commit on their review or portion step — O05-2 stays for recipes; S07-6 (review from manual entry) is superseded by S06-5. S03-1 is now curated discovery rather than a full list, S03-2 the same page with criteria; S06-1 to S06-3 are step 1 of two. The R6 method sheet replaces the 2 × 2 grid in O01. Total: 55 rows (51 − O05 − S07-6 + S01-5, S01-6, S02-11, S06-4, S06-5, O08).

Implemented 2026-09-05 (revision H2, docs/design/hifi-decisions.md §13): the inventory gains O09 (the targets entry sheet, Set daily goal) and O09-2 (the reviewed estimate) — 57 rows. Reopened with changed composition: S01-1 / S01-2 / S01-5 (the compact day strip without week buttons, the calorie card and three macro cards, the recommendation above the meals, the adjustable water reference), S03-1 / S03-2 (discovery without a search field: featured recipe, quick preferences with an exclusive time bound, two collections), S02-1 … S02-4 and S02-7 … S02-10 (icon-only scanner), S02-5 / S02-6 / S02-11 (the Recipes scope's results toolbar with List / Grid and the filter action; O02 opens from there). The old goal editor states are superseded by O09 / O09-2 and the targets editor.
