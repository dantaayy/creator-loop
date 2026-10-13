import { expect, test } from "@playwright/test";

test("home page shows the placeholder", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Creator Loop");
  await expect(page.getByRole("heading", { level: 1, name: "Creator Loop" })).toBeVisible();
});
