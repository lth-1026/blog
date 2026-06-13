import { test, expect } from "@playwright/test";

// Theme + locale toggles are client-only behavior — they hydrate and mutate
// the DOM / route on click, so a broken wiring passes the build but fails here.
test.describe("theme toggle", () => {
  test("switches between light and dark", async ({ page }) => {
    await page.goto("/ko");
    const html = page.locator("html");
    const before = (await html.getAttribute("class")) ?? "";
    const wasDark = before.includes("dark");

    await page.getByRole("button", { name: "테마 전환" }).click();

    // The <html> dark class must flip.
    if (wasDark) {
      await expect(html).not.toHaveClass(/\bdark\b/);
    } else {
      await expect(html).toHaveClass(/\bdark\b/);
    }
  });
});

test.describe("locale toggle", () => {
  test("switches ko → en and updates the URL", async ({ page }) => {
    await page.goto("/ko");
    await page.getByRole("button", { name: "en", exact: true }).click();
    await expect(page).toHaveURL(/\/en(\/|$)/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});
