# jito-calories-calculator

**Portion** — an iOS-oriented web prototype for two journeys: calculate the calories of a specific food or dish, and find a suitable recipe. The design system, Storybook and product screens are implemented in this repository with React 19, Vite 8, TypeScript 7 and Storybook 10.5; branding and UX artifacts live in Figma/FigJam.

## Run locally

```bash
npm ci                    # locked install
npm run dev               # app on http://localhost:5173
npm run storybook         # Storybook on http://localhost:6006
```

| Purpose | Command |
| --- | --- |
| Typecheck | `npm run typecheck` |
| Regenerate / check design tokens | `npm run tokens:build` / `npm run tokens:check` |
| Unit tests (domain and formatting) | `npm run test:unit` |
| Storybook tests (headless Chromium, accessibility at error) | `npm run test:storybook` |
| Both test projects | `npm test` |
| Everything above plus builds | `npm run verify` |
| Build app / Storybook | `npm run build` / `npm run build-storybook` |
| Contrast matrix from the token source | `node scripts/verify/contrast-matrix.mjs --check` (regenerate `docs/design-system/contrast-matrix.md` without the flag) |
| Navigation radius comparison renders (inspection aid, `.verification/compare/`) | `node scripts/verify/nav-radius-compare.mjs` after `npm run build-storybook` |
| The 41 mapped low-fi states at 393 × 852 plus 320/430/200 %/safe-area variants (`.verification/storybook/states/`, curated copies in `verification/storybook/states/`) | part of `node scripts/verify/storybook-captures.mjs`; the mapping lives in `docs/design/hifi-decisions.md` and Storybook → Product states → 00 Index |
| Runtime walkthrough with screenshots | `npm run build && npx vite preview --port 4173` then `node scripts/verify/runtime-walkthrough.mjs` |
| Storybook captures from the static build | `npm run build-storybook` then `node scripts/verify/storybook-captures.mjs` |
| Runtime walkthrough with screenshots | `npm run build && npx vite preview --port 4173` then `node scripts/verify/runtime-walkthrough.mjs` |

Guide, coverage register and verification status: [docs/design-system/README.md](docs/design-system/README.md). Behaviour contracts: [docs/ux/ui-contract.md](docs/ux/ui-contract.md) and [docs/ux/low-fidelity.md](docs/ux/low-fidelity.md).

## Development workflow

This project follows a lightweight GitHub Flow:

- `main` is always kept in a working state.
- Changes are developed in short-lived branches.
- Meaningful changes are merged through pull requests.
- Branches are deleted after merging.
- UI components are validated in Storybook before being integrated into flows.

## Project Links

- Live Application — TBD (not deployed yet)
- Storybook — TBD (not published yet)
- Figma Design — https://www.figma.com/design/heuO3V1WlKG44CukQswCkw/jito-calories-calculator?node-id=92-1209 (branding/stylescape and low-fidelity artifacts; final UI screens not yet captured from code)
- FigJam Research — https://www.figma.com/board/Np6ZrdnQKjVw7tZw8W51kT/jito-calories-calculator?node-id=0-1&t=hmC4SE1oWCczMwPP-1
- Walkthrough video — TBD

Public access to the Figma files has not been verified from an incognito session.
