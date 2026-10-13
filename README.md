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
5. `npx supabase login`, then `npx supabase link --project-ref <your-project-ref>` (asks for the database password).
6. `npm run dev` and open http://localhost:3000

### Supabase dashboard settings

Magic-link sign-in needs these under Authentication → URL Configuration:

- Site URL: `http://localhost:3000` (your Vercel URL once deployed)
- Redirect URLs: `http://localhost:3000/**`

After changing the schema, add a migration in `supabase/migrations/`, run `npx supabase db push`, then regenerate types:

```bash
npx supabase gen types typescript --linked --schema public > src/lib/supabase/database.types.ts
```

## Scripts

| Command                | What it does                                    |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | Local dev server                                |
| `npm run build`        | Production build                                |
| `npm run lint`         | ESLint, route type generation, and `tsc` check  |
| `npm test`             | Vitest unit tests                               |
| `npm run test:e2e`     | Playwright flows (starts the dev server itself) |
| `npm run test:db`      | RLS tests against the hosted Supabase project   |
| `npm run format`       | Prettier                                        |
| `npx supabase db push` | Apply database migrations                       |

## Layout

```text
src/app/          routes
src/components/   UI pieces (shadcn/ui in components/ui)
src/lib/          shared code: supabase/ (clients, types, RLS tests), auth/; ai/ and calc/ come later
src/proxy.ts      refreshes the session, sends signed-out visitors to /sign-in
supabase/         CLI config and SQL migrations
e2e/              Playwright specs
docs/SPEC.md      product spec, source of truth for scope
```
