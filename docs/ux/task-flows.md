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

**Entry point:** S06 — Recipe Discovery.  
**User outcome:** Find a recipe that meets the user's needs.

### Search and selection criteria

The user starts in Recipe Discovery and can either browse available recipes or refine the selection by entering a query and/or choosing criteria.

| Input | Purpose |
| --- | --- |
| Search query | Search for a specific recipe or dish. |
| Calories per portion | Refine recipes by calorie content. |
| Protein per portion | Refine recipes by protein content. |
| Dietary type | Refine recipes by dietary preference. |
| Preparation time | Refine recipes by cooking time. |

The task flow identifies the available criteria. Specific filter values, ranges, matching rules, and ranking logic are not defined.

### Flow sequence

1. **Browse recipes in S06 — Recipe Discovery.**  
   The user enters Recipe Discovery, where recipes can be browsed and search and filters are available.

2. **Decide whether to refine the selection.**
   - If **No**, continue directly to checking whether recipes are available.
   - If **Yes**, enter a search query and/or select criteria in the S07 search/filter state.

3. **Enter a query and/or select criteria in S07.**  
   The user can refine recipes using calories per portion, protein per portion, dietary type, and preparation time.

4. **Check whether recipes are found.**
   - If **Yes**, proceed to S08 — Results.
   - If **No**, display the S08 no-results state.

5. **Recover from no results when necessary.**  
   If no recipes match the current selection, the user changes the query and/or filters and the system checks for matching recipes again.

6. **Review recipes in S08 — Results.**  
   Compare available recipes using:
   - calories per portion;
   - protein per portion;
   - dietary type;
   - preparation time;
   - selected-criteria matches, when criteria were specified.

7. **Evaluate whether the results are relevant.**
   - If **No**, return to S06 — Recipe Discovery and adjust the search or selection.
   - If **Yes**, select and open a recipe.

8. **Open the selected recipe in S09 — Recipe Details.**  
   Review:
   - ingredients;
   - preparation instructions;
   - portion information;
   - calories;
   - available macronutrients;
   - dietary type;
   - preparation time.

9. **Evaluate whether the recipe is suitable.**
   - If **Yes**, the task is complete.
   - If **No**, return to S08 — Results and continue reviewing available recipes.

### Decision logic

| Decision | Yes | No |
| --- | --- | --- |
| Refine the selection? | Enter a query and/or select criteria in S07. | Continue directly to the recipes-found decision. |
| Recipes found? | Proceed to S08 — Results. | Show the S08 no-results state and change the query and/or filters. |
| Results relevant? | Select and open a recipe. | Return to S06 — Recipe Discovery to adjust the selection. |
| Recipe suitable? | Complete the task. | Return to S08 — Results and review another recipe. |

### Screens and states

| Screen | State or action | Content and behaviour |
| --- | --- | --- |
| S06 — Recipe Discovery | Browse | Browse available recipes and access search and filters. |
| S07 — Search / Filters | Refine selection | Enter a query and/or select calories, protein, dietary type, and preparation-time criteria. |
| S08 — Results | Results available | Review and compare recipes matching the current selection. |
| S08 — Results | No results | Change the query and/or filters when no recipes match. |
| S08 — Results | Return from recipe | Continue reviewing alternatives after rejecting a recipe. |
| S09 — Recipe Details | Review recipe | Inspect ingredients, preparation instructions, portion information, nutrition information, dietary type, and preparation time. |

### Navigation and recovery behaviour

The flow supports several recovery paths:

- **No matching recipes:** change the query and/or filters and retry.
- **Irrelevant result set:** return to Recipe Discovery and adjust the selection.
- **Unsuitable individual recipe:** return to S08 — Results without restarting the discovery process.

The exact persistence of search criteria, filters, and scroll position after returning to a previous screen is an implementation decision.

### Completion

The task is complete when the user identifies a recipe they consider suitable.

The final **Recipe suitable?** decision represents the user's assessment of the recipe. The flow does not introduce an additional confirmation dialog, save action, meal-log action, or other post-selection behaviour.

---

## Implementation Boundaries

Screen IDs follow the updated task flow:

**S06 — Recipe Discovery**  
**S07 — Search / Filters**  
**S08 — Results**  
**S09 — Recipe Details**

The following details require decisions during UI design and implementation:

| Area | Detail to define |
| --- | --- |
| Search behaviour | Search triggering, suggestions, recent searches, and query matching. |
| Filter controls | Exact values, ranges, defaults, multi-selection behaviour, and reset behaviour. |
| Result ranking | How recipes are ordered and how strongly selected criteria affect ranking. |
| Criteria matching | How matching criteria are communicated within recipe results. |
| No-results recovery | Whether filters can be edited directly from the no-results state or through S07. |
| Return behaviour | Whether query, filters, selected values, and scroll position persist when navigating back. |
| Recipe data | Required nutrition fields, handling of unavailable macronutrients, and portion representation. |
| System states | Loading, network/service failures, incomplete recipe data, and empty states. |

These implementation details are not established by the supplied task flow and should be defined during UI design and implementation.

## Source Diagrams

figma link - [figma - Task Flows & Screen Inventory](https://www.figma.com/board/Np6ZrdnQKjVw7tZw8W51kT/jito-calories-calculator?node-id=4-334&t=hmC4SE1oWCczMwPP-1)

The descriptions preserve the decisions and return paths shown in these versions.