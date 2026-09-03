Portion — Task Flows

Updated: 2026-09-03.
Status: Revised task specification; alignment of the FigJam diagrams and implementation is pending.
Repository location: docs/ux/task-flows.md.

This document describes the two core tasks defined by the user stories: their goals, entry points, screen-level actions, decisions, recovery and completion. It does not describe the complete application architecture or every system state.

Low-fidelity owns screen structure, state mapping and design coverage. UI contract owns detailed interaction, data and component behavior. The three documents describe the same intended product; a historical implementation report does not override this specification.

1. Screen and overlay IDs

ID

Name

S01

Home

S02

Search, with Food and Recipes scopes

S03

Recipes

S04

Barcode scan

S05

Photo recognition

S06

Manual food entry

S07

Food review

S08

Recipe details

O01

Add food / Choose a method — bottom-sheet overlay

O02

Recipe filters — overlay

Detailed state IDs are listed in the low-fidelity inventory. These are design identifiers, not URL routes.

2. TF01 — Calculate Calories for a Product or Dish

User story and job

As a user, I want to calculate the amount of calories in a dish or a specific product.

JTBD 01: When I need to understand the calorie content of a food or dish, I want to identify what I am eating, set the relevant portion, and correct the input if necessary, so I can understand a calorie result that reflects what I actually intend to consume.

Entry points

The primary entry is Home → Add first food or + Add food → O01. The trailing plus also opens O01 from Search, Recipes and Recipe Details wherever the shared navigation is present. Direct food search through the Search tab is another supported entry.

O01 opens above the current screen and is not a navigation destination. Closing it dismisses only the sheet. Focused camera, manual-entry and review screens do not acquire an additional plus or navigation bar.

No daily goal, existing record or account is required to calculate a portion.

Identify or enter food

O01 offers four immediately actionable alternatives. The user chooses one method; there is no sequence of Yes/No rejection questions and no separate Continue step.

Method

Main path

If no usable candidate is available

Search food

S02 Food → search → select a result → S07-1

Change the query, choose manual entry or switch method.

Scan barcode

S04 → scan and lookup → matched candidate → S07-4

Rescan, search, enter manually or switch method as appropriate to the cause.

Take a photo

S05 → capture → preview → analyse → review suggestions → select a candidate → S07-5

Retake, search, enter manually or switch method.

Enter manually

S06 → enter valid reference data → S07-6

Correct missing or invalid fields while retaining other input.

These recoveries are choices offered to the user, not automatic navigation into manual entry. A service failure is distinct from a successful lookup with no match; retry is available for recoverable request failures. Camera permission and detailed recovery states are specified in the LF and UI contract.

Manual entry establishes the food name, calorie value, positive reference quantity and unit, with optional available macronutrients. The reference quantity is the basis of the entered nutrition; it is not automatically the portion the user intends to consume.

Shared review and correction

All four methods converge on S07 — Food review, including manual entry.

Review the food identity, source and nutrition reference basis.

If the identity is wrong, use the explicit correction action to return to the relevant search, recognition or manual-entry step, then review the corrected candidate.

Review the desired portion. A displayed default may be retained when it is the intended amount; otherwise change the amount or a supported unit in S07.

See the calorie result and available nutrition for that portion. Valid changes update the preview locally. Invalid input stays editable and does not present the previous result as valid for the new amount.

A photo suggestion or barcode match is not proof of identity or portion. The user must be able to review and correct either.

Decisions and completion

The diagrams may use these binary decisions:

Usable food candidate available? Yes → S07; No → a relevant recovery choice.

Food identity correct? Yes → review the portion; No → correct the candidate and return to review.

Change the portion? Yes → adjust in S07; No → keep the valid displayed portion.

These decisions describe the user's assessment; they do not require Yes/No dialogs in the interface.

The task is complete when the user understands the calorie result for the food and portion they actually intend to consume. The result is presented in S07. Completing this job does not require a separate Calculate destination, a return to Home, setting a goal, selecting a meal time or saving a diary record.

Optional action after obtaining the result

The accepted Home design includes an optional daily food record. Add to today in S07 explicitly adds the reviewed portion to that record and returns to Home. Merely viewing or adjusting the result does not add it.

This is an optional continuation, not an additional success condition for TF01. Its add/edit/remove rules are defined in low-fidelity and UI contract. The core task diagram may end at the calorie result, with a short note linking to this continuation.

3. TF02 — Find a Suitable Recipe

User story and job

As a user, I want to find a recipe for a dish that is suitable for me.

JTBD 02: When I need to find a suitable recipe, I want to narrow the available options by relevant criteria and understand why each option matches them, so I can choose without evaluating every recipe in detail.

Entry points

Home → Find recipes or the Recipes tab opens Recipes. First use opens S03-1 Browse; later visits restore the existing browse/filter context.

If Home shows actual applied Recipes criteria, See matching recipes restores that filtered Recipes context.

Search → Recipes scope is an alternative. Switching from Food to Recipes is explicit.

The user may browse without a query or criteria. A daily goal or food record is not a precondition. Daily calories remaining do not automatically become a recipe filter or meal budget.

Flow

Browse recipes in S03, or search in S02 Recipes scope.

Narrow the selection? If yes, enter a recipe query and/or open O02 to choose criteria: calories per serving, protein per serving, dietary preference and preparation time. Apply criteria to the owning list. If no, continue with the available set.

Recipes found? If yes, review results in S03 or S02-5. If no, change the query or criteria and request a new set. Keep the user in the relevant discovery/search context; do not restart at Home. Request failure has a separate retry path.

Compare results. Show calories and protein per serving, available dietary and preparation information, and evidence of actual criterion matches. Users should not need to open every recipe to make an initial comparison.

Results relevant? If no, adjust the current query or criteria. If yes, inspect a promising recipe when more information is needed.

Open S08 — Recipe details. Show ingredients, preparation, serving basis, calories, available nutrients, dietary information and preparation time. Against active criteria, show the corresponding known values. Unavailable details offer Retry or Back.

Recipe suitable? If yes, the task is complete. If no, return to the same results and evaluate another recipe, retaining the relevant context.

The result set and recipe suitability decisions describe the user's assessment, not required Yes/No interface controls.

Completion

The task is complete when the user identifies a recipe they consider suitable. Details support the decision where needed. There is no mandatory Save, Cook or food-log action.

4. Diagram notation and boundaries

Element

Rule for these diagrams

Start / End

The start or successful completion of one task.

Process / Screen

A task step or user-visible screen.

Overlay

A temporary layer such as O01 or O02; opening it does not itself navigate to another root screen.

Decision

For consistency in these diagrams, use one binary question with labeled Yes and No exits. This is the project's notation convention.

Method selection

Four labeled branches from one selection step; no chained rejection decisions.

Recovery

Return to a useful point in the same task with relevant input retained.

Component variants, animation, loading timing, API behavior, focus, scroll mechanics, filter-draft mechanics, persistence and Storybook APIs belong in the LF/UI contract and design-system documentation.

5. Source diagrams and pending alignment

[FigJam - Task Flows](https://www.figma.com/board/Np6ZrdnQKjVw7tZw8W51kT/jito-calories-calculator?node-id=4-334&t=56wpcX5b4EzXTq65-1) contains TF01 (66:3473) and TF02 (75:332), as identified in the supplied documentation.

The latest supplied TF01 export routes manual entry past the shared S07 review. Update that connection and show an explicit identity-correction return path. Keep the successful calorie-result endpoint independent of daily logging. Align TF02's Home CTA and recovery routes with the rules above.

This revision changes the document only. It does not claim either FigJam diagram, any Figma reaction or runtime