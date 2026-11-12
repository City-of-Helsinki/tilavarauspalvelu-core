/**
 * Playwright config for the Varaamo e2e suite.
 *
 * One project per suite, with the same name; the suite's file is `<name>.spec.ts`. The three customer projects run the
 * tests of `customer-tests.ts`, each from a small spec file, so the report groups the tests by device: the desktop runs
 * all but the `@phone-only` ones, the phones those tagged `@also-on-phones` or `@phone-only`. The suites depend on the
 * `create_data` project, which creates the test data once per run. The notification suite depends instead on
 * `notifications_login`, which logs its admin in once, and runs separately with one worker:
 *   playwright test --grep-invert @serialonly                                     # parallel run
 *   playwright test --project Tests_admin_notifications_serial --workers 1        # serial run
 * Sequential mode with shared users:
 *   FORCE_SINGLE_USER=True playwright test --workers 1
 *
 * Each project's browser and device are in its `use` options, from which Playwright makes the page that
 * devices.setUpBrowserAndOpenUrl opens.
 */
import { defineConfig, devices } from "@playwright/test";
import type { PlaywrightTestOptions, PlaywrightWorkerOptions } from "@playwright/test";
import { readEnv } from "./lib/env";
import type { Platform } from "./TestSuites/Resources/test_users";

// The app shows times only in Helsinki time, so the suite runs in it: TZ for the reservation times that the suite
// formats in Node's local time, and timezoneId below for the browsers
const TIME_ZONE = "Europe/Helsinki";
process.env.TZ = TIME_ZONE;

const env = readEnv();

// PW_TRACE=on (or another trace mode) records Playwright traces for local debugging. They aren't recorded in CI.
const trace = env.CI ? "off" : env.PW_TRACE;

// The desktop browser (devices.Set Up Browser And Open Url)
const desktop: Partial<PlaywrightTestOptions & PlaywrightWorkerOptions> = {
  browserName: "chromium",
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
};

// The tests of the phone projects: those that also run on the desktop, and those that run only on phones
const PHONE_TESTS = /@also-on-phones|@phone-only/;

const suite = (
  name: string,
  options: {
    /** The tests the project runs, and those it leaves out, by their tags */
    grep?: RegExp;
    grepInvert?: RegExp;
    /** Picks the users and units of the project's tests (TestSuites/test-data.ts) */
    platform?: Platform;
    dependencies?: string[];
    fullyParallel?: boolean;
    use?: Partial<PlaywrightTestOptions & PlaywrightWorkerOptions>;
  } = {}
) => ({
  name,
  testMatch: `${name}.spec.ts`,
  grep: options.grep,
  grepInvert: options.grepInvert,
  metadata: { platform: options.platform ?? "desktop" },
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
      // 10 minutes, an upper limit only: the data setup waits at most 5 minutes for the new data and 2 for the site,
      // going on as soon as each is ready. The rest leaves room for requests still running when a wait ends.
      timeout: 10 * 60_000,
      retries: 0,
    },
    suite("Tests_user_desktop_FI", { grepInvert: /@phone-only/ }),
    suite("Tests_admin_desktop_FI"),
    suite("Tests_users_with_admin_desktop"),
    // An Android phone: Chromium with the Pixel 5 device
    suite("Tests_user_mobile_android_FI", { grep: PHONE_TESTS, platform: "android", use: { ...devices["Pixel 5"] } }),
    // An iPhone: WebKit with the iPhone 14 device
    suite("Tests_user_mobile_iphone_FI", { grep: PHONE_TESTS, platform: "iphone", use: { ...devices["iPhone 14"] } }),
    // Logs the notification suite's admin in once and saves the login, which the suite's tests start with
    { name: "notifications_login", testMatch: "notifications_login.setup.ts", use: desktop },
    suite("Tests_admin_notifications_serial", { dependencies: ["notifications_login"], fullyParallel: false }),
  ],
});
