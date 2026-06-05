import { expect, test } from "@playwright/test";

/**
 * E2E for the account lifecycle added for launch: registration → welcome
 * notification, in-app notifications bell, data export / account deletion, and
 * the public password-reset / email-verification pages. Runs against the
 * offline mock backend (in-memory store); each test uses a unique email so
 * runs and retries don't collide.
 */

function uniqueEmail(tag: string): string {
  return `e2e_${tag}_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function register(page: import("@playwright/test").Page, email: string) {
  await page.goto("/account");
  await page.locator(".seg").getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("secret123");
  await page.locator("form").getByRole("button", { name: "Create account" }).click();
  // Authenticated view shows the signed-in email.
  await expect(page.locator("#main-content").getByText(email)).toBeVisible();
}

test.describe("notifications", () => {
  test("a new account gets a welcome notification surfaced in the bell", async ({ page }) => {
    await register(page, uniqueEmail("notif"));

    // The bell shows an unread badge once the count query resolves.
    const bell = page.getByRole("button", { name: /Notifications \(\d+ unread\)/ });
    await expect(bell).toBeVisible();

    await bell.click();
    const menu = page.getByRole("menu");
    await expect(menu.getByText("Welcome to InsightXI")).toBeVisible();

    // Marking all read clears the unread badge.
    await menu.getByRole("button", { name: /Mark all read/i }).click();
    await expect(page.getByRole("button", { name: /unread/i })).toHaveCount(0);
  });
});

test.describe("account data & deletion", () => {
  test("a fresh account is unverified and can be deleted", async ({ page }) => {
    const email = uniqueEmail("delete");
    await register(page, email);

    // New email accounts start unverified.
    await expect(page.locator("#main-content").getByText(/email unverified/i)).toBeVisible();

    // Accept the confirmation dialog, then delete.
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: /Delete account/i }).click();

    // Deletion logs the user out → the signed-out form returns.
    await expect(page.getByText(/Demo accounts:/i)).toBeVisible();
  });
});

test.describe("password reset page", () => {
  test("rejects mismatched passwords before calling the API", async ({ page }) => {
    await page.goto("/reset-password?token=anything");
    await page.getByLabel("New password", { exact: true }).fill("secret123");
    await page.getByLabel("Confirm new password").fill("different456");
    await page.getByRole("button", { name: "Reset password" }).click();
    await expect(page.getByText(/Passwords do not match/i)).toBeVisible();
  });

  test("shows an error for an invalid/expired token", async ({ page }) => {
    await page.goto("/reset-password?token=not-a-real-token");
    await page.getByLabel("New password", { exact: true }).fill("secret123");
    await page.getByLabel("Confirm new password").fill("secret123");
    await page.getByRole("button", { name: "Reset password" }).click();
    await expect(
      page.getByText(/invalid or has already been used|Could not reset/i),
    ).toBeVisible();
  });
});

test.describe("email verification page", () => {
  test("an invalid verification link reports the error", async ({ page }) => {
    await page.goto("/verify-email?token=not-a-real-token");
    await expect(page.getByText(/invalid or has expired/i)).toBeVisible();
  });
});

test.describe("forgot password", () => {
  test("does not reveal whether an email exists", async ({ page }) => {
    await page.goto("/account");
    await page.getByLabel("Email").fill("someone@example.com");
    await page.getByRole("button", { name: /Forgot password\?/i }).click();
    await expect(page.getByText(/a reset link is on its way/i)).toBeVisible();
  });
});
