# UI Contract

Behaviour contracts for the components and patterns defined on the Figma page
[Branding / Stylescape](https://www.figma.com/design/heuO3V1WlKG44CukQswCkw/jito-calories-calculator?node-id=92-1209),
sections 07, 08 and 09.

Visual decisions live in [`../design/visual-direction.md`](../design/visual-direction.md).
Screen IDs and flow logic live in [`./task-flows.md`](./task-flows.md).

A static design file can show appearance and structure. It cannot demonstrate
focus management, screen-reader semantics, keyboard operation, runtime text
scaling or reduced motion. Everything marked **verify in implementation** is
outside what the file establishes.

---

## 1. Demonstration Fixtures

These are synthetic test fixtures. They are not nutritional advice, not external
database records, and not values inferred from a photograph.

### Fixture C — calculator

| Amount | Energy | Protein | Carbohydrates | Fat |
| --- | --- | --- | --- | --- |
| 100 g | 180 kcal | 6 g | 21 g | 8 g |
| 250 g | 450 kcal | 15 g | 52.5 g | 20 g |
| 300 g | 540 kcal | 18 g | 63 g | 24 g |

Scaling for demonstration: per-100-g value × amount ÷ 100.

### Fixture R — recipe

Lentil soup, 1 serving = 300 g — 450 kcal, 24 g protein, 48 g carbohydrates,
18 g fat, 25 min, dietary type not specified.

Clearly-labelled synthetic extension for the expanded-nutrient specimen only:
fibre 8 g, calcium 120 mg, iron 3 mg, vitamin C 12 mg, vitamin D unavailable.

**C and R are separate fixtures.** C at 300 g is 540 kcal while R at 300 g is
450 kcal; neither is derived from the other.

### Rounding

Retain full precision internally. Display: whole kcal; up to one decimal for
macronutrient grams, omitting unnecessary trailing zeros. A small micronutrient
quantity must never round a known non-zero value to a misleading zero — define
unit and precision behaviour per nutrient separately.

---

## 2. Data Rules

- An amount must be valid and greater than zero. An invalid entry is **retained
  for correction**, and a previous result is never labelled as current.
- A blank filter threshold means **no constraint**, not a threshold of zero.
- A recipe matches when **known** values satisfy **every** active criterion.
- An unknown value can never establish a match. Unknown dietary type cannot
  establish a dietary match.
- With no active filters, omit "Matches your filters" rather than inventing one.
- Missing information is **Not available** — never zero, never inferred from
  another field.
- Only supported data units. No invented mass, volume or serving conversions.
- Empty results, loading and operational failure are three different states with
  different copy and different recovery actions.
- The prototype uses mock data. Nothing may claim verified food identification
  or a working AI backend.

---

## 3. Persistence in This Prototype

The task flow places successful completion after **Save data → Yes** but does not
define storage.

**Bounded prototype assumption:** *Save result* stores the current result locally
on the device for the duration of the prototype session. It does **not** create a
diary, a history or a synced account, and the UI must not promise any of those.
Success is reported with the `SaveFeedback` state; failure uses operational-error
copy and keeps the entry intact.

If the product later defines real persistence, this assumption is the thing to
replace.

---

## 4. Component Contracts

### Actions — `Button`, `IconButton`

| Aspect | Contract |
| --- | --- |
| Variants | Primary, secondary, text; `IconButton` at 48 × 48 |
| States | Default, pressed, focus-visible, disabled, loading; hover for pointer input only |
| Loading | Replaces the label and makes the control unavailable. Never applied to a static component. |
| Focus | 3 px `focus/ring` drawn **outside** the control with a 2 px canvas gap, so it cannot be clipped |
| Accessible name | An icon-only control must carry a name in code; the glyph is decorative to assistive technology |

### Inputs — `TextField`, `AmountField`, `SearchField`, `UnitControl`

| Aspect | Contract |
| --- | --- |
| States | Empty, filled, focused, invalid, disabled |
| Label | Always visible. A placeholder is never the only label. |
| Invalid | Border, icon and text together — never colour alone. The entry is kept. |
| `AmountField` | Numeric entry plus `UnitControl`; only valid unit conversions are offered |
| `UnitControl` | Opens a modal list with explicit cancel and confirm; the selected option carries a check |
| `SearchField` | The query stays visible with a clear action; the field border spans the full control width |

### Selection — `FilterChip`, `AppliedCriterionChip`, `NutrientBadge`

| Component | Contract |
| --- | --- |
| `FilterChip` | Selectable. Selected = 2 px boundary + fill change + check mark + accessible selected state |
| `AppliedCriterionChip` | Represents a committed criterion and carries a remove action |
| `NutrientBadge` | **Static.** No border, not tappable, never styled to look interactive |

### Data — `NutritionSummary`, `NutrientRow`, `MatchCriteria`

| Aspect | Contract |
| --- | --- |
| Compact | Energy plus the three macronutrients, used on result and card surfaces |
| Expanded | Adds fibre as a component of carbohydrates, plus grouped vitamins and minerals |
| Grouping | Vitamins and minerals share one group marker each; individual nutrients are labelled neutral rows |
| Unavailable | Named as *Not available* in secondary text |
| Stale after editing | When an amount changes, the previous result must not be presented as current until it recalculates |
| Interaction | A nutrient row is not interactive |

### Recipes — `RecipeCard`

| Aspect | Contract |
| --- | --- |
| Photo | 4:3. Absent photo uses a quiet tinted band — no broken-image icon, no skeleton |
| Long title | Wraps; it is never truncated |
| Active criteria | In a **list**, a compact summary ("Matches all 3 filters") so several options stay scannable |
| | On the **detail**, each criterion is restated against the recipe's own value |
| No active filters | The match block is omitted entirely |
| Missing optional fields | Dropped, never shown as zero |
| Never | An invented suitability score |

### Overlays — `ModalSheet`

| Aspect | Contract |
| --- | --- |
| Uses | Entry-method selection, filters, unit selection |
| Appearance | 12 px top corners, one overlay elevation, a 40 % scrim over a still-recognisable underlying screen |
| Dismissal | A visible close control is always present; Escape dismisses where the platform supports it. Dismissal never requires a swipe. |
| Content | Short and scrolling content are both supported; the sheet keeps its header anchored |
| **Verify in implementation** | Initial focus inside the sheet, keyboard containment, background inert, focus restored to the opener on dismissal |

### Feedback — `InlineMessage`, `EmptyState`, `LoadingState`, `SaveFeedback`

Four separate situations, each with its own copy and its own recovery action. An
operational failure is never rendered as a zero result or as an empty result.

### Navigation — `AppHeader`, `BackAction`, `NavigationBar`

Two destinations: **Calculate** (S01) and **Recipes** (S06–S09). This is a new
design decision; the task flows do not define a primary navigation.

The navigation bar is the only fixed element, so a keyboard or footer cannot
cover the active field or the primary action. **Verify in implementation.**

---

## 5. Pattern Contracts

### 5.1 Choose an entry method — S01

| | |
| --- | --- |
| Trigger | *Add food* on S01 |
| Visible state | Modal sheet over the dimmed calculator |
| Commit / cancel | Choosing a method commits and navigates; close or Escape changes nothing |
| Persistence | Nothing is written until a food is identified and its amount confirmed |
| Recovery | Manual entry is always available as the fallback |

### 5.2 Search and select a food — S01 search, S06 browse

| | |
| --- | --- |
| Trigger | *Search food* from the entry sheet, or the S06 field |
| Visible state | Query stays in the field beside a clear action; results list below |
| Commit / cancel | Selecting a result opens review; Back returns with the query intact |
| Persistence | Query survives navigation to review and back for the duration of the task |
| Recovery | No match offers manual entry. Recipe discovery also works with no query at all. |

### 5.3 Edit the amount and unit — S01 review

| | |
| --- | --- |
| Trigger | Editing the amount field or opening the unit control |
| Visible state | The result restates the amount it was calculated for and the nutrition basis |
| Commit / cancel | The unit list is modal with explicit cancel and confirm |
| Persistence | The result recalculates from the per-100-g basis |
| Recovery | Zero or blank is rejected inline and the entry is kept |

### 5.4 Draft, apply, reset and dismiss filters — S07

| | |
| --- | --- |
| Trigger | *Filters* from S06 or S08 |
| Visible state | Draft values live only in the sheet; applied values appear as chips above the results |
| Commit / cancel | **Apply** validates and commits. Dismissal discards unapplied edits. **Reset all** clears the draft and takes effect only on Apply. |
| Persistence | Applied criteria and the query survive opening a recipe and returning |
| Recovery | A blank threshold means no constraint |

Criteria: calories per serving (maximum), protein per serving (minimum),
preparation time (maximum), dietary type. All active criteria must match — AND,
not OR. Thresholds and AND matching are illustrative design proposals, not
nutritional recommendations.

### 5.5 Explain suitability before the details — S08 → S09

| | |
| --- | --- |
| Trigger | A result set with at least one applied criterion |
| Visible state | Each active criterion restated against the recipe's own value on the detail; a compact summary in the list |
| Commit / cancel | Opening a recipe navigates to S09; Back returns to S08 |
| Persistence | Query, applied filters and list position are restored on return |
| Recovery | With no active filters the block is omitted; an unknown value never satisfies a criterion |

### 5.6 Recover from empty, failed and error states — S08, S01

| | |
| --- | --- |
| Trigger | Empty result set, failed identification, or a network/service failure |
| Visible state | Three separate states with different copy; a failure is never rendered as a zero result |
| Commit / cancel | Each state keeps the user in place; nothing is discarded |
| Persistence | Query and applied filters are preserved throughout |
| Recovery | Every state names its own next action; loading is a fourth, distinct state |

### 5.7 Expanded nutrition

One disclosure behaviour, used identically in the calculator result and in recipe
details. Energy and macronutrients are always visible; vitamins and minerals sit
behind a single expand. This is a presentation of existing data, not a separate
feature journey.

---

## 6. Accessibility Requirements

Measured from the design file:

- 24 contrast pairs recalculated on 2026-09-02 with the WCAG 2.2 sRGB
  relative-luminance formula (Figma section 10).
- Normal text meets 4.5:1; non-text control, state and boundary information meets
  3:1, subject to the criterion's conditions and exceptions.
- Colour is never the only carrier of meaning.
- `border/decorative` (1.23:1) is restricted to decoration.
- Controls target 48 × 48. This is a **product decision**: WCAG 2.2 AA sets a
  24 × 24 CSS px minimum with exceptions, Apple's guidance is generally 44 × 44 pt
  and Android's is 48 dp. CSS px, iOS pt and Android dp are not interchangeable
  certification units.
- Layout verified at 320, 390 and 430 widths and at 150 % text.

**Verify in implementation** — not established by the file:

- Screen-reader semantics and accessible names
- Keyboard operation and focus order
- Focus trapping and restoration for modal sheets
- Runtime OS text scaling
- Reduced motion — removes translation and counting effects; a state change must
  never depend on animation
- Tabular figures (`font-feature-settings: "tnum" 1`), which could not be enabled
  through the Figma plugin API

No blanket conformance claim is made.
