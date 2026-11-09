/**
 * Playwright config for the Varaamo e2e suite.
 *
 * One project per suite file, with the same name. The suites depend on the `create_data` project, which creates
 * the test data once per run. The notification suite has no data setup and runs separately with one worker:
 *   playwright test --grep-invert @serialonly                                     # parallel run
 *   playwright test --project Tests_admin_notifications_serial --workers 1        # serial run
 * Sequential mode with shared users:
 *   FORCE_SINGLE_USER=True playwright test --workers 1
 *
 * Each project's browser and device are in its `use` options: the "Set Up … And Open Url" keywords of `devices`
 * open the test's page, which Playwright makes from them.
 */
import { defineConfig, devices } from "@playwright/test";
import type { PlaywrightTestOptions, PlaywrightWorkerOptions } from "@playwright/test";
import { readEnv } from "./lib/env";

// The app shows times only in Helsinki time, so the suite runs in it: TZ for the reservation times that the suite
// formats in Node's local time, and timezoneId below for the browsers
const TIME_ZONE = "Europe/Helsinki";
process.env.TZ = TIME_ZONE;

const env = readEnv();

// PW_TRACE=on (or another trace mode) records Playwright traces for local debugging. They aren't recorded in CI.
const trace = env.CI ? "off" : env.PW_TRACE;

// The desktop browser (devices.Set Up Chromium Desktop Browser And Open Url)
const desktop: Partial<PlaywrightTestOptions & PlaywrightWorkerOptions> = {
  browserName: "chromium",
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
};

const suite = (
  name: string,
  options: {
    dependencies?: string[];
    fullyParallel?: boolean;
    use?: Partial<PlaywrightTestOptions & PlaywrightWorkerOptions>;
  } = {}
) => ({
  name,
  testMatch: `${name}.spec.ts`,
  dependencies: options.dependencies ?? ["create_data"],
  fullyParallel: options.fullyParallel ?? true,
  use: options.use ?? desktop,
});

export default defineConfig({
  testDir: "./TestSuites",
  // Every test can run in its own worker
  fullyParallel: true,
  forbidOnly: env.CI,
  // A failed test runs again (RETRIES, once by default)
  retries: env.RETRIES,
  // WORKERS, 5 by default
  workers: env.WORKERS,
  // Only stops a test that hangs
  timeout: 15 * 60_000,
  expect: { timeout: 10_000 },
  globalSetup: "./lib/global-setup.ts",
  outputDir: "test-results",
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
    // A skipped test fails the run: it checked nothing
    ["./lib/skips-fail-run-reporter.ts"],
  ],
  use: {
    // URL_TEST of Resources/variables.ts, for page.goto("/…") and URL checks in Playwright code
    baseURL: "https://varaamo.test.hel.ninja/",
    // The context options of every browser of the suites
    locale: "en-US",
    timezoneId: TIME_ZONE,
    ignoreHTTPSErrors: true,
    acceptDownloads: true,
    // BROWSER_TIMEOUT_GLOBAL of Resources/variables.ts
    actionTimeout: 40_000,
    navigationTimeout: 40_000,
    // The whole page, not only the part in the viewport
    screenshot: { mode: "only-on-failure", fullPage: true },
    video: "retain-on-failure",
    trace,
  },
  projects: [
    // Unit tests of the e2e suite's own code (lib/ and the keywords that need no test environment), not tests of the
    // app: they run offline against local pages, without the test environment (pnpm test:unit, and the E2E checks)
    { name: "unit", testDir: "./unit", retries: 0 },
    {
      name: "create_data",
      testMatch: "create_data.setup.ts",
      // 10 minutes (Playwright counts in milliseconds), and only an upper limit: the data setup polls until the new
      // data has been saved (at most 5 minutes) and then until the site answers normally (at most 2 minutes), and
      // goes on as soon as each is ready. The other 3 minutes leave room for requests still running when a wait ends.
      timeout: 10 * 60_000,
      retries: 0,
    },
    suite("Tests_user_desktop_FI"),
    suite("Tests_admin_desktop_FI"),
    suite("Tests_users_with_admin_desktop"),
    // Set Up Android Pixel 5 And Open Url
    suite("Tests_user_mobile_android_FI", { use: { ...devices["Pixel 5"] } }),
    // Set Up Iphone 14 And Open Url
    suite("Tests_user_mobile_iphone_FI", { use: { ...devices["iPhone 14"] } }),
    suite("Tests_admin_notifications_serial", { dependencies: [], fullyParallel: false }),
  ],
});
