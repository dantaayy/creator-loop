# Creator Loop

Mobile-first PWA that helps creators going full-time capture ideas, plan a capped week, and protect their energy and runway.
The full spec is docs/SPEC.md. Read it before any task. It is the source of truth for scope.

## Stack

Next.js (App Router) + TypeScript, Tailwind + shadcn/ui, Supabase (Postgres, auth, storage), Anthropic SDK, zod, Vitest, Playwright, Vercel.

## Commands

- npm run dev: local app
- npm run lint: ESLint + type check
- npm test: Vitest unit tests
- npm run test:e2e: Playwright flows
- npx supabase db push: apply migrations

## How we work

- One milestone per session (see Build plan in docs/SPEC.md). Plan first, list files, wait for my OK, then build.
- Never build features listed under Out of scope or Roadmap. Add ideas to Open decisions instead.
- Ask before adding any new dependency.
- Run lint and tests before calling a milestone done. Commit as "M#: short name".

## Rules

- Every table has user_id and RLS. Never query without the user's session.
- All Claude API calls live in src/lib/ai and run server-side only. Model names come from env vars.
- Validate every AI response with zod. On failure, save the idea untagged; never block a capture.
- Never overwrite ideas.raw_text. It is the creator's own words.
- Caps are enforced on the server, not only in the UI.
- Business math lives in src/lib/calc as pure functions with unit tests.
- No streaks, no view counts, no guilt copy anywhere in the UI.
- Secrets only in .env Never log or commit keys.
