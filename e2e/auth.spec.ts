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

    await page.goto("/trends");
    // Either the trend cards or the table appears (no upgrade prompt).
    await expect(page.getByText(/premium subscription required/i)).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Historical Trends" }),
    ).toBeVisible();
  });

  test("free user is blocked from premium trends", async ({ page }) => {
    await page.goto("/account");
    await page.getByPlaceholder("Email").fill("free@insightxi.dev");
    await page.getByPlaceholder("Password").fill("password");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText("FREE")).toBeVisible();

    await page.goto("/trends");
    await expect(page.getByText(/premium subscription required/i)).toBeVisible();
  });
});
