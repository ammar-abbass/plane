import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should redirect unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/workspaces");
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
