# CLAUDE.md

## Purpose

This repository implements the Jito UX/UI Trainee Designer test task as an
AI-native, code-first product design project.

Claude Code is an implementation partner, not the source of product decisions.
Do not invent requirements, features, user needs, or UX rationale.

## Sources of Truth

Before making a product or UX decision, read the relevant documentation.

- Product requirements: `docs/project/brief.md`
- Product boundaries: `docs/project/scope.md`
- Project process: `docs/project/approach.md`
- Research conclusions: `docs/research/synthesis.md`
- Detailed research: `docs/research/`
- UX hypotheses and flows: `docs/ux/` when present
- Design-system behavior: design-system code and Storybook once implemented

Do not load or reproduce all documentation by default. Read only what is
relevant to the current task.

If documentation and implementation conflict, do not silently choose one.
Identify the conflict before changing product behavior.

## Product Decisions

Never introduce a new product capability only because it is common in
nutrition apps or technically easy to implement.

When a requirement is ambiguous:

1. Check the brief and scope.
2. Check research/UX documentation.
3. Check established product and design-system patterns.
4. Make only the smallest reversible implementation decision needed to proceed.
5. State any product-level assumption explicitly.

Implementation details may be decided locally when they do not change product
behavior or documented UX.

## Before Editing

Before changing code:

1. Read the affected files and relevant documentation.
2. Search for an existing component, token, utility, or interaction pattern.
3. Check the impact on shared components and both core flows.
4. Change the smallest necessary area.

Do not perform unrelated refactoring.

## Design System

Reuse before creating.

- Reuse an existing shared component when it already represents the same
  semantic UI concept.
- Prefer a meaningful variant when behavior and semantics are shared.
- Create a new component when it represents a distinct reusable concept, not
  merely to shorten one screen file.
- Do not duplicate shared components inside feature directories.
- Do not bypass the design system with local styling hacks.
- Use existing design tokens instead of raw visual values when an appropriate
  token exists.
- Do not change a shared component API without checking its consumers.
- Keep component names semantic and consistent with existing conventions.

A repeated value is not automatically a token and repeated markup is not
automatically a component. Avoid premature abstraction.

## UX and Interaction

Preserve the documented intent of the two core flows:

- calorie calculation;
- recipe discovery.

For each changed interaction, consider only the states relevant to that
interaction, including where applicable:

- loading;
- empty / no result;
- error;
- validation;
- success;
- disabled;
- cancel / back behavior;
- persistence after navigation.

Do not manufacture states that the scenario cannot reach.

Keep automated or estimated nutrition input reviewable when the documented UX
requires user correction or confirmation.

Do not change navigation or flow structure as a side effect of visual work.

## Frontend and Accessibility

Prefer semantic HTML and native interactive elements before recreating their
behavior with generic elements.

For interactive UI:

- preserve keyboard operability;
- provide accessible names where visible text is insufficient;
- preserve visible focus behavior;
- do not use color as the only carrier of meaning;
- preserve readable hierarchy and usable interaction targets.

Do not solve responsive issues with isolated device-specific hacks when the
layout can be expressed as a reusable rule.

## Dependencies and Scope

Before adding a dependency, check whether the repository already provides the
required capability.

Add a dependency only when it solves a concrete project need that is not
reasonably covered by the existing stack.

Never:

- add speculative infrastructure;
- rewrite working code without a task-related reason;
- leave temporary/debug code;
- leave unused components or imports created by the change;
- expand the product beyond `docs/project/scope.md` without explicit approval.

## Storybook

When a shared design-system component gains or changes a meaningful public
variant or interaction state, keep its Storybook documentation aligned.

Do not create stories merely to duplicate product screens.

Treat Storybook as component documentation, not as a second implementation of
the product UI.

## Verification

Use only commands and scripts that actually exist in `package.json` or the
repository configuration. Never invent project commands.

After code changes, run the relevant existing checks for the affected area,
such as type checking, linting, tests, build, or Storybook build when configured.

For visual changes, inspect the rendered result rather than assuming that a
successful build proves visual correctness.

Report pre-existing failures separately from failures introduced by the change.

## Documentation

Update documentation when a product, UX, architecture, or design-system
decision materially changes.

Do not duplicate detailed research, component documentation, or implementation
details in this file.

`docs/project/ai-workflow.md` documents how AI was used for human reviewers;
this file defines operational instructions for Claude Code.

## Git

Do not create or switch branches, commit, push, rewrite history, or discard
unrelated working-tree changes unless explicitly requested.

Keep changes scoped to the current task.