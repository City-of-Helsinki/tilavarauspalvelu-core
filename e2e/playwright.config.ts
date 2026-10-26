/**
 * Playwright config for the Varaamo e2e suite, ported from the tilavarauspalvelu-robot Robot Framework suite.
 *
 * One project per Robot suite file, with the same name. The suites depend on the `create_data` project, which
 * replaces Robot's `Suite Setup    Run Only Once    create_data.Create Robot Test Data`. The notification suite
 * has no data setup (like in Robot) and runs separately with one worker:
 *   playwright test --grep-invert @serialonly                                     # pabot run
 *   playwright test --project Tests_admin_notifications_serial --workers 1        # serial run
 * Sequential mode with shared users (robot --variable FORCE_SINGLE_USER:True):
 *   FORCE_SINGLE_USER=True playwright test --workers 1
 */
import { defineConfig } from "@playwright/test";

// The suite formats reservation times in local time, like the Robot Docker image (TZ=Europe/Helsinki)
process.env.TZ ??= "Europe/Helsinki";

const suite = (name: string, options: { dependencies?: string[]; fullyParallel?: boolean } = {}) => ({
  name,
  testMatch: `${name}.spec.ts`,
  dependencies: options.dependencies ?? ["create_data"],
  fullyParallel: options.fullyParallel ?? true,
});

export default defineConfig({
  testDir: "./TestSuites",
  // pabot --testlevelsplit: every test can run in its own worker
  fullyParallel: true,
  forbidOnly: process.env.CI != null,
  // Replaces the end-of-run rerun of failed tests
  retries: Number(process.env.RETRIES ?? 1),
  // docker-config.json "all_suites": 5
  workers: Number(process.env.WORKERS ?? 5),
  // Robot has no test timeout; the longest test waits up to 7 minutes for another test's emails
  timeout: 15 * 60_000,
  expect: { timeout: 10_000 },
  globalSetup: "./lib/global-setup.ts",
  outputDir: "test-results",
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
    // A skipped test fails the run, like in the Robot runners (e.g. the email test skips when its booking failed)
    ["./lib/skips-fail-run-reporter.ts"],
  ],
  projects: [
    // Offline test of the port's runtime (library shims, pure keywords), no test environment needed
    { name: "selftest", testDir: "./selftest", retries: 0 },
    {
      name: "create_data",
      testMatch: "create_data.setup.ts",
      // [Timeout]    5 minutes in create_data.Create Robot Test Data
      timeout: 6 * 60_000,
      retries: 0,
    },
    suite("Tests_user_desktop_FI"),
    suite("Tests_admin_desktop_FI"),
    suite("Tests_users_with_admin_desktop"),
    suite("Tests_user_mobile_android_FI"),
    suite("Tests_user_mobile_iphone_FI"),
    suite("Tests_admin_notifications_serial", { dependencies: [], fullyParallel: false }),
  ],
});
