import { defineConfig, devices } from "@playwright/test";

// E2E smoke tests for the interactive paths that only break in a real browser
// (clicks, JS hydration) — the kind of regression `next build` and `tsc` can't
// catch. Static page rendering is already validated by the build itself.
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Builds and serves the production app, then runs the tests against it.
  // Locally, reuses an already-running server if one is up.
  webServer: {
    command: "npm run build && npm run start",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
