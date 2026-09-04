# Apply before the Hi-Fi run

Copy the bundle into `C:\jito-calories-calculator`, preserving paths.

- Replace root `CLAUDE.md`, `AGENTS.md`, `PRODUCT.md`, and `DESIGN.md`.
- Replace the three bundled skill entrypoints.
- Keep the existing `.claude\skills\impeccable\reference\` and `.claude\skills\impeccable\scripts\` directories from Impeccable 4.1.3.
- Remove the old duplicated/escaped pasted versions; do not keep two authoritative copies.

Prepare the branch before pasting the execution prompt:

```powershell
git switch main
git pull --ff-only origin main
git switch -c feat/hifi-screens
git status --short --branch
```

If `feat/hifi-screens` already exists, switch to it instead of creating it. Start a fresh Claude Code session from the repository root, confirm the skills are discoverable, then paste `HIFI_EXECUTION_PROMPT.md` once. Use the highest-capability Claude coding model available with extended/high reasoning; avoid a fast/light model for the single long 42-state run.
