# LibrOS

Guestbook dApp on Stellar testnet (Scaffold Stellar + Vite/React + Vercel).
Contract in `contracts/libro-visitas`, app in `app/`, UI copy in Spanish.

## Workflow (branches, environments, releases)

Follow `docs/FLUJO.md`. In short:

- Branches: `main` (production, PRs from `dev_main` only), `dev_main`
  (integration), `feature/x.y.z` (from `dev_main`, PR back). Merge commits. Docs
  and small fixes go straight to `dev_main`. Never commit to `main`.
- Contracts are fixed per environment on testnet: `staging` (`dev_main`, Vercel
  Previews) and `production` (`main`), both in `scaffold.yml`. The 1.0.0
  contract has no `upgrade`: changing it means a new deploy (new id, empty
  data), staging first, documented in the CHANGELOG.
- Every version: bump `package.json`, add a `CHANGELOG.md` section. After the
  user merges `dev_main → main`: `git tag -a vX.Y.Z origin/main` + GitHub
  release with that CHANGELOG section.
- The user merges PRs in GitHub; open them and wait.
- Vercel/CI generate the contract client with `scripts/ci-clients.mjs` (no Rust
  there), from `PUBLIC_LIBRO_VISITAS_CONTRACT_ID`.

## Commands (repo root)

| Command                                          | What                                                  |
| ------------------------------------------------ | ----------------------------------------------------- |
| `STELLAR_NETWORK=testnet stellar scaffold build` | generate the client for production (`staging` too)    |
| `npm start`                                      | `stellar scaffold watch` + Vite on localhost:5173     |
| `npm run check`                                  | cargo test + fmt, typecheck, lint, prettier check     |
| `npm run build`                                  | production build of the app (needs generated clients) |

`app-lib/clients/` is generated and gitignored. Tabs, no semicolons (Prettier
config `@theahaco/ts-config/prettier`).
