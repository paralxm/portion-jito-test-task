# Visual Direction — Measured Clarity

This document records the visual and UI decisions for **Portion** and the reasoning
behind them. It is the source of decisions for the Design System phase.

The editable deliverable is the Figma page
[Branding / Stylescape](https://www.figma.com/design/heuO3V1WlKG44CukQswCkw/jito-calories-calculator?node-id=92-1209).

Superseded material is kept on the Figma page
`Archive — Stylescape (superseded 2026-09-02)`.

---

## 1. What This Direction Has to Carry

Portion is an English-language mobile calorie calculator and recipe-discovery
product covering two user stories:

> As a user, I want to calculate the amount of calories in a dish or a specific product.

> As a user, I want to find a recipe for a dish that is suitable for me.

The visual direction therefore has to make numbers readable, keep estimated values
correctable, and explain recipe suitability using criteria the user chose.

---

## 2. Selected Direction

**Measured Clarity** — blue-led, restrained, minimally rounded.

Two directions were built with equivalent content, the same fixtures and equal
specimen widths (Figma section 02):

| Dimension | A — Kitchen Counter | B — Measured Clarity (selected) |
| --- | --- | --- |
| Task balance | Photography dominates, so the recipe task outweighs the calculator. | Both tasks carry equal weight. |
| Numeric clarity | A terracotta result colour couples quantity to brand accent. | The result stays neutral, so colour never implies a judgement. |
| Photo integration | Warm surfaces and warm food photography compete. | A cool action family stays separate from warm imagery. |
| Implementation | Warm neutrals need a second tint ramp for status colours. | One action family plus separate status and nutrition roles. |

**The trade-off, stated plainly:** blue alone is generic. Identity has to come from
the whole composition — typography, alignment, photographic treatment and
proportion — not from the hue. This was a qualitative comparison; no preference
test was run and no scores were assigned.

Both directions use one typeface. The difference is surface, accent and
photographic emphasis, not the number of font families. A green accent
exploration was reviewed and dropped: it differed only in accent hue.

---

## 3. Typography

**Inter**, one family for the whole hierarchy.

Selected because it is designed for screen text at small sizes, ships a
tabular-figure feature the numeric columns need, is already implemented in this
project, and covers the hierarchy through size and weight alone. This is a
project fit, not a claim that it is the best available typeface.

Technical fallback: `Inter`, then the platform UI sans-serif, then a generic sans-serif.

| Role | Size / line height | Weight |
| --- | --- | --- |
| Screen heading | 24 / 32 | 600 |
| Main result | 32 / 40 | 600 |
| Card / section title | 18 / 26 | 600 |
| Body / input | 16 / 24 | 400 |
| Action | 16 / 24 | 600 |
| Label | 14 / 20 | 500 |
| Supporting text | 14 / 20 | 400 |

32 px is reserved for the main result on a calculator or details view. Values
inside lists and cards use 18 or 16.

**Wordmark:** `portion`, lowercase, Inter Semi Bold, −3 % tracking. The negative
tracking is a wordmark rule only — interface text keeps normal tracking.

### Tabular figures — not applied in the Figma file

Re-tested on 2026-09-02: `openTypeFeatures` is a read-only property on a Figma
text node and `setRangeOpenTypeFeatures` does not exist, so tabular figures
cannot be enabled through the plugin API.

They are therefore an **implementation requirement**, not a demonstrated
property. Apply `font-feature-settings: "tnum" 1` wherever values align in a
column or update in place. Column alignment in the file is achieved with layout
(a fixed-width, right-aligned value column) and never with inserted spaces.

---

## 4. Iconography

**Phosphor Icons**, replacing Lucide across the redesigned scope.

- Catalogue: <https://phosphoricons.com/>
- React package: <https://github.com/phosphor-icons/react>

**Official weights, verified 2026-09-02 against `phosphor-icons/core`:**
`thin`, `light`, `regular`, `bold`, `fill`, `duotone`.

There is **no `medium` weight** — `assets/medium` returns HTTP 404. Do not use
`weight="medium"`, do not thicken paths to imitate it, and do not describe a
custom asset as an official variant.

- `regular` is the default.
- `bold` is the disclosed substitute for the stronger selected treatment, used
  **only** for a persistent selected state such as the current navigation
  destination. It is Bold, not Medium.
- Selection is never carried by weight alone: weight + action colour + a 2 px
  indicator bar + the visible label, plus the accessible selected state in code.

Momentary states are different from selection: hover changes the control
surface, pressed darkens it, keyboard focus draws a ring outside the control,
and loading shows progress. None of these change the glyph weight.

Source SVGs are filled paths on a 256 viewBox with no stroke. Lucide's 24-unit
stroke handling must not be applied to them.

Icons render at 24 px. A documented smaller size is allowed for non-interactive
metadata only. Touch targets are sized independently of the glyph.

Catalogue names in use: `plus`, `magnifying-glass`, `barcode`, `camera`,
`pencil-simple`, `sliders-horizontal`, `x`, `arrow-left`, `check`, `info`,
`clock`, `caret-down`, `calculator`, `cooking-pot`, `warning-circle`.

---

## 5. Colour

Three independent layers. Tokens stay separately addressable even where values
coincide.

### 5.1 Foundation and interaction

One blue action family covers buttons, links, selection, focus and navigation.

| Role | Value |
| --- | --- |
| `bg/canvas` | `#FFFFFF` |
| `bg/surface` | `#F7F8FA` |
| `bg/sunken` | `#F2F4F7` |
| `text/primary` | `#17212B` |
| `text/secondary` | `#52606D` |
| `border/control` | `#77818B` |
| `border/decorative` | `#E4E8EC` |
| `action/primary` | `#2855D9` |
| `action/hover` | `#2147B6` |
| `action/pressed` | `#19368F` |
| `action/surfaceSelected` | `#EAF0FF` |
| `focus/ring` | `#19368F` |
| `state/disabled/surface` | `#E5E7EB` |
| `state/disabled/text` | `#59636E` |
| `scrim/base` | `#17212B` at 40 % |

`border/decorative` measures 1.23:1 against canvas. Its role is restricted to
decoration; wherever a boundary must be perceivable, `border/control` is used.

### 5.2 Operational feedback

Describes system conditions, never food quality.

| Role | Text | Surface |
| --- | --- | --- |
| Error | `#B42318` | `#FFF1F0` |
| Warning | `#8A4B0C` | `#FFF5E7` |
| Success | `#166534` | `#EFF8F1` |
| Information | `#2147B6` | `#EAF0FF` |

Information deliberately shares the action hue but is a separate token and is
never rendered as an interactive control.

### 5.3 Nutrition categories

Recognition markers, never scores or health verdicts.

| Category | Accent | Subtle surface |
| --- | --- | --- |
| Energy / calories | `#17212B` | `#F2F4F7` |
| Protein | `#7252A3` | `#F3EFF9` |
| Carbohydrates | `#087682` | `#EAF6F7` |
| Fat | `#955A0C` | `#FFF4E2` |
| Fibre | `#4E7029` | `#F1F5E8` |
| Vitamins | `#A04574` | `#F9EEF3` |
| Minerals | `#6B6259` | `#F3F0ED` |

Every accent reaches at least 4.85:1 on its own subtle surface, so a category
label may be set in its accent.

### 5.4 Display rules

- Quantities and units stay in neutral text. Colour lives in a small marker or a
  label accent — never in the number or the card background.
- The mapping is identical in calculator results, recipe cards, recipe details
  and component examples.
- Never rely on hue alone. The nutrient name, quantity, unit and fixed order
  carry the meaning.
- Vitamins and minerals share one group marker each; individual nutrients are
  labelled neutral rows.
- Nutrition tokens are never aliased to status tokens.
- A nutrient row is not interactive and must not look tappable.
- Energy is not a fourth macronutrient. **Fibre is displayed as a component of
  carbohydrates and is never added to the carbohydrate total.**
- Grams, milligrams and micrograms are never combined in one proportional chart.
- No percentage-of-daily-value and no deficiency or excess verdict: this project
  defines no reference basis.
- Detailed nutrients use progressive disclosure on result and details views, not
  on every recipe card.

### 5.5 Colour-independence check (computed)

Computed on 2026-09-02 from the values above, not user tested.

| Category | Accent | Greyscale (relative luminance) | Deuteranope approximation |
| --- | --- | --- | --- |
| Protein | `#7252A3` | `#626262` | `#5B5BA2` |
| Carbohydrates | `#087682` | `#6B6B6B` | `#565684` |
| Fat | `#955A0C` | `#686868` | `#6B6B0B` |
| Fibre | `#4E7029` | `#666666` | `#66662A` |
| Vitamins | `#A04574` | `#656565` | `#606072` |
| Minerals | `#6B6259` | `#636363` | `#656559` |

Six of the seven accents fall inside a nine-step greyscale range. Under the
deuteranope approximation, protein and carbohydrates converge, as do fat and
fibre. The accents are therefore **recognition aids only**. Deuteranope values
use the Viénot et al. (1999) linear approximation; a simulation is not user
testing.

---

## 6. Shape and Spacing

Radii, replacing the former 8/12/20 and pill-heavy defaults:

| Token | Value | Applies to |
| --- | --- | --- |
| `radius/structure` | 0 | Full-width structural regions and separators |
| `radius/control` | 4 | Buttons, fields, filter chips, small callouts |
| `radius/card` | 8 | Recipe cards and grouped data containers |
| `radius/sheet` | 12 | Modal-sheet top corners |

No pill-shaped controls and no 20–32 px card corners. Naturally circular icon
geometry is not an exception to this.

Spacing scale: **4 / 8 / 12 / 16 / 24 / 32 / 48 / 64**.

| Value | Role |
| --- | --- |
| 16 | Mobile page inset |
| 16 | Typical card padding |
| 8 | Closely related items |
| 16 | Form and list grouping |
| 24 | Between major screen groups |

Controls grow with their content.

**Elevation:** ordinary surfaces use borders and space. One overlay elevation
exists, for modal sheets only:

```
box-shadow: 0 -2px 24px 0 rgba(23, 33, 43, 0.16);
```

No decorative calorie rings, blobs, arbitrary gradients, celebration graphics or
unexplained progress gauges.

---

## 7. Photography

- 4:3 for recipe-card images, 16:9 for recipe details. 1:1 is not used.
- Natural-looking light, recognisable food texture, controlled saturation, quiet
  backgrounds, no text over photographs.
- No-photo treatment is a quiet tinted band — never a broken-image icon and
  never a loading skeleton, because the photo is absent rather than loading.
- **A photograph never establishes calories, ingredients, dietary status or
  nutrient values.**

Images used on the board, all via commons.wikimedia.org and cropped to ratio:

| Image | Author | Licence |
| --- | --- | --- |
| Lentil soup | jules | CC BY 2.0 |
| Healthy Vegan Buddha Bowl | FitTasteTic | CC BY-SA 2.0 |
| Healthy Gnocchi Buddha Bowl | FitTasteTic | CC BY-SA 2.0 |

External app screenshots on the board are references for attributed design
analysis. Their public availability does not grant permission to reuse
competitor imagery in the product.

---

## 8. Navigation

The approved task flows define screens S01 and S06–S09 but **do not define a
primary navigation**. A minimal two-destination navigation is proposed here as a
new design decision:

- **Calculate** → S01
- **Recipes** → S06 · S07 · S08 · S09

Selected destination = Phosphor `bold` weight + `action/primary` + a 2 px
indicator bar + the visible label. A five-tab tracker navigation is explicitly
not imported from competitors.

---

## 9. Naming

Product name: **Portion**. The wordmark is lowercase. `Calorie calculator` is
retained as the functional screen title of S01.

No trademark or domain clearance has been carried out for this project.

---

## 10. Scope Boundaries

Not part of this product: onboarding, subscriptions, a diary or history product,
goals, streaks, social features, coaching, a health score, or a real AI
recognition backend.

Detailed-nutrition presentation is provided where data exists. It is not extended
into clinical advice, supplements, nutrient goals or extra filtering.

---

## 11. Related Documents

- Behaviour contracts: [`../ux/ui-contract.md`](../ux/ui-contract.md)
- Machine-readable token draft: [`./tokens.json`](./tokens.json)
- Task flows and screen IDs: [`../ux/task-flows.md`](../ux/task-flows.md)
- Research: [`../ux/research/`](../ux/research/)
