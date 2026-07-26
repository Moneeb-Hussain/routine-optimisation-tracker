import { test, expect } from "@playwright/test";


test.describe("Mission USA AI smoke", () => {
  test("home and login are reachable", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Mission|USA|Advisor|Outreach/i);
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1 }).or(page.locator("h1, h2").first())).toBeVisible();
  });

  test("dashboard renders in preview mode", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText(/Command Center|execution|must-do|Good focus/i).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test("placeholder routes are live pages", async ({ page }) => {
    for (const path of ["/journey", "/analytics", "/reminders", "/coach", "/interview-prep"]) {
      const res = await page.goto(path);
      expect(res?.ok()).toBeTruthy();
    }
  });
});
