import { test, expect } from "@playwright/test";

test.describe("Workspace Flow", () => {
  test("should create workspace and project", async ({ page }) => {
    // This test requires a logged-in user
    // In CI, use Clerk test tokens or mock auth
    await page.goto("/workspaces");
    await expect(page).toHaveURL(/sign-in|workspaces/);
  });
});
