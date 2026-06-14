import { test, expect } from "@playwright/test";

// Series/tag pages are SSG via generateStaticParams. If params are pre-encoded
// there, names with spaces/non-ASCII (e.g. "블로그 만들기", "Building this blog")
// double-encode and 404 on click. These guard that the generated path matches
// the link the user actually clicks.
test.describe("taxonomy navigation", () => {
  test("Korean series link opens the series page (no 404)", async ({ page }) => {
    await page.goto("/ko/blog/nextjs-16-mdx-blog");
    await page.getByRole("link", { name: /블로그 만들기/ }).click();
    await expect(page).toHaveURL(/\/ko\/series\//);
    await expect(
      page.getByRole("heading", { name: "블로그 만들기", level: 1 }),
    ).toBeVisible();
  });

  test("English series link (has spaces) opens the series page", async ({
    page,
  }) => {
    await page.goto("/en/blog/nextjs-16-mdx-blog");
    await page.getByRole("link", { name: /Building this blog/ }).click();
    await expect(page).toHaveURL(/\/en\/series\//);
    await expect(
      page.getByRole("heading", { name: "Building this blog", level: 1 }),
    ).toBeVisible();
  });

  test("tag link opens the tag page (no 404)", async ({ page }) => {
    await page.goto("/ko/blog/nextjs-16-mdx-blog");
    await page.getByRole("link", { name: "#nextjs" }).first().click();
    await expect(page).toHaveURL(/\/ko\/blog\/tag\//);
    await expect(
      page.getByRole("heading", { name: "#nextjs", level: 1 }),
    ).toBeVisible();
  });
});
