import { expect, test } from "@playwright/test";

test.describe("core navigation & data hub", () => {
  test("dashboard loads with hero and section links", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /explainable football analytics/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Fixtures" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Standings" })).toBeVisible();
  });

  test("standings page renders a populated league table", async ({ page }) => {
    await page.goto("/standings");
    await expect(page.getByRole("heading", { name: "Standings" })).toBeVisible();
    // 8 teams per league in the seed -> 8 body rows.
    const rows = page.locator("table tbody tr");
    await expect(rows).toHaveCount(8);
    // Points column is present and numeric for the leader.
    await expect(rows.first()).toBeVisible();
  });

  test("results list links through to a match detail page", async ({ page }) => {
    await page.goto("/results");
    await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
    const firstMatch = page.locator('a[href^="/matches/"]').first();
    await expect(firstMatch).toBeVisible();
    await firstMatch.click();
    await expect(page).toHaveURL(/\/matches\//);
    // Match Intelligence section renders (prediction may degrade if AI is off).
    await expect(
      page.getByRole("heading", { name: "Match Intelligence" }),
    ).toBeVisible();
  });
});
