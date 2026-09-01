# Task Flows

The Calories Calculator covers two core tasks:

1. Calculate the calorie content of a product or dish.
2. Find a recipe that matches the user's needs.

This document describes their entry points, actions, decisions, return paths, and completion conditions.

## 1. Calculate Calories for a Product or Dish

> As a user, I want to calculate the amount of calories in a dish or a specific product.

**Entry point:** S01 — Calorie Calculator.  
**User outcome:** Obtain the calorie content of the selected portion.

### Input methods

| Method | Action | Next step |
| --- | --- | --- |
| Barcode | Scan a product barcode. | Check whether the product is recognised or found. |
| Product search | Search for a product. | Check whether the product is found. |
| Photo | Take a photo of a dish and run analysis. | Check whether the product or dish is recognised. |
| Manual entry | Enter the product name, calories, macronutrients, and portion. | Continue to the portion-adjustment decision. |

Manual entry is available both as an input method and as a fallback when recognition or lookup does not return a product.

### Flow sequence

1. **Open the calculator.**  
   Start from S01 and choose an input method.

2. **Obtain product or dish data.**  
   Barcode scanning, product search, and photo analysis converge on the recognition or lookup decision:
   - If the product is recognised or found, open its product card.
   - Otherwise, continue to the manual-entry decision.
   - If manual entry is declined, return to S01.

3. **Continue to the portion decision.**  
   The product-card path and manual-entry path converge here. The user can adjust the weight or portion quantity, or continue with the existing portion.

4. **Specify meal time.**  
   Both portion branches continue to this step.

5. **Decide whether to save.**  
   Saving reaches the documented outcome. Declining to save returns to the portion decision.

### Decision logic

| Decision | Yes | No |
| --- | --- | --- |
| Add through a barcode? | Scan the barcode. | Continue to the product-search decision. |
| Use product search? | Search for a product. | Continue to the photo decision. |
| Use a photo? | Take a photo and analyse the dish. | Continue to the manual-entry decision. |
| Product recognised or found? | Open the product card. | Continue to the manual-entry decision. |
| Enter manually? | Enter product data. | Return to S01. |
| Change the portion? | Adjust weight or portion quantity, then specify meal time. | Continue directly to meal time. |
| Save data? | Complete the flow. | Return to the portion decision. |

The method decisions describe alternative input paths. They do not require a sequence of confirmation dialogs in the interface.

### Data and completion

| Step | Data |
| --- | --- |
| Manual entry | Product name, calories, protein, fat, carbohydrates, and portion. |
| Portion adjustment | Weight or portion quantity. |
| Meal time | Time of the meal. |
| Successful outcome | Calorie content of the user's portion. |

The diagram places successful completion after **Save data → Yes**. It does not specify when the calorie result first becomes visible.

**Save data → No** continues the editing loop. It does not represent cancellation or completion.

---

## 2. Find a Suitable Recipe

> As a user, I want to find a recipe for a dish that is suitable for me.

**Entry point:** S07 — Recipe Discovery.  
**User outcome:** Find a recipe that meets the user's needs.

### Search and selection criteria

The user can browse without refinement or enter a query and/or select criteria.

| Input | Purpose |
| --- | --- |
| Search query | Search for a recipe. |
| Calories per portion | Refine the selection by calorie content. |
| Protein per portion | Refine the selection by protein content. |
| Dietary type | Refine the selection by dietary preference. |
| Preparation time | Refine the selection by cooking time. |

The flow identifies the available criteria. Specific filter values, ranges, and matching rules are not defined.

### Flow sequence

1. **Browse recipes in S07.**  
   Recipe Discovery provides access to recipes, search, and filters.

2. **Optionally refine the selection.**  
   Enter a query and/or select criteria. The user can also continue without refinement.

3. **Check whether recipes are available.**
   - If recipes are found, display the results within S07.
   - If none are found, display the no-results state and return to search or filters.

4. **Review the results.**  
   Compare recipes using calories and protein per portion, dietary type, and preparation time. Show matches with the selected criteria when criteria are specified.

5. **Open a recipe in S08.**  
   Review its ingredients, preparation instructions, portion information, calories, available macronutrients, dietary type, and preparation time.

6. **Evaluate suitability.**
   - If the recipe is suitable, complete the task.
   - Otherwise, return to the results in S07 and continue reviewing options.

### Decision logic

| Decision | Yes | No |
| --- | --- | --- |
| Refine the selection? | Enter a query and/or select criteria in S07. | Continue to the recipes-found decision. |
| Recipes found? | Display results within S07. | Display the no-results state, then return to search or filters. |
| Recipe suitable? | Complete the flow. | Return from S08 to the results in S07. |

The user can also return directly from the results to search or filters to change the selection.

### Screens and states

| Screen | State or action | Content and behaviour |
| --- | --- | --- |
| S07 — Recipe Discovery | Browse | View recipes with search and filters available. |
| S07 — Recipe Discovery | Search and filters | Enter a query and/or select criteria. |
| S07 — Recipe Discovery | Results | Review recipe summaries, open a recipe, or refine the selection. |
| S07 — Recipe Discovery | No results | Change the query or filters. |
| S08 — Recipe Details | Review recipe | Inspect ingredients, instructions, portion, nutrition information, dietary type, and preparation time. |
| S08 — Recipe Details | Return to results | Continue browsing when the recipe is unsuitable. |

Search, filters, results, and no results are states or interactions within S07. They do not introduce additional screen IDs.

### Completion

The task is complete when the user identifies a suitable recipe.

The suitability decision represents the user's assessment. The flow does not define an additional confirmation dialog, save action, or meal-log step.

---

## Implementation Boundaries

Screen IDs follow the source diagrams: **S01, S07, and S08**. Intermediate actions in the calorie flow have no assigned screen IDs.

The following details require decisions during UI design and implementation:

| Area | Detail to define |
| --- | --- |
| Input-method selection | The control used to choose barcode, search, photo, or manual entry. |
| Calorie calculation | Nutrition-data basis, calculation rules, and when the result becomes visible. |
| Manual input | Required fields, units, defaults, and validation. |
| Return behaviour | Which entered values, query, filters, and scroll position remain after navigating back. |
| System states | Loading, camera permissions, service failures, and incomplete data. |

These details are not established by the supplied task flows.

## Source Diagrams

figma link - [figma - Task Flows & Screen Inventory](https://www.figma.com/board/Np6ZrdnQKjVw7tZw8W51kT/jito-calories-calculator?node-id=4-334&t=hmC4SE1oWCczMwPP-1)

The descriptions preserve the decisions and return paths shown in these versions.