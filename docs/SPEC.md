# Creator Loop — v1 Product Spec & Build Plan

Oct 13, 2026 · @Dante

## Overview

Creator Loop (working title) is a mobile-first web app that helps creators going full-time do three things: capture ideas, plan a realistic week, and protect their energy and income runway. v1 ships only those three jobs. Everything else waits until users are hooked on the core loop.

**Who it's for:** creators posting 2–5 times a week who want to go full-time, often still working a 9-5. They have ideas scattered across Notes, screenshots and DMs, no ceiling on their workload, and no clear number that tells them when they can quit.

**How Claude Code should use this doc:** export it as Markdown and save it as `docs/SPEC.md` in the project. The Claude Code kickoff section has the `CLAUDE.md` file and the first prompt to paste.

### Product principles

1. **Two taps to capture.** Saving an idea must never take longer than opening Notes.
2. **Never a blank page.** Every week starts with ideas already picked.
3. **A ceiling, not a streak.** The app limits work to what the creator said they can sustain. No streaks, no guilt, no view counts on the home screen.
4. **The creator's voice, not AI's.** AI sorts and suggests. It never invents stories or facts about the creator.
5. **Earn the next feature.** New features unlock only after the creator has been using the previous layer.

## Core loop and v1 scope

v1 runs one weekly loop: capture ideas all week, pick the best few on Monday inside a capacity cap, and check energy and runway on Sunday.

&#91;embedded content: the weekly loop · 4 steps\]

The loop is the whole product: every v1 screen serves one of these four steps.

| Job | v1 features | Problem it solves |
| --- | --- | --- |
| Capture | Idea Inbox (text, voice, link, screenshot) with AI tagging; Daily Story Prompt | Running out of fresh ideas |
| Plan | Weekly Pick of the best ideas, placed on days inside a weekly post and hour cap | Disorganization, blank-page weeks |
| Protect | Sunday energy check-in, Minimum Week mode, Runway bar | Burnout, not knowing when to go full-time |

### Rules the app enforces

- A week can never hold more posts or hours than the creator's cap. The server rejects it, not only the UI.
- Two Sunday energy ratings of 2 or lower in a row trigger a suggestion to switch the next week to Minimum Week (1 post).
- Ideas older than 60 days that were never picked move to an Archive, so the inbox stays small.

### Out of scope for v1

- Posting, scheduling or connecting to Instagram, TikTok or YouTube accounts
- Analytics dashboards or view counts
- Trend feeds
- Script writing (v2), brand deal tracking (v4), team accounts

## Screens and user flows

v1 has 7 screens behind a bottom nav of four tabs (Week, Inbox, Prompt, Runway) plus a floating capture button on every screen.

| Screen | What the user sees | Main actions |
| --- | --- | --- |
| Onboarding (4 steps) | 1. Niche + 3–5 content pillars. 2. Weekly cap: posts and hours. 3. Runway numbers (skippable). 4. Daily prompt time. | Finish in under 3 minutes |
| Week (home) | Capacity bar (e.g. 2 of 3 posts), this week's planned posts by day with Film / Edit / Post steps, small runway bar | Tick steps done, open Weekly Pick, Sunday check-in |
| Capture sheet | Text box with mic, link and image buttons | Save in 2 taps; AI tags in the background |
| Inbox | Idea cards: hook, pillar chip, format, age | Filter by pillar, pick for this week, archive, edit |
| Daily Prompt | One question a day, answer by voice or text | Answer, see the 1–3 ideas it turned into, save them |
| Weekly Pick | Suggested ideas (as many as the cap allows), each with a one-line reason | Accept, swap, drag onto days, switch to Minimum Week |
| Runway | Months of runway, full-time readiness bar, income log | Log income, update expenses and savings |

### Key flows

1. **Capture (daily, any time):** tap + → type or speak → Save. The idea lands in Inbox right away; the AI tag (pillar, hook, format, effort) fills in a few seconds later.
2. **Daily Prompt (once a day):** notification at the chosen time → answer the question → AI turns the answer into 1–3 idea cards → user keeps or discards each.
3. **Monday planning:** open Week → Weekly Pick suggests ideas up to the cap → user accepts or swaps → places each on a day → the week is set.
4. **Sunday check-in:** rate energy 1–5 + optional one-line note → app shows posts shipped this week → suggests Minimum Week if the rule triggers.

### Visual direction

Calm and editorial, not gamified. Default theme from the brand palette: Obsidian `#1C1B17`, Alabaster `#EFEAE1`, Graphite `#33302B`, Stone `#8C857A`, Bronze `#9C7F52` as the single accent. Serif headings (Lora), sans body (Inter). Dark and light mode.

## Data model

Six Postgres tables in Supabase. Every table has `user_id` and a row-level security policy so a user can only read and write their own rows.

```sql
-- profiles: one row per user
profiles (
  id uuid primary key references auth.users,
  display_name text,
  niche text,
  pillars jsonb not null default '[]',      -- [{id, name, description}] 3-5 items
  weekly_post_cap int not null default 3,
  weekly_hour_cap int not null default 8,
  prompt_time time default '19:00',
  timezone text not null default 'America/Phoenix',
  monthly_expenses numeric,                  -- runway inputs, all optional
  savings numeric,
  created_at timestamptz default now()
)

-- ideas: everything captured
ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles,
  raw_text text not null,                    -- the creator's own words, never overwritten
  source text not null check (source in ('text','voice','link','image','prompt')),
  link_url text,
  image_path text,                           -- Supabase Storage path
  pillar_id text,                            -- AI-filled, user-editable
  hook text,                                 -- AI-filled, user-editable
  format text check (format in ('talking_head','broll_voiceover','skit','carousel','tutorial','vlog','other')),
  effort text check (effort in ('s','m','l')),
  status text not null default 'inbox' check (status in ('inbox','planned','posted','archived')),
  tagged_at timestamptz,                     -- null until AI tagging finishes
  created_at timestamptz default now()
)

-- daily_prompts: one question + answer per day
daily_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles,
  prompt_date date not null,
  question text not null,
  answer text,
  unique (user_id, prompt_date)
)

-- weeks: one row per planned week
weeks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles,
  week_start date not null,                  -- Monday
  mode text not null default 'normal' check (mode in ('normal','minimum')),
  post_cap int not null,                     -- copied from profile; 1 in minimum mode
  hour_cap int not null,
  energy int check (energy between 1 and 5), -- Sunday check-in
  note text,
  unique (user_id, week_start)
)

-- plan_items: an idea placed on a day of a week
plan_items (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references weeks on delete cascade,
  idea_id uuid not null references ideas,
  post_day date not null,
  est_hours numeric not null default 2,
  film_done bool default false,
  edit_done bool default false,
  posted bool default false
)

-- income_entries: creator income for the runway bar
income_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles,
  received_on date not null,
  source_type text not null check (source_type in ('brand_deal','freelance','affiliate','platform_payout','other')),
  amount numeric not null check (amount >= 0),
  note text
)
```

### Calculations (pure functions, unit tested)

- **Months of runway** = savings ÷ monthly expenses, one decimal.
- **Full-time readiness** = average creator income over the last 3 full months ÷ monthly expenses, capped at 100%.
- **Week load** = count of plan items vs `post_cap`, and sum of `est_hours` vs `hour_cap`. Adding an item that breaks either limit returns an error.

## AI features and Claude prompts

v1 makes three Claude API calls. All run server-side, return JSON checked against a zod schema, and fail soft: if a call fails, the idea is saved untagged and the user can retry.

| Feature | When it runs | Model (env var) | Output |
| --- | --- | --- | --- |
| Tag an idea | After every capture | `CLAUDE_MODEL_FAST` (Haiku) | pillar, hook, format, effort |
| Answer to ideas | After a Daily Prompt answer | `CLAUDE_MODEL_SMART` (Sonnet) | 1–3 idea cards |
| Weekly Pick | When the user opens Weekly Pick | `CLAUDE_MODEL_SUPA` (Opus) | ranked idea IDs + one-line reason each |

The Daily Prompt question itself comes from a seeded bank of 60 questions in `src/data/prompts.ts`, rotated so none repeats within 30 days. No AI call is needed to ask it.

### Shared system prompt

```text
You help a content creator organize their own ideas. Rules:
- Use the creator's own words and experiences. Never invent facts, stories, numbers or events about them.
- Hooks are under 12 words, written how a person talks, no hashtags or emoji.
- Only use pillar IDs from the list provided.
- Reply with JSON only, matching the schema given.
```

### 1. Tag an idea

```text
Creator niche: {niche}
Pillars: {pillars as JSON}
Idea (raw): {raw_text}
Link, if any: {link_url}

Return: {"pillar_id": string, "hook": string, "format": one of [talking_head, broll_voiceover, skit, carousel, tutorial, vlog, other], "effort": one of [s, m, l]}
```

### 2. Daily Prompt answer to ideas

```text
Creator niche: {niche}
Pillars: {pillars as JSON}
Today's question: {question}
Their answer: {answer}

Find 1 to 3 content ideas that come straight from this answer. Quote or closely paraphrase their words in raw_text.
Return: {"ideas": [{"raw_text": string, "pillar_id": string, "hook": string, "format": string, "effort": string}]}
```

### 3. Weekly Pick

```text
Creator niche: {niche}
Pillars: {pillars as JSON}
Slots this week: {post_cap}   Hours available: {hour_cap}
Pillars posted in the last 4 weeks: {pillar counts}
Inbox ideas: {id, hook, pillar_id, format, effort, age_days for up to 50 ideas}

Pick exactly {post_cap} ideas. Balance pillars, favor lower effort when hours are tight, and favor ideas that have waited longer.
Return: {"picks": [{"idea_id": string, "reason": string under 15 words}]}
```

The server checks every returned `idea_id` belongs to the user and that the picks fit the hour cap before showing them.

## Tech stack and architecture

v1 is a Progressive Web App (installable to the phone home screen) built with Next.js and Supabase. One codebase covers phone and desktop, and it can become a native app later.

| Layer | Choice | Why |
| --- | --- | --- |
| App | Next.js (App Router) + TypeScript | One codebase, server routes for AI calls |
| UI | Tailwind CSS + shadcn/ui | Fast to build, easy to theme |
| Database, auth, files | Supabase (Postgres, magic-link auth, Storage) | Row-level security, free tier |
| AI | Anthropic API via `@anthropic-ai/sdk`, server-side only | Tagging, prompt ideas, Weekly Pick |
| Voice | Browser Web Speech API in v1 | Free, no extra vendor; typed fallback where unsupported |
| Validation | zod | Checks every form and every AI response |
| Tests | Vitest (logic), Playwright (key flows) | Claude Code can run both |
| Hosting | Vercel | Deploys from GitHub |
| Notifications | Web Push (PWA) | Daily Prompt reminder |

### Folder layout

```text
src/
  app/                 # routes: (auth), onboarding, week, inbox, prompt, runway, settings
  app/api/             # ideas/tag, prompt/ideas, week/pick, push/subscribe
  components/          # UI pieces (IdeaCard, CaptureSheet, CapacityBar...)
  lib/ai/              # Claude client, prompts, zod schemas
  lib/calc/            # runway, readiness, week load (pure + tested)
  lib/supabase/        # server and browser clients, generated types
  data/prompts.ts      # 60 Daily Prompt questions
supabase/migrations/   # SQL for tables + RLS policies
docs/SPEC.md           # this document
```

## Build plan for Claude Code

Build v1 in 9 milestones, one per Claude Code session. Each milestone ends with tests passing and a short summary before the next one starts.

1. **M0 — Scaffold.** Next.js + TypeScript + Tailwind + shadcn/ui, ESLint, Prettier, Vitest, Playwright, `.env.example`, README.
   - Done when: `npm run dev` shows a placeholder home page and `npm test` passes.
2. **M1 — Database and auth.** Supabase migrations for all six tables, RLS policies, generated TypeScript types, magic-link sign-in and sign-out.
   - Done when: a test proves user A cannot read or write user B's ideas.
3. **M2 — Onboarding and settings.** The 4-step onboarding; settings to edit pillars, caps, prompt time and runway numbers.
   - Done when: a new user finishes onboarding and lands on an empty Week screen.
4. **M3 — Capture and Inbox (no AI yet).** Floating + button, capture sheet with text, voice (Web Speech), link and image upload; Inbox list with pillar filter, edit, pick and archive.
   - Done when: an idea can be saved in 2 taps and appears in Inbox at once.
5. **M4 — AI tagging.** `/api/ideas/tag` with the tagging prompt, zod check, one retry, untagged fallback; Inbox shows tags as they arrive.
   - Done when: unit tests with a mocked Claude client cover success, bad JSON and API error.
6. **M5 — Daily Prompt.** Seeded question bank, today's question screen, answer to 1–3 idea cards, keep or discard.
   - Done when: answering creates idea cards with `source = 'prompt'`.
7. **M6 — Week, Weekly Pick and caps.** Week screen with capacity bar and steps; Weekly Pick via Claude; drag to days; server-side cap check; Minimum Week; Sunday check-in and the burnout rule.
   - Done when: tests prove the server rejects a plan item over the post or hour cap.
8. **M7 — Runway.** Runway screen, income log, months of runway and readiness bar from `lib/calc`.
   - Done when: calculation unit tests pass for empty, partial and full data.
9. **M8 — PWA, polish and deploy.** Manifest, install prompt, Web Push for the Daily Prompt, empty and error states, accessibility pass, deploy to Vercel.
   - Done when: the app installs on an iPhone home screen and the Playwright flows pass against production.

### Working rules for each session

- Plan first: list the files to create or change and wait for approval before writing code.
- Stay inside the milestone. Note anything else under Open decisions instead of building it.
- Run `npm run lint` and `npm test` before saying a milestone is done.
- Commit at the end of each milestone with a message that names it (e.g. `M3: capture and inbox`).

## Claude Code kickoff

Set up the project folder with two files, then paste the first prompt into Claude Code. Claude Code reads `CLAUDE.md` automatically at the start of every session.

### Setup steps

1. Create an empty folder (e.g. `creator-loop`) and a GitHub repo for it.
2. Export this doc as Markdown and save it as `docs/SPEC.md` in that folder.
3. Save the block below as `CLAUDE.md` in the folder root.
4. Create a Supabase project and an Anthropic API key. Keep the keys for `.env.local` (never commit them).
5. Open the folder in Claude Code and paste the first prompt.

### CLAUDE.md

```markdown
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
- Secrets only in .env.local. Never log or commit keys.
```

### .env.example

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
CLAUDE_MODEL_FAST=claude-haiku-5-5
CLAUDE_MODEL_SMART=claude-sonnet-5-5
CLAUDE_MODEL_SUPA=claude-opus-5-5
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

### First prompt to paste

```text
Read CLAUDE.md and docs/SPEC.md fully. We're building Creator Loop v1, one milestone at a time.
Start with M0 (Scaffold). First, give me your plan: the commands you'll run and the files you'll create. Wait for my OK.
After I approve, build it, run lint and tests, commit as "M0: scaffold", and give me a 5-line summary plus anything I need to do by hand.
Then stop. Don't start M1 until I say so.
```

For each next milestone, use the same prompt with the milestone number swapped in ("Start with M1 (Database and auth)...").

## Roadmap and open decisions

After v1, the app grows in four layers. Each one appears for a user only after they pass a gate, so new users never see more than the core loop.

&#91;embedded content: roadmap · 5 layers, 4 unlock gates\]

Gates are per user, not per release: all layers can ship, but each stays hidden until that user is ready for it.

### Open decisions

- [ ] **App name.** "Creator Loop" is a working title.
- [ ] **PWA first or native iOS.** Web Push on iPhone only works once the app is added to the Home Screen (iOS 16.4+).
- [ ] **Voice capture.** Free browser speech recognition, or a paid transcription service for better accuracy.
- [ ] **Pricing.** Free during beta; the paid plan and price are undecided.
- [ ] **Beta group.** Use it yourself for 4 weeks, then invite 5–10 creators.
