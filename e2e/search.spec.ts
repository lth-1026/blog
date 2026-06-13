import { test, expect } from "@playwright/test";

// Regression test for the search dialog crash: CommandDialog rendered cmdk
// primitives without the <Command> root, so opening search threw
// "Cannot read properties of undefined (reading 'subscribe')" and nothing
// appeared. This only surfaces on a real click in the browser — build/tsc
// pass clean. See components/ui/command.tsx.
test.describe("search (⌘K command palette)", () => {
  test("opens, accepts input, and returns results without errors", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));

    await page.goto("/ko");

    // Open via the header trigger button.
    await page.getByRole("button", { name: "검색" }).first().click();

    // The cmdk input must actually mount (the bug left it absent).
    const input = page.locator('input[cmdk-input], input[role="combobox"]');
    await expect(input.first()).toBeVisible();

    // Empty state shows recent posts.
    await expect(page.locator("[cmdk-item]").first()).toBeVisible();

    // Korean query returns at least one result (guards against the
    // cmdk double-filter bug that hid non-Latin matches).
    await input.first().fill("블로그");
    await expect(page.locator("[cmdk-item]").first()).toBeVisible();

    // English query also works.
    await input.first().fill("nextjs");
    await expect(page.locator("[cmdk-item]").first()).toBeVisible();

    expect(pageErrors, "no uncaught errors while searching").toEqual([]);
  });

  test("⌘K keyboard shortcut toggles the palette", async ({ page }) => {
    await page.goto("/ko");
    await page.keyboard.press("Meta+k");
    await expect(
      page.locator('input[cmdk-input], input[role="combobox"]').first(),
    ).toBeVisible();
  });
});
