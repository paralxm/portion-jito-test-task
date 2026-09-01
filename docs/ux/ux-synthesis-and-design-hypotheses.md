# UX Synthesis & Design Hypotheses

This document translates the completed research into a focused UX direction for the two core user stories.

It consolidates:

- research synthesis;
- derived user needs;
- Jobs to Be Done;
- design hypotheses;
- UX requirements.

The detailed research evidence remains documented in [`./research`](./research/).

---

## 1. Given User Stories

### User Story 01 — Calculate Calories

> As a user, I want to calculate the amount of calories in a dish or a specific product.

### User Story 02 — Find a Suitable Recipe

> As a user, I want to find a recipe for a dish that is suitable for me.

---

## 2. Research Synthesis

### RS-01 — Focus the experience on the task, not the tracking system

Calorie calculation should work as a focused task rather than forcing users through a complete daily tracking workflow.

### RS-02 — Speed is expected; transparency and control create value

Fast input is becoming a category expectation.

The stronger UX opportunity is making estimates easy to review, understand, and correct.

### RS-03 — Calorie information needs context, not judgment

A calorie result should explain what was calculated and for which portion, while remaining neutral rather than evaluative.

### RS-04 — Recipe suitability should be explainable

Users should be able to understand why a recipe may fit their needs before committing to it.

---

## 3. Derived User Needs

These needs were derived from the two given user stories and the completed research.

### User Story 01 — Calculate Calories

#### N1 — Reach the calculation directly

> I need to calculate a food or dish without first managing a complete daily diary.

#### N2 — Understand what the result represents

> I need to know which food or dish and which portion the calorie result is based on.

#### N3 — Correct incorrect assumptions

> I need to easily change the selected food, ingredients, quantity, or portion when the result does not match what I am eating.

#### N4 — Understand more than one isolated number

> I need enough nutritional context to interpret the calorie value.

#### N5 — Receive neutral information

> I need nutrition information to inform my decision without labeling food as good or bad.

### User Story 02 — Find a Suitable Recipe

#### N6 — Narrow recipes by relevant criteria

> I need to narrow recipe options using criteria relevant to what I am looking for.

#### N7 — Understand why a recipe fits

> I need to see the relevant characteristics of a recipe before deciding whether it is suitable for me.

---

## 4. Jobs to Be Done

### JTBD-01 — Calorie Calculation

> When I need to understand the calorie content of a food or dish, I want to identify what I am eating, set the relevant portion, and correct the input if necessary, so I can understand a calorie result that reflects what I actually intend to consume.

### JTBD-02 — Recipe Discovery

> When I need to find a suitable recipe, I want to narrow the available options by relevant criteria and understand why each option matches them, so I can choose without evaluating every recipe in detail.

---

## 5. Design Hypotheses

These hypotheses translate the research findings into design directions.

They are hypotheses to be addressed through the product design, not validated findings.

### H1 — Direct Calorie Calculation

> We believe that providing a direct calorie-calculation path without requiring a full diary workflow will reduce unnecessary interaction between the user's intent and the calorie result.

**Design direction**

Keep calorie calculation accessible as a focused task rather than embedding it inside a mandatory daily tracking workflow.

---

### H2 — Editable Assumptions

> We believe that keeping food, ingredient, quantity, and portion assumptions visible and editable will make calorie estimates easier to understand and correct before users rely on them.

**Design direction**

Keep the information that affects the calculation visible and allow relevant values to be corrected.

---

### H3 — Contextual Nutrition Result

> We believe that showing calories together with portion context and key nutritional information will make the result more understandable than presenting calories alone.

**Design direction**

Present the calorie result together with its serving context and relevant nutrition information.

---

### H4 — Explainable Recipe Suitability

> We believe that exposing relevant suitability criteria in recipe discovery and results will help users evaluate options before opening every recipe detail.

**Design direction**

Surface relevant recipe characteristics during discovery instead of relying only on an unexplained recommendation.

---

## 6. UX Requirements

The following requirements define the minimum UX behavior derived from the synthesis and hypotheses.

### 6.1 Calorie Calculation

#### CR-01 — Direct Task Entry

The calorie calculation must be accessible without requiring a complete diary workflow.

#### CR-02 — Food / Dish Identification

The flow must let the user identify the food or dish being calculated.

#### CR-03 — Explicit Portion Context

The selected quantity or serving must be visible as part of the calculation.

#### CR-04 — Editable Calculation

Users must be able to correct relevant food, quantity, or portion information and receive an updated result.

#### CR-05 — Contextual Result

The calorie result must be presented with its serving context and relevant nutrition information.

#### CR-06 — Neutral Presentation

Do not classify food or results using unnecessary good / bad judgments or aggressive warning language.

#### CR-07 — Automation Must Remain Correctable

If AI or photo estimation is used, the result must have a review and correction path before it is treated as final.

---

### 6.2 Recipe Discovery

#### RR-01 — Recipe Discovery / Search

The experience must provide a way to find recipes rather than requiring users to know the exact recipe in advance.

Recipe libraries and search are present in several analyzed competitors, although not universally.

#### RR-02 — Relevant Narrowing Criteria

Users must be able to narrow options using supported suitability criteria.

The research identified the following relevant criteria:

- dietary preference;
- nutrition information;
- calories;
- protein;
- preparation constraints.

These are research-supported criteria, not a requirement to implement every filter.

#### RR-03 — Suitability Visible in Results

Relevant matching criteria must be visible before the user opens the full recipe.

#### RR-04 — Explain Relevance, Not Generic Health

Do not replace explicit matching information with a universal healthy score or an unexplained recommendation.

#### RR-05 — Nutrition Detail

Recipe details should expose the nutritional information required to evaluate the recipe.

---

## 7. UX Direction Summary

The resulting UX direction is based on four principles:

1. **Direct task completion**  
   Calorie calculation should not depend on a complete tracking workflow.

2. **Visible user control**  
   Information that affects a calorie estimate should remain understandable and correctable.

3. **Contextual nutrition information**  
   Calories should be presented with relevant serving and nutrition context rather than as an isolated or evaluative number.

4. **Explainable recipe suitability**  
   Recipe discovery should expose the characteristics that make an option relevant to the user's selected criteria.

---

## 8. Handoff to Flow Design

These requirements are the input for the next UX stage:

- minimum application structure;
- calorie-calculation task flow;
- recipe-discovery task flow;
- screen inventory;
- relevant interaction states.

The next stage should not introduce additional product areas unless they are required to complete the two documented user stories.