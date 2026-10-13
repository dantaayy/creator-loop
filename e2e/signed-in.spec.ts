// Signs a throwaway user in through the real magic-link callback and checks the signed-in
// home page renders cleanly. Uses the hosted Supabase project, so it needs SUPABASE_SECRET
// in .env; it is skipped when that is missing. The user is deleted afterwards.
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

if (existsSync(".env")) process.loadEnvFile(".env");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET;

test.skip(!url || !secretKey, "needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET in .env");

const admin = createClient(url ?? "", secretKey ?? "", {
  auth: { persistSession: false, autoRefreshToken: false },
});
let userId: string | undefined;

test.afterEach(async () => {
  if (userId) await admin.auth.admin.deleteUser(userId);
});

test("a signed-in user sees the home page without errors, then signs out", async ({ page }) => {
  const email = `e2e-${crypto.randomUUID()}@example.com`;
  const created = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (created.error) throw created.error;
  userId = created.data.user.id;
  const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (link.error) throw link.error;

  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto(`/auth/callback?token_hash=${link.data.properties.hashed_token}&type=magiclink`);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
  await page.reload();
  await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
  expect(errors).toEqual([]);

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
});
