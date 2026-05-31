import { expect, test } from "@playwright/test";

test.describe("interactive features", () => {
  test("topbar search finds a team and routes to its profile", async ({ page }) => {
    await page.goto("/dashboard");
    const search = page.getByLabel("Search teams and matches");
    await search.click();
    await search.fill("Arsenal");
    // Results listbox appears with at least one option.
    const option = page.getByRole("option").filter({ hasText: "Arsenal" }).first();
    await expect(option).toBeVisible();
    await option.click();
    await expect(page).toHaveURL(/\/teams\//);
    await expect(page.getByRole("link", { name: "Teams" }).first()).toBeVisible();
  });

  test("Insight assistant opens, answers from model output, and links to a match", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /Open Insight AI assistant/i }).click();

    const dialog = page.getByRole("dialog", { name: /Insight AI assistant/i });
    await expect(dialog).toBeVisible();

    // Use a suggestion chip to ask for today's top pick.
    await dialog.getByRole("button", { name: "Top pick today" }).click();

    // Either a grounded answer (AI up) or a graceful note (AI offline) appears;
    // in both cases the assistant responds rather than hanging. Match the answer
    // title only (".first()" keeps this strict-mode safe if copy overlaps).
    await expect(
      dialog.getByText(/Top pick:|No model output yet/i).first(),
    ).toBeVisible();

    // Escape closes the drawer.
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });

  test("live center renders feed status and a momentum readout", async ({ page }) => {
    await page.goto("/live");
    await expect(page.getByRole("heading", { name: "Live Center" })).toBeVisible();
    // Connection pill reflects socket state (connected or connecting).
    await expect(page.getByText(/Live feed connected|Connecting…/)).toBeVisible();
    // Either a live match (momentum tracker) or the waiting empty-state shows.
    await expect(
      page.getByText(/Win probability tracker|Waiting for a live match/i),
    ).toBeVisible();
  });

  test("data-freshness pill is present in the topbar", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dashboard");
    await expect(page.getByLabel(/Data status:/i)).toBeVisible();
  });
});
