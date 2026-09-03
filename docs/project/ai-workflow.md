## Tool Ownership

FigJam
→ problem framing and problem statement
→ Product Research & Competitive Analysis
→ research synthesis
→ target audience / user needs
→ user stories
→ hypotheses and assumption mapping
→ user flows and task flows
→ validation planning and hypothesis review

Figma
→ branding, moodboard, visual exploration, selected presentation artifacts

Repository
→ accepted research conclusions, product requirements, UX decisions,
  project rules, implementation and validation record

Storybook
→ implemented design system, components, states and interaction behavior

Claude Code
→ implementation using repository context and approved Figma/FigJam inputs
## Design-system implementation slice (2026-09-02 → 2026-09-03)

Claude Code built the design system, product screens and Storybook in the repository on branch `feat/design-system`, following the code-first order in `CLAUDE.md`: contracts → tokens → components → Storybook → runtime screens → browser verification. Skills and tools actually used, and why:

- `frontend-design` skill — loaded once for craft guidance (typography, copy, restraint); accepted contracts overrode its defaults where they conflicted.
- Playwright (already installed for Storybook tests) — `scripts/verify/runtime-walkthrough.mjs` exercises both journeys against the built app and captures screenshots that were inspected visually.
- `feature-dev:code-reviewer` agent — reviewed the branch at the end of the slice; findings are recorded in `docs/design-system/README.md` §9.
- Figma MCP — not used in this slice; capturing the verified screens into the Figma Design file is the open handoff step.

Verification commands, results and known gaps are recorded in `docs/design-system/README.md` §6, and the per-capability status in its coverage register (§4).
