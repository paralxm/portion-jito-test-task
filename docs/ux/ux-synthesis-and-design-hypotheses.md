UX Synthesis & Design Hypotheses

This document consolidates the completed UX synthesis for the two core user stories. It records the research synthesis, derived user needs, JTBD statements, design hypotheses, and UX requirements.

Given User Stories

User Story 01 — Calculate calories

As a user, I want to calculate the amount of calories in a dish or a specific product.

User Story 02 — Find a suitable recipe

As a user, I want to find a recipe for a dish that is suitable for me.

Research Synthesis

01 — Focus the experience on the task, not the tracking system

Calorie calculation should work as a focused task rather than forcing users through a complete daily tracking workflow.

02 — Speed is expected; transparency and control create value

Fast input is becoming a category expectation. The stronger UX opportunity is making estimates easy to review, understand, and correct.

03 — Calorie information needs context, not judgment

A calorie result should explain what was calculated and for which portion, while remaining neutral rather than evaluative.

04 — Recipe suitability should be explainable

Users should be able to understand why a recipe may fit their needs before committing to it.

Derived User Needs

User Story 01 — Calculate calories

N1 — Reach the calculation directly

I need to calculate a food or dish without first managing a complete daily diary.

N2 — Understand what the result represents

I need to know which food or dish and which portion the calorie result is based on.

N3 — Correct incorrect assumptions

I need to easily change the selected food, ingredients, quantity, or portion when the result does not match what I am eating.

N4 — Understand more than one isolated number

I need enough nutritional context to interpret the calorie value.

N5 — Receive neutral information

I need nutrition information to inform my decision without labeling food as good or bad.

User Story 02 — Find a suitable recipe

N6 — Narrow recipes by relevant criteria

I need to narrow recipe options using criteria relevant to what I am looking for.

N7 — Understand why a recipe fits

I need to see the relevant characteristics of a recipe before deciding whether it is suitable for me.

Jobs to Be Done

JTBD 01 — Calorie Calculation

When I need to understand the calorie content of a food or dish, I want to identify what I am eating, set the relevant portion, and correct the input if necessary, so I can understand a calorie result that reflects what I actually intend to consume.

JTBD 02 — Recipe Discovery

When I need to find a suitable recipe, I want to narrow the available options by relevant criteria and understand why each option matches them, so I can choose without evaluating every recipe in detail.

Design Hypotheses

H1 — Direct calorie calculation

We believe that providing a direct calorie-calculation path without requiring a full diary workflow will reduce unnecessary interaction between the user's intent and the calorie result.

H2 — Editable assumptions

We believe that keeping food, ingredient, quantity, and portion assumptions visible and editable will make calorie estimates easier to understand and correct before users rely on them.

H3 — Contextual nutrition result

We believe that showing calories together with portion context and key nutritional information will make the result more understandable than presenting calories alone.

H4 — Explainable recipe suitability

We believe that exposing relevant suitability criteria in recipe discovery and results will help users evaluate options before opening every recipe detail.

UX Requirements

Calorie Calculation

CR-01 — Direct task entry

The calorie calculation must be accessible without requiring a complete diary workflow.

CR-02 — Food / dish identification

The flow must let the user identify the food or dish being calculated.

CR-03 — Explicit portion context

The selected quantity / serving must be visible as part of the calculation.

CR-04 — Editable calculation

Users must be able to correct relevant food, quantity, or portion information and receive an updated result.

CR-05 — Contextual result

The calorie result must be presented with its serving context and relevant nutrition information.

CR-06 — Neutral presentation

Do not classify food or results using unnecessary good / bad judgments or aggressive warning language.

CR-07 — Automation must remain correctable

If AI / photo estimation is used, the result must have a review / correction path before it is treated as final.

Recipe Discovery

RR-01 — Recipe discovery / search

The experience must provide a way to find recipes rather than requiring users to know the exact recipe in advance.

Recipe libraries / search are present in several competitors, although not universally.

RR-02 — Relevant narrowing criteria

Users must be able to narrow options using supported suitability criteria.

Research supports:

dietary preference;

nutrition information;

calories;

protein;

preparation constraints.

RR-03 — Suitability visible in results

Relevant matching criteria must be visible before the user opens the full recipe.

RR-04 — Explain relevance, not generic health

Do not replace explicit matching information with a universal healthy score or unexplained recommendation.

RR-05 — Nutrition detail

Recipe details should expose the nutritional information required to evaluate the recipe; recipe nutrition detail is also confirmed across several analyzed discovery-oriented competitors.