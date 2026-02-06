import { test, expect } from "@playwright/test";

test.describe("App", () => {
  test("loads and shows main content (dashboard or login)", async ({ page }) => {
    await page.goto("/#/");
    await page.waitForLoadState("networkidle");
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible({ timeout: 10000 });
    const text = await h1.textContent();
    expect(["대시보드", "로그인"]).toContain(text?.trim());
  });

  test("can navigate to expenses page", async ({ page }) => {
    await page.goto("/#/");
    await page.waitForLoadState("networkidle");
    if (await page.getByRole("heading", { name: "로그인" }).isVisible()) {
      await page.getByRole("button", { name: "익명으로 체험하기" }).click();
      // const dashboardVisible = await page.getByRole("heading", { name: "대시보드" }).isVisible({ timeout: 5000 }).catch(() => false);
      // test.skip(!dashboardVisible, "Anonymous login is disabled in this environment");
    }
    await page.getByRole("link", { name: "지출" }).click();
    await expect(page).toHaveURL(/#\/expenses/);
    await expect(page.locator("h1")).toContainText("지출");
  });

  test("can navigate to report page", async ({ page }) => {
    await page.goto("/#/");
    await page.waitForLoadState("networkidle");
    if (await page.getByRole("heading", { name: "로그인" }).isVisible()) {
      await page.getByRole("button", { name: "익명으로 체험하기" }).click();
      // const dashboardVisible = await page.getByRole("heading", { name: "대시보드" }).isVisible({ timeout: 5000 }).catch(() => false);
      // test.skip(!dashboardVisible, "Anonymous login is disabled in this environment");
    }
    await page.getByRole("link", { name: "리포트" }).click();
    await expect(page).toHaveURL(/#\/report/);
    await expect(page.locator("h1")).toContainText("리포트");
  });
});
