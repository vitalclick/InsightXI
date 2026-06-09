import { test, expect } from "@playwright/test";

/**
 * The dedicated mobile experience at /m. Rendered at any width (a centered
 * phone frame on desktop), so it runs under the standard Desktop Chrome project.
 * Assertions lean on the shell/nav, which render regardless of backend data.
 */
test.describe("mobile app (/m)", () => {
  test("renders the shell, header and bottom-nav tabs", async ({ page }) => {
    await page.goto("/m");
    await expect(page.locator(".app-frame .bottom-nav")).toBeVisible();
    for (const tab of ["Home", "Live", "Predict", "Fixtures", "More"]) {
      await expect(page.locator(".nav-tab", { hasText: tab })).toBeVisible();
    }
    await expect(page.getByText(/football intelligence/i).first()).toBeVisible();
  });

  test("switches tabs and pushes/pops a detail screen", async ({ page }) => {
    await page.goto("/m");

    await page.locator(".nav-tab", { hasText: "Predict" }).click();
    await expect(page.getByText("Sure Win")).toBeVisible();

    // More → Standings (a real, data-backed Explore screen) and back.
    await page.locator(".nav-tab", { hasText: "More" }).click();
    await expect(page.getByText("Explore")).toBeVisible();
    await page.getByText("Standings", { exact: true }).click();
    await expect(page.locator(".hdr-title", { hasText: "Standings" })).toBeVisible();

    await page.locator(".hdr-back").click();
    await expect(page.getByText("Explore")).toBeVisible();
  });

  test("opens Match Intel from a fixture when the slate is populated", async ({ page }) => {
    await page.goto("/m");
    await page.locator(".nav-tab", { hasText: "Fixtures" }).click();
    const row = page.locator(".screen.active .match-row").first();
    if (await row.count()) {
      await row.click();
      await expect(page.locator(".hdr-title", { hasText: "Match Intel" })).toBeVisible();
      // The prediction tri-bar / pills render when the AI service is reachable;
      // the header always renders, so assert that.
      await expect(page.getByText("Match Prediction")).toBeVisible();
    }
  });
});
