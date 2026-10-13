# Creator Loop

Mobile-first PWA that helps creators going full-time capture ideas, plan a capped week, and protect their energy and runway.

The product spec and build plan live in [docs/SPEC.md](docs/SPEC.md). Working rules for Claude Code are in [CLAUDE.md](CLAUDE.md).

## Stack

Next.js (App Router) + TypeScript, Tailwind CSS + shadcn/ui, Supabase, Anthropic SDK, zod, Vitest, Playwright, Vercel.

## Setup

1. Install Node 22 or newer.
2. `npm install`
3. `npx playwright install chromium` (once, for end-to-end tests)
4. Copy `.env.example` to `.env` and fill in the values. `.env` is git-ignored; never commit keys.
5. `npm run dev` and open http://localhost:3000

## Scripts

| Command                | What it does                                    |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | Local dev server                                |
| `npm run build`        | Production build                                |
| `npm run lint`         | ESLint, route type generation, and `tsc` check  |
| `npm test`             | Vitest unit tests                               |
| `npm run test:e2e`     | Playwright flows (starts the dev server itself) |
| `npm run format`       | Prettier                                        |
| `npx supabase db push` | Apply database migrations (from M1)             |

## Layout

```text
src/app/          routes
src/components/   UI pieces (shadcn/ui in components/ui)
src/lib/          shared code: ai/, calc/, supabase/ arrive in later milestones
e2e/              Playwright specs
docs/SPEC.md      product spec, source of truth for scope
```
