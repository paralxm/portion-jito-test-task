@AGENTS.md
@PRODUCT.md
@DESIGN.md

# Claude Code entry point

- Work from the repository root. Read the current branch, worktree, `package.json`, active UX contracts, and the affected implementation before editing.
- Never trust historical hashes, file counts, component counts, or test totals in prose; current source and executed commands win.
- For shared UI, load `portion-design-system`. For screen composition or visual review, also load `portion-visual-quality`.
- Use `impeccable` only as a refinement and QA toolkit inside `PRODUCT.md`, `DESIGN.md`, the UX contracts, and the two Portion skills. Default mode: **Operate**, not redesign.
- Figma is read-only unless the task explicitly authorizes a writeback. Never make a Figma-only fix to implemented UI.
- Keep UI copy in English. Keep code, identifiers, and documentation in the repository's existing language.
- Continue autonomously through implementation and verification. Stop only for a real blocker: inaccessible required source, unsafe repository state, contradictory product authority, missing permission, or a failing prerequisite that cannot be repaired within scope.
- Do not push, merge, rebase, reset, delete branches, or overwrite unrelated work. Local commits are allowed only when the active task says so.

