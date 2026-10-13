-- M1: all v1 tables, row-level security, and integrity triggers.
-- Source of truth: docs/SPEC.md → Data model.
-- Every table is owned by one user. RLS lets a signed-in user touch only their own rows.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- profiles: one row per user. `id` is the user id (stands in for user_id).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  niche text,
  pillars jsonb not null default '[]',
  weekly_post_cap int not null default 3 check (weekly_post_cap >= 1),
  weekly_hour_cap int not null default 8 check (weekly_hour_cap >= 1),
  prompt_time time default '19:00',
  timezone text not null default 'America/Phoenix',
  monthly_expenses numeric check (monthly_expenses >= 0),
  savings numeric,
  created_at timestamptz default now()
);

-- ideas: everything captured.
create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  raw_text text not null,
  source text not null check (source in ('text', 'voice', 'link', 'image', 'prompt')),
  link_url text,
  image_path text,
  pillar_id text,
  hook text,
  format text check (
    format in ('talking_head', 'broll_voiceover', 'skit', 'carousel', 'tutorial', 'vlog', 'other')
  ),
  effort text check (effort in ('s', 'm', 'l')),
  status text not null default 'inbox' check (status in ('inbox', 'planned', 'posted', 'archived')),
  tagged_at timestamptz,
  created_at timestamptz default now()
);

create index ideas_user_status_idx on public.ideas (user_id, status);
create index ideas_user_created_idx on public.ideas (user_id, created_at desc);

-- daily_prompts: one question + answer per day.
create table public.daily_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  prompt_date date not null,
  question text not null,
  answer text,
  unique (user_id, prompt_date)
);

-- weeks: one row per planned week. week_start is always a Monday.
create table public.weeks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null check (extract(isodow from week_start) = 1),
  mode text not null default 'normal' check (mode in ('normal', 'minimum')),
  post_cap int not null check (post_cap >= 1),
  hour_cap int not null check (hour_cap >= 1),
  energy int check (energy between 1 and 5),
  note text,
  unique (user_id, week_start)
);

-- plan_items: an idea placed on a day of a week.
-- user_id is not in the spec's column list; added so every table has user_id + RLS (CLAUDE.md).
create table public.plan_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_id uuid not null references public.weeks (id) on delete cascade,
  idea_id uuid not null references public.ideas (id),
  post_day date not null,
  est_hours numeric not null default 2 check (est_hours > 0),
  film_done bool default false,
  edit_done bool default false,
  posted bool default false
);

create index plan_items_user_idx on public.plan_items (user_id);
create index plan_items_week_idx on public.plan_items (week_id);
create index plan_items_idea_idx on public.plan_items (idea_id);

-- income_entries: creator income for the runway bar.
create table public.income_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  received_on date not null,
  source_type text not null check (
    source_type in ('brand_deal', 'freelance', 'affiliate', 'platform_payout', 'other')
  ),
  amount numeric not null check (amount >= 0),
  note text
);

create index income_entries_user_received_idx on public.income_entries (user_id, received_on desc);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Create a profile row for every new auth user.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ideas.raw_text is the creator's own words. It can never be changed after capture.
create function public.prevent_raw_text_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.raw_text is distinct from old.raw_text then
    raise exception 'ideas.raw_text cannot be changed'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger ideas_raw_text_immutable
  before update on public.ideas
  for each row execute function public.prevent_raw_text_change();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.ideas enable row level security;
alter table public.daily_prompts enable row level security;
alter table public.weeks enable row level security;
alter table public.plan_items enable row level security;
alter table public.income_entries enable row level security;

-- Only signed-in users get table access, and RLS narrows it to their own rows.
revoke all on public.profiles, public.ideas, public.daily_prompts, public.weeks,
  public.plan_items, public.income_entries from anon;
grant select, insert, update, delete on public.profiles, public.ideas, public.daily_prompts,
  public.weeks, public.plan_items, public.income_entries to authenticated;

-- profiles: created by the trigger; users read and update their own. No insert or delete.
create policy "profiles: read own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- ideas
create policy "ideas: read own" on public.ideas
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "ideas: insert own" on public.ideas
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "ideas: update own" on public.ideas
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "ideas: delete own" on public.ideas
  for delete to authenticated using ((select auth.uid()) = user_id);

-- daily_prompts
create policy "daily_prompts: read own" on public.daily_prompts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "daily_prompts: insert own" on public.daily_prompts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "daily_prompts: update own" on public.daily_prompts
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "daily_prompts: delete own" on public.daily_prompts
  for delete to authenticated using ((select auth.uid()) = user_id);

-- weeks
create policy "weeks: read own" on public.weeks
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "weeks: insert own" on public.weeks
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "weeks: update own" on public.weeks
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "weeks: delete own" on public.weeks
  for delete to authenticated using ((select auth.uid()) = user_id);

-- plan_items: the row, its week, and its idea must all belong to the same user.
create function public.owns_week_and_idea(p_week_id uuid, p_idea_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select
    exists (select 1 from public.weeks w where w.id = p_week_id and w.user_id = (select auth.uid()))
    and exists (select 1 from public.ideas i where i.id = p_idea_id and i.user_id = (select auth.uid()));
$$;

revoke execute on function public.owns_week_and_idea(uuid, uuid) from public, anon;
grant execute on function public.owns_week_and_idea(uuid, uuid) to authenticated;

create policy "plan_items: read own" on public.plan_items
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "plan_items: insert own" on public.plan_items
  for insert to authenticated
  with check ((select auth.uid()) = user_id and public.owns_week_and_idea(week_id, idea_id));
create policy "plan_items: update own" on public.plan_items
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and public.owns_week_and_idea(week_id, idea_id));
create policy "plan_items: delete own" on public.plan_items
  for delete to authenticated using ((select auth.uid()) = user_id);

-- income_entries
create policy "income_entries: read own" on public.income_entries
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "income_entries: insert own" on public.income_entries
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "income_entries: update own" on public.income_entries
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "income_entries: delete own" on public.income_entries
  for delete to authenticated using ((select auth.uid()) = user_id);
