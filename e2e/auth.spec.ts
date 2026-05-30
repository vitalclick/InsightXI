import { expect, test } from "@playwright/test";

test.describe("auth & premium gating", () => {
  test("premium trends page prompts sign-in when logged out", async ({ page }) => {
    await page.goto("/trends");
    await expect(page.getByText(/sign in to view historical trends/i)).toBeVisible();
  });

  test("signing in as premium unlocks trends", async ({ page }) => {
    await page.goto("/account");
    // Demo premium credentials are prefilled; just submit.
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText("PREMIUM")).toBeVisible();

    // Navigate via the in-app link (client-side) so the auth store is
    // preserved — a full page reload would race Zustand-persist rehydration.
    await page.getByRole("link", { name: "Trends" }).click();
    await expect(page).toHaveURL(/\/trends$/);
    // No upgrade prompt for a premium user...
    await expect(
      page.getByRole("heading", { name: "Sign in to view historical trends" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Premium subscription required" }),
    ).toHaveCount(0);
    // ...and the premium content (a season-trend summary card) is shown.
    await expect(page.getByText("Goal difference")).toBeVisible();
  });

  test("free user is blocked from premium trends", async ({ page }) => {
    await page.goto("/account");
    await page.getByPlaceholder("Email").fill("free@insightxi.dev");
    await page.getByPlaceholder("Password").fill("password");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText("FREE")).toBeVisible();

    await page.getByRole("link", { name: "Trends" }).click();
    await expect(page).toHaveURL(/\/trends$/);
    await expect(
      page.getByRole("heading", { name: "Premium subscription required" }),
    ).toBeVisible();
  });
});
