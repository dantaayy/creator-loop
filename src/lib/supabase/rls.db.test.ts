// Proves row-level security on the hosted database: user A's rows are invisible and
// untouchable for user B, on every table. Run with `npm run test:db`.
//
// Creates two throwaway users with the secret key, signs each in through the magic-link
// flow (no email is sent), and deletes both users afterwards.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "./database.types";

type Client = SupabaseClient<Database>;
type User = { id: string; client: Client };

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET;
if (!url || !publishableKey || !secretKey) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET in .env",
  );
}

const noSession = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient<Database>(url, secretKey, noSession);
const createdUserIds: string[] = [];

async function createSignedInUser(label: string): Promise<User> {
  const email = `rls-test-${label}-${crypto.randomUUID()}@example.com`;
  const created = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (created.error) throw created.error;
  createdUserIds.push(created.data.user.id);

  const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (link.error) throw link.error;

  const client = createClient<Database>(url!, publishableKey!, noSession);
  const verified = await client.auth.verifyOtp({
    type: "magiclink",
    token_hash: link.data.properties.hashed_token,
  });
  if (verified.error) throw verified.error;

  return { id: created.data.user.id, client };
}

function must<T>(result: { data: T; error: unknown }): NonNullable<T> {
  if (result.error) throw result.error;
  if (result.data == null) throw new Error("No data returned");
  return result.data;
}

let a: User;
let b: User;
const aRows = {} as Record<
  "ideas" | "daily_prompts" | "weeks" | "plan_items" | "income_entries",
  string
>;

beforeAll(async () => {
  a = await createSignedInUser("a");
  b = await createSignedInUser("b");

  must(await a.client.from("profiles").update({ niche: "cooking" }).eq("id", a.id).select());

  aRows.ideas = must(
    await a.client
      .from("ideas")
      .insert({ user_id: a.id, raw_text: "A's own words", source: "text" })
      .select("id")
      .single(),
  ).id;
  aRows.daily_prompts = must(
    await a.client
      .from("daily_prompts")
      .insert({ user_id: a.id, prompt_date: "2026-10-13", question: "What surprised you today?" })
      .select("id")
      .single(),
  ).id;
  aRows.weeks = must(
    await a.client
      .from("weeks")
      .insert({ user_id: a.id, week_start: "2026-10-12", post_cap: 3, hour_cap: 8 })
      .select("id")
      .single(),
  ).id;
  aRows.plan_items = must(
    await a.client
      .from("plan_items")
      .insert({
        user_id: a.id,
        week_id: aRows.weeks,
        idea_id: aRows.ideas,
        post_day: "2026-10-14",
      })
      .select("id")
      .single(),
  ).id;
  aRows.income_entries = must(
    await a.client
      .from("income_entries")
      .insert({ user_id: a.id, received_on: "2026-10-01", source_type: "brand_deal", amount: 500 })
      .select("id")
      .single(),
  ).id;
});

afterAll(async () => {
  // Deleting the auth user cascades to the profile and every row it owns.
  for (const id of createdUserIds) await admin.auth.admin.deleteUser(id);
});

describe("profiles", () => {
  it("are created automatically on sign-up", async () => {
    const rows = must(await a.client.from("profiles").select("id, niche"));
    expect(rows).toEqual([{ id: a.id, niche: "cooking" }]);
  });

  it("B cannot read A's profile", async () => {
    const rows = must(await b.client.from("profiles").select("id").eq("id", a.id));
    expect(rows).toEqual([]);
  });

  it("B cannot update A's profile", async () => {
    const rows = must(
      await b.client.from("profiles").update({ niche: "hijacked" }).eq("id", a.id).select(),
    );
    expect(rows).toEqual([]);
    const aView = must(await a.client.from("profiles").select("niche").eq("id", a.id).single());
    expect(aView.niche).toBe("cooking");
  });

  it("B cannot create a profile for A", async () => {
    const { error } = await b.client.from("profiles").insert({ id: a.id });
    expect(error).not.toBeNull();
  });
});

const ownedTables = ["ideas", "daily_prompts", "weeks", "plan_items", "income_entries"] as const;

describe.each(ownedTables)("%s", (table) => {
  it("A can read their own row", async () => {
    const rows = must(await a.client.from(table).select("id").eq("id", aRows[table]));
    expect(rows).toHaveLength(1);
  });

  it("B cannot read A's row", async () => {
    const rows = must(await b.client.from(table).select("id").eq("id", aRows[table]));
    expect(rows).toEqual([]);
  });

  it("B cannot update A's row", async () => {
    // A no-op-looking update by id: RLS must hide the row so nothing is matched.
    const rows = must(
      await b.client.from(table).update({ user_id: b.id }).eq("id", aRows[table]).select("id"),
    );
    expect(rows).toEqual([]);
  });

  it("B cannot delete A's row", async () => {
    const rows = must(await b.client.from(table).delete().eq("id", aRows[table]).select("id"));
    expect(rows).toEqual([]);
    const stillThere = must(await a.client.from(table).select("id").eq("id", aRows[table]));
    expect(stillThere).toHaveLength(1);
  });
});

describe("inserting rows as someone else", () => {
  it("B cannot insert an idea owned by A", async () => {
    const { error } = await b.client
      .from("ideas")
      .insert({ user_id: a.id, raw_text: "not mine", source: "text" });
    expect(error).not.toBeNull();
  });

  it("B cannot insert a week, prompt or income entry owned by A", async () => {
    const results = await Promise.all([
      b.client
        .from("weeks")
        .insert({ user_id: a.id, week_start: "2026-10-19", post_cap: 1, hour_cap: 1 }),
      b.client
        .from("daily_prompts")
        .insert({ user_id: a.id, prompt_date: "2026-10-14", question: "q" }),
      b.client
        .from("income_entries")
        .insert({ user_id: a.id, received_on: "2026-10-01", source_type: "other", amount: 1 }),
    ]);
    for (const { error } of results) expect(error).not.toBeNull();
  });

  it("B cannot plan A's idea into A's week, even as B's own row", async () => {
    const { error } = await b.client.from("plan_items").insert({
      user_id: b.id,
      week_id: aRows.weeks,
      idea_id: aRows.ideas,
      post_day: "2026-10-15",
    });
    expect(error).not.toBeNull();
  });

  it("B cannot hand their own idea over to A", async () => {
    const own = must(
      await b.client
        .from("ideas")
        .insert({ user_id: b.id, raw_text: "B's idea", source: "text" })
        .select("id")
        .single(),
    );
    const { error } = await b.client.from("ideas").update({ user_id: a.id }).eq("id", own.id);
    expect(error).not.toBeNull();
  });
});

describe("signed-out visitors", () => {
  it("cannot read any ideas", async () => {
    const anon = createClient<Database>(url, publishableKey, noSession);
    const { data } = await anon.from("ideas").select("id");
    expect(data ?? []).toEqual([]);
  });
});

describe("ideas.raw_text", () => {
  it("can never be changed, even by its owner", async () => {
    const { error } = await a.client
      .from("ideas")
      .update({ raw_text: "rewritten" })
      .eq("id", aRows.ideas);
    expect(error).not.toBeNull();
    const idea = must(
      await a.client.from("ideas").select("raw_text").eq("id", aRows.ideas).single(),
    );
    expect(idea.raw_text).toBe("A's own words");
  });

  it("leaves the other fields editable", async () => {
    const idea = must(
      await a.client
        .from("ideas")
        .update({ hook: "A better hook" })
        .eq("id", aRows.ideas)
        .select("hook")
        .single(),
    );
    expect(idea.hook).toBe("A better hook");
  });
});
