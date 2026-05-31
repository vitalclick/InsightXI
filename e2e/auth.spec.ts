import { expect, test } from "@playwright/test";

test.describe("auth & premium gating", () => {
  test("historical trends are gated behind Premium when logged out", async ({ page }) => {
    await page.goto("/historical");
    await expect(page.getByRole("heading", { name: "Premium analytics" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Upgrade Premium/i })).toBeVisible();
  });

  test("signing in as premium unlocks season trends", async ({ page }) => {
    await page.goto("/account");
    // Demo premium credentials are prefilled; just submit.
    await page.getByRole("button", { name: /^Sign in$/ }).click();
    await expect(page.getByText("PREMIUM")).toBeVisible();

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
    await page.getByRole("button", { name: /^Sign in$/ }).click();
    await expect(page.getByText("FREE")).toBeVisible();

    await page.getByRole("link", { name: "Historical" }).first().click();
    await expect(page).toHaveURL(/\/historical$/);
    await expect(page.getByRole("heading", { name: "Premium analytics" })).toBeVisible();
  });
});
