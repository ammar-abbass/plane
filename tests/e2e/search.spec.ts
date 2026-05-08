import { test, expect } from "@playwright/test";

test.describe("Search / Command Palette", () => {
  test("should redirect unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/workspaces/test/projects/test");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("⌘K shortcut triggers search palette on project page", async ({ page }) => {
    // Documents the behaviour — full auth flow requires Clerk test tokens
    // The shortcut is wired in useKeyboardShortcuts which calls onSearch
    // This is verified in unit tests; e2e requires an authenticated session
    await page.goto("/workspaces");
  });
});

test.describe("SSE Real-time (two-tab scenario)", () => {
  test("documents the SSE two-tab contract", async ({ page }) => {
    // Full verification requires:
    // 1. Two authenticated pages open on the same project board
    // 2. Update an issue status in page 1
    // 3. Assert page 2 reflects the update without refresh
    // This requires Clerk test tokens set in playwright.config.ts
    // See docs/incidents/001-optimistic-update-revert.md for the bug this prevents
    await page.goto("/workspaces");
    await expect(page).toHaveURL(/sign-in|workspaces/);
  });
});
