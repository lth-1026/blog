import { test, expect } from "@playwright/test";

// Comments (Giscus) are lazy-mounted via IntersectionObserver only when the
// comments section scrolls into view (components/blog/comments-lazy.tsx). This
// checks the full lazy chain: nothing mounts at the top of the article, and the
// giscus iframe actually renders once the section is scrolled into view.
// (@giscus/react injects a client script that is then replaced by the iframe,
// so we assert on the iframe — which also proves giscus really renders.)
test.describe("comments lazy-load", () => {
  test("giscus mounts only after the section scrolls into view", async ({
    page,
  }) => {
    await page.goto("/ko/blog/hello-world");

    const giscusFrame = page.locator('iframe[src*="giscus.app"]');

    // Not mounted at the top of the article (lazy).
    await expect(giscusFrame).toHaveCount(0);

    // Scroll to the comments heading → IntersectionObserver mounts GiscusPanel.
    await page.getByRole("heading", { name: "댓글" }).scrollIntoViewIfNeeded();

    await expect(giscusFrame).toHaveCount(1, { timeout: 15_000 });
  });
});
