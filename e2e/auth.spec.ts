import { expect, test } from "@playwright/test";

test.describe("auth & premium gating", () => {
  test("historical trends are gated behind Premium when logged out", async ({ page }) => {
    await page.goto("/historical");
    await expect(page.getByRole("heading", { name: "Premium analytics" })).toBeVisible();
    // Scope to the page body: the sidebar also has an "Upgrade Premium" link.
    await expect(
      page.locator("#main-content").getByRole("link", { name: /Upgrade Premium/i }),
    ).toBeVisible();
  });

  test("signing in as premium unlocks season trends", async ({ page }) => {
    await page.goto("/account");
    // Fill the premium demo credentials explicitly (mirrors the free-user test
    // below). The form ships empty — the test must not rely on prefilled values.
    await page.getByLabel("Email").fill("premium@insightxi.dev");
    await page.getByLabel("Password").fill("password");
    await page.locator("form").getByRole("button", { name: /^Sign in$/ }).click();
    // The account tier badge in the page body (sidebar "Premium" link also exists).
    await expect(
      page.locator("#main-content").getByText("PREMIUM", { exact: true }),
    ).toBeVisible();

    // Navigate via the in-app sidebar link (client-side) so the Zustand auth
    // store is preserved — a full reload would race persist rehydration.
    await page.getByRole("link", { name: "Historical" }).first().click();
    await expect(page).toHaveURL(/\/historical$/);
    // The premium upsell must be gone for a premium user.
    await expect(page.getByRole("heading", { name: "Premium analytics" })).toHaveCount(0);
    // Season-trends panel header is shown instead.
    await expect(page.getByText(/Season Trends/i)).toBeVisible();
  });

  test("free user stays gated out of premium trends", async ({ page }) => {
    await page.goto("/account");
    await page.getByLabel("Email").fill("free@insightxi.dev");
    await page.getByLabel("Password").fill("password");
    await page.locator("form").getByRole("button", { name: /^Sign in$/ }).click();
    await expect(page.locator("#main-content").getByText("FREE", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Historical" }).first().click();
    await expect(page).toHaveURL(/\/historical$/);
    await expect(page.getByRole("heading", { name: "Premium analytics" })).toBeVisible();
  });
});
