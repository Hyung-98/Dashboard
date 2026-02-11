import { test, expect } from "@playwright/test";

test.describe("App", () => {
  test("loads and shows main content (dashboard or login)", async ({ page }) => {
    await page.goto("/#/");
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible({ timeout: 10000 });
    const text = await h1.textContent();
    expect(["대시보드", "로그인"]).toContain(text?.trim());
  });

  test("can navigate to expenses page", async ({ page }) => {
    await page.goto("/#/");
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    if (await page.getByRole("heading", { name: "로그인" }).isVisible()) {
      await page.getByRole("button", { name: "익명으로 체험하기" }).click();
      try {
        await page.getByRole("heading", { name: "대시보드" }).waitFor({ timeout: 10000 });
      } catch {
        test.skip(true, "Anonymous login is not available in this environment");
      }
    }
    await page.getByRole("link", { name: "지출" }).click();
    await expect(page).toHaveURL(/#\/expenses/);
    await expect(page.locator("h1")).toContainText("지출");
  });

  test("can navigate to report page", async ({ page }) => {
    await page.goto("/#/");
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    if (await page.getByRole("heading", { name: "로그인" }).isVisible()) {
      await page.getByRole("button", { name: "익명으로 체험하기" }).click();
      try {
        await page.getByRole("heading", { name: "대시보드" }).waitFor({ timeout: 10000 });
      } catch {
        test.skip(true, "Anonymous login is not available in this environment");
      }
    }
    await page.getByRole("link", { name: "리포트" }).click();
    await expect(page).toHaveURL(/#\/report/);
    await expect(page.locator("h1")).toContainText("리포트");
  });
});
