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
 *
 * Each project's browser and device are in its `use` options: the "Set Up … And Open Url" keywords of devices.robot
 * open the test's page, which Playwright makes from them.
 */
import { defineConfig, devices } from "@playwright/test";
import type { PlaywrightTestOptions, PlaywrightWorkerOptions } from "@playwright/test";

// The suite formats reservation times in local time, like the Robot Docker image (TZ=Europe/Helsinki)
process.env.TZ ??= "Europe/Helsinki";

// PW_TRACE=on (or another trace mode) records Playwright traces for local debugging. They aren't recorded in CI.
const trace = process.env.CI == null ? ((process.env.PW_TRACE ?? "off") as PlaywrightWorkerOptions["trace"]) : "off";

// The desktop browser of devices.robot (Set Up Chromium Desktop Browser And Open Url)
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
    // A skipped test fails the run, like in the Robot runners
    ["./lib/skips-fail-run-reporter.ts"],
  ],
  use: {
    // ${URL_TEST} in variables.robot, for page.goto("/…") and URL checks in Playwright code
    baseURL: "https://varaamo.test.hel.ninja/",
    // The context options of devices.robot, for every browser of the suites
    locale: "en-US",
    timezoneId: "Europe/Helsinki",
    ignoreHTTPSErrors: true,
    acceptDownloads: true,
    // Set Browser Timeout    ${BROWSER_TIMEOUT_GLOBAL}
    actionTimeout: 40_000,
    navigationTimeout: 40_000,
    // The whole page, not only the part in the viewport
    screenshot: { mode: "only-on-failure", fullPage: true },
    video: "retain-on-failure",
    trace,
  },
  projects: [
    // Offline test of the port's runtime (library shims, pure keywords), no test environment needed
    { name: "selftest", testDir: "./selftest", retries: 0 },
    {
      name: "create_data",
      testMatch: "create_data.setup.ts",
      // create_data.Create Robot Test Data waits up to 5 minutes for the data, like its [Timeout] in Robot
      timeout: 7 * 60_000,
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
