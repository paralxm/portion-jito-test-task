# Portion Visual Quality

## Purpose

Use this skill when visually auditing, refining, rebuilding, or polishing the **Portion** mobile interface.

This skill governs the final visual quality of Portion:

- visual hierarchy;
- typography;
- spacing and rhythm;
- composition;
- surface hierarchy;
- iconography;
- color and contrast;
- progress visualization;
- accessibility;
- iOS-aware interaction patterns;
- responsive mobile behavior;
- anti-AI-slop rules;
- visual QA.

This skill does **not** own design-system architecture, token generation, domain logic, or product scope. Those remain governed by the current Portion product contracts and the project-specific design-system rules.

If a generic visual-design skill, frontend-design skill, Impeccable, or another visual assistant conflicts with this file, this file is authoritative.

---

## 1. Product Context

Portion is a mobile-first product for:

1. calculating calories for a food or dish;
2. finding recipes that match user-selected criteria.

The approved visual direction is:

**Portion — Measured Clarity**

The product should feel:

- precise;
- calm;
- clear;
- trustworthy;
- neutral;
- modern;
- lightweight;
- human;
- product-focused.

It must not feel like:

- a bodybuilding app;
- an aggressive weight-loss tracker;
- a clinical nutrition system;
- a gamified habit tracker;
- a generic AI dashboard;
- a marketing landing page inside a mobile app.

Visual design must make nutritional information easier to understand, not merely more decorative.

---

## 2. Core Visual Principle

Every screen must establish a deliberate reading order.

Before approving a screen, answer:

1. What is the single most important element?
2. What is the second most important element?
3. What supports those elements?
4. What can be visually quieter?
5. What can be removed without harming the task?

If everything attracts equal attention, the hierarchy has failed.

Visual emphasis must follow product importance.

Do not use decoration to manufacture hierarchy when typography, spacing, scale, grouping, or contrast can solve it more clearly.

---

## 3. Visual Hierarchy

Use hierarchy through:

- scale;
- weight;
- position;
- whitespace;
- grouping;
- contrast;
- surface separation;
- restrained accent color.

Avoid using all hierarchy methods at once.

### Typical hierarchy

For a high-information mobile screen:

```text
Primary outcome / main metric
        ↓
Primary action or immediate context
        ↓
Supporting information
        ↓
Secondary actions
        ↓
Metadata / tertiary information
```

### Home example

The intended priority should typically resemble:

```text
1. Calorie state / calorie progress
2. Supporting nutrition summary
3. Current or today's relevant food context
4. Primary next action
5. Recipe discovery / secondary content
6. Tertiary metadata
```

Do not allow secondary cards to visually compete with the primary calorie state.

### Recipe screens

Priority should typically be:

```text
Recipe identity
→ suitability evidence
→ nutrition / preparation facts
→ ingredients / details
→ supporting metadata
```

Do not make decorative photography more important than the information required to judge whether the recipe fits.

---

## 4. Typography

The approved primary typeface is:

**Inter**

Do not replace Inter.

Do not introduce a second display typeface unless explicitly approved outside this task.

Distinctiveness must come from composition, hierarchy, numeric treatment, spacing, proportion, and consistency — not from changing the font family.

### Typography must establish clear roles

At minimum distinguish:

- display / hero metric;
- screen title;
- section heading;
- card title;
- body;
- label;
- metadata;
- button text;
- navigation label;
- numeric metric;
- supporting numeric value.

Do not use one style for unrelated semantic roles merely because the font size is similar.

### Numeric information

Calories and nutrition values often deserve stronger visual treatment than surrounding labels.

Use:

- tabular or stable numeric behavior where supported;
- clear unit relationships;
- enough spacing between value and unit;
- consistent decimal precision;
- predictable alignment.

Do not visually separate a number from its unit so strongly that they appear unrelated.

### Text size and iOS awareness

The web implementation visually targets an iOS mobile product.

Use Apple platform guidance as a design reference, not as proof that the React implementation is a native iOS app.

Do not blindly equate:

```text
CSS px = iOS pt = Android dp
```

Use the approved browser typography scale unless the project explicitly changes it.

For native-oriented reasoning:

- approximately 17 pt is a useful default iOS body-text reference;
- avoid tiny persistent text;
- support enlarged text;
- ensure hierarchy still works when text grows.

Do not globally replace the approved web type scale with 17 px/pt simply because Apple uses that default.

---

## 5. Spacing and Rhythm

Spacing must communicate relationships.

Use this rule:

```text
Related items → closer
Different groups → farther apart
Major sections → clearly separated
```

Do not space every layer equally.

Avoid a mechanical layout where every vertical gap is identical.

### Use the existing spacing system

Do not invent arbitrary spacing values when an approved token already fits.

Optical adjustments are allowed only when:

- visually necessary;
- local;
- documented or obvious;
- not used to bypass the token system.

Do not introduce random values such as 13, 17, 19, or 23 solely to "make it look better."

### Check rhythm across full screens

Review:

- top safe-area spacing;
- title-to-content spacing;
- section spacing;
- card internal spacing;
- card-to-card spacing;
- bottom content clearance;
- fixed/sticky UI clearance;
- navigation separation.

A screen can use valid tokens and still have bad rhythm.

---

## 6. Layout and Composition

Prefer simple compositions with strong alignment.

Use a small number of meaningful layout anchors.

Avoid:

- arbitrary floating elements;
- decorative offset cards;
- unnecessary asymmetry;
- excessive overlap;
- components positioned independently without shared alignment logic.

### Mobile composition

Design for one-handed scanning and clear vertical progression.

Important content should not require visual hunting.

Primary actions should be easy to locate and should not move unpredictably between similar states.

Use progressive disclosure rather than fitting every detail into the first viewport.

### Density

Portion should feel informative but not dense.

Do not solve density by:

- shrinking text too far;
- compressing touch targets;
- reducing contrast;
- removing labels;
- overusing icon-only actions.

Prefer:

- stronger grouping;
- disclosure;
- prioritization;
- shorter supporting copy;
- better spacing hierarchy.

---

## 7. Surfaces and Elevation

Surface treatment must communicate structure.

Use elevation only when it explains:

- layering;
- interaction;
- grouping;
- floating/sticky behavior;
- modal hierarchy.

Do not use shadows as decoration.

Avoid:

- every section becoming a card;
- cards inside cards inside cards;
- large shadows on static content;
- excessive border-radius variation;
- unnecessary glassmorphism.

A plain grouped section is often better than another rounded container.

### Surface hierarchy should remain obvious

Typical relationship:

```text
Canvas
→ raised content surface
→ interactive surface
→ overlay / modal surface
```

The number of elevation levels should stay limited.

Do not create visual depth that the interaction model does not need.

---

## 8. Radius

Use the approved radius system.

Do not automatically apply large rounded corners to:

- every container;
- every image;
- every navigation item;
- every metric;
- every group.

Radius should reflect component anatomy and interaction.

Avoid the common AI-generated pattern:

```text
large radius + soft shadow + gradient + pill + icon
```

repeated across the entire interface.

---

## 9. Color

Use the approved Portion palette and semantic roles.

Do not rebrand the product during visual refinement.

Do not introduce new accent colors simply to create novelty.

### Color hierarchy

Color should support:

- hierarchy;
- state;
- interaction;
- category/semantic meaning;
- progress;
- feedback.

Color should not be used to decorate neutral information without purpose.

### Calories

Use the existing calorie-specific color roles.

Calorie visualizations should consume semantic calorie tokens, not arbitrary screen-level colors.

### Nutrition colors

If macros use distinct colors, their meaning must remain stable across the product.

Do not swap color meanings between screens.

Color must not be the sole indicator.

Always pair meaningful color with one or more of:

- text label;
- numeric value;
- icon;
- marker;
- shape;
- position;
- accessible name.

---

## 10. Contrast and Accessibility

Never approve a visual treatment based on appearance alone.

Verify the **actual foreground/background pair** used in the rendered interface.

Review:

- primary text on canvas;
- secondary text on canvas;
- text on cards;
- text on chips;
- text on buttons;
- icons on surfaces;
- progress indicators;
- progress tracks;
- focus rings;
- disabled states;
- photo overlays;
- scrims;
- sticky/floating surfaces;
- error/success/warning states.

### Contrast targets

Use current WCAG AA guidance as the baseline:

- normal text: at least 4.5:1;
- large text: at least 3:1;
- meaningful non-text UI information: generally at least 3:1 where applicable.

Do not claim complete accessibility compliance based only on contrast ratios.

### Important rule

A token can be accessible in one context and fail in another.

Do not approve:

```text
text.secondary
```

globally because it passes on the canvas if it fails on another surface where it is actually used.

### Photo/media content

Never rely on uncontrolled photography to provide a predictable text background.

For text over media, use a deliberate treatment such as:

- scrim;
- solid chip;
- controlled overlay;
- text placement in a consistently dark/light region only when guaranteed.

After replacing placeholder media with real photography, re-check actual readability.

---

## 11. Progress Ring Visual Rules

`ProgressRing` and `CalorieProgressRing` must prioritize comprehension over visual spectacle.

### The ring must communicate

- current progress;
- total/target context;
- current value;
- remaining or consumed state when relevant.

### The ring must not depend on color alone

The central content or adjacent label must communicate the meaning even if color is unavailable.

### Required visual checks

Test:

- 0%;
- small progress;
- mid progress;
- near complete;
- 100%;
- over-target only if supported by the product contract.

Verify:

- track remains visible but visually secondary;
- indicator is clearly distinguishable;
- start/end geometry is correct;
- no clipping;
- stroke scales correctly;
- text remains readable;
- enlarged text does not collide with the ring;
- progress never visually exceeds the intended maximum unless explicitly designed to show overflow.

### Avoid

- decorative gradients without semantic reason;
- glow;
- neon effects;
- excessive animation;
- confetti;
- alarm-red over-budget treatment;
- fitness-ring imitation without product justification.

Use calorie-specific semantic colors intentionally.

---

## 12. Iconography

Use **Phosphor Icons**.

Default:

```text
Regular
```

Persistent selected navigation may use:

```text
Bold
```

Do not randomly mix weights.

Use a coherent optical size system.

Visible icon size and touch target are separate.

### Icon rules

- icon-only actions need accessible names;
- avoid ambiguous icons without labels where the meaning is not obvious;
- do not use decorative icons in every card heading;
- avoid icons merely to fill empty space;
- use text when text is clearer.

---

## 13. iOS-Aware Design Rules

Portion is implemented as a web prototype but visually targets a mobile iOS-style experience.

Follow Apple HIG principles where they improve the product, without falsely claiming native implementation.

### Touch targets

Use the project baseline:

```text
48 × 48 CSS px
```

This intentionally provides a generous target.

Do not shrink interactive areas to match the visible glyph.

### Safe areas

Ensure:

- top content respects device/status areas;
- bottom navigation does not overlap content;
- sticky CTA areas account for bottom safe area;
- focused inputs remain visible above the software keyboard.

### Navigation

Prefer familiar mobile navigation behavior.

Do not introduce experimental navigation simply to make the interface more distinctive.

Preserve:

- clear current destination;
- predictable Back behavior;
- modal vs push distinction;
- correct dismissal behavior.

### Sheets and overlays

Bottom sheets should:

- have an obvious hierarchy;
- provide visible dismissal where required;
- preserve context;
- not hide critical actions behind unsafe-area regions;
- support scrolling when content grows;
- avoid nested modal complexity.

### System familiarity

Prefer controls that visually and behaviorally resemble familiar mobile interaction patterns.

Do not imitate iOS chrome so literally that the web prototype becomes fake-native decoration.

---

## 14. Enlarged Text and Dynamic-Type Awareness

The layout must survive enlarged text.

Test representative 150–200% browser text scenarios.

Check:

- navigation labels;
- buttons;
- form labels;
- helper/error text;
- nutrition values;
- chips;
- modal headers;
- progress-ring center content;
- card titles;
- recipe metadata.

Do not solve enlarged-text problems by:

- clipping;
- shrinking below the approved minimum;
- hiding labels;
- making controls horizontally scroll unless intentionally designed.

Prefer reflow and vertical expansion.

---

## 15. Navigation Bar Visual Rules

The bottom navigation must remain visually subordinate to screen content while still being easy to use.

Check:

- selected state is unmistakable;
- unselected states remain readable;
- icon/label spacing is consistent;
- Add food remains visually distinguishable as an action, not a selected destination;
- keyboard behavior does not create a floating or broken bar;
- safe area is respected.

Do not turn the navigation into an oversized decorative object.

Avoid excessive glass effects, glow, or gradients unless explicitly approved.

---

## 16. Buttons and CTAs

Primary CTA hierarchy must be obvious.

A screen should normally have one dominant primary action.

Avoid multiple equally prominent buttons.

### Buttons must remain legible across

- default;
- pressed;
- focus-visible;
- disabled;
- loading.

Do not use low-contrast disabled styles that become unreadable.

Do not use gradient CTAs simply because they look more premium.

Use gradients only if the visual direction explicitly supports them and contrast remains valid across the full gradient.

---

## 17. Cards

Cards must represent actual grouping.

Do not make every content block a card.

A card is justified when it groups content into a meaningful reusable unit or provides a distinct interactive target.

### Recipe cards

Prioritize:

1. recipe identity;
2. suitability evidence;
3. relevant nutrition/time facts;
4. supporting imagery.

Avoid:

- excessive badges;
- decorative pills;
- ratings when not required;
- health-score metaphors;
- text directly over uncontrolled photography without protection.

### Nutrition cards

Do not turn every nutrient into an individual card.

Prefer clear grouped presentation.

---

## 18. Chips, Pills, and Badges

Use pills only when the shape reflects interaction or semantic grouping.

Valid examples:

- filters;
- removable criteria;
- compact statuses;
- short tags.

Avoid "pillification":

- metadata in pills without reason;
- headings inside pills;
- every secondary label inside a rounded capsule;
- decorative pill labels used only to make the UI look modern.

If plain text is clearer, use plain text.

---

## 19. Motion

Motion must explain change.

Valid purposes:

- state transition;
- navigation continuity;
- progress update;
- modal entry/exit;
- spatial relationship.

Avoid:

- entrance animation on every card;
- bouncing icons;
- looping decorative motion;
- number counting when it delays comprehension;
- excessive spring effects;
- motion added solely for "premium feel."

Support reduced-motion preferences.

When reduced motion is active, preserve state information.

---

## 20. Anti-AI-Slop Rules

The final UI must not look like a generic AI-generated concept.

### Explicitly avoid

- default purple/blue AI gradients;
- random aurora/mesh backgrounds;
- gradient text;
- glassmorphism everywhere;
- excessive blur;
- neon glows;
- floating decorative orbs;
- huge marketing headlines inside product screens;
- oversized rounded cards used everywhere;
- card-inside-card layouts;
- arbitrary badges;
- excessive pill-shaped metadata;
- generic "AI insight" panels;
- sparkles or magic-wand decoration;
- fake AI status indicators;
- dashboards filled with unnecessary charts;
- a progress visualization for every metric;
- meaningless health scores;
- fake personalization;
- random illustrations unrelated to product tasks;
- excessively soft shadows;
- tiny low-contrast grey text;
- multiple accent colors competing simultaneously;
- gradients used solely because flat color feels "boring";
- trendy effects that weaken information hierarchy.

### Also avoid category imitation

Do not copy familiar patterns from:

- Apple Activity rings;
- MyFitnessPal;
- YAZIO;
- Lifesum;
- Cal AI;
- fitness dashboards;

without a clear Portion-specific rationale.

Category familiarity is useful.

Category imitation is not differentiation.

---

## 21. Distinctiveness Without Slop

Portion should feel distinctive through:

- precise visual hierarchy;
- disciplined spacing;
- strong numeric typography;
- consistent calorie semantics;
- clear surfaces;
- calm composition;
- excellent state design;
- coherent iconography;
- high-quality photography where relevant;
- subtle but intentional detail.

Do not manufacture distinctiveness through decorative excess.

Use restraint deliberately.

Simple does not mean generic if the proportions, hierarchy, spacing, and interaction are carefully resolved.

---

## 22. Visual Review Gate

Before approving any screen, evaluate it against the following questions.

### Hierarchy

- Is the primary element obvious in under two seconds?
- Is the primary action obvious?
- Are secondary elements visually quieter?
- Is there unnecessary competition for attention?

### Typography

- Are semantic roles clearly distinguishable?
- Are line-height and wrapping comfortable?
- Are nutrition values and units easy to parse?
- Does enlarged text still work?

### Spacing

- Are related elements grouped?
- Are sections separated clearly?
- Does the page have consistent rhythm?
- Are there arbitrary gaps?

### Color

- Does accent color have a clear purpose?
- Is color meaning consistent?
- Is color doing work that text/structure should do?

### Contrast

- Do actual rendered combinations pass?
- Are media overlays readable?
- Are disabled/focus states clear?

### Components

- Does every card/container need to exist?
- Are pills/chips semantically justified?
- Are radii and shadows overused?

### iOS/mobile behavior

- Are touch targets sufficient?
- Are safe areas respected?
- Does the screen behave predictably?
- Does navigation match user expectations?

### Anti-slop

- Does anything look added only because it is visually trendy?
- Could any visual flourish be removed without losing usability?
- Does the screen resemble a generic AI dashboard?

If the answer exposes a problem, refine the screen before declaring it complete.

---

## 23. Visual QA Workflow

For substantial visual work, use this sequence:

```text
Inspect current screen
        ↓
Identify hierarchy and usability problems
        ↓
Check current design-system constraints
        ↓
Define intended improvement
        ↓
Implement
        ↓
Render at representative widths
        ↓
Capture screenshots
        ↓
Review screenshots visually
        ↓
Check contrast
        ↓
Check enlarged text
        ↓
Check states/interactions
        ↓
Fix regressions
        ↓
Re-run verification
```

Do not approve a change only because:

- code compiles;
- Storybook renders;
- token bindings are complete;
- automated accessibility checks pass.

Structural correctness and visual correctness are separate.

---

## 24. Representative Widths

At minimum review:

```text
320 px
390 px
393 px
430 px
```

Also review short-height conditions where sticky/fixed controls exist.

Check all critical screens at the product's primary target width and use narrow-width checks to expose fragile layouts.

---

## 25. Screenshot Review

After every major visual change, inspect screenshots.

Do not rely solely on DOM structure, token audits, or automated metrics.

Look specifically for:

- uneven rhythm;
- weak hierarchy;
- clipping;
- awkward wrapping;
- excessive whitespace;
- insufficient whitespace;
- accidental visual emphasis;
- misaligned icons;
- strange optical centering;
- inconsistent corner radii;
- poor image crop;
- unreadable overlay text;
- compressed controls;
- progress-ring geometry issues;
- sticky/fixed overlap;
- unexpected token-binding regressions.

A structural audit can pass while the interface is visibly broken.

---

## 26. Using Impeccable or Frontend-Design Skills

External visual skills are advisory.

They may help with:

- hierarchy;
- composition;
- spacing;
- polish;
- visual critique;
- anti-generic design review.

They must not override:

- Inter;
- approved Portion branding;
- approved palette;
- approved navigation;
- product scope;
- semantic token logic;
- accessibility constraints;
- iOS-aware behavior.

Do not accept recommendations to change foundations merely because a generic visual skill prefers a more expressive style.

Use external skills to improve execution **inside Portion's direction**, not to invent a new direction.

---

## 27. Final Visual Completion Criteria

A visually changed screen is complete only when:

- primary hierarchy is immediately clear;
- typography roles are consistent;
- spacing feels deliberate;
- semantic color use is coherent;
- real foreground/background contrast is verified;
- progress visualization is understandable without color alone;
- touch targets remain sufficient;
- safe areas are respected;
- enlarged text remains usable;
- no critical clipping/overflow exists;
- controls and navigation feel familiar and predictable;
- decorative effects are restrained;
- the screen does not resemble generic AI-generated UI;
- the screen still feels like Portion;
- screenshots have been visually reviewed after implementation.

Do not claim a screen is finished because it is merely cleaner than the previous version.

The standard is:

**clear, coherent, accessible, product-specific, iOS-aware, and visually intentional.**

---

## 28. Priority for the Current Portion Visual Rebuild

For the current visual pass, prioritize in this order:

1. Home first-viewport hierarchy.
2. Calorie `ProgressRing` / `CalorieProgressRing`.
3. Typography hierarchy and numeric treatment.
4. Recipe-card visual quality and suitability hierarchy.
5. Surface and section hierarchy.
6. Spacing/rhythm across screens.
7. Navigation and Add-food action polish.
8. Real contrast checks.
9. Enlarged-text and 320 px resilience.
10. Empty/loading/error-state visual quality.
11. Media/photo treatment.
12. Final screenshot review across the full flow.

Do not add new decorative systems until these are resolved.
