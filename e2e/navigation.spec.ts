import { expect, test } from "@playwright/test";

test.describe("core navigation & data hub", () => {
  test("landing page renders the hero and primary CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Football Intelligence/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Explore Insights" })).toBeVisible();
    await expect(page.getByRole("link", { name: /View Live Matches/i })).toBeVisible();
  });

  test("leagues page renders a populated league table", async ({ page }) => {
    await page.goto("/leagues");
    await expect(page.getByRole("heading", { name: /Leagues & Standings/i })).toBeVisible();
    // 8 teams per league in the seed -> 8 body rows.
    const rows = page.locator("table tbody tr");
    await expect(rows).toHaveCount(8);
    await expect(rows.first()).toBeVisible();
  });

  test("results list links through to a match detail page", async ({ page }) => {
    await page.goto("/results");
    await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
    const firstMatch = page.locator('a[href^="/matches/"]').first();
    await expect(firstMatch).toBeVisible();
    await firstMatch.click();
    await expect(page).toHaveURL(/\/matches\//);
    // The match-detail breadcrumb always renders; the AI panel degrades when
    // the AI service is offline (as in CI).
    await expect(page.getByText(/Matchday/i).first()).toBeVisible();
  });

  test("sidebar navigates to the confidence board", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("link", { name: "Confidence Board" }).first().click();
    await expect(page).toHaveURL(/\/board$/);
    await expect(page.getByRole("heading", { name: "Confidence Board" })).toBeVisible();
  });
});
