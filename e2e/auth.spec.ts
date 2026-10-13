import { expect, test } from "@playwright/test";

test("signed-out visitors are sent to sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("heading", { level: 1, name: "Creator Loop" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send sign-in link" })).toBeVisible();
});

test("the page they asked for is kept for after sign-in", async ({ page }) => {
  await page.goto("/inbox");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Finbox$/);
});

test("an expired or broken link explains what to do", async ({ page }) => {
  await page.goto("/auth/callback?code=not-a-real-code");
  await expect(page).toHaveURL(/\/sign-in\?error=link$/);
  await expect(page.getByRole("alert").filter({ hasText: "send a new one" })).toBeVisible();
});
