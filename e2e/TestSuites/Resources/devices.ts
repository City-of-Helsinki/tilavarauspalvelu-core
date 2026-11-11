import type { BrowserContextOptions } from "@playwright/test";
import { readEnv } from "../../lib/env";
import { step, log } from "../../lib/runtime";
import type { BrowserName } from "../../lib/session";
import { PageObject } from "../page-object";

export const BROWSER: BrowserName = "chromium";
export const BROWSER_FOR_MAIL: BrowserName = "firefox";
export const LOCALE = "en-US";
export const ENABLE_WAF_BYPASS_HEADER: boolean = true;
export const WAF_BYPASS_HEADER_NAME = "X-Test-Secret";

/** Opens a test's pages in the project's browser and device. */
export class Devices extends PageObject {
  /** Adds WAF bypass headers to context config when enabled */
  @step("devices.Apply Global Header To Context Config")
  async applyGlobalHeaderToContextConfig(context_config: BrowserContextOptions) {
    if (ENABLE_WAF_BYPASS_HEADER) {
      const { WAF_BYPASS_SECRET } = readEnv();
      if (WAF_BYPASS_SECRET !== "") {
        context_config.extraHTTPHeaders = { [WAF_BYPASS_HEADER_NAME]: WAF_BYPASS_SECRET };
        await log("🛡️ Added global WAF bypass header to browser context config", { level: "DEBUG" });
      } else {
        await log("ENABLE_WAF_BYPASS_HEADER is True but WAF_BYPASS_SECRET not found in .env file", { level: "WARN" });
      }
    }
  }

  /** Opens the url in the project's browser and device: desktop Chromium, the Pixel 5 or the iPhone 14 */
  @step("devices.Set Up Browser And Open Url")
  // oxlint-disable-next-line eslint/no-unused-vars -- downloads are saved into the test's results folder
  async setUpBrowserAndOpenUrl(input_URL: string, DOWNLOAD_DIR: string) {
    // The browser, context and page come from the project's `use` options in playwright.config.ts (the browser and
    // device, locale, time zone), so traces, screenshots, video and --headed/--ui work. Playwright starts one
    // browser per worker; the staggered start of each slot's first test is the staggeredStart fixture
    // (TestSuites/fixtures.ts). A second call in a test opens a new context.
    const context_config: BrowserContextOptions = {};
    await this.applyGlobalHeaderToContextConfig(context_config);
    await this.session.openPage({ contextOptions: context_config });
    // Go To waits for the page to load
    await this.page.goto(input_URL);

    await this.logCurrentTime();
    await log("🎉 BROWSER SETUP COMPLETED", { level: "DEBUG" });
  }

  /** Sets up Firefox browser for permission tests - separate session from Django admin and Admin UI */
  @step("devices.Set Up Firefox Desktop Browser And Open Url")
  // oxlint-disable-next-line eslint/no-unused-vars -- downloads are saved into the test's results folder
  async setUpFirefoxDesktopBrowserAndOpenUrl(input_URL: string, DOWNLOAD_DIR: string) {
    // DEVNOTE: This is used for permission tests
    // A Firefox context with the project's `use` options in playwright.config.ts, see Set Up Browser And Open Url.
    // Firefox is closed when the test ends.
    const context_config: BrowserContextOptions = {};
    await this.applyGlobalHeaderToContextConfig(context_config);
    await this.session.openPage({
      browserName: BROWSER_FOR_MAIL,
      contextOptions: context_config,
    });
    // Go To waits for the page to load
    await this.page.goto(input_URL);
    await log("✅ Page loaded successfully", { level: "DEBUG" });

    await this.logCurrentTime();
    await log("🎉 BROWSER SETUP COMPLETED", { level: "DEBUG" });
  }

  @step("devices.Log Current Time")
  async logCurrentTime() {
    // Log only current local time (HH:MM:SS)
    const current_time = new Date().toTimeString().slice(0, 8);
    await log(`Current local time: ${current_time}`);
  }

  @step("devices.Log Current Cookies")
  async logCurrentCookies() {
    // The names only: the values would put the session into the report
    const fresh_cookies = (await this.page.context().cookies()).map((cookie) => cookie.name).join(", ");
    await log(`🔍 cookies: ${fresh_cookies}`);
  }
}
